/*
  # Initial schema

  Reconstructed from the live database (October 2026) to match what the app
  and n8n workflows actually use. Later migrations tighten access and change
  the uniqueness rule; apply them in order.

  ## Tables
    - linkedin_leads: people found for a search (one search_id per search),
      enriched with profile data and scored against an uploaded resume
    - user_resumes: uploaded resumes and their extracted text

  ## Storage
    - resumes bucket for uploaded PDFs

  ## Security (as originally deployed; see 20261003 and 20261005 migrations)
    - Anyone could read linkedin_leads
    - Anyone could insert into user_resumes
    - The resumes bucket was public
*/

create table if not exists public.linkedin_leads (
  id serial primary key,
  full_name text,
  job_title text,
  company text,
  profile_image_url text,
  linkedin_url text unique,
  search_description text,
  full_profile_markdown text,
  similarity_score integer default 0,
  scoring_reasoning text,
  created_at timestamptz default current_timestamp,
  resume_name text,
  modified_at timestamptz default now(),
  target_role text,
  search_id text
);

create table if not exists public.user_resumes (
  id uuid primary key default extensions.uuid_generate_v4(),
  resume_name text,
  resume_url text,
  upload_time timestamptz default now(),
  raw_resume_text text,
  candidate_name text,
  company_searched_for text
);

alter table public.linkedin_leads enable row level security;
alter table public.user_resumes enable row level security;

create policy "Allow public read access"
  on public.linkedin_leads
  for select
  using (true);

create policy "Allow n8n to insert resumes"
  on public.user_resumes
  for insert
  to anon
  with check (true);

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;
