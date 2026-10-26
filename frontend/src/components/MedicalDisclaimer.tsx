import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface MedicalDisclaimerProps {
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-[#F7F9FA] border border-[#E2E8F0] rounded-md text-xs text-[#64748B]">
        <Info className="w-4 h-4 text-[#0F766E] shrink-0" />
        <p>
          Educational screening only. Not a clinical diagnosis. Consult a qualified healthcare professional.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-md p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 text-[#0F766E]">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-semibold text-[#172B3A]">Educational Screening Notice</h4>
          <p className="text-xs text-[#64748B] leading-relaxed">
            This risk assessment is intended for screening and educational awareness only. It does not replace clinical diagnosis, laboratory testing, or in-person consultation with a qualified physician. Never delay emergency or professional medical care based on automated risk estimations.
          </p>
        </div>
      </div>
    </div>
  );
};
