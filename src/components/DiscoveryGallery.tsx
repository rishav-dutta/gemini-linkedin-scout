import { motion } from 'framer-motion';
import { Linkedin, Upload, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, functionErrorMessage } from '../lib/supabase';
import { useLeads } from '../lib/useLeads';
import { BackButton, ErrorBanner, LoadError } from './Feedback';

// Same limit the n8n-proxy Edge Function enforces
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

interface DiscoveryGalleryProps {
  onResumeUploaded: () => void;
  onNewSearch: () => void;
  targetCompany: string;
  searchId: string; // Added searchId to the interface
}

export function DiscoveryGallery({ 
  onResumeUploaded, 
  onNewSearch,
  targetCompany,
  searchId 
}: DiscoveryGalleryProps) {
  const { leads, isLoading, loadFailed, reload } = useLeads(searchId, 'created_at');
  const [isScanning, setIsScanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto">
        <div className="mb-6">
          <BackButton label="New search" onClick={onNewSearch} />
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Contacts at {targetCompany}</h1>
          <p className="text-gray-400">Upload your resume to see who matches your profile best.</p>
        </div>

        <div className="mb-8 space-y-3">
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
            disabled={isScanning} 
          />
          <label
            htmlFor="resume-upload"
            onDragOver={(e) => {
              e.preventDefault();
              if (!isScanning) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file && !isScanning) handleFileUpload(file);
            }}
            className={`block backdrop-blur-xl rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragging ? 'border-cyan-400 bg-cyan-400/10' : 'bg-white/5 border-white/20 hover:border-cyan-400/50'
            } ${isScanning ? 'cursor-wait' : 'cursor-pointer'}`}
          >
            {/* pointer-events-none stops child elements from firing dragleave on the zone */}
            <div className="flex flex-col items-center gap-4 pointer-events-none">
              {isScanning ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-cyan-400 animate-pulse">Analyzing matches...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-cyan-400" />
                  <p className="text-white font-semibold">
                    {isDragging ? 'Drop your resume to upload' : 'Click or drag resume here'}
                  </p>
                  <p className="text-gray-500 text-sm">PDF, up to 5 MB</p>
                </>
              )}
            </div>
          </label>
          {uploadError && <ErrorBanner message={uploadError} />}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.length > 0 ? (
              leads.map((lead) => (
                <div key={lead.id} className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden border border-white/10">
                      {lead.profile_image_url ? (
                        <img 
                          src={lead.profile_image_url} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                          alt={lead.full_name}
                        />
                      ) : <User className="m-3 text-gray-500" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold truncate">{lead.full_name}</h3>
                      <p className="text-cyan-400 text-sm truncate">{lead.job_title}</p>
                      <a
                        href={lead.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-gray-400 hover:text-cyan-300 transition-colors"
                      >
                        <Linkedin className="w-4 h-4" />
                        <span className="text-sm">View Profile</span>
                      </a>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-3 italic">"{lead.search_description}"</p>
                </div>
              ))
            ) : loadFailed ? (
              <LoadError onRetry={reload} />
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">No leads found for this search. Try a different company.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
