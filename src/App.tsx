import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LandingScreen } from './components/LandingScreen';
import { DiscoveryGallery } from './components/DiscoveryGallery';
import { MatchLeaderboard } from './components/MatchLeaderboard';
import { supabase, functionErrorMessage, type LinkedInLead } from './lib/supabase';

type Screen = 'landing' | 'gallery' | 'leaderboard';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [leads, setLeads] = useState<LinkedInLead[]>([]);
  const [lastSearchedCompany, setLastSearchedCompany] = useState('');
  
  // 1. Initialize the Search ID state
  const [currentSearchId, setCurrentSearchId] = useState<string>('');

  const handleFindLeads = async (companyName: string, targetRole: string) => {
    // 2. Generate the unique ID specifically when a search starts
    const newSearchId = crypto.randomUUID();
    setCurrentSearchId(newSearchId);
    setLastSearchedCompany(companyName);
    
    try {
      // Goes through the n8n-proxy Edge Function, which validates, rate-limits
      // and forwards to n8n with a secret the browser never sees
      const { data, error } = await supabase.functions.invoke('n8n-proxy/find-leads', {
        body: {
          company_name: companyName,
          role: targetRole,
          search_id: newSearchId, // Use the fresh ID here
        },
      });

      if (error) throw error;

      const leadsArray = Array.isArray(data) ? data : data?.leads || [];

      setLeads(leadsArray);
      setCurrentScreen('gallery');
    } catch (error) {
      console.error('Search failed:', error);
      alert(await functionErrorMessage(error, 'Search failed. Please try again.'));
    }
  };

  const handleResumeUploaded = () => {
    setCurrentScreen('leaderboard');
  };

  return (
    <AnimatePresence mode="wait">
      {currentScreen === 'landing' && (
        <LandingScreen key="landing" onFindLeads={handleFindLeads} />
      )}
      {currentScreen === 'gallery' && (
        <DiscoveryGallery 
          key="gallery" 
          onResumeUploaded={handleResumeUploaded} 
          leads={leads}
          targetCompany={lastSearchedCompany} 
          searchId={currentSearchId} // 3. Pass to Gallery
        />
      )}
      {currentScreen === 'leaderboard' && (
        <MatchLeaderboard 
          key="leaderboard" 
          targetCompany={lastSearchedCompany} 
          searchId={currentSearchId} // 4. Pass to Leaderboard
        />
      )}
    </AnimatePresence>
  );
}

export default App;