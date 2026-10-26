import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { HealthTrends, HealthMeasurement } from '../types';
import { HealthTrendChart } from '../components/HealthTrendChart';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import {
  Activity,
  Plus,
  Scale,
  Droplet,
  Clock,
  Check,
  X,
  HeartPulse,
  FileText,
  Sparkles,
  ShieldCheck,
  Moon,
  Footprints
} from 'lucide-react';

interface HealthDataPageProps {
  onNavigateTab?: (tab: string) => void;
}

export const HealthDataPage: React.FC<HealthDataPageProps> = ({ onNavigateTab }) => {
  const [trends, setTrends] = useState<HealthTrends | null>(null);
  const [measurements, setMeasurements] = useState<HealthMeasurement[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'vitals' | 'blood_tests' | 'lifestyle' | 'history' | 'documents'>('vitals');
  const [timeframe, setTimeframe] = useState<string>('30d');
  const [loading, setLoading] = useState<boolean>(true);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);

  // Modal form state
  const [metricType, setMetricType] = useState('blood_glucose');
  const [metricVal, setMetricVal] = useState<number>(98);
  const [metricNotes, setMetricNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, mData] = await Promise.all([
        api.getTrends(timeframe),
        api.getMeasurements(),
      ]);
      setTrends(tData || null);
      setMeasurements(mData || []);
    } catch (err) {
      console.error('Failed to load health metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    const unitMap: Record<string, string> = {
      blood_glucose: 'mg/dL',
      systolic_bp: 'mmHg',
      diastolic_bp: 'mmHg',
      heart_rate: 'bpm',
      weight: 'kg',
      cholesterol: 'mg/dL',
    };

    try {
      await api.logMeasurement({
        measurement_type: metricType,
        value: metricVal,
        unit: unitMap[metricType] || 'units',
        notes: metricNotes || undefined,
      });
      setShowLogModal(false);
      setMetricNotes('');
      await loadData();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save biometric measurement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6EAF0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1677FF] border border-blue-200">
              Biometric Vault
            </span>
            <span className="text-xs text-[#16A34A] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Clinical Baseline
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#172033]">
            Health Records & Biometric Vault
          </h1>
          <p className="text-xs md:text-sm text-[#667085] mt-0.5">
            Log and review all longitudinal biometric indicators, lab documents, and lifestyle parameters.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1677FF] hover:bg-[#1366DB] text-white text-xs font-bold rounded-xl shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Measurement</span>
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1.5 bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#E6EAF0] overflow-x-auto">
        {[
          { id: 'vitals', label: 'Primary Vitals', icon: HeartPulse },
          { id: 'blood_tests', label: 'Blood & Metabolic Panels', icon: Droplet },
          { id: 'lifestyle', label: 'Lifestyle & Habits', icon: Moon },
          { id: 'history', label: 'Measurement Log Table', icon: Activity },
          { id: 'documents', label: 'Documents & Lab Files', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-[#1677FF] shadow-2xs font-extrabold'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1677FF]' : 'text-[#667085]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: VITALS */}
      {activeSubTab === 'vitals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-[#E6EAF0] rounded-2xl shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-[#667085]">Resting Heart Rate</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-[#172033]">72</span>
                <span className="text-xs text-[#667085]">BPM</span>
              </div>
              <span className="text-[11px] font-bold text-[#16A34A] block">Target: 60-100 BPM</span>
            </div>

            <div className="p-5 bg-white border border-[#E6EAF0] rounded-2xl shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-[#667085]">Blood Pressure</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-[#172033]">122/80</span>
                <span className="text-xs text-[#667085]">mmHg</span>
              </div>
              <span className="text-[11px] font-bold text-[#16A34A] block">Optimal Normotensive</span>
            </div>

            <div className="p-5 bg-white border border-[#E6EAF0] rounded-2xl shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-[#667085]">Body Weight</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-[#172033]">77.5</span>
                <span className="text-xs text-[#667085]">kg</span>
              </div>
              <span className="text-[11px] font-bold text-[#667085] block">Target Goal: 75.0 kg</span>
            </div>

            <div className="p-5 bg-white border border-[#E6EAF0] rounded-2xl shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-[#667085]">Body Mass Index (BMI)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-[#172033]">24.5</span>
                <span className="text-xs text-[#667085]">kg/m²</span>
              </div>
              <span className="text-[11px] font-bold text-[#16A34A] block">Normal Weight Category</span>
            </div>
          </div>

          {/* Vitals Trend Chart */}
          <HealthTrendChart
            trends={trends}
            selectedTimeframe={timeframe}
            onTimeframeChange={setTimeframe}
            isLoading={loading}
          />
        </div>
      )}

      {/* TAB 2: BLOOD TESTS */}
      {activeSubTab === 'blood_tests' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E6EAF0] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div>
              <h3 className="text-base font-bold text-[#172033]">Fasting Blood & Lipid Profile</h3>
              <p className="text-xs text-[#667085] mt-0.5">Verified lab measurements from blood panels.</p>
            </div>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('assistant') : null}
              className="text-xs font-bold text-[#1677FF] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-100"
            >
              Analyze Lab PDF with AI →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
              <span className="text-xs text-[#667085] font-semibold">Fasting Blood Glucose</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#172033]">98</span>
                <span className="text-xs text-[#667085]">mg/dL</span>
              </div>
              <span className="text-[11px] font-bold text-[#16A34A] block">Normal: 70–99 mg/dL</span>
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
              <span className="text-xs text-[#667085] font-semibold">HbA1c Estimated</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#172033]">5.4</span>
                <span className="text-xs text-[#667085]">%</span>
              </div>
              <span className="text-[11px] font-bold text-[#16A34A] block">Normal: &lt;5.7%</span>
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
              <span className="text-xs text-[#667085] font-semibold">Total Cholesterol</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#172033]">188</span>
                <span className="text-xs text-[#667085]">mg/dL</span>
              </div>
              <span className="text-[11px] font-bold text-[#16A34A] block">Desirable: &lt;200 mg/dL</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIFESTYLE */}
      {activeSubTab === 'lifestyle' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E6EAF0] shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-[#172033]">Lifestyle & Behavioral Baseline</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
              <span className="text-xs text-[#667085] font-semibold">Physical Activity</span>
              <span className="text-lg font-bold text-[#172033] block">3.5 hrs / week</span>
              <span className="text-[11px] text-[#16A34A] font-semibold">Active Aerobic Target</span>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
              <span className="text-xs text-[#667085] font-semibold">Sleep Average</span>
              <span className="text-lg font-bold text-[#172033] block">7h 20m / night</span>
              <span className="text-[11px] text-[#16A34A] font-semibold">Restorative Rest</span>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
              <span className="text-xs text-[#667085] font-semibold">Smoking Status</span>
              <span className="text-lg font-bold text-[#172033] block">Former Smoker</span>
              <span className="text-[11px] text-[#1677FF] font-semibold">Non-active risk</span>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl space-y-1">
              <span className="text-xs text-[#667085] font-semibold">Alcohol Intake</span>
              <span className="text-lg font-bold text-[#172033] block">Moderate / Social</span>
              <span className="text-[11px] text-[#667085] font-semibold">1-2 drinks/week</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MEASUREMENT LOG TABLE */}
      {activeSubTab === 'history' && (
        <div className="bg-white border border-[#E6EAF0] rounded-2xl p-5 shadow-2xs">
          <h3 className="text-base font-bold text-[#172033] mb-1">
            Measurement Log History
          </h3>
          <p className="text-xs text-[#667085] mb-4">
            All verified biometric values captured manually or during AI screening submissions.
          </p>

          {measurements.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#667085]">
              No biometric measurements logged yet. Use the "Log New Measurement" button above to add records.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E6EAF0] text-[#667085] text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Measurement</th>
                    <th className="py-3 px-4">Value</th>
                    <th className="py-3 px-4">Notes / Source</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {measurements.slice(0, 20).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 text-[#172033] font-medium whitespace-nowrap">
                        {new Date(m.measured_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 capitalize font-bold text-[#172033]">
                        {m.measurement_type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 font-black text-[#1677FF]">
                        {m.value} {m.unit}
                      </td>
                      <td className="py-3.5 px-4 text-[#667085]">
                        {m.notes || 'Direct user entry'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
                          <Check className="w-3 h-3" /> Logged
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DOCUMENTS & LAB FILES */}
      {activeSubTab === 'documents' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E6EAF0] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div>
              <h3 className="text-base font-bold text-[#172033]">Uploaded Medical Documents</h3>
              <p className="text-xs text-[#667085] mt-0.5">Laboratory PDFs and diagnostic paperwork.</p>
            </div>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('assistant') : null}
              className="px-3.5 py-2 bg-[#1677FF] text-white text-xs font-bold rounded-xl hover:bg-[#1366DB]"
            >
              Open Lab Report Analyzer
            </button>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E6EAF0] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1677FF] flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#172033] block">
                  comprehensive_metabolic_panel.pdf
                </span>
                <span className="text-[10px] text-[#667085] block">
                  142 KB • LabCorp Diagnostics • Processed Oct 1, 2026
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab ? onNavigateTab('assistant') : null}
              className="text-xs font-bold text-[#1677FF] hover:underline"
            >
              View Biomarkers →
            </button>
          </div>
        </div>
      )}

      <MedicalDisclaimer />

      {/* Log Measurement Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E6EAF0] shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
              <h3 className="text-base font-bold text-[#172033]">Log Biometric Entry</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-[#94A3B8] hover:text-[#172033]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#B91C1C]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1.5">
                  Metric Type
                </label>
                <select
                  value={metricType}
                  onChange={(e) => setMetricType(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#CBD5E1] text-xs bg-white focus:outline-none focus:border-[#1677FF]"
                >
                  <option value="blood_glucose">Blood Glucose (mg/dL)</option>
                  <option value="systolic_bp">Systolic BP (mmHg)</option>
                  <option value="diastolic_bp">Diastolic BP (mmHg)</option>
                  <option value="heart_rate">Heart Rate (bpm)</option>
                  <option value="weight">Weight (kg)</option>
                  <option value="cholesterol">Total Cholesterol (mg/dL)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1.5">
                  Measured Value
                </label>
                <input
                  type="number"
                  step="any"
                  value={metricVal}
                  onChange={(e) => setMetricVal(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full h-11 px-3.5 rounded-xl border border-[#CBD5E1] text-sm focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1.5">
                  Context / Notes (optional)
                </label>
                <input
                  type="text"
                  value={metricNotes}
                  onChange={(e) => setMetricNotes(e.target.value)}
                  placeholder="e.g. Fasting morning test, post-workout"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#CBD5E1] text-xs focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E6EAF0] text-xs font-bold text-[#667085] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#1677FF] hover:bg-[#1366DB] text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Measurement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
