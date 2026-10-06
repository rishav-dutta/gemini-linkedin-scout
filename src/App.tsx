import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LandingScreen } from './components/LandingScreen';
import { DiscoveryGallery } from './components/DiscoveryGallery';
import { MatchLeaderboard } from './components/MatchLeaderboard';
import { supabase, functionErrorMessage } from './lib/supabase';

type Screen = 'landing' | 'gallery' | 'leaderboard';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [lastSearchedCompany, setLastSearchedCompany] = useState('');
  const [lastSearchedRole, setLastSearchedRole] = useState('');
  
  // 1. Initialize the Search ID state
  const [currentSearchId, setCurrentSearchId] = useState<string>('');

  const handleFindLeads = async (companyName: string, targetRole: string) => {
    // 2. Generate the unique ID specifically when a search starts
    const newSearchId = crypto.randomUUID();
    setCurrentSearchId(newSearchId);
    setLastSearchedCompany(companyName);
    setLastSearchedRole(targetRole);
    
    try {
      // Goes through the n8n-proxy Edge Function, which validates, rate-limits
      // and forwards to n8n with a secret the browser never sees
      const { error } = await supabase.functions.invoke('n8n-proxy/find-leads', {
        body: {
          company_name: companyName,
          role: targetRole,
          search_id: newSearchId, // Use the fresh ID here
        },
      });

      if (error) throw error;

      // n8n only replies with a status; the gallery loads the saved leads itself
      setCurrentScreen('gallery');
    } catch (error) {
      console.error('Search failed:', error);
      // The landing screen shows this message under the form
      throw new Error(await functionErrorMessage(error, 'Search failed. Please try again.'));
    }
  };

  const handleResumeUploaded = () => {
    setCurrentScreen('leaderboard');
  };

  const handleNewSearch = () => {
    setCurrentScreen('landing');
  };

  const handleBackToContacts = () => {
    setCurrentScreen('gallery');
  };

  return (
    <AnimatePresence mode="wait">
      {currentScreen === 'landing' && (
        <LandingScreen
          key="landing"
          onFindLeads={handleFindLeads}
          initialCompany={lastSearchedCompany}
          initialRole={lastSearchedRole}
        />
      )}
      {currentScreen === 'gallery' && (
        <DiscoveryGallery 
          key="gallery" 
          onResumeUploaded={handleResumeUploaded} 
          onNewSearch={handleNewSearch}
          targetCompany={lastSearchedCompany} 
          searchId={currentSearchId} // 3. Pass to Gallery
        />
      )}
      {currentScreen === 'leaderboard' && (
        <MatchLeaderboard 
          key="leaderboard" 
          onBack={handleBackToContacts}
          onNewSearch={handleNewSearch}
          targetCompany={lastSearchedCompany} 
          searchId={currentSearchId} // 4. Pass to Leaderboard
        />
      )}
    </AnimatePresence>
  );
}

export default App;