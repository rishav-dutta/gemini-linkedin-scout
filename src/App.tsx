import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LandingScreen } from './components/LandingScreen';
import { DiscoveryGallery } from './components/DiscoveryGallery';
import { MatchLeaderboard } from './components/MatchLeaderboard';

type Screen = 'landing' | 'gallery' | 'leaderboard';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [leads, setLeads] = useState<any[]>([]);
  // Store the company name to filter the database query later
  const [lastSearchedCompany, setLastSearchedCompany] = useState('');

  const handleFindLeads = async (companyName: string, targetRole: string) => {
    // Save the company name immediately
    setLastSearchedCompany(companyName);
    
    // Switch to your PRODUCTION URL for sharing
    const webhookUrl = import.meta.env.VITE_WEBHOOK_FIND_LEADS;
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          role: targetRole,
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
        />
      )}
      {currentScreen === 'leaderboard' && (
        <MatchLeaderboard 
          key="leaderboard" 
          targetCompany={lastSearchedCompany} 
        />
      )}
    </AnimatePresence>
  );
}

export default App;