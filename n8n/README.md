# n8n workflows

Exports of the workflows the app runs on (n8n 2.41). Credentials are referenced
by name only; no secrets are stored in these files.

| Workflow | Trigger | What it does |
|---|---|---|
| `finding-linkedin-profiles.json` | Webhook `POST /webhook/find-leads` | Searches for people at a company (Firecrawl), saves them to `linkedin_leads`, enriches profiles (Apify) |
| `linkedin-profile-relevance-engine.json` | Webhook `POST /webhook/score-resume` | Uploads the resume to storage, extracts its text, scores each lead with Gemini, saves the scores |
| `supabase-keep-alive.json` | Schedule, every 2 days | Pings Supabase so the free project isn't paused for inactivity |

## Importing

1. In n8n: **Create workflow**, then paste the file's contents onto the canvas (or **Import from file**).
2. Create these credentials and select them on the nodes that need them:

   | Credential | Type | Used by |
   |---|---|---|
   | Postgres account | Postgres (Supabase pooler connection) | Both main workflows, keep-alive |
   | Firecrawl account | Firecrawl API | Finding Linkedin Profiles |
   | Apify account | Apify API | Finding Linkedin Profiles |
   | Google Gemini(PaLM) Api account | Google Gemini | Relevance Engine |
   | Supabase Storage | Header Auth: `apikey` = Supabase secret key | Relevance Engine (resume upload) |
   | Proxy Secret | Header Auth: `X-Proxy-Secret` = same value as the Edge Function's `N8N_PROXY_SECRET` | Both webhook nodes |

3. In `supabase-keep-alive.json`, replace `YOUR_SUPABASE_ANON_KEY` with the project's anon key.
4. The Apify and Firecrawl nodes are community nodes: install `@apify/n8n-nodes-apify` and
   `@mendable/n8n-nodes-firecrawl` under **Settings → Community nodes**.
5. Publish the workflows. The webhooks only accept requests carrying the proxy secret, so the
   website reaches them through the `n8n-proxy` Supabase Edge Function.
