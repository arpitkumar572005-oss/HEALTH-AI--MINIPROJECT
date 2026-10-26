import React from 'react';
import { FeatureContribution } from '../types';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface FeatureContributionChartProps {
  contributions: FeatureContribution[];
}

export const FeatureContributionChart: React.FC<FeatureContributionChartProps> = ({ contributions }) => {
  if (!contributions || contributions.length === 0) {
    return (
      <div className="text-xs text-[#667085] italic p-4 text-center">
        No feature contribution data available for this screening.
      </div>
    );
  }

  // Find max contribution for relative bar width
  const maxContribution = Math.max(...contributions.map((c) => c.contribution), 0.1);

  return (
    <div className="space-y-3 font-sans">
      <div className="space-y-2.5">
        {contributions.map((item, idx) => {
          const widthPct = Math.min(Math.round((item.contribution / maxContribution) * 100), 100);
          
          let barBg = 'bg-[#1677FF]';
          let dirBadge = (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1677FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              <Minus className="w-3 h-3" /> Neutral
            </span>
          );

          if (item.direction === 'increases_risk') {
            barBg = 'bg-[#EF4444]';
            dirBadge = (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B91C1C] bg-[#FEF2F2] px-2 py-0.5 rounded-full border border-[#FECACA]">
                <ArrowUp className="w-3 h-3 text-[#EF4444]" /> +{Math.round(item.contribution * 100)}%
              </span>
            );
          } else if (item.direction === 'decreases_risk') {
            barBg = 'bg-[#16A34A]';
            dirBadge = (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                <ArrowDown className="w-3 h-3 text-[#16A34A]" /> -{Math.round(item.contribution * 100)}%
              </span>
            );
          }

          return (
            <div key={idx} className="p-3 bg-[#F7F9FC] border border-[#E6EAF0] rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#172033]">{item.label}</span>
                  <span className="text-[#667085]">
                    ({item.patient_value} {item.unit})
                  </span>
                </div>
                <div>
                  {dirBadge}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#E6EAF0] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${barBg}`}
                  style={{ width: `${Math.max(widthPct, 8)}%` }}
                />
              </div>

              {/* Subtle clinical explanation */}
              <p className="text-[11px] text-[#667085] mt-1.5 leading-relaxed">
                {item.explanation}
              </p>
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-[11px] text-[#667085] italic flex items-center justify-between">
        <span>* Features ranked by relative statistical weight in AI model inference.</span>
        <span>Does not imply singular medical causality.</span>
      </div>
    </div>
  );
};
