import { motion } from 'framer-motion';
import { Linkedin, Upload, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, LinkedInLead } from '../lib/supabase';

interface DiscoveryGalleryProps {
  onResumeUploaded: () => void;
  leads?: (LinkedInLead | any)[];
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

    if (error) {
      console.error('Error fetching leads:', error);
    } else {
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
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      onResumeUploaded(); 
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Potential Contacts</h1>
          <p className="text-gray-400">People you should reach out to at your target company</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`backdrop-blur-xl bg-white/5 rounded-2xl border-2 border-dashed ${
              isDragging ? 'border-cyan-400' : 'border-white/20'
            } p-8 transition-all cursor-pointer hover:border-cyan-400/50`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="resume-upload"
              disabled={isScanning}
            />
            <label htmlFor="resume-upload" className="cursor-pointer">
              <div className="flex flex-col items-center justify-center gap-4">
                {isScanning ? (
                  <>
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-cyan-500 rounded-full animate-pulse" />
                    </div>
                    <p className="text-cyan-400 font-semibold text-lg animate-pulse">
                      Scanning Resume...
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-cyan-400" />
                    <div className="text-center">
                      <p className="text-white font-semibold text-lg mb-1">
                        Share Your Resume
                      </p>
                      <p className="text-gray-400 text-sm">
                        Get AI-ranked matches based on your skills
                      </p>
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
        ) : leads.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No contacts found yet</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {leads.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 hover:border-cyan-400/50 transition-all hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    {lead.profile_image_url ? (
                      <img
                        src={lead.profile_image_url}
                        alt={lead.full_name}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg mb-1 truncate">
                      {lead.full_name}
                    </h3>
                    <p className="text-cyan-400 text-sm mb-1">{lead.job_title}</p>
                    <a
                      href={lead.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span className="text-sm">View Profile</span>
                    </a>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{lead.search_description}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
