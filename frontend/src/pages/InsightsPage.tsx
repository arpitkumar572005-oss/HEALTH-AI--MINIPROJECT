import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ScreeningHistoryItem, ScreeningResult } from '../types';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Stethoscope,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Activity,
  Layers,
} from 'lucide-react';

interface InsightsPageProps {
  onNavigateTab?: (tab: string) => void;
  selectedAssessmentId?: string | null;
}

// Concise 1 to 2 sentence definitions for relevant analytes
const CONCISE_MEASUREMENTS: Record<string, { title: string; normalRange: string; explanation: string }> = {
  fasting_glucose: {
    title: 'Fasting Blood Glucose',
    normalRange: '70 to 99 mg/dL',
    explanation: 'Measures blood sugar concentration after an overnight fast. Persistent readings above 100 mg/dL indicate impaired glucose processing.',
  },
  systolic_bp: {
    title: 'Systolic Blood Pressure',
    normalRange: '90 to 120 mmHg',
    explanation: 'The peak pressure in your arteries when the heart contracts. Elevated systolic pressure increases strain on arterial walls.',
  },
  diastolic_bp: {
    title: 'Diastolic Blood Pressure',
    normalRange: '60 to 80 mmHg',
    explanation: 'The baseline pressure inside arteries when the heart rests between contractions.',
  },
  cholesterol: {
    title: 'Total Cholesterol',
    normalRange: 'Below 200 mg/dL',
    explanation: 'The total lipid circulating in the blood. Levels above 200 mg/dL contribute to plaque buildup inside blood vessels.',
  },
  heart_rate: {
    title: 'Resting Heart Rate',
    normalRange: '60 to 100 bpm',
    explanation: 'Number of heartbeats per minute at rest. A lower resting rate typically reflects higher cardiovascular fitness.',
  },
  serum_creatinine: {
    title: 'Serum Creatinine',
    normalRange: '0.6 to 1.2 mg/dL',
    explanation: 'A metabolic waste product filtered almost entirely by the kidneys. Elevated levels signal reduced renal filtration.',
  },
  blood_urea: {
    title: 'Blood Urea Nitrogen',
    normalRange: '15 to 45 mg/dL',
    explanation: 'A byproduct of protein breakdown cleared by the kidneys. Higher values can reflect reduced kidney clearance or dehydration.',
  },
  albumin: {
    title: 'Urine Albumin',
    normalRange: 'Grade 0 (Negative)',
    explanation: 'A protein that healthy kidney filters prevent from entering urine. Any presence indicates early filter permeability.',
  },
  hemoglobin: {
    title: 'Hemoglobin',
    normalRange: '12.0 to 17.5 g/dL',
    explanation: 'The oxygen-carrying protein in red blood cells. Lower levels are often secondary to chronic renal impairment.',
  },
  bmi: {
    title: 'Body Mass Index (BMI)',
    normalRange: '18.5 to 24.9 kg/m²',
    explanation: 'Ratio of body mass to height squared. Values of 25 and above increase metabolic and cardiovascular workload.',
  },
};

export const InsightsPage: React.FC<InsightsPageProps> = ({
  onNavigateTab,
  selectedAssessmentId,
}) => {
  const [history, setHistory] = useState<ScreeningHistoryItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(selectedAssessmentId || null);
  const [activeResult, setActiveResult] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      setLoading(true);
      try {
        const hist = await api.getScreeningHistory();
        if (!isMounted) return;
        setHistory(hist || []);
        if (hist && hist.length > 0) {
          const targetId = selectedAssessmentId || hist[0].id;
          setActiveId(targetId);
          loadDetail(targetId);
        }
      } catch (err) {
        console.error('Failed to load assessment history for insights:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [selectedAssessmentId]);

  const loadDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getScreeningDetail(id);
      setActiveResult(detail);
      setActiveId(id);
    } catch (err) {
      console.error('Failed to load assessment detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDateIndian = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-[#64748B]">
        <div className="w-8 h-8 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-semibold">Loading health insights...</span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0F766E]">
              <Brain className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#172B3A]">
                Explainable Health Insights
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Understand the specific variables and statistical weights influencing your assessment results.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#E2E8F0] p-10 text-center max-w-md mx-auto shadow-sm">
          <div className="w-10 h-10 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center mx-auto mb-3 text-[#64748B]">
            <Brain className="w-5 h-5 text-[#0F766E]" />
          </div>
          <h2 className="text-sm font-bold text-[#172B3A]">
            You have not completed an assessment yet.
          </h2>
          <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
            Complete a risk assessment or symptom evaluation to generate personalized feature insights.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={() => onNavigateTab && onNavigateTab('symptoms')}
              className="w-full sm:w-auto px-4 py-2 rounded-md text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors"
            >
              Check Symptoms
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab('predictions')}
              className="w-full sm:w-auto px-4 py-2 rounded-md text-xs font-semibold bg-[#142B3B] text-white hover:bg-[#1E3A8A] transition-colors"
            >
              Start Disease Assessment
            </button>
          </div>
        </div>

        <MedicalDisclaimer compact={true} />
      </div>
    );
  }

  // Filter features into elevating vs moderating
  const featureList = activeResult?.feature_contributions || [];
  const elevatingFactors = featureList.filter((fc) => fc.direction === 'increases_risk');
  const moderatingFactors = featureList.filter((fc) => fc.direction === 'decreases_risk');

  // Filter concise measurements strictly relevant to active inputs
  const relevantInputs = activeResult?.input_data || {};
  const relevantGlossaryKeys = Object.keys(CONCISE_MEASUREMENTS).filter((k) => k in relevantInputs);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header and Assessment Selector */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0F766E] shrink-0">
            <Brain className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#172B3A]">
              Explainable Health Insights
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Factor influence rankings, plain-language measurement definitions, and preventive guidance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#64748B] whitespace-nowrap">Assessment:</span>
          <select
            value={activeId || ''}
            onChange={(e) => loadDetail(e.target.value)}
            className="h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[#172B3A] font-semibold focus:bg-white focus:outline-none focus:border-[#0F766E]"
          >
            {history.map((h) => (
              <option key={h.id} value={h.id}>
                {h.screening_title || h.title} ({formatDateIndian(h.created_at)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingDetail || !activeResult ? (
        <div className="py-12 flex flex-col items-center justify-center text-[#64748B]">
          <div className="w-6 h-6 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-xs">Loading assessment insights...</span>
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* 1. Compact Assessment Summary Card */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
              <div>
                <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">
                  Selected Assessment
                </span>
                <h2 className="text-base font-bold text-[#172B3A] mt-0.5">
                  {activeResult.screening_title || activeResult.title}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Date: {formatDateIndian(activeResult.created_at)}</span>
                  <span>•</span>
                  <span>Algorithm: {activeResult.algorithm}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E]">
                  {activeResult.risk_score_percentage}% Risk Score
                </span>
                <span
                  className={`px-3 py-1 rounded-md text-xs font-bold capitalize border ${
                    activeResult.risk_category === 'elevated'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : activeResult.risk_category === 'moderate'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {activeResult.risk_category} Risk
                </span>
              </div>
            </div>

            <p className="text-xs text-[#172B3A] leading-relaxed bg-[#F8FAFC] p-3 rounded-md border border-[#E2E8F0]">
              <strong className="block text-[#172B3A] mb-0.5">{activeResult.risk_heading}</strong>
              {activeResult.risk_summary}
            </p>
          </div>

          {/* 2. Visual Ranking of Relevant Contributing Factors (Horizontal Bars) */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F1F5F9]">
              <div>
                <h2 className="text-sm font-bold text-[#172B3A] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0F766E]" />
                  <span>Factor Influence Ranking</span>
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Mathematical influence of user parameters calculated directly from the trained model.
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-red-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#E11D48]" />
                  Elevates Risk
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-teal-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0F766E]" />
                  Protective / Moderates
                </span>
              </div>
            </div>

            {featureList.length === 0 ? (
              <p className="text-xs text-[#64748B] p-4 bg-[#F8FAFC] rounded-md text-center">
                This rule-based screening operates on clinical triage heuristics rather than continuous factor weights.
              </p>
            ) : (
              <div className="space-y-3">
                {featureList.map((fc, idx) => {
                  const pct = Math.min(Math.round(Math.abs(fc.contribution) * 100), 100) || 20;
                  const isElevating = fc.direction === 'increases_risk';

                  return (
                    <div key={idx} className="p-3 rounded-md border border-[#E2E8F0] bg-white space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#172B3A]">
                        <div className="flex items-center gap-2">
                          <span>{fc.label}</span>
                          <span className="text-[10px] text-[#64748B] font-normal">
                            (Entered: {fc.patient_value} {fc.unit})
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isElevating
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isElevating ? `+${pct}% Relative Weight` : 'Favorable Baseline'}
                        </span>
                      </div>

                      {/* Visual Horizontal Progress Bar */}
                      <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isElevating ? 'bg-[#E11D48]' : 'bg-[#0F766E]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        {fc.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Short Explanations of Important Measurements (1 to 2 Sentences) */}
          {relevantGlossaryKeys.length > 0 && (
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-[#172B3A] pb-2 border-b border-[#F1F5F9]">
                Relevant Measurement Glossary
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {relevantGlossaryKeys.map((key) => {
                  const item = CONCISE_MEASUREMENTS[key];
                  const recordedVal = relevantInputs[key];
                  return (
                    <div key={key} className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-[#172B3A]">{item.title}</strong>
                        <span className="text-[10px] text-[#0F766E] font-medium bg-white px-1.5 py-0.2 rounded border border-[#E2E8F0]">
                          {item.normalRange}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        {item.explanation}
                      </p>
                      {recordedVal !== undefined && (
                        <div className="text-[10px] font-bold text-[#172B3A] pt-0.5">
                          Entered: {recordedVal}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. General Preventive Guidance */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-[#172B3A] pb-2 border-b border-[#F1F5F9] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
              <span>General Preventive Guidance</span>
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#172B3A]">
              {(activeResult.general_guidance || []).map((g, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2.5 rounded-md bg-[#F0FDFA] border border-[#CCFBF1]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] shrink-0 mt-0.5" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 5. Expandable "How this assessment works" Accordion */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#0F766E]" />
                <span className="text-xs font-bold text-[#172B3A]">
                  How this assessment works (Methodology & Limitations)
                </span>
              </div>
              {isMethodologyOpen ? (
                <ChevronUp className="w-4 h-4 text-[#64748B]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              )}
            </button>

            {isMethodologyOpen && (
              <div className="p-4 pt-0 text-xs text-[#64748B] space-y-2.5 border-t border-[#F1F5F9] bg-[#F8FAFC]">
                <p className="leading-relaxed">
                  <strong>Statistical Weighting:</strong> HealthAI evaluates user physiological inputs against independently trained, calibrated machine learning models. Feature rankings indicate mathematical deviations from population reference norms.
                </p>
                <p className="leading-relaxed">
                  <strong>Non-Causation Boundary:</strong> Feature contributions reflect mathematical association within the trained dataset and do not prove medical causation. Elevated weights indicate areas for clinical attention during professional healthcare consultations.
                </p>
                <p className="leading-relaxed">
                  <strong>Clinical Oversight:</strong> Automated risk scores do not constitute definitive diagnoses or prescriptive advice. Please discuss any abnormal metrics with a qualified physician.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compact Medical Disclaimer */}
      <MedicalDisclaimer compact={true} />
    </div>
  );
};
