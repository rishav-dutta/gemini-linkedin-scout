import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface LinkedInLead {
  id: string;
  name: string;
  linkedin_url: string;
  profile_picture_url: string | null;
  summary: string;
  similarity_score: number | null;
  scoring_reasoning: string | null;
  created_at: string;
}
