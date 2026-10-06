import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Linkedin, Trophy, User } from 'lucide-react';
import { useState } from 'react';
import { isScored, type LinkedInLead } from '../lib/supabase';
import { useLeads } from '../lib/useLeads';
import { BackButton, LoadError } from './Feedback';

interface MatchLeaderboardProps {
  onBack: () => void;
  onNewSearch: () => void;
  targetCompany: string;
  searchId: string; // Added searchId to the interface
}

// Titles from search results often already name the company ("PM at Acme"),
// so only add "@ Company" when they don't
function titleWithCompany(lead: LinkedInLead): string {
  const mentionsCompany = lead.company && lead.job_title?.toLowerCase().includes(lead.company.toLowerCase());
  return [lead.job_title, mentionsCompany ? null : lead.company].filter(Boolean).join(' @ ');
}

export function MatchLeaderboard({ onBack, onNewSearch, targetCompany, searchId }: MatchLeaderboardProps) {
  const { leads: rows, isLoading, loadFailed, reload } = useLeads(searchId, 'similarity_score');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Scored leads first (already sorted by score), then any Gemini skipped
  const leads = [...rows.filter(isScored), ...rows.filter((lead) => !isScored(lead))];

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-linear-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-linear-to-br from-gray-900 via-slate-900 to-gray-900 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <BackButton label="Upload another resume" onClick={onBack} />
          <button
            onClick={onNewSearch}
            className="text-gray-400 hover:text-cyan-300 transition-colors text-sm font-medium"
          >
            New search
          </button>
        </div>

        <div className="mb-8 flex items-center gap-3 sm:gap-4">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 shrink-0" />
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 break-words">Best Matches at {targetCompany}</h1>
            <p className="text-gray-400 text-base sm:text-lg">Ranked by how well you align with them</p>
          </div>
        </div>

        <div className="space-y-4">
          {leads.length > 0 ? (
            leads.map((lead, index) => {
              const scored = isScored(lead);
              const isTop = scored && index < 3;
              const isExpanded = expandedId === lead.id;
              const rank = scored ? index + 1 : '–';
              const rankStyle = isTop ? 'bg-linear-to-br from-green-400 to-emerald-500 text-white' : 'bg-white/10 text-gray-400';

              return (
                <motion.div
                  key={lead.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`backdrop-blur-xl bg-white/5 rounded-2xl border transition-all ${
                    isTop ? 'border-green-400 shadow-lg shadow-green-500/20' : 'border-white/10'
                  } overflow-hidden`}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex items-center gap-4 shrink-0">
                        <div className={`hidden sm:flex w-12 h-12 rounded-full items-center justify-center font-bold text-lg ${rankStyle}`}>
                          {rank}
                        </div>
                        
                        <div className="relative">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                            {lead.profile_image_url ? (
                              <img 
                                src={lead.profile_image_url} 
                                alt={lead.full_name} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                            )}
                          </div>
                          {/* On phones the rank sits on the photo to leave room for the name */}
                          <div className={`sm:hidden absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-slate-900 ${rankStyle}`}>
                            {rank}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 flex items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                          <h3 className="text-white font-semibold text-lg sm:text-xl mb-0.5 break-words">{lead.full_name}</h3>
                          <p className="text-cyan-400 text-sm font-medium mb-2 break-words">{titleWithCompany(lead)}</p>
                          <a 
                            href={lead.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-gray-400 hover:text-cyan-300 transition-colors"
                          >
                            <Linkedin className="w-4 h-4" />
                            <span className="text-sm">View Profile</span>
                          </a>
                        </div>
                        <div className="text-right shrink-0">
                          {scored ? (
                            <>
                              <div className={`text-2xl sm:text-3xl font-bold ${isTop ? 'text-green-400' : 'text-cyan-400'}`}>
                                {lead.similarity_score}%
                              </div>
                              <div className="text-gray-400 text-xs sm:text-sm">
                                <span className="sm:hidden">Match</span>
                                <span className="hidden sm:inline">Compatibility</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-gray-500 text-sm pt-2">Not scored</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Full width on phones; lined up with the name column (rank + photo + gaps = 9rem) on larger screens */}
                    <div className="mt-3 sm:mt-2 sm:pl-36">
                      <p className="text-gray-300 text-sm leading-relaxed mb-4">{lead.search_description}</p>
                      
                      {lead.scoring_reasoning && (
                        <button 
                          onClick={() => toggleExpanded(lead.id)} 
                          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? 'Hide Reasoning' : 'Show Reasoning'}
                        </button>
                      )}
                    </div>

                    {isExpanded && lead.scoring_reasoning && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        className="mt-4 pt-4 border-t border-white/10"
                      >
                        <h4 className="text-white font-semibold mb-2 text-sm">AI Analysis:</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{lead.scoring_reasoning}</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : loadFailed ? (
            <LoadError onRetry={reload} />
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <p className="text-gray-500">No matches found for this search.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}