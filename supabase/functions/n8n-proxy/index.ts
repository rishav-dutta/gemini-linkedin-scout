// Supabase Edge Function: n8n-proxy
//
// Sits between the website and the n8n webhooks. It validates input, applies
// rate limits, and forwards the request to n8n with a shared secret that never
// reaches the browser. The n8n webhooks require that secret (Header Auth), so
// calling them directly is rejected.
//
// Routes:
//   POST /n8n-proxy/find-leads    JSON { company_name, role, search_id }
//   POST /n8n-proxy/score-resume  multipart { resume (PDF), search_id, target_company }
//
// Secrets (Dashboard → Edge Functions → Secrets):
//   N8N_BASE_URL       e.g. https://n8n-backend.boar-alkaline.ts.net
//   N8N_PROXY_SECRET   must match the n8n "Header Auth" credential (header X-Proxy-Secret)
// Provided automatically by Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://gemini-linkedin-scout.vercel.app",
  "http://localhost:5173",
];

// Per visitor (hashed IP) per hour, and across all visitors per day.
const LIMITS = {
  "find-leads": { perIpPerHour: 5, globalPerDay: 50 },
  "score-resume": { perIpPerHour: 10, globalPerDay: 100 },
} as const;
type Action = keyof typeof LIMITS;

const MAX_TEXT_LENGTH = 100;
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

class ValidationError extends Error {}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin":
      origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length >= 1 && text.length <= MAX_TEXT_LENGTH ? text : null;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function buildFindLeads(req: Request) {
  const body = await req.json().catch(() => null);
  const company = cleanText(body?.company_name);
  const role = cleanText(body?.role);
  const searchId = body?.search_id;
  if (!company || !role || typeof searchId !== "string" || !UUID_RE.test(searchId)) {
    throw new ValidationError(`Company and role are required (up to ${MAX_TEXT_LENGTH} characters each).`);
  }
  return {
    body: JSON.stringify({ company_name: company, role, search_id: searchId }),
    headers: { "Content-Type": "application/json" },
  };
}

async function buildScoreResume(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("resume");
  const searchId = form?.get("search_id");
  const company = cleanText(form?.get("target_company"));
  if (!(file instanceof File) || typeof searchId !== "string" || !UUID_RE.test(searchId) || !company) {
    throw new ValidationError("A PDF resume and a valid search are required.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPdf = new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
  if (bytes.length > MAX_PDF_BYTES || !isPdf) {
    throw new ValidationError("The resume must be a PDF under 5 MB.");
  }

  // Prefix with the search ID so two uploads named "resume.pdf" don't overwrite
  // each other in storage, and strip characters that are unsafe in a storage path.
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-80) || "resume.pdf";
  const forwarded = new FormData();
  forwarded.append("resume", new File([bytes], `${searchId}-${safeName}`, { type: "application/pdf" }));
  forwarded.append("search_id", searchId);
  forwarded.append("target_company", company);
  return { body: forwarded, headers: {} }; // fetch sets the multipart boundary
}

// Returns a message if the caller is over a limit; otherwise records the request.
async function checkRateLimit(action: Action, ipHash: string): Promise<string | null> {
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();

  const [perIp, global] = await Promise.all([
    db.from("proxy_requests").select("id", { count: "exact", head: true })
      .eq("action", action).eq("ip_hash", ipHash).gte("created_at", hourAgo),
    db.from("proxy_requests").select("id", { count: "exact", head: true })
      .eq("action", action).gte("created_at", dayAgo),
  ]);
  if (perIp.error) throw perIp.error;
  if (global.error) throw global.error;

  if ((perIp.count ?? 0) >= LIMITS[action].perIpPerHour) {
    return "Too many requests. Please try again in an hour.";
  }
  if ((global.count ?? 0) >= LIMITS[action].globalPerDay) {
    return "This demo has reached its daily limit. Please try again tomorrow.";
  }

  const { error } = await db.from("proxy_requests").insert({ action, ip_hash: ipHash });
  if (error) throw error;
  await db.from("proxy_requests").delete().lt("created_at", new Date(Date.now() - 2 * 86_400_000).toISOString());
  return null;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, origin);

  const action = new URL(req.url).pathname.split("/").pop() ?? "";
  if (!(action in LIMITS)) return jsonResponse({ error: "Not found" }, 404, origin);

  let forward: { body: BodyInit; headers: Record<string, string> };
  try {
    forward = action === "find-leads" ? await buildFindLeads(req) : await buildScoreResume(req);
  } catch (e) {
    const message = e instanceof ValidationError ? e.message : "Invalid request.";
    return jsonResponse({ error: message }, 400, origin);
  }

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const limited = await checkRateLimit(action as Action, await sha256Hex(ip));
    if (limited) return jsonResponse({ error: limited }, 429, origin);
  } catch (e) {
    console.error("Rate limit check failed:", e);
    return jsonResponse({ error: "Something went wrong. Please try again." }, 500, origin);
  }

  try {
    const upstream = await fetch(`${Deno.env.get("N8N_BASE_URL")}/webhook/${action}`, {
      method: "POST",
      headers: { ...forward.headers, "X-Proxy-Secret": Deno.env.get("N8N_PROXY_SECRET")! },
      body: forward.body,
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (e) {
    console.error("n8n request failed:", e);
    return jsonResponse({ error: "The search service is unavailable. Please try again later." }, 502, origin);
  }
});
