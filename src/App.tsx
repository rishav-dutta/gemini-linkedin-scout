import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LandingScreen } from './components/LandingScreen';
import { DiscoveryGallery } from './components/DiscoveryGallery';
import { MatchLeaderboard } from './components/MatchLeaderboard';

type Screen = 'landing' | 'gallery' | 'leaderboard';

interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  image?: string;
  email?: string;
  linkedin?: string;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [leads, setLeads] = useState<Lead[]>([]);
  // This stores the results returned by your n8n Respond to Webhook node
  const [scoredLeads, setScoredLeads] = useState<any[]>([]);

  const handleFindLeads = async (companyName: string, targetRole: string) => {
    // 1. HARDCODED URL - Matches your current active tunnel
    const testUrl = 'https://event-gcc-ranges-usage.trycloudflare.com/webhook-test/find-leads';
    
    console.log('--- TEST STAR ---');
    console.log('Calling URL:', testUrl);
    console.log('With Data:', { company_name: companyName, role: targetRole });

    try {
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: companyName,
          role: targetRole,
        }),
      });

      console.log('Server Status:', response.status);

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      const data = await response.json();
      console.log('Server Response Data:', data);

      // Handle both array and object responses from n8n
      const leadsArray = Array.isArray(data) ? data : data.leads || [];

      setLeads(leadsArray);
      setCurrentScreen('gallery');
      console.log('--- TEST SUCCESS: MOVING TO GALLERY ---');
    } catch (error) {
      console.error('--- TEST FAILED ---');
      console.error('Detailed Error:', error);
      alert(`Connection failed: ${error instanceof Error ? error.message : 'Check Console'}`);
    }
  };

  // We add 'incomingResults' to catch the data from response.json()
  const handleResumeUploaded = (incomingResults?: any[]) => {
    if (incomingResults) {
      setScoredLeads(incomingResults); // Save the scores
    }
    setCurrentScreen('leaderboard');
  };

  return (
    <AnimatePresence mode="wait">
      {currentScreen === 'landing' && (
        <LandingScreen key="landing" onFindLeads={handleFindLeads} />
      )}
      {currentScreen === 'gallery' && (
        <DiscoveryGallery key="gallery" onResumeUploaded={handleResumeUploaded} leads={leads} />
      )}
      {currentScreen === 'leaderboard' && (
        // We pass the saved scores directly into the leaderboard
        <MatchLeaderboard key="leaderboard" initialLeads={scoredLeads} />
      )}
    </AnimatePresence>
  );
}

export default App;
