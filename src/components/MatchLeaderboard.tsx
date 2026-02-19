import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Linkedin, Trophy, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, LinkedInLead } from '../lib/supabase';

interface MatchLeaderboardProps {
  targetCompany: string;
}

export function MatchLeaderboard({ targetCompany }: MatchLeaderboardProps) {
  const [leads, setLeads] = useState<LinkedInLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [targetCompany]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch all scored leads
      const { data, error } = await supabase
        .from('linkedin_leads')
        .select('*')
        .not('similarity_score', 'is', null)
        .order('similarity_score', { ascending: false });

      if (error) throw error;

      if (data) {
        // 2. Filter locally to ensure strict company matching
        const searchTerm = targetCompany.toLowerCase().trim();
        const filtered = data.filter(lead => 
          (lead.company || '').toLowerCase().includes(searchTerm)
        );
        setLeads(filtered);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Trophy className="w-10 h-10 text-yellow-400" />
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Best Matches at {targetCompany}</h1>
            <p className="text-gray-400 text-lg">Ranked by resume compatibility</p>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-gray-400">No scored matches found for "{targetCompany}".</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead, index) => {
              const isTop = index < 3;
              const isExpanded = expandedId === lead.id;

              return (
                <motion.div
                  key={lead.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`backdrop-blur-xl bg-white/5 rounded-2xl border transition-all ${
                    isTop ? 'border-green-400 shadow-lg shadow-green-500/20' : 'border-white/10'
                  } overflow-hidden`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          isTop ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' : 'bg-white/10 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                          {lead.profile_image_url ? (
                            <img src={lead.profile_image_url} alt={lead.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : <User className="w-8 h-8 text-gray-500" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="text-white font-semibold text-xl mb-0.5">{lead.full_name}</h3>
                            <p className="text-cyan-400 text-sm font-medium mb-2">{lead.job_title} @ {lead.company}</p>
                            <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gray-400 hover:text-cyan-300 transition-colors">
                              <Linkedin className="w-4 h-4" />
                              <span className="text-sm">View Profile</span>
                            </a>
                          </div>
                          <div className="text-right">
                            <div className={`text-3xl font-bold ${isTop ? 'text-green-400' : 'text-cyan-400'}`}>
                              {lead.similarity_score}%
                            </div>
                            <div className="text-gray-400 text-sm">Compatibility</div>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">{lead.search_description}</p>
                        
                        {lead.scoring_reasoning && (
                          <button onClick={() => toggleExpanded(lead.id)} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {isExpanded ? 'Hide Reasoning' : 'Show Reasoning'}
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && lead.scoring_reasoning && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-white/10">
                        <h4 className="text-white font-semibold mb-2 text-sm">AI Analysis:</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{lead.scoring_reasoning}</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}