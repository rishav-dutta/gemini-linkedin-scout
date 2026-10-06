import { useEffect, useState } from 'react';
import { supabase, type LinkedInLead } from './supabase';

// While waiting for profile details, re-read the leads this often
const POLL_MS = 3000;
// n8n saves every profile's details in one step, so once one lead has them the
// rest follow within moments; one more read after this delay picks them up
const SETTLE_MS = 2000;
// Stop waiting for details after this long (Apify normally takes 7-35 seconds)
const GIVE_UP_MS = 180_000;

export type DetailsStatus = 'loading' | 'ready' | 'failed';

// Loads one search's leads. get_leads_for_search returns only that search's rows
// (the table itself is not publicly readable). With waitForDetails, keeps
// re-reading until n8n has added the full profiles that scoring needs.
export function useLeads(
  searchId: string,
  orderBy: 'created_at' | 'similarity_score',
  waitForDetails = false
) {
  const [leads, setLeads] = useState<LinkedInLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [details, setDetails] = useState<DetailsStatus>('loading');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // Ignore a response that arrives after the search changed or the screen closed
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settling = false;
    const startedAt = Date.now();

    const fetchLeads = async (initial: boolean) => {
      if (initial) {
        setIsLoading(true);
        setLoadFailed(false);
        setDetails('loading');
      }

      const { data, error } = await supabase
        .rpc('get_leads_for_search', { p_search_id: searchId })
        .order(orderBy, { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error('Could not load leads:', error.message);
        if (initial) {
          setLoadFailed(true);
          setIsLoading(false);
        } else {
          // A failed re-read while waiting for details: keep the leads shown and try again
          timer = setTimeout(() => fetchLeads(false), POLL_MS);
        }
        return;
      }

      const rows = (data ?? []) as LinkedInLead[];
      setLeads(rows);
      setIsLoading(false);

      if (!waitForDetails || rows.length === 0) {
        setDetails('ready');
        return;
      }
      const withDetails = rows.filter((lead) => lead.enriched !== false).length;
      if (withDetails === rows.length || (settling && withDetails > 0)) {
        setDetails('ready');
      } else if (withDetails > 0) {
        settling = true;
        timer = setTimeout(() => fetchLeads(false), SETTLE_MS);
      } else if (Date.now() - startedAt > GIVE_UP_MS) {
        setDetails('failed');
      } else {
        timer = setTimeout(() => fetchLeads(false), POLL_MS);
      }
    };

    if (searchId) fetchLeads(true);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchId, orderBy, waitForDetails, reloadCount]);

  const reload = () => setReloadCount((count) => count + 1);

  return { leads, isLoading, loadFailed, details, reload };
}
