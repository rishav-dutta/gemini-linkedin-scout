import { createClient } from '@supabase/supabase-js';

// Bolt automatically manages these variables now that you've connected
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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