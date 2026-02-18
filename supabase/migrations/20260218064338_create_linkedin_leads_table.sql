/*
  # Create LinkedIn Leads Table

  ## Overview
  This migration creates the linkedin_leads table to store candidate profiles discovered through LinkedIn searches.
  
  ## New Tables
    - `linkedin_leads`
      - `id` (uuid, primary key) - Unique identifier for each lead
      - `name` (text, required) - Full name of the candidate
      - `linkedin_url` (text, required) - URL to the candidate's LinkedIn profile
      - `profile_picture_url` (text, optional) - URL to the candidate's profile picture
      - `summary` (text, required) - Brief background summary of the candidate
      - `similarity_score` (numeric, optional) - AI-generated similarity score (0-100)
      - `scoring_reasoning` (text, optional) - AI explanation for the similarity score
      - `created_at` (timestamptz) - Timestamp when the lead was added
  
  ## Security
    - Enable RLS on `linkedin_leads` table
    - Add policy to allow public read access (for lead discovery)
    - Add policy for authenticated inserts (for lead creation)
*/

CREATE TABLE IF NOT EXISTS linkedin_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  linkedin_url text NOT NULL,
  profile_picture_url text,
  summary text NOT NULL,
  similarity_score numeric,
  scoring_reasoning text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE linkedin_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read linkedin_leads"
  ON linkedin_leads
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert linkedin_leads"
  ON linkedin_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);