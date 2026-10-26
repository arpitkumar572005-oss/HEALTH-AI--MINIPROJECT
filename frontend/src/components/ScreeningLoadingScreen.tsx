import React, { useState, useEffect } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';

interface ScreeningLoadingScreenProps {
  screeningTitle: string;
}

export const ScreeningLoadingScreen: React.FC<ScreeningLoadingScreenProps> = ({ screeningTitle }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    { title: 'Validating information', detail: 'Verifying input bounds and biometrics' },
    { title: 'Processing health measurements', detail: 'Applying clinical standard normalization' },
    { title: 'Running AI screening model', detail: 'Executing disease-specific statistical inference' },
    { title: 'Preparing explainable results', detail: 'Computing factor contributions & safety flags' },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setStepIndex(1), 600);
    const timer2 = setTimeout(() => setStepIndex(2), 1200);
    const timer3 = setTimeout(() => setStepIndex(3), 1900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="min-h-[460px] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      {/* AI Pulse Badge */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-elevated animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-blue-500 opacity-20 filter blur-sm animate-pulse" />
      </div>

      <h3 className="text-xl font-bold text-[#172033] tracking-tight">
        Analyzing Health Information
      </h3>
      <p className="text-xs text-[#667085] mt-1.5 mb-8">
        Evaluating {screeningTitle.toLowerCase()} indicators against statistical screening benchmarks.
      </p>

      {/* Progressive Checkpoints */}
      <div className="w-full space-y-3.5 text-left bg-[#FFFFFF] border border-[#E6EAF0] p-5 rounded-2xl shadow-subtle">
        {steps.map((step, idx) => {
          const isDone = idx < stepIndex;
          const isCurrent = idx === stepIndex;

          return (
            <div key={idx} className="flex items-start gap-3 transition-all duration-300">
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <div className="w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full bg-blue-50 text-[#1677FF] flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-[#CBD5E1] bg-white" />
                )}
              </div>

              <div>
                <p className={`text-xs font-semibold ${isDone ? 'text-[#172033]' : isCurrent ? 'text-[#1677FF]' : 'text-[#94A3B8]'}`}>
                  {step.title}
                </p>
                <p className="text-[11px] text-[#667085]">{step.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-[#94A3B8] mt-6 italic">
        Screening assessment only — not a clinical medical diagnosis.
      </p>
    </div>
  );
};
