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

  const handleFindLeads = async (companyName: string, targetRole: string) => {
    try {
      const response = await fetch('https://villas-equality-blues-leave.trycloudflare.com/webhook-test/find-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: 'FedEx',
          role: 'Product Manager',
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      const data = await response.json();
      const leadsArray = Array.isArray(data) ? data : data.leads || [];

      setLeads(leadsArray);
      setCurrentScreen('gallery');
    } catch (error) {
      console.error('Error triggering webhook:', error);
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
        <DiscoveryGallery key="gallery" onResumeUploaded={handleResumeUploaded} leads={leads} />
      )}
      {currentScreen === 'leaderboard' && (
        <MatchLeaderboard key="leaderboard" />
      )}
    </AnimatePresence>
  );
}

export default App;
