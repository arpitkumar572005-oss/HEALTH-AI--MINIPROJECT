import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EmergencyBannerProps {
  message?: string | null;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ message }) => {
  return (
    <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-card p-4.5 text-[#B91C1C] flex items-start gap-3.5 shadow-subtle animate-pulse">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#DC2626]" />
      <div className="text-sm">
        <span className="font-semibold block mb-0.5">Important Health Notice:</span>
        <p className="text-xs leading-relaxed text-[#991B1B]">
          {message || 'If you are experiencing severe, sudden, or rapidly worsening symptoms, seek urgent medical attention or contact local emergency services immediately.'}
        </p>
      </div>
    </div>
  );
};
