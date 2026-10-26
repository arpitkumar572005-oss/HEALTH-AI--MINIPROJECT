import React from 'react';
import { RiskCategory } from '../types';

interface RiskGaugeProps {
  scorePercentage: number;
  category: RiskCategory;
  size?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  scorePercentage,
  category,
  size = 180
}) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Circular arc gauge (75% circle, 270 deg)
  const arcLength = circumference * 0.75;
  const offset = arcLength - (arcLength * Math.min(scorePercentage, 100)) / 100;

  // Colors based on risk category
  let strokeColor = '#16A34A'; // Green for lower
  let badgeBg = 'bg-[#F0FDF4]';
  let badgeBorder = 'border-[#BBF7D0]';
  let badgeText = 'text-[#15803D]';
  let labelText = 'Lower Estimated Risk';

  if (category === 'moderate') {
    strokeColor = '#F59E0B'; // Amber for moderate
    badgeBg = 'bg-[#FFFBEB]';
    badgeBorder = 'border-[#FDE68A]';
    badgeText = 'text-[#B45309]';
    labelText = 'Moderate Estimated Risk';
  } else if (category === 'elevated') {
    strokeColor = '#EF4444'; // Red for elevated
    badgeBg = 'bg-[#FEF2F2]';
    badgeBorder = 'border-[#FECACA]';
    badgeText = 'text-[#B91C1C]';
    labelText = 'Elevated Estimated Risk';
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 font-sans">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-135"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E6EAF0"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold tracking-tight text-[#172033]">
            {scorePercentage}%
          </span>
          <span className="text-[11px] font-medium text-[#667085] mt-0.5">
            Risk Score
          </span>
        </div>
      </div>

      {/* Risk Category Badge */}
      <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeBg} ${badgeBorder} ${badgeText}`}>
        <span className="w-2 h-2 rounded-full bg-current" />
        <span>{labelText}</span>
      </div>
    </div>
  );
};
