import { motion } from 'framer-motion';
import { ChevronDown, Linkedin } from 'lucide-react';
import { useState } from 'react';
import { isScored, type LinkedInLead } from '../lib/supabase';
import { useLeads } from '../lib/useLeads';
import { Avatar, BackButton, LoadError, Page, Spinner } from './Feedback';

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
  // 'top' opens the best match's reasoning until the visitor opens or closes one themselves
  const [expandedId, setExpandedId] = useState<number | 'top' | null>('top');

  // Scored leads first (already sorted by score), then any Gemini skipped
  const leads = [...rows.filter(isScored), ...rows.filter((lead) => !isScored(lead))];
  const scoredCount = rows.filter(isScored).length;

  if (isLoading) {
    return (
      <Page>
        <div className="min-h-[80dvh] flex items-center justify-center">
          <Spinner />
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <BackButton label="Upload another resume" onClick={onBack} />
          <button onClick={onNewSearch} className="text-muted hover:text-ink transition-colors text-sm">
            New search
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-balance font-serif font-semibold text-3xl sm:text-4xl tracking-tight break-words">
            Best matches at {targetCompany}
          </h1>
          <p className="mt-2 text-muted">
            {scoredCount > 0
              ? 'Ranked by how closely their background matches your resume. Start at the top.'
              : 'Ranked by how closely their background matches your resume.'}
          </p>
        </div>

        {leads.length > 0 ? (
          <ol className="rounded-xl border border-rule bg-card divide-y divide-rule">
            {leads.map((lead, index) => {
              const scored = isScored(lead);
              const isExpanded = expandedId === 'top' ? index === 0 && scored : expandedId === lead.id;
              const score = Math.max(0, Math.min(100, lead.similarity_score ?? 0));

              return (
                <motion.li
                  key={lead.id || index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 sm:p-6"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className="hidden sm:block font-serif font-semibold text-xl text-muted w-6 shrink-0 pt-3 text-center">
                      {scored ? index + 1 : '–'}
                    </span>
                    <div className="relative shrink-0">
                      <Avatar name={lead.full_name} src={lead.profile_image_url} className="w-11 h-11 sm:w-14 sm:h-14 text-sm" />
                      {/* On phones the rank sits on the photo to leave room for the name */}
                      <span className="sm:hidden absolute -top-1 -left-1 w-5 h-5 rounded-full bg-ink text-paper text-[11px] font-semibold flex items-center justify-center ring-2 ring-card">
                        {scored ? index + 1 : '–'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-lg leading-snug break-words">{lead.full_name}</h3>
                        <p className="text-muted text-sm break-words">{titleWithCompany(lead)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {scored ? (
                          <>
                            <div className="text-2xl font-semibold tabular-nums leading-none">
                              {score}
                              <span className="text-sm text-muted font-normal">/100</span>
                            </div>
                            <div className="mt-2 ml-auto h-1.5 w-16 sm:w-20 rounded-full bg-rule overflow-hidden" aria-hidden="true">
                              <div className="h-full rounded-full bg-accent" style={{ width: `${score}%` }} />
                            </div>
                          </>
                        ) : (
                          <div className="text-muted text-sm pt-1">Not scored</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Full width on phones; lined up with the name (rank + photo + gaps = 7rem) on larger screens */}
                  <div className="sm:pl-28">
                    {lead.search_description && (
                      <p className="mt-3 text-sm text-muted leading-relaxed">{lead.search_description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                      {lead.scoring_reasoning && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                          aria-expanded={isExpanded}
                          className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent-hover"
                        >
                          Why this score
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                      <a
                        href={lead.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-muted hover:text-ink"
                      >
                        <Linkedin className="w-4 h-4" />
                        View on LinkedIn
                      </a>
                    </div>

                    {isExpanded && lead.scoring_reasoning && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 text-sm leading-relaxed border-l-2 border-accent pl-3"
                      >
                        {lead.scoring_reasoning}
                      </motion.p>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ol>
        ) : loadFailed ? (
          <LoadError onRetry={reload} />
        ) : (
          <div className="text-center py-20 rounded-xl border border-dashed border-rule">
            <p className="text-muted">No matches found for this search.</p>
          </div>
        )}
      </motion.div>
    </Page>
  );
}
