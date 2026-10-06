import { createClient, FunctionsHttpError } from '@supabase/supabase-js';

// Set in .env.local for development and in the Vercel project settings for production (see .env.example)
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
  id: number;
  full_name: string;
  job_title: string;
  company?: string;
  linkedin_url: string;
  profile_image_url: string | null;
  search_description: string;
  similarity_score: number | null;
  scoring_reasoning: string | null;
  created_at: string;
}
// n8n saves every new lead with similarity_score 0, and 0 is also a real score,
// so a lead counts as scored once Gemini has written its reasoning.
export function isScored(lead: LinkedInLead): boolean {
  return lead.scoring_reasoning !== null;
}
