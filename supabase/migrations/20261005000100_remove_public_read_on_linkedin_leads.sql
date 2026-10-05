/*
  # Remove public read access on linkedin_leads

  Apply only after the frontend reads leads through get_leads_for_search().
  RLS stays enabled with no SELECT policy, so the anon key can no longer read
  the table directly. n8n connects as the table owner and is unaffected.
*/

drop policy if exists "Allow public read access" on public.linkedin_leads;
