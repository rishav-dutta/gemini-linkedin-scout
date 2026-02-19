import { createClient } from '@supabase/supabase-js';

// Hardcoding your actual project credentials to ensure the connection is correct
// Make sure to paste your actual ANON KEY from your Supabase dashboard between the quotes below
const supabaseUrl = 'https://eqipaeameimazivwwrrm.supabase.co';
const supabaseAnonKey = 'sb_publishable_Wiik_spU6iLz8YpzLmWMCQ_lFECQtC8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface LinkedInLead {
  id: string;
  name: string;
  company?: string; // Added this to support your company filtering
  linkedin_url: string;
  profile_picture_url: string | null;
  summary: string;
  similarity_score: number | null;
  scoring_reasoning: string | null;
  created_at: string;
}