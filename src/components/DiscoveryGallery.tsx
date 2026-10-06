import { motion } from 'framer-motion';
import { Upload, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, LinkedInLead, functionErrorMessage } from '../lib/supabase';

interface DiscoveryGalleryProps {
  onResumeUploaded: () => void;
  targetCompany: string;
  searchId: string; // Added searchId to the interface
}

export function DiscoveryGallery({ 
  onResumeUploaded, 
  targetCompany,
  searchId 
}: DiscoveryGalleryProps) {
  const [leads, setLeads] = useState<LinkedInLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Ignore a response that arrives after the search changed or the screen closed
    let cancelled = false;

    const fetchLeads = async () => {
      setIsLoading(true);
      setLoadFailed(false);

      // The function returns only this search's leads (the table itself is not publicly readable)
      const { data, error } = await supabase
        .rpc('get_leads_for_search', { p_search_id: searchId })
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error('Database Error:', error.message);
        setLoadFailed(true);
      } else {
        setLeads((data ?? []) as LinkedInLead[]);
      }
      setIsLoading(false);
    };

    if (searchId) fetchLeads();
    return () => {
      cancelled = true;
    };
  }, [searchId, reloadCount]);

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
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
      alert(await functionErrorMessage(error, 'Failed to upload and process resume. Please try again.'));
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Contacts at {targetCompany}</h1>
          <p className="text-gray-400">Upload your resume to see who matches your profile best.</p>
        </div>

        <div className="mb-8">
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl border-2 border-dashed border-white/20 p-8 text-center hover:border-cyan-400/50 transition-all cursor-pointer relative">
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
            <label htmlFor="resume-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-4">
                {isScanning ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-cyan-400 animate-pulse">Analyzing matches...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-cyan-400" />
                    <p className="text-white font-semibold">Click or drag resume here</p>
                  </>
                )}
              </div>
            </label>
          </div>
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
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-3 italic">"{lead.search_description}"</p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                {loadFailed ? (
                  <>
                    <p className="text-gray-500 mb-3">Could not load contacts.</p>
                    <button
                      onClick={() => setReloadCount((count) => count + 1)}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
                    >
                      Try again
                    </button>
                  </>
                ) : (
                  <p className="text-gray-500">No leads found for this search. Try a different company.</p>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
