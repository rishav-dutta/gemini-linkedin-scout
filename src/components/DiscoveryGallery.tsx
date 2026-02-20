import { motion } from 'framer-motion';
import { Linkedin, Upload, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, LinkedInLead } from '../lib/supabase';

interface DiscoveryGalleryProps {
  onResumeUploaded: () => void;
  leads?: LinkedInLead[];
  targetCompany: string; // New prop to handle filtering
}

export function DiscoveryGallery({ onResumeUploaded, leads: initialLeads, targetCompany }: DiscoveryGalleryProps) {
  const [leads, setLeads] = useState<LinkedInLead[]>(initialLeads || []);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [targetCompany]); // Re-fetch if the company changes

  const fetchLeads = async () => {
    setIsLoading(true);
    console.log('Fetching all leads to bypass API schema errors...');

    try {
      // Step 1: Get the latest leads without a DB-side filter to avoid the 400 error
      const { data, error } = await supabase
        .from('linkedin_leads')
        .select('*')
        .eq('search_id', currentSearchId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database Error:', error.message);
      } else if (data) {
        // Step 2: Filter the data in JavaScript
        // This is much safer if the API doesn't recognize the "company" column yet
        const searchTerm = targetCompany.toLowerCase().trim();
        const filtered = data.filter(lead => 
          lead.company?.toLowerCase().includes(searchTerm)
        );
        
        console.log(`Total Leads: ${data.length} | Matches for "${targetCompany}": ${filtered.length}`);
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
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const webhookUrl = import.meta.env.VITE_WEBHOOK_SCORE_RESUME;
      const response = await fetch(webhookUrl, { method: 'POST', body: formData });

      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

      const result = await response.json();
      if (result.status === 'success') {
        onResumeUploaded();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to upload resume');
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
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl border-2 border-dashed border-white/20 p-8 text-center hover:border-cyan-400/50 transition-all cursor-pointer">
            <input type="file" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" id="resume-upload" disabled={isScanning} />
            <label htmlFor="resume-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-4">
                {isScanning ? (
                  <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
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
          <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map((lead) => (
              <div key={lead.id} className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden">
                    {lead.profile_image_url ? (
                      <img src={lead.profile_image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : <User className="m-3 text-gray-500" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold truncate">{lead.full_name}</h3>
                    <p className="text-cyan-400 text-sm truncate">{lead.job_title}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm line-clamp-3 italic">"{lead.search_description}"</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}