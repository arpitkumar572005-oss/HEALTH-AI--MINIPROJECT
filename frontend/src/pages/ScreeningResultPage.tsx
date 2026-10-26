import React from 'react';
import { ScreeningResult } from '../types';
import { RiskGauge } from '../components/RiskGauge';
import { FeatureContributionChart } from '../components/FeatureContributionChart';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { EmergencyBanner } from '../components/EmergencyBanner';
import { api } from '../services/api';
import {
  Download,
  Printer,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  TrendingDown,
  TrendingUp,
  Minus,
  Activity,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface ScreeningResultPageProps {
  result: ScreeningResult;
  onBackToDashboard: () => void;
  onStartAnother: () => void;
  onViewHistory: () => void;
}

export const ScreeningResultPage: React.FC<ScreeningResultPageProps> = ({
  result,
  onBackToDashboard,
  onStartAnother,
  onViewHistory,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const pdfUrl = api.getPdfDownloadUrl(result.id);
  const comparison = result.historical_comparison;
  const symptomProgression = result.symptom_progression;
  const patterns = result.identified_patterns || [];

  const hasPrevious = comparison?.has_previous_data ?? false;
  const prevPercentage = comparison?.previous_risk_percentage;
  const currPercentage = result.risk_score_percentage;
  const pointsChange = comparison?.risk_change_points;
  const trend = comparison?.risk_trend || 'Stable';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans animate-in fade-in duration-300">
      {/* Top action toolbar (hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E6EAF0] no-print">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#172033]"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E6EAF0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#172033] shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#667085]" />
            <span>Print</span>
          </button>

          <a
            href={pdfUrl}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1677FF] hover:bg-[#1366DB] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF Report</span>
          </a>

          <button
            onClick={onStartAnother}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-[#1677FF] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Screening</span>
          </button>
        </div>
      </div>

      {/* Emergency banner if flagged */}
      {result.emergency_warning && (
        <EmergencyBanner message={result.emergency_message} />
      )}

      {/* Main Result Card */}
      <div className="bg-white border border-[#E6EAF0] rounded-xl p-6 md:p-8 shadow-xs space-y-6">
        {/* Header Information */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#F7F9FC]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1677FF] text-[11px] font-semibold border border-blue-100 mb-1.5">
              <Sparkles className="w-3 h-3" />
              <span>AI Risk Detection Result</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#172033]">
              {result.screening_title}
            </h1>
            <p className="text-xs text-[#667085] flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#667085]" />
                {new Date(result.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#667085]" />
                {result.algorithm} ({result.model_version})
              </span>
            </p>
          </div>
        </div>

        {/* 1. TOP ROW: DONUT GAUGE + "WHAT DOES THIS MEAN?" */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Gauge column */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-[#F7F9FC] border border-[#E6EAF0] rounded-xl">
            <RiskGauge
              scorePercentage={result.risk_score_percentage}
              category={result.risk_category}
            />
            {/* Category thresholds breakdown */}
            <div className="w-full mt-3 pt-3 border-t border-[#E6EAF0] text-[10px] text-[#667085] flex justify-between px-1">
              <span className={result.risk_category === 'lower' ? 'font-bold text-[#15803D]' : ''}>&lt;35% Lower</span>
              <span className={result.risk_category === 'moderate' ? 'font-bold text-[#B45309]' : ''}>35–65% Moderate</span>
              <span className={result.risk_category === 'elevated' ? 'font-bold text-[#B91C1C]' : ''}>&gt;65% Elevated</span>
            </div>
          </div>

          {/* "What does this mean?" card */}
          <div className="md:col-span-7 bg-white p-5 rounded-xl border border-[#E6EAF0] space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#1677FF]" />
              <h3 className="text-sm font-bold text-[#172033]">Model Risk Assessment</h3>
            </div>
            <p className="text-xs text-[#667085] leading-relaxed font-medium">
              {result.risk_summary}
            </p>
            <div className="text-[11px] text-[#667085] leading-relaxed pt-1 border-t border-[#F7F9FC]">
              This score indicates a statistical estimation of potential early risk compared against validated epidemiological cohorts. It is designed to prompt informed conversations with your clinician, not to provide a medical diagnosis.
            </div>
          </div>
        </div>

        {/* 2. AUTOMATED LONGITUDINAL COMPARISON CARDS */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1677FF]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                Longitudinal Risk Comparison
              </h3>
            </div>
            <span className="text-[11px] text-[#667085]">
              {hasPrevious ? `Compared with baseline from ${comparison?.previous_date}` : 'Baseline screening — no previous screening available for comparison.'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Previous Risk */}
            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E6EAF0]">
              <span className="text-xs font-medium text-[#667085] block">Previous Estimated Risk</span>
              {hasPrevious && prevPercentage !== undefined && prevPercentage !== null ? (
                <>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-[#172033]">
                      {prevPercentage}%
                    </span>
                    <span className="text-[11px] capitalize text-[#667085] font-semibold">
                      ({comparison?.previous_risk_category || 'moderate'})
                    </span>
                  </div>
                  <span className="text-[10px] text-[#667085] mt-0.5 block">
                    Recorded {comparison?.previous_date}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-semibold text-[#667085] mt-2 block">
                    No previous data available
                  </span>
                  <span className="text-[10px] text-[#667085] mt-1 block">
                    Baseline screening established
                  </span>
                </>
              )}
            </div>

            {/* Current Risk */}
            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E6EAF0]">
              <span className="text-xs font-medium text-[#667085] block">Current Estimated Risk</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-[#1677FF]">
                  {currPercentage}%
                </span>
                <span className="text-[11px] capitalize text-[#1677FF] font-semibold">
                  ({result.risk_category})
                </span>
              </div>
              <span className="text-[10px] text-[#667085] mt-0.5 block">
                Today's calculation
              </span>
            </div>

            {/* Change & Trend */}
            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E6EAF0]">
              <span className="text-xs font-medium text-[#667085] block">Observed Shift</span>
              {hasPrevious && pointsChange !== undefined && pointsChange !== null ? (
                <>
                  <div className="flex items-center gap-1.5 mt-1">
                    {pointsChange > 0 ? (
                      <>
                        <ArrowUpRight className="w-5 h-5 text-[#EF4444]" />
                        <span className="text-2xl font-extrabold text-[#EF4444]">
                          +{pointsChange}
                        </span>
                        <span className="text-xs font-semibold text-[#EF4444]">
                          pts
                        </span>
                      </>
                    ) : pointsChange < 0 ? (
                      <>
                        <ArrowDownRight className="w-5 h-5 text-[#16A34A]" />
                        <span className="text-2xl font-extrabold text-[#16A34A]">
                          {pointsChange}
                        </span>
                        <span className="text-xs font-semibold text-[#16A34A]">
                          pts
                        </span>
                      </>
                    ) : (
                      <>
                        <Minus className="w-5 h-5 text-[#667085]" />
                        <span className="text-2xl font-extrabold text-[#667085]">
                          0
                        </span>
                        <span className="text-xs font-semibold text-[#667085]">
                          pts
                        </span>
                      </>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-0.5 block ${
                      pointsChange < 0
                        ? 'text-[#16A34A]'
                        : pointsChange > 0
                        ? 'text-[#EF4444]'
                        : 'text-[#667085]'
                    }`}
                  >
                    {trend === 'Decreased'
                      ? `Risk reduction: ${Math.abs(pointsChange)} percentage points`
                      : trend === 'Increased'
                      ? `Risk increase: +${pointsChange} percentage points`
                      : 'Risk level unchanged (0 percentage points)'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-semibold text-[#667085] mt-2 block">
                    N/A
                  </span>
                  <span className="text-[10px] text-[#667085] mt-1 block">
                    Baseline screening — no previous screening available
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. "WHAT CHANGED" & PARAMETER COMPARISON TABLE */}
        <div className="pt-4 border-t border-[#F7F9FC] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#172033]">
                What Changed: Parameter Breakdown
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Side-by-side comparison of current biomarkers against retrieved historical records.
              </p>
            </div>
            <span className="text-[11px] font-medium bg-blue-50 text-[#1677FF] px-2.5 py-1 rounded-lg border border-blue-100">
              Automated Retrieval
            </span>
          </div>

          {/* AI Explanation of What Changed */}
          {comparison?.explanation && (
            <div className="p-4 bg-blue-50/60 border border-blue-200/70 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#172033]">
                <Sparkles className="w-4 h-4 text-[#1677FF]" />
                <span>AI Longitudinal Insight</span>
              </div>
              <p className="text-xs text-[#172033] leading-relaxed">
                {comparison.explanation}
              </p>
            </div>
          )}

          {/* Parameter Table */}
          {comparison?.parameter_comparisons && comparison.parameter_comparisons.length > 0 ? (
            <div className="border border-[#E6EAF0] rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F9FC] border-b border-[#E6EAF0] text-[#667085] uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Biomarker Parameter</th>
                      <th className="px-4 py-3">Previous Baseline</th>
                      <th className="px-4 py-3">Current Value</th>
                      <th className="px-4 py-3">Observed Change</th>
                      <th className="px-4 py-3">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EAF0]">
                    {comparison.parameter_comparisons.map((param, idx) => {
                      const isDecreased = param.trend.includes('Decreased');
                      const isIncreased = param.trend.includes('Increased');
                      const isStable = param.trend.includes('Stable') || param.trend.includes('Unchanged');
                      const hasPrev = param.has_previous;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-[#172033]">
                            {param.parameter}
                          </td>
                          <td className="px-4 py-3 text-[#667085]">
                            {hasPrev && param.previous_value ? (
                              <span className="font-medium text-[#172033]">
                                {param.previous_value}
                              </span>
                            ) : (
                              <span className="text-[#667085] italic text-[11px]">
                                No previous data available for comparison.
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-[#172033]">
                            {param.current_value}
                          </td>
                          <td className="px-4 py-3">
                            {hasPrev && param.change ? (
                              <span
                                className={`font-semibold ${
                                  isDecreased ? 'text-[#16A34A]' : isIncreased ? 'text-[#EF4444]' : 'text-[#667085]'
                                }`}
                              >
                                {param.change} {param.pct_change ? `(${param.pct_change})` : ''}
                              </span>
                            ) : (
                              <span className="text-[#667085]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                !hasPrev
                                  ? 'bg-slate-100 text-[#667085] border border-slate-200'
                                  : isDecreased
                                  ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                                  : isIncreased
                                  ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                                  : 'bg-slate-100 text-[#667085] border border-slate-200'
                              }`}
                            >
                              {param.trend}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#F7F9FC] border border-[#E6EAF0] rounded-xl text-xs text-[#667085] italic">
              Previous comparison parameters not recorded. This screening serves as your new longitudinal baseline.
            </div>
          )}
        </div>

        {/* 4. SYMPTOM PROGRESSION (FOR SYMPTOM SCREENINGS OR SYMPTOMS RECORDED) */}
        {symptomProgression && (
          <div className="pt-4 border-t border-[#F7F9FC] space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#172033]">
                Longitudinal Symptom Progression
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Comparison of symptoms against your previous screening.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Newly Reported */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#B45309]">Newly Reported</span>
                  <span className="text-[10px] font-bold bg-amber-100 text-[#B45309] px-2 py-0.5 rounded-full">
                    {symptomProgression.newly_reported?.length || 0}
                  </span>
                </div>
                {symptomProgression.newly_reported && symptomProgression.newly_reported.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {symptomProgression.newly_reported.map((sym) => (
                      <span key={sym} className="text-xs bg-white text-[#B45309] border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                        + {sym}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#667085] italic">No new symptoms emerged</p>
                )}
              </div>

              {/* Continuing */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1677FF]">Continuing Symptoms</span>
                  <span className="text-[10px] font-bold bg-blue-100 text-[#1677FF] px-2 py-0.5 rounded-full">
                    {symptomProgression.continuing?.length || 0}
                  </span>
                </div>
                {symptomProgression.continuing && symptomProgression.continuing.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {symptomProgression.continuing.map((sym) => (
                      <span key={sym} className="text-xs bg-white text-[#1677FF] border border-blue-200 px-2 py-0.5 rounded-md font-medium">
                        • {sym}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#667085] italic">No continuing symptoms</p>
                )}
              </div>

              {/* Resolved */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#16A34A]">Resolved Symptoms</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-[#16A34A] px-2 py-0.5 rounded-full">
                    {symptomProgression.resolved?.length || 0}
                  </span>
                </div>
                {symptomProgression.resolved && symptomProgression.resolved.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {symptomProgression.resolved.map((sym) => (
                      <span key={sym} className="text-xs bg-white text-[#16A34A] border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                        ✓ {sym}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#667085] italic">No previously tracked symptoms resolved</p>
                )}
              </div>
            </div>

            {/* Progression Summary */}
            {symptomProgression.progression_summary && (
              <p className="text-xs text-[#667085] bg-[#F7F9FC] p-3.5 rounded-xl border border-[#E6EAF0]">
                {symptomProgression.progression_summary}
              </p>
            )}
          </div>
        )}

        {/* 5. IDENTIFIED CLINICAL PATTERNS (IF ANY) */}
        {patterns.length > 0 && (
          <div className="pt-4 border-t border-[#F7F9FC] space-y-3">
            <h2 className="text-base font-bold text-[#172033]">
              Identified Symptom Cluster Patterns
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {patterns.map((p, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-blue-200 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1677FF]">{p.name}</span>
                    <span className="text-[10px] font-semibold bg-blue-50 text-[#1677FF] px-2 py-0.5 rounded-md">
                      {p.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#667085]">{p.description}</p>
                  <p className="text-[11px] text-[#172033] bg-[#F7F9FC] p-2 rounded-lg border border-[#E6EAF0]">
                    <strong>Clinical Note:</strong> {p.clinical_implication}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. KEY MODEL INFLUENCING FACTORS */}
        <div className="pt-4 border-t border-[#F7F9FC] space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#172033]">Key Model Influencing Factors</h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Feature contribution weights indicating relative impact on your estimated risk score.
            </p>
          </div>

          <FeatureContributionChart contributions={result.feature_contributions} />
        </div>

        {/* 7. GENERAL GUIDANCE / SUGGESTED NEXT STEPS */}
        <div className="pt-4 border-t border-[#F7F9FC] space-y-3">
          <div className="p-5 bg-[#F7F9FC] border border-[#E6EAF0] rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-[#172033]">
              <ShieldCheck className="w-5 h-5 text-[#1677FF] shrink-0" />
              <h2 className="text-sm font-bold">Suggested Next Steps</h2>
            </div>

            <ul className="space-y-2 text-xs text-[#667085] leading-relaxed">
              {result.general_guidance.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <span className="text-[#172033]">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="pt-2">
          <MedicalDisclaimer />
        </div>
      </div>

      {/* Bottom Nav actions */}
      <div className="flex items-center justify-between no-print pt-2">
        <button
          onClick={onViewHistory}
          className="text-xs font-semibold text-[#1677FF] hover:underline flex items-center gap-1"
        >
          View all past screenings <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onBackToDashboard}
          className="px-5 py-2.5 rounded-xl bg-white border border-[#E6EAF0] hover:bg-slate-50 text-xs font-semibold text-[#172033] shadow-xs"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
