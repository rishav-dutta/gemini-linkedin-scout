/*
  # Tell the site when a lead's profile details have arrived

  The search workflow now replies as soon as the people from the web search
  are saved, and fetches full profiles (Apify) afterwards. get_leads_for_search
  gains an `enriched` column (true once full_profile_markdown is filled in) so
  the site can show contacts right away and wait for details before scoring.

  Adding a return column means dropping and recreating the function.
*/

begin;

drop function if exists public.get_leads_for_search(text);

create function public.get_leads_for_search(p_search_id text)
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
  created_at timestamptz,
  enriched boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.full_name, l.job_title, l.company, l.profile_image_url,
         l.linkedin_url, l.search_description, l.similarity_score,
         l.scoring_reasoning, l.created_at,
         l.full_profile_markdown is not null
  from public.linkedin_leads l
  where p_search_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and l.search_id = p_search_id;
$$;

revoke all on function public.get_leads_for_search(text) from public;
grant execute on function public.get_leads_for_search(text) to anon, authenticated;

commit;
