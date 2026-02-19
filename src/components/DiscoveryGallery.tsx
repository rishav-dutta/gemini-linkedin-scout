import { motion } from 'framer-motion';
import { Linkedin, Upload, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, LinkedInLead } from '../lib/supabase';

interface DiscoveryGalleryProps {
  onResumeUploaded: () => void;
  leads?: LinkedInLead[];
}

export function DiscoveryGallery({ onResumeUploaded, leads: initialLeads }: DiscoveryGalleryProps) {
  const [leads, setLeads] = useState<LinkedInLead[]>(initialLeads || []);
  const [isLoading, setIsLoading] = useState(!initialLeads || initialLeads.length === 0);
  const [isScanning, setIsScanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!initialLeads || initialLeads.length === 0) {
      fetchLeads();
    }
  }, [initialLeads]);

  const fetchLeads = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('linkedin_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setLeads(data || []);
    }
    setIsLoading(false);
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
      const webhookUrl = 'https://event-gcc-ranges-usage.trycloudflare.com/webhook-test/score-resume';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      // We check for the success signal before navigating
      if (result.status === 'success') {
        onResumeUploaded();
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume');
    } finally {
      setIsScanning(false);
    }
  };

  // Helper functions for drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Potential Contacts</h1>
          <p className="text-gray-400">People you should reach out to at your target company</p>
        </div>

        <motion.div className="mb-8">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`backdrop-blur-xl bg-white/5 rounded-2xl border-2 border-dashed ${
              isDragging ? 'border-cyan-400' : 'border-white/20'
            } p-8 transition-all cursor-pointer hover:border-cyan-400/50`}
          >
            <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" id="resume-upload" disabled={isScanning} />
            <label htmlFor="resume-upload" className="cursor-pointer">
              <div className="flex flex-col items-center justify-center gap-4">
                {isScanning ? (
                  <>
                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                    <p className="text-cyan-400 font-semibold text-lg animate-pulse">Scanning Resume...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-cyan-400" />
                    <div className="text-center">
                      <p className="text-white font-semibold text-lg mb-1">Share Your Resume</p>
                      <p className="text-gray-400 text-sm">Get AI-ranked matches based on your skills</p>
                    </div>
                  </>
                )}
              </div>
            </label>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map((lead) => (
              <div key={lead.id} className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 hover:border-cyan-400/50 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                    {lead.profile_image_url ? (
                      <img src={lead.profile_image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : <User className="text-white" />}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold truncate">{lead.full_name}</h3>
                    <p className="text-cyan-400 text-sm mb-1">{lead.job_title}</p>
                    <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
                      <Linkedin className="w-4 h-4" />
                      <span className="text-sm">View</span>
                    </a>
                  </div>
                </div>
                <p className="text-gray-300 text-sm line-clamp-3">{lead.search_description}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}