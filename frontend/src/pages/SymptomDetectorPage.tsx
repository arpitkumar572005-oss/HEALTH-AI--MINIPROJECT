import React, { useState } from 'react';
import { api } from '../services/api';
import { ScreeningResult } from '../types';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import {
  Stethoscope,
  Search,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  Info,
  Calendar,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SymptomDetectorPageProps {
  onAssessmentCompleted?: (result: ScreeningResult) => void;
  onViewInsights?: () => void;
  onViewHistory?: () => void;
}

const SUPPORTED_SYMPTOMS = [
  // Metabolic / Glycemic
  { id: 'Excessive thirst', label: 'Excessive thirst', category: 'Metabolic' },
  { id: 'Frequent urination', label: 'Frequent urination', category: 'Metabolic' },
  { id: 'Fatigue', label: 'Persistent fatigue', category: 'General' },
  { id: 'Unusual weight change', label: 'Unexplained weight change', category: 'Metabolic' },
  { id: 'Slow healing cuts', label: 'Slow healing cuts or sores', category: 'Metabolic' },
  { id: 'Dry mouth', label: 'Dry mouth', category: 'Metabolic' },

  // Cardiovascular & Arterial
  { id: 'Chest discomfort', label: 'Chest discomfort or tightness', category: 'Cardiovascular', emergency: true },
  { id: 'Shortness of breath', label: 'Shortness of breath', category: 'Cardiovascular', emergency: true },
  { id: 'Heart palpitations', label: 'Rapid or irregular heartbeat', category: 'Cardiovascular' },
  { id: 'Dizziness', label: 'Dizziness or lightheadedness', category: 'Cardiovascular' },
  { id: 'Swollen feet or ankles', label: 'Swelling in feet or ankles', category: 'Cardiovascular' },

  // Blood Pressure / Neurological
  { id: 'Headache', label: 'Dull or throbbing headache', category: 'Neurological' },
  { id: 'Blurred vision', label: 'Blurred vision', category: 'Neurological' },
  { id: 'Morning head pressure', label: 'Head pressure upon waking', category: 'Cardiovascular' },
  { id: 'Facial flushing', label: 'Facial flushing', category: 'Cardiovascular' },
  { id: 'Sudden weakness', label: 'Sudden numbness or weakness', category: 'Neurological', emergency: true },

  // General
  { id: 'Fever', label: 'Mild fever', category: 'General' },
  { id: 'Nausea', label: 'Mild nausea or low appetite', category: 'General' },
  { id: 'Joint discomfort', label: 'Joint or muscular aches', category: 'General' },
];

export const SymptomDetectorPage: React.FC<SymptomDetectorPageProps> = ({
  onAssessmentCompleted,
  onViewInsights,
  onViewHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState('days');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [onset, setOnset] = useState('gradual');
  const [age, setAge] = useState<number>(46);
  const [notes, setNotes] = useState('');

  // Execution state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScreeningResult | null>(null);

  const categories = ['All', 'Metabolic', 'Cardiovascular', 'Neurological', 'General'];

  // Check if any selected symptom is an emergency red flag
  const activeEmergencies = selectedSymptoms.filter((s) => {
    const item = SUPPORTED_SYMPTOMS.find((sym) => sym.id === s);
    return item?.emergency;
  });

  const toggleSymptom = (id: string) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  const filteredSymptoms = SUPPORTED_SYMPTOMS.filter((sym) => {
    const matchesSearch =
      sym.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sym.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || sym.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom to evaluate.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        symptoms: selectedSymptoms,
        duration,
        severity,
        onset,
        description: notes.trim() || undefined,
        age: age || 46,
      };

      const assessmentResult = await api.screenSymptoms(payload);
      setResult(assessmentResult);
      if (onAssessmentCompleted) {
        onAssessmentCompleted(assessmentResult);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to evaluate symptoms. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setSearchTerm('');
    setDuration('days');
    setSeverity('moderate');
    setOnset('gradual');
    setNotes('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0F766E] shrink-0">
            <Stethoscope className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#172B3A]">
              AI Symptom Detector
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Select your symptoms for an instant, rule-based clinical triage assessment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E]">
            <Info className="w-3.5 h-3.5" />
            <span>Clinical Triage Prototype</span>
          </span>
        </div>
      </div>

      {/* Emergency Alert Banner */}
      {activeEmergencies.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <strong className="font-bold text-red-950 block">Urgent Medical Notice:</strong>
            <p className="leading-relaxed">
              You selected potentially acute symptoms ({activeEmergencies.join(', ')}). Sudden chest pressure, shortness of breath, or numbness require immediate evaluation. Do not wait for an online assessment. Call 112 / 102 or proceed to the nearest emergency center immediately.
            </p>
          </div>
        </div>
      )}

      {/* Main Flow: Form vs Result */}
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Symptom Selector */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
              <div>
                <h2 className="text-sm font-bold text-[#172B3A]">
                  1. Select Your Symptoms
                </h2>
                <p className="text-xs text-[#64748B]">
                  Search or click symptoms below to build your assessment.
                </p>
              </div>

              {selectedSymptoms.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] px-2.5 py-0.5 rounded border border-[#CCFBF1]">
                    {selectedSymptoms.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSymptoms([])}
                    className="text-xs text-[#64748B] hover:text-red-600 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Selected Symptoms Badges Strip */}
            {selectedSymptoms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
                {selectedSymptoms.map((sym) => (
                  <span
                    key={sym}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#0F766E] text-white shadow-2xs"
                  >
                    <span>{sym}</span>
                    <button
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className="hover:text-red-200 text-xs font-bold"
                      aria-label={`Remove ${sym}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search and Category Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter symptoms (e.g. fatigue, thirst, headache)..."
                  className="w-full h-9 pl-9 pr-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E] transition-colors"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-[#142B3B] text-white'
                        : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172B3A] border border-[#E2E8F0]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
              {filteredSymptoms.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym.id);
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => toggleSymptom(sym.id)}
                    className={`text-left p-2.5 rounded-md border text-xs transition-all flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E] font-semibold shadow-2xs'
                        : 'border-[#E2E8F0] hover:border-slate-300 bg-white text-[#172B3A]'
                    }`}
                  >
                    <span className="truncate">{sym.label}</span>
                    {isSelected ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-sm border border-slate-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Characteristics & Details in a Clean Responsive Grid */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#172B3A] pb-3 border-b border-[#F1F5F9]">
              2. Symptom Characteristics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Severity Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1.5">
                  Severity Level
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['mild', 'moderate', 'severe'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSeverity(lvl)}
                      className={`py-1.5 rounded-md text-xs font-semibold capitalize border transition-colors ${
                        severity === lvl
                          ? lvl === 'severe'
                            ? 'bg-red-50 border-red-300 text-red-700'
                            : lvl === 'moderate'
                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#172B3A]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1.5">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="days">1 to 2 days</option>
                  <option value="days_few">3 to 7 days</option>
                  <option value="weeks">1 to 2 weeks</option>
                  <option value="months">More than 2 weeks</option>
                </select>
              </div>

              {/* Onset Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1.5">
                  Onset Pattern
                </label>
                <select
                  value={onset}
                  onChange={(e) => setOnset(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="gradual">Gradual development</option>
                  <option value="sudden">Sudden onset</option>
                  <option value="intermittent">Comes and goes</option>
                </select>
              </div>

              {/* Patient Age */}
              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1.5">
                  Patient Age (years)
                </label>
                <input
                  type="number"
                  min={18}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full h-9 px-2.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>

            {/* Optional Notes */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                Additional Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Symptoms occur mostly in the evening or after physical exertion"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#991B1B] text-xs rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Prominent Action Button */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] rounded-md transition-colors"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedSymptoms.length === 0}
              className="px-6 py-2.5 bg-[#0F766E] text-white text-xs font-bold rounded-md hover:bg-[#0D655E] disabled:opacity-50 transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating Symptoms...</span>
                </>
              ) : (
                <>
                  <span>Evaluate Symptoms</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Concise, Interactive Results State */
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
              <div>
                <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">
                  Triage Result
                </span>
                <h2 className="text-base font-bold text-[#172B3A] mt-0.5">
                  {result.risk_heading}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E]">
                  {result.risk_score_percentage}% Pattern Score
                </span>
              </div>
            </div>

            <p className="text-xs text-[#172B3A] leading-relaxed bg-[#F8FAFC] p-3 rounded-md border border-[#E2E8F0]">
              {result.risk_summary}
            </p>

            {/* Submitted Symptoms Chips */}
            <div>
              <span className="text-xs font-bold text-[#172B3A] block mb-1.5">
                Evaluated Symptoms
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(result.input_data?.symptoms || selectedSymptoms).map((sym: string) => (
                  <span
                    key={sym}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#F1F5F9] text-[#172B3A] border border-[#E2E8F0]"
                  >
                    {sym}
                  </span>
                ))}
              </div>
            </div>

            {/* Identified Potential Patterns */}
            {result.identified_patterns && result.identified_patterns.length > 0 && (
              <div>
                <span className="text-xs font-bold text-[#172B3A] block mb-1.5">
                  Potential Health Patterns
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.identified_patterns.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md bg-[#F0FDFA] border border-[#CCFBF1] text-xs text-[#115E59]"
                    >
                      <strong className="block text-[#0F766E] mb-0.5">{p.name || p.cluster || 'Identified Cluster'}</strong>
                      <p className="text-[11px] leading-relaxed text-[#134E4A]">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps Guidance */}
            <div>
              <span className="text-xs font-bold text-[#172B3A] block mb-1.5">
                Recommended Next Steps
              </span>
              <ul className="space-y-1.5 text-xs text-[#172B3A]">
                {result.general_guidance.slice(0, 3).map((g, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-[#172B3A] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Check Other Symptoms</span>
              </button>

              <div className="flex items-center gap-2">
                {onViewHistory && (
                  <button
                    type="button"
                    onClick={onViewHistory}
                    className="px-3.5 py-2 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#172B3A] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
                  >
                    View History
                  </button>
                )}
                {onViewInsights && (
                  <button
                    type="button"
                    onClick={onViewInsights}
                    className="px-4 py-2 rounded-md text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>View Insights</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Educational notice */}
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[11px] text-[#64748B]">
            <strong className="text-[#172B3A]">Educational Notice:</strong> Possible conditions reflect rule-based triage patterns and are not confirmed medical diagnoses. Always consult a qualified physician for clinical evaluation.
          </div>
        </div>
      )}

      {/* Compact Medical Disclaimer */}
      <MedicalDisclaimer compact={true} />
    </div>
  );
};
