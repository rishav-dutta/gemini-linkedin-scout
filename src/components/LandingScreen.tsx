import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { ErrorBanner, Page } from './Feedback';

const DOCS_URL = 'https://rishav-dutta.github.io/linkedin-scout/';

// Filling the form from an example doesn't run a search, so it costs nothing
const EXAMPLES = [
  { company: 'Airtable', role: 'Product Manager' },
  { company: 'Stripe', role: 'Data Scientist' },
  { company: 'Notion', role: 'Designer' },
];

interface LandingScreenProps {
  onFindLeads: (companyName: string, targetRole: string) => Promise<void>;
  // Prefilled from the previous search when coming back via "New search"
  initialCompany?: string;
  initialRole?: string;
}

export function LandingScreen({ onFindLeads, initialCompany = '', initialRole = '' }: LandingScreenProps) {
  const [companyName, setCompanyName] = useState(initialCompany);
  const [targetRole, setTargetRole] = useState(initialRole);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !targetRole.trim()) return;

    setError(null);
    setIsLoading(true);
    try {
      await onFindLeads(companyName, targetRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
    }
    setIsLoading(false);
  };

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-card border border-rule text-ink placeholder:text-muted/70 focus:outline-hidden focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors';

  return (
    <Page>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto flex flex-col min-h-[calc(100dvh-2.5rem)] sm:min-h-[calc(100dvh-4rem)]"
      >
        <header className="flex items-center justify-between text-sm">
          <span className="font-serif text-lg font-semibold">LinkedIn Scout</span>
          <a href={DOCS_URL} className="text-muted hover:text-ink transition-colors">
            How it works
          </a>
        </header>

        <main className="flex-1 flex flex-col justify-center py-12 sm:py-16">
          <h1 className="text-balance font-serif font-semibold text-4xl sm:text-5xl leading-tight tracking-tight max-w-2xl">
            Find the right people to reach out to.
          </h1>
          <p className="mt-4 text-lg text-muted max-w-xl">
            Enter a company and a role. You’ll see who works there, then upload your resume to rank them by how
            closely their background matches yours.
          </p>

          <form onSubmit={handleSubmit} className="mt-10">
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div>
                <label htmlFor="company" className="block text-sm font-medium mb-1.5">
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Google, Meta, Stripe"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium mb-1.5">
                  Role or team
                </label>
                <input
                  id="role"
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Engineering, Product, Sales"
                  className={inputClass}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="h-[50px] px-6 rounded-lg bg-accent hover:bg-accent-hover text-white dark:text-paper font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white dark:border-paper/40 dark:border-t-paper rounded-full animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Find people
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">Try</span>
              {EXAMPLES.map((example) => (
                <button
                  key={example.company}
                  type="button"
                  onClick={() => {
                    setCompanyName(example.company);
                    setTargetRole(example.role);
                    setError(null);
                  }}
                  className="px-3 py-1 rounded-full border border-rule text-muted hover:text-ink hover:border-muted transition-colors"
                >
                  {example.company} · {example.role}
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-6">
                <ErrorBanner message={error} />
              </div>
            )}
          </form>

          <ol className="mt-14 grid gap-6 sm:grid-cols-3 text-sm border-t border-rule pt-8">
            <li>
              <span className="font-serif text-lg font-semibold">1. Search</span>
              <p className="mt-1 text-muted">People in that role at the company appear in about a second.</p>
            </li>
            <li>
              <span className="font-serif text-lg font-semibold">2. Upload</span>
              <p className="mt-1 text-muted">Add your resume as a PDF once their profiles have loaded.</p>
            </li>
            <li>
              <span className="font-serif text-lg font-semibold">3. Reach out</span>
              <p className="mt-1 text-muted">Start with the best matches. Each score comes with a reason.</p>
            </li>
          </ol>
        </main>

        <footer className="text-xs text-muted">
          Built by{' '}
          <a href="https://linkedin.com/in/duttarishav" className="underline underline-offset-2 hover:text-ink">
            Rishav Dutta
          </a>{' '}
          ·{' '}
          <a href="https://github.com/rishav-dutta/linkedin-scout" className="underline underline-offset-2 hover:text-ink">
            Source
          </a>
        </footer>
      </motion.div>
    </Page>
  );
}
