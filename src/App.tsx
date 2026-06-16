import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import { LandingScreen } from './components/LandingScreen';
import { DiscoveryGallery } from './components/DiscoveryGallery';
import { MatchLeaderboard } from './components/MatchLeaderboard';

type Screen = 'landing' | 'gallery' | 'leaderboard';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [leads, setLeads] = useState<any[]>([]);
  const [lastSearchedCompany, setLastSearchedCompany] = useState('');
  
  // 1. Initialize the Search ID state
  const [currentSearchId, setCurrentSearchId] = useState<string>('');

  const handleFindLeads = async (companyName: string, targetRole: string) => {
    // 2. Generate the unique ID specifically when a search starts
    const newSearchId = crypto.randomUUID();
    setCurrentSearchId(newSearchId);
    setLastSearchedCompany(companyName);
    
    const webhookUrl = import.meta.env.VITE_WEBHOOK_FIND_LEADS;
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          role: targetRole,
          search_id: newSearchId, // Use the fresh ID here
        }),
      });

      if (!response.ok) throw new Error(`Webhook returned ${response.status}`);

      const data = await response.json();
      const leadsArray = Array.isArray(data) ? data : data.leads || [];

      setLeads(leadsArray);
      setCurrentScreen('gallery');
    } catch (error) {
      console.error('Search failed:', error);
      alert('Connection failed. Please check your n8n tunnel.');
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
      <Analytics />
    </AnimatePresence>
  );
}

export default App;