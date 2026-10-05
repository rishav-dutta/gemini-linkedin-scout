/*
  # Read leads for one search only

  The frontend used to read linkedin_leads directly, which required a policy
  letting anyone read every row. This function returns only the rows for a
  given search_id (a random UUID generated per search), and only the columns
  the UI displays. Runs as the function owner, so it works without a public
  SELECT policy on the table.
*/

create or replace function public.get_leads_for_search(p_search_id text)
returns table (
  id integer,
  full_name text,
  job_title text,
  company text,
  profile_image_url text,
  linkedin_url text,
  search_description text,
  similarity_score integer,
  scoring_reasoning text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.full_name, l.job_title, l.company, l.profile_image_url,
         l.linkedin_url, l.search_description, l.similarity_score,
         l.scoring_reasoning, l.created_at
  from public.linkedin_leads l
  where p_search_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and l.search_id = p_search_id;
$$;

revoke all on function public.get_leads_for_search(text) from public;
grant execute on function public.get_leads_for_search(text) to anon, authenticated;
