import { motion } from 'framer-motion';
import { Linkedin, Upload, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, LinkedInLead } from '../lib/supabase';

interface DiscoveryGalleryProps {
  onResumeUploaded: () => void;
  leads?: LinkedInLead[];
  targetCompany: string;
  searchId: string; // Added searchId to the interface
}

export function DiscoveryGallery({ 
  onResumeUploaded, 
  leads: initialLeads, 
  targetCompany,
  searchId 
}: DiscoveryGalleryProps) {
  const [leads, setLeads] = useState<LinkedInLead[]>(initialLeads || []);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (searchId) {
      fetchLeads();
    }
  }, [targetCompany, searchId]); // Re-fetch if company or search session changes

  const fetchLeads = async () => {
    setIsLoading(true);
    console.log(`Fetching leads for Search ID: ${searchId}`);

    try {
      // Step 1: Query Supabase specifically for this search session
      const { data, error } = await supabase
        .from('linkedin_leads')
        .select('*')
        .eq('search_id', searchId) 
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database Error:', error.message);
      } else if (data) {
        // Step 2: Extra safety filter for the specific company name in JS
        const searchTerm = targetCompany.toLowerCase().trim(); 
        const filtered = data.filter(lead => 
          lead.company?.toLowerCase().includes(searchTerm)
        );
        
        console.log(`Found ${filtered.length} leads for search ${searchId}`);
        setLeads(filtered);
      }
    } catch (err) {
      console.error('Unexpected Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
      const webhookUrl = import.meta.env.VITE_WEBHOOK_SCORE_RESUME;
      const response = await fetch(webhookUrl, { 
        method: 'POST', 
        body: formData 
      });

      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

      const result = await response.json();
      
      // Check for success signal from your n8n/backend workflow
      if (result.status === 'success' || result.message === 'success') {
        onResumeUploaded();
      }
    } catch (error) {
      console.error('Error during resume processing:', error);
      alert('Failed to upload and process resume. Check your backend logs.');
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
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
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
                    <p className="text-xs text-gray-500 underline">Session ID: {searchId}</p>
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
                <p className="text-gray-500">No leads found for this search. Try a different company.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}