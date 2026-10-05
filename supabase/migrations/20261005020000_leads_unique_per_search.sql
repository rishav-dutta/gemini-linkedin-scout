/*
  # Leads are unique per search, not across the whole table

  Previously linkedin_url was unique, so when a second search found the same
  person it took over their row: the first search lost that lead and its score
  was overwritten. Each search now keeps its own row per person.

  The (search_id, linkedin_url) index also serves lookups by search_id.
  The n8n upsert/update nodes match on both columns.
*/

alter table public.linkedin_leads
  add constraint linkedin_leads_search_id_linkedin_url_key
  unique (search_id, linkedin_url);

alter table public.linkedin_leads
  drop constraint if exists linkedin_leads_linkedin_url_key;
