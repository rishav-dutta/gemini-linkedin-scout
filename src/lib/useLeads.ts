import { useEffect, useState } from 'react';
import { supabase, type LinkedInLead } from './supabase';

// Loads one search's leads. get_leads_for_search returns only that search's rows
// (the table itself is not publicly readable).
export function useLeads(searchId: string, orderBy: 'created_at' | 'similarity_score') {
  const [leads, setLeads] = useState<LinkedInLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // Ignore a response that arrives after the search changed or the screen closed
    let cancelled = false;

    const fetchLeads = async () => {
      setIsLoading(true);
      setLoadFailed(false);

      const { data, error } = await supabase
        .rpc('get_leads_for_search', { p_search_id: searchId })
        .order(orderBy, { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error('Could not load leads:', error.message);
        setLoadFailed(true);
      } else {
        setLeads((data ?? []) as LinkedInLead[]);
      }
      setIsLoading(false);
    };

    if (searchId) fetchLeads();
    return () => {
      cancelled = true;
    };
  }, [searchId, orderBy, reloadCount]);

  const reload = () => setReloadCount((count) => count + 1);

  return { leads, isLoading, loadFailed, reload };
}
