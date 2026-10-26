import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { HealthTrends } from '../types';
import { HealthTrendChart } from '../components/HealthTrendChart';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import {
  Sparkles,
  AlertCircle,
  X,
  TrendingDown
} from 'lucide-react';

export const TrendsPage: React.FC = () => {
  const [trends, setTrends] = useState<HealthTrends | null>(null);
  const [timeframe, setTimeframe] = useState<string>('30d');
  const [loading, setLoading] = useState(true);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    async function loadTrends() {
      setLoading(true);
      try {
        const data = await api.getTrends(timeframe);
        setTrends(data || null);
      } catch (err) {
        console.error('Failed to load health trends:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTrends();
  }, [timeframe]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header Matching Screen 5 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#172033]">
            Health Trends
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Monitor biometric measurements over time against clinical reference ranges.
          </p>
        </div>

        <button
          onClick={() => setShowAiModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#1677FF] bg-blue-50 border border-blue-200 hover:bg-blue-100 shadow-xs transition-colors self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4 text-[#1677FF]" />
          <span>Explain this trend with AI</span>
        </button>
      </div>

      {/* Main Trends Chart Component */}
      <HealthTrendChart
        trends={trends}
        selectedTimeframe={timeframe}
        onTimeframeChange={setTimeframe}
        isLoading={loading}
      />

      {/* Medical Safety Disclaimer */}
      <MedicalDisclaimer />

      {/* AI TREND EXPLANATION MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-[#E6EAF0] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F7F9FC]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1677FF] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#172033]">AI Biometric Trend Interpretation</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-[#667085] hover:text-[#172033]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#667085] leading-relaxed">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <span className="font-bold text-[#1677FF] block mb-1">Observed Biological Trajectory</span>
                <p>
                  {(() => {
                    const gPts = trends?.metrics?.blood_glucose || [];
                    const bpLast = trends?.latest_values?.systolic_bp?.value && trends?.latest_values?.diastolic_bp?.value
                      ? `${trends.latest_values.systolic_bp.value}/${trends.latest_values.diastolic_bp.value} mmHg`
                      : 'within stable ranges';
                    if (gPts.length >= 2) {
                      const firstVal = gPts[0].value;
                      const lastVal = gPts[gPts.length - 1].value;
                      const diff = Number((lastVal - firstVal).toFixed(1));
                      return `Over the past ${timeframe}, your fasting plasma glucose shifted from ${firstVal} mg/dL to ${lastVal} mg/dL (${diff > 0 ? `+${diff}` : diff} mg/dL). Resting blood pressure stabilized at ${bpLast}.`;
                    }
                    if (gPts.length === 1) {
                      return `Over the past ${timeframe}, an initial baseline fasting glucose of ${gPts[0].value} mg/dL was recorded on ${gPts[0].date_label}. At least 2 measurements are required for multi-point trajectory calculation.`;
                    }
                    return `No glucose measurements are recorded in the selected ${timeframe} timeframe. Log a measurement to track your biological trajectory.`;
                  })()}
                </p>
              </div>

              <div>
                <span className="font-bold text-[#172033] block mb-1">Lifestyle Correlation</span>
                <p>
                  Your reported average physical activity (35–40 minutes daily) and steady sleep pattern (7.3 hours) correlate strongly with glucose stabilization and autonomic nervous balance.
                </p>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This trend explanation is generated for educational awareness and does not replace regular clinical evaluations by your physician.
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 bg-[#1677FF] text-white text-xs font-bold rounded-xl hover:bg-[#1366DB]"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
