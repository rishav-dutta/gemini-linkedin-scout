import { motion } from 'framer-motion';
import { FileUp, Linkedin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, functionErrorMessage } from '../lib/supabase';
import { useLeads } from '../lib/useLeads';
import { Avatar, BackButton, ErrorBanner, LoadError, Page, Spinner } from './Feedback';

// Same limit the n8n-proxy Edge Function enforces
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

interface DiscoveryGalleryProps {
  onResumeUploaded: () => void;
  onNewSearch: () => void;
  targetCompany: string;
  targetRole: string;
  searchId: string; // Added searchId to the interface
}

export function DiscoveryGallery({ 
  onResumeUploaded, 
  onNewSearch,
  targetCompany,
  targetRole,
  searchId 
}: DiscoveryGalleryProps) {
  // Contacts show as soon as the web search is saved; full profiles (needed for
  // scoring) arrive a little later, so uploading waits for them
  const { leads, isLoading, loadFailed, details, reload } = useLeads(searchId, 'created_at', true);
  const [isScanning, setIsScanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canUpload = details === 'ready' && !isScanning;
  const missingDetails = details === 'ready' ? leads.filter((lead) => lead.enriched === false).length : 0;

  // A file dropped outside the upload zone would make the browser open it and lose this search
  useEffect(() => {
    const preventFileOpen = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', preventFileOpen);
    window.addEventListener('drop', preventFileOpen);
    return () => {
      window.removeEventListener('dragover', preventFileOpen);
      window.removeEventListener('drop', preventFileOpen);
    };
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploadError(null);

    // Some systems leave the type empty for dropped files, so also accept a .pdf name;
    // the Edge Function checks the file contents either way
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Please upload a PDF file.');
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setUploadError('That file is over 5 MB. Please upload a smaller PDF.');
      return;
    }

    setIsScanning(true);
    
    // Prepare multi-part form data
    const formData = new FormData();
    formData.append('resume', file);
    // Crucial: Send the searchId so the backend scores the right people
    formData.append('search_id', searchId); 
    formData.append('target_company', targetCompany);

    try {
      // Goes through the n8n-proxy Edge Function (validation, rate limit, secret)
      const { data: result, error } = await supabase.functions.invoke('n8n-proxy/score-resume', {
        body: formData,
      });

      if (error) throw error;

      // n8n replies with a text/plain body, so the JSON may arrive as a string
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;

      // Check for success signal from your n8n/backend workflow
      if (parsed?.status === 'success' || parsed?.message === 'success') {
        onResumeUploaded();
      } else {
        throw new Error(`Unexpected response: ${JSON.stringify(parsed)}`);
      }
    } catch (error) {
      console.error('Error during resume processing:', error);
      setUploadError(await functionErrorMessage(error, 'Failed to upload and process resume. Please try again.'));
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Page>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
        <div className="mb-8">
          <BackButton label="New search" onClick={onNewSearch} />
        </div>

        <div className="mb-8">
          <h1 className="text-balance font-serif font-semibold text-3xl sm:text-4xl tracking-tight break-words">People at {targetCompany}</h1>
          <p className="mt-2 text-muted">
            {isLoading
              ? `Searching for ${targetRole}…`
              : `${leads.length} ${leads.length === 1 ? 'person' : 'people'} found for “${targetRole}”. Upload your resume to rank them.`}
          </p>
        </div>

        <div className="mb-10 space-y-3">
          <input 
            type="file" 
            accept=".pdf" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Clear the input so picking the same file again (e.g. after an error) fires onChange
              e.target.value = '';
              if (file) handleFileUpload(file);
            }} 
            className="hidden" 
            id="resume-upload" 
            disabled={!canUpload} 
          />
          <label
            htmlFor="resume-upload"
            onDragOver={(e) => {
              e.preventDefault();
              if (canUpload) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file && canUpload) handleFileUpload(file);
            }}
            aria-disabled={!canUpload}
            className={`block rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
              isDragging ? 'border-accent bg-accent-soft' : 'border-rule bg-card'
            } ${canUpload ? 'cursor-pointer hover:border-accent' : isScanning ? 'cursor-wait' : 'cursor-not-allowed'}`}
          >
            {/* pointer-events-none stops child elements from firing dragleave on the zone */}
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              {isScanning ? (
                <>
                  <Spinner />
                  <p className="font-medium mt-1">Scoring your matches…</p>
                  <p className="text-muted text-sm">Usually done in under 20 seconds</p>
                </>
              ) : details === 'loading' ? (
                <>
                  <Spinner />
                  <p className="font-medium mt-1">Loading full profiles…</p>
                  <p className="text-muted text-sm">You can upload your resume in a moment (usually 10–30 seconds)</p>
                </>
              ) : details === 'failed' ? (
                <>
                  <FileUp className="w-8 h-8 text-muted" />
                  <p className="font-medium text-muted mt-1">Matches can't be scored for this search</p>
                </>
              ) : (
                <>
                  <FileUp className="w-8 h-8 text-accent" />
                  <p className="font-medium mt-1">
                    {isDragging ? (
                      'Drop your resume to upload'
                    ) : (
                      <>
                        {/* Phones and tablets can't drag files, so they get a tap prompt */}
                        <span className="pointer-coarse:hidden">
                          Drop your resume here, or <span className="text-accent underline underline-offset-2">choose a file</span>
                        </span>
                        <span className="hidden pointer-coarse:inline">Tap to choose your resume</span>
                      </>
                    )}
                  </p>
                  <p className="text-muted text-sm">PDF, up to 5 MB</p>
                </>
              )}
            </div>
          </label>
          {details === 'failed' && (
            <ErrorBanner message="Couldn't load profile details for these contacts. Please try a new search." />
          )}
          {missingDetails > 0 && (
            <p className="text-muted text-sm">
              Profile details couldn't be loaded for {missingDetails} of {leads.length} people, so they won't be scored.
            </p>
          )}
          {uploadError && <ErrorBanner message={uploadError} />}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leads.length > 0 ? (
              leads.map((lead) => (
                <div key={lead.id} className="rounded-xl border border-rule bg-card p-5">
                  <div className="flex items-start gap-4">
                    <Avatar name={lead.full_name} src={lead.profile_image_url} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{lead.full_name}</h3>
                      <p className="text-muted text-sm line-clamp-2">{lead.job_title}</p>
                    </div>
                    <a
                      href={lead.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${lead.full_name} on LinkedIn`}
                      className="shrink-0 inline-flex items-center gap-1 text-sm text-accent hover:text-accent-hover"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span className="hidden sm:inline">Profile</span>
                    </a>
                  </div>
                  {lead.search_description && (
                    <p className="mt-3 text-sm text-muted line-clamp-3">{lead.search_description}</p>
                  )}
                </div>
              ))
            ) : loadFailed ? (
              <LoadError onRetry={reload} />
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted">No leads found for this search. Try a different company.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </Page>
  );
}
