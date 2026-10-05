import { createClient, FunctionsHttpError } from '@supabase/supabase-js';

// Bolt automatically manages these variables now that you've connected
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Returns the message an Edge Function sent with its error response (e.g. a rate
// limit notice), or the fallback if it didn't send one.
export async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null);
    if (typeof body?.error === 'string') return body.error;
  }
  return fallback;
}

export interface LinkedInLead {
  id: string; // Changed to string as Supabase UUIDs/IDs are usually handled as strings in TS
  full_name: string;
  job_title: string;
  company?: string;
  linkedin_url: string;
  profile_image_url: string | null;
  search_description: string;
  similarity_score: number | null; // Use 'number' instead of 'integer' for TypeScript
  scoring_reasoning: string | null;
  created_at: string; // Use 'string' for ISO timestamps in TypeScript
}