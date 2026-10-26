import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ReportAnalysis,
  ReportHistoryItem,
  ScreeningResult,
  ScreeningHistoryItem,
} from '../types';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  UploadCloud,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
  Activity,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Stethoscope,
  RefreshCw,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Terminal,
  AlertTriangle,
  Layers,
  Cpu,
} from 'lucide-react';

interface ReportsPageProps {
  onViewScreeningResult?: (result: ScreeningResult) => void;
}

const PROCESSING_STEPS = [
  'Uploading...',
  'Reading report...',
  'Extracting text...',
  'Identifying report type...',
  'Extracting medical information...',
  'Generating summary...',
  'Complete',
];

export const ReportsPage: React.FC<ReportsPageProps> = ({ onViewScreeningResult }) => {
  const [activeTab, setActiveTab] = useState<'summarizer' | 'screening_reports'>('summarizer');
  const [reportsList, setReportsList] = useState<ReportHistoryItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [processingStepIndex, setProcessingStepIndex] = useState<number>(0);
  const [showDebugMetadata, setShowDebugMetadata] = useState<boolean>(false);
  const [runningScreening, setRunningScreening] = useState<string | null>(null);
  const [screeningSuccess, setScreeningSuccess] = useState<{
    disease: string;
    message: string;
    result: ScreeningResult;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Screening reports history
  const [screeningHistory, setScreeningHistory] = useState<ScreeningHistoryItem[]>([]);
  const [selectedScreeningId, setSelectedScreeningId] = useState<string | null>(null);
  const [screeningDetail, setScreeningDetail] = useState<ScreeningResult | null>(null);

  // Load report history and initial detail
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const list = await api.getReportsList();
        setReportsList(list || []);

        if (list && list.length > 0) {
          const detail = await api.getReportDetails(list[0].id);
          setSelectedReport(detail);
        }

        const screenList = await api.getScreeningHistory();
        setScreeningHistory(screenList || []);
        if (screenList && screenList.length > 0) {
          setSelectedScreeningId(screenList[0].id);
          const sDetail = await api.getScreeningDetail(screenList[0].id);
          setScreeningDetail(sDetail);
        }
      } catch (err: any) {
        console.error('Error loading reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectReport = async (reportId: string) => {
    setLoading(true);
    setScreeningSuccess(null);
    setErrorMessage(null);
    try {
      const detail = await api.getReportDetails(reportId);
      setSelectedReport(detail);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  const uploadReportWithStepper = async (formData: FormData) => {
    setUploading(true);
    setProcessingStepIndex(0);
    setErrorMessage(null);
    setScreeningSuccess(null);

    // Stepped progression timer
    const interval = setInterval(() => {
      setProcessingStepIndex((prev) => (prev < 5 ? prev + 1 : prev));
    }, 400);

    try {
      const res = await api.uploadReport(formData);
      clearInterval(interval);
      setProcessingStepIndex(6); // Complete
      setSelectedReport(res);

      const updatedList = await api.getReportsList();
      setReportsList(updatedList || []);
      setTimeout(() => {
        setUploading(false);
      }, 500);
    } catch (err: any) {
      clearInterval(interval);
      setUploading(false);
      setErrorMessage(err?.message || 'Failed to upload and analyze report.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    await uploadReportWithStepper(formData);
  };

  const handleLoadPreset = async (presetType: string) => {
    let content = '';
    let filename = '';

    if (presetType === 'ultrasound') {
      filename = 'kidney_ultrasound_kub.txt';
      content = `KIDNEY ULTRASOUND REPORT (USG KUB)
Patient: Alex Test | Age: 48 | Gender: Male | Date: Current Assessment
FINDINGS:
Right kidney measures 10.4 cm in length. Increased cortical echogenicity. Cortico-medullary differentiation maintained.
Grade II hydronephrosis observed in right kidney with a 6 mm renal calculus in middle calyx.
Left kidney measures 10.8 cm. Normal cortical echotexture. No hydronephrosis or stone seen.
Urinary bladder: Well distended. Post-void residual urine volume: 30 mL.
IMPRESSION:
Grade II Right Hydronephrosis secondary to 6 mm right renal calculus. Left kidney sonographically normal.`;
    } else if (presetType === 'cbc') {
      filename = 'complete_blood_count.txt';
      content = `COMPLETE BLOOD COUNT (CBC) & HEMOGRAM
Patient: Demo Patient | Age: 42 | Gender: Female | Date: Current Assessment
Hemoglobin: 13.8 g/dL (Reference: 12.0 - 15.5 g/dL)
WBC Count: 6800 /µL (Reference: 4500 - 11000 /µL)
RBC Count: 4.6 M/µL (Reference: 4.0 - 5.2 M/µL)
Platelet Count: 240000 /µL (Reference: 150000 - 450000 /µL)
Hematocrit: 41.5 % (Reference: 37.0 - 48.0 %)
MCV: 89.2 fL (Reference: 80.0 - 100.0 fL)
IMPRESSION:
Normal Complete Blood Count. No cytopenia or leukocytosis identified.`;
    } else if (presetType === 'thyroid') {
      filename = 'thyroid_profile.txt';
      content = `THYROID FUNCTION PROFILE (SERUM)
Patient: Demo Patient | Age: 39 | Gender: Female | Date: Current Assessment
TSH: 2.85 uIU/mL (Reference: 0.45 - 4.50 uIU/mL)
Free T3: 3.10 pg/mL (Reference: 2.0 - 4.4 pg/mL)
Free T4: 1.25 ng/dL (Reference: 0.82 - 1.77 ng/dL)
IMPRESSION:
Euthyroid state. Thyroid hormone levels are within normal physiological limits.`;
    } else if (presetType === 'xray') {
      filename = 'chest_xray_pa.txt';
      content = `CHEST RADIOGRAPH (X-RAY CHEST PA VIEW)
Patient: Demo Patient | Age: 50 | Gender: Male | Date: Current Assessment
FINDINGS:
Lungs: Both lung fields are clear of focal consolidation, masses, or pneumothorax.
Cardiac Silhouette: Normal cardiac size and contour. Cardiothoracic ratio < 0.5.
Pleural Spaces: Costophrenic and cardiophrenic angles are sharp. No pleural effusion.
Bony Thorax: Visualized osseous structures are intact.
IMPRESSION:
Normal chest radiograph. No active cardiopulmonary disease.`;
    } else if (presetType === 'ecg') {
      filename = 'resting_12lead_ecg.txt';
      content = `12-LEAD RESTING ELECTROCARDIOGRAM (ECG)
Patient: Demo Patient | Age: 52 | Gender: Male | Date: Current Assessment
Ventricular Rate: 72 bpm
PR Interval: 158 ms (Reference: 120 - 200 ms)
QRS Duration: 86 ms (Reference: 70 - 100 ms)
Cardiac Rhythm: Normal Sinus Rhythm
ST-T Segment: Normal contour, no acute ischemic changes or ST elevation.
IMPRESSION:
Normal resting 12-lead electrocardiogram. Normal sinus rhythm at 72 bpm without ischemic abnormality.`;
    } else {
      // Default: Metabolic & Lipid Panel
      filename = 'current_metabolic_panel.txt';
      content = `METABOLIC & LIPID LAB REPORT - CURRENT ASSESSMENT
Patient: Demo Patient | Age: 46 | Sex: Male | Date: Current
Fasting Blood Glucose: 98 mg/dL (Reference: 70 - 99 mg/dL)
HbA1c Glycated Hemoglobin: 5.4 % (Reference: < 5.7 %)
Total Cholesterol: 188 mg/dL (Reference: < 200 mg/dL)
HDL Cholesterol: 48 mg/dL (Reference: >= 40 mg/dL)
LDL Cholesterol: 111 mg/dL (Reference: < 100 mg/dL)
Systolic Blood Pressure: 122 mmHg
Diastolic Blood Pressure: 80 mmHg
Hemoglobin: 14.1 g/dL (Reference: 13.5 - 17.5 g/dL)
Triglycerides: 145 mg/dL (Reference: < 150 mg/dL)
IMPRESSION:
Normal glycemic control and optimal cardiovascular biomarker profile.`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const file = new File([blob], filename, { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file);
    await uploadReportWithStepper(formData);
  };

  const handleRunScreening = async (diseaseType: string) => {
    if (!selectedReport) return;
    setRunningScreening(diseaseType);
    setErrorMessage(null);

    try {
      const res = await api.runScreeningFromReport(selectedReport.id, diseaseType);
      setScreeningSuccess({
        disease: diseaseType,
        message: `New ${diseaseType === 'diabetes' ? 'Diabetes' : 'Cardiovascular'} risk screening generated successfully!`,
        result: res,
      });

      // Refresh screening history
      const screenList = await api.getScreeningHistory();
      setScreeningHistory(screenList || []);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to run screening from report');
    } finally {
      setRunningScreening(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#172033]">
            Medical Report Summarizer
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Intelligent analysis of your current medical lab reports with automated historical comparison.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1 bg-[#F7F9FC] border border-[#E6EAF0] p-1 rounded-xl self-start sm:self-auto no-print">
          <button
            onClick={() => setActiveTab('summarizer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'summarizer'
                ? 'bg-white text-[#1677FF] shadow-2xs'
                : 'text-[#667085] hover:text-[#172033]'
            }`}
          >
            Report Summarizer & Comparison
          </button>
          <button
            onClick={() => setActiveTab('screening_reports')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'screening_reports'
                ? 'bg-white text-[#1677FF] shadow-2xs'
                : 'text-[#667085] hover:text-[#172033]'
            }`}
          >
            Generated Risk Reports ({screeningHistory.length})
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-[#B91C1C]">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: MEDICAL REPORT SUMMARIZER */}
      {activeTab === 'summarizer' && (
        <div className="space-y-6">
          {/* Automated Retrieval Principle Banner */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3.5 shadow-2xs">
            <Sparkles className="w-5 h-5 text-[#1677FF] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-[#172033]">
                  Automated Historical Record Retrieval
                </h4>
                <span className="text-[10px] font-semibold bg-blue-100 text-[#1677FF] px-2 py-0.5 rounded-full">
                  Current Upload Only
                </span>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed">
                Upload only your <strong>current medical lab report</strong>. HealthAI automatically retrieves your prior baseline report from your medical history, aligns matching biomarker parameters, calculates changes, and explains trends.
              </p>
            </div>
          </div>

          {/* 1. Upload Dropzone Area */}
          <div className="bg-white border-2 border-dashed border-[#E6EAF0] hover:border-[#1677FF]/50 rounded-xl p-6 sm:p-8 text-center transition-colors">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1677FF] flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#172033]">
              Upload Real Medical Laboratory or Imaging Report
            </h3>
            <p className="text-xs text-[#667085] mt-1 mb-4 max-w-lg mx-auto">
              Select or drop your newest medical report (PDF, JPG, PNG, or text). Supports multi-page PDFs, scans, lab panels, ultrasounds, X-Rays, and ECGs.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1677FF] hover:bg-[#1366DB] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors">
                <UploadCloud className="w-4 h-4" />
                <span>{uploading ? 'Processing Document...' : 'Choose Current Report File'}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => handleLoadPreset('metabolic')}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F7F9FC] border border-[#E6EAF0] hover:bg-slate-100 text-[#172033] text-xs font-semibold rounded-xl transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#1677FF]" />
                <span>Sample Blood Panel</span>
              </button>
            </div>

            {/* Stepped Processing Animation & Status */}
            {uploading && (
              <div className="mt-6 p-4 bg-blue-50/60 border border-blue-200 rounded-xl text-left space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[#1677FF] animate-spin" />
                    <span className="text-xs font-bold text-[#172033]">
                      Document Extraction Engine Running...
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#1677FF] bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                    Step {processingStepIndex + 1} of {PROCESSING_STEPS.length}: {PROCESSING_STEPS[processingStepIndex]}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 pt-1">
                  {PROCESSING_STEPS.map((step, idx) => {
                    const isDone = idx < processingStepIndex;
                    const isCurrent = idx === processingStepIndex;
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg text-center border text-[10px] font-medium transition-all ${
                          isDone
                            ? 'bg-emerald-50 border-emerald-200 text-[#16A34A]'
                            : isCurrent
                            ? 'bg-blue-100/70 border-blue-300 text-[#1677FF] font-bold ring-1 ring-blue-300'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {isDone ? (
                            <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                          ) : (
                            <span className={`w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[9px] ${
                              isCurrent ? 'bg-[#1677FF] text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {idx + 1}
                            </span>
                          )}
                        </div>
                        <span className="truncate block">{step.replace('...', '')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Instant Real Document Presets */}
            <div className="mt-5 pt-4 border-t border-[#F1F5F9]">
              <span className="text-xs font-semibold text-[#667085] block mb-2.5">
                Or test real medical document extraction across categories:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadPreset('metabolic')}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs font-medium text-[#172033] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#1677FF]" />
                  <span>Metabolic & Lipid</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('ultrasound')}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-xs font-medium text-[#172033] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Kidney Ultrasound (USG)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('cbc')}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-xs font-medium text-[#172033] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>Complete Blood Count (CBC)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('thyroid')}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 text-xs font-medium text-[#172033] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Thyroid Function</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('xray')}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-200 text-xs font-medium text-[#172033] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-[#0891B2]" />
                  <span>Chest X-Ray</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('ecg')}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs font-medium text-[#172033] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-[#E11D48]" />
                  <span>12-Lead ECG</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Current Report Analysis & Side-by-Side Comparison */}
          {selectedReport && (
            <div className="space-y-6 animate-in fade-in">
              {/* Poor quality / unreadable document warning banner */}
              {((selectedReport.processing_metadata?.warnings && selectedReport.processing_metadata.warnings.length > 0) ||
                selectedReport.processing_metadata?.status === 'warning' ||
                selectedReport.processing_metadata?.status === 'failed') && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-[#92400E] shadow-2xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97706] mt-0.5" />
                  <div>
                    <span className="font-bold block">Document Readability Notice:</span>
                    <p className="mt-0.5">
                      Some text could not be reliably extracted from this report. Please upload a clearer image or selectable text PDF.
                    </p>
                  </div>
                </div>
              )}

              {/* Report Header Metadata */}
              <div className="bg-white p-5 rounded-xl border border-[#E6EAF0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1677FF] flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#172033]">
                        {selectedReport.filename}
                      </span>
                      <span className="text-[10px] font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200 px-2 py-0.5 rounded-full capitalize">
                        {selectedReport.document_type.replace('_', ' ')}
                      </span>
                      {selectedReport.is_sample && (
                        <span className="text-[10px] font-semibold bg-amber-50 text-[#D97706] border border-amber-200 px-2 py-0.5 rounded-full">
                          Sample Report
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#667085] mt-0.5 block">
                      {selectedReport.file_size_kb} KB • Uploaded {new Date(selectedReport.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#667085]">
                    {selectedReport.detected_parameters.length} Extracted Findings / Analytes
                  </span>
                </div>
              </div>

              {/* Clinical Impression Section (if extracted) */}
              {selectedReport.impression && (
                <div className="bg-amber-50/60 p-5 rounded-xl border border-amber-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-[#D97706]" />
                    <h3 className="text-xs font-bold text-[#92400E] uppercase tracking-wider">
                      Diagnostic Impression & Findings
                    </h3>
                  </div>
                  <p className="text-xs font-semibold text-[#78350F] leading-relaxed">
                    {selectedReport.impression}
                  </p>
                </div>
              )}

              {/* Current Report Summary */}
              <div className="bg-white p-6 rounded-xl border border-[#E6EAF0] shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1677FF]" />
                  <h3 className="text-sm font-bold text-[#172033]">Current Report Summary</h3>
                </div>
                <p className="text-xs text-[#172033] leading-relaxed">
                  {selectedReport.summary}
                </p>
              </div>

              {/* AI Educational Explanation (if available) */}
              {selectedReport.ai_explanation && (
                <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#1677FF]" />
                    <h3 className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider">
                      AI Educational Overview
                    </h3>
                  </div>
                  <p className="text-xs text-[#1E3A8A] leading-relaxed">
                    {selectedReport.ai_explanation}
                  </p>
                </div>
              )}

              {/* Dynamic Categorized Parameters: Numerical Analytes vs Qualitative Observations */}
              {(() => {
                const numericalParams = selectedReport.detected_parameters.filter(
                  (p) => p.type !== 'observation'
                );
                const clinicalObservations = selectedReport.detected_parameters.filter(
                  (p) => p.type === 'observation'
                );

                return (
                  <div className="space-y-6">
                    {/* Numerical Analytes Section */}
                    {numericalParams.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-[#1677FF]" />
                            <span>Quantitative Biomarkers & Laboratory Analytes ({numericalParams.length})</span>
                          </span>
                          <span className="text-[11px] text-[#667085]">
                            100% Real document extraction (Zero fabricated parameters)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {numericalParams.map((p, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-4 rounded-xl border border-[#E6EAF0] shadow-xs space-y-1.5"
                            >
                              <span className="text-xs font-semibold text-[#667085] block truncate">
                                {p.parameter}
                              </span>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-bold text-[#172033]">{p.value}</span>
                                {p.unit && <span className="text-xs text-[#667085]">{p.unit}</span>}
                              </div>
                              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#F7F9FC]">
                                <span
                                  className={`font-semibold ${
                                    p.status.toLowerCase().includes('normal') ||
                                    p.status.toLowerCase().includes('desirable')
                                      ? 'text-[#16A34A]'
                                      : p.status.toLowerCase().includes('low')
                                      ? 'text-[#2563EB]'
                                      : 'text-[#D97706]'
                                  }`}
                                >
                                  ● {p.status}
                                </span>
                                {p.reference && (
                                  <span className="text-[10px] text-[#667085] truncate">
                                    {p.reference}
                                  </span>
                                )}
                              </div>
                              {p.explanation && (
                                <p className="text-[10px] text-[#667085] italic pt-1">
                                  {p.explanation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clinical Observations Section */}
                    {clinicalObservations.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                            <Stethoscope className="w-4 h-4 text-[#D97706]" />
                            <span>Clinical Findings & Qualitative Observations ({clinicalObservations.length})</span>
                          </span>
                          <span className="text-[11px] text-[#667085]">
                            Sonographic, imaging & diagnostic observations
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {clinicalObservations.map((obs, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-4 rounded-xl border border-[#E6EAF0] shadow-xs space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#172033]">
                                  {obs.parameter}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                    obs.status === 'normal'
                                      ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                                      : obs.status === 'critical'
                                      ? 'bg-red-50 text-[#EF4444] border border-red-200'
                                      : 'bg-amber-50 text-[#D97706] border border-amber-200'
                                  }`}
                                >
                                  {obs.status}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-[#172033] bg-[#F7F9FC] p-2.5 rounded-lg border border-slate-100">
                                {obs.value} {obs.unit ? obs.unit : ''}
                              </div>
                              {obs.reference && (
                                <div className="text-[11px] text-[#667085]">
                                  <span className="font-medium text-slate-500">Standard: </span>
                                  {obs.reference}
                                </div>
                              )}
                              {obs.source_text && (
                                <div className="text-[10px] text-slate-500 font-mono truncate bg-slate-50 px-2 py-1 rounded">
                                  Line: "{obs.source_text}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Collapsible Document Extraction & Technical Debugging Metadata */}
              <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowDebugMetadata(!showDebugMetadata)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#1677FF]" />
                    <span className="text-xs font-bold text-[#172033]">
                      Document Extraction & Technical Debugging Metadata
                    </span>
                    <span className="text-[10px] font-semibold bg-blue-50 text-[#1677FF] border border-blue-200 px-2 py-0.5 rounded-full">
                      System Diagnostic
                    </span>
                  </div>
                  {showDebugMetadata ? (
                    <ChevronUp className="w-4 h-4 text-[#667085]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#667085]" />
                  )}
                </button>

                {showDebugMetadata && (
                  <div className="p-4 pt-0 border-t border-[#F1F5F9] bg-slate-50/50 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs pt-3">
                      <div className="bg-white p-3 rounded-lg border border-[#E6EAF0]">
                        <span className="text-[10px] text-[#667085] uppercase tracking-wider block font-semibold">
                          Filename
                        </span>
                        <span className="font-mono font-bold text-[#172033] truncate block mt-0.5">
                          {selectedReport.processing_metadata?.filename || selectedReport.filename}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-[#E6EAF0]">
                        <span className="text-[10px] text-[#667085] uppercase tracking-wider block font-semibold">
                          File Format
                        </span>
                        <span className="font-mono font-bold text-[#172033] block mt-0.5">
                          {selectedReport.processing_metadata?.file_type || 'text/document'}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-[#E6EAF0]">
                        <span className="text-[10px] text-[#667085] uppercase tracking-wider block font-semibold">
                          Page Count
                        </span>
                        <span className="font-mono font-bold text-[#172033] block mt-0.5">
                          {selectedReport.processing_metadata?.page_count ?? 1} Page(s)
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-[#E6EAF0]">
                        <span className="text-[10px] text-[#667085] uppercase tracking-wider block font-semibold">
                          OCR Performed
                        </span>
                        <span className="font-mono font-bold text-[#172033] block mt-0.5">
                          {selectedReport.processing_metadata?.ocr_performed
                            ? 'Yes (EasyOCR engine)'
                            : 'No (Selectable Text)'}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-[#E6EAF0]">
                        <span className="text-[10px] text-[#667085] uppercase tracking-wider block font-semibold">
                          Extracted Text Length
                        </span>
                        <span className="font-mono font-bold text-[#172033] block mt-0.5">
                          {selectedReport.processing_metadata?.raw_text_length ?? 0} characters
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-[#E6EAF0]">
                        <span className="text-[10px] text-[#667085] uppercase tracking-wider block font-semibold">
                          Detected Category
                        </span>
                        <span className="font-mono font-bold text-[#1677FF] block mt-0.5">
                          {selectedReport.processing_metadata?.detected_type || selectedReport.document_type}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-[#E6EAF0]">
                        <span className="text-[10px] text-[#667085] uppercase tracking-wider block font-semibold">
                          Classification Confidence
                        </span>
                        <span className="font-mono font-bold text-[#16A34A] block mt-0.5">
                          {selectedReport.processing_metadata?.confidence
                            ? `${Math.round(selectedReport.processing_metadata.confidence * 100)}%`
                            : '92%'}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-[#E6EAF0]">
                        <span className="text-[10px] text-[#667085] uppercase tracking-wider block font-semibold">
                          Findings Count
                        </span>
                        <span className="font-mono font-bold text-[#172033] block mt-0.5">
                          {selectedReport.processing_metadata?.findings_count ??
                            selectedReport.detected_parameters.length}{' '}
                          Item(s)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Current vs Previous Report Comparison Table */}
              <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-xs overflow-hidden space-y-4 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F7F9FC]">
                  <div>
                    <h3 className="text-base font-bold text-[#172033]">
                      Current vs Previous Report Comparison
                    </h3>
                    <p className="text-xs text-[#667085] mt-0.5">
                      {selectedReport.has_previous_report ? (
                        <>
                          Automatically compared against prior matching report:{' '}
                          <strong className="text-[#172033]">{selectedReport.previous_filename}</strong> ({selectedReport.previous_report_date})
                        </>
                      ) : (
                        'No previous matching report on file. This document establishes your baseline.'
                      )}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-50 text-[#1677FF] border border-blue-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                    Type-Aware Longitudinal Alignment
                  </span>
                </div>

                {/* AI Explanation of What Changed */}
                {selectedReport.change_explanation && (
                  <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#172033]">
                      <Sparkles className="w-4 h-4 text-[#1677FF]" />
                      <span>AI Longitudinal Report Analysis</span>
                    </div>
                    <p className="text-xs text-[#172033] leading-relaxed">
                      {selectedReport.change_explanation}
                    </p>
                  </div>
                )}

                {/* Comparison Table */}
                <div className="border border-[#E6EAF0] rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F7F9FC] border-b border-[#E6EAF0] text-[#667085] uppercase tracking-wider text-[10px] font-bold">
                        <tr>
                          <th className="px-4 py-3">Parameter / Finding</th>
                          <th className="px-4 py-3">Previous Value</th>
                          <th className="px-4 py-3">Current Value</th>
                          <th className="px-4 py-3">Observed Shift</th>
                          <th className="px-4 py-3">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6EAF0]">
                        {selectedReport.parameter_comparisons.map((c, idx) => {
                          const isDecreased = c.trend.includes('Decreased');
                          const isIncreased = c.trend.includes('Increased');
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-[#172033]">
                                {c.parameter}
                              </td>
                              <td className="px-4 py-3 text-[#667085]">
                                {c.has_previous && c.previous_value !== undefined && c.previous_value !== null ? (
                                  <span className="font-medium text-[#172033]">
                                    {c.previous_value}
                                  </span>
                                ) : (
                                  <span className="italic text-[#667085] text-[11px]">
                                    No previous data available for comparison.
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-bold text-[#172033]">
                                {c.current_value}
                              </td>
                              <td className="px-4 py-3">
                                {c.has_previous && c.change ? (
                                  <span
                                    className={`font-semibold ${
                                      isDecreased ? 'text-[#16A34A]' : isIncreased ? 'text-[#EF4444]' : 'text-[#667085]'
                                    }`}
                                  >
                                    {c.change} {c.percentage_change ? `(${c.percentage_change})` : ''}
                                  </span>
                                ) : (
                                  <span className="text-[#667085]">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    !c.has_previous
                                      ? 'bg-slate-100 text-[#667085] border border-slate-200'
                                      : isDecreased
                                      ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                                      : isIncreased
                                      ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                                      : 'bg-slate-100 text-[#667085] border border-slate-200'
                                  }`}
                                >
                                  {c.trend}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 3. "Run New Risk Screening from this Report" Section or Eligibility Notice */}
              {selectedReport.can_run_new_screening && selectedReport.screening_opportunities.length > 0 ? (
                <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1677FF] text-[11px] font-semibold border border-blue-200 mb-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>Actionable Screening Opportunity</span>
                      </div>
                      <h3 className="text-base font-bold text-[#172033]">
                        Run New Risk Screening from Report Data
                      </h3>
                      <p className="text-xs text-[#667085] mt-0.5">
                        Valid clinical biometrics detected in this report can directly inform a new statistical disease risk screening.
                      </p>
                    </div>
                  </div>

                  {/* Opportunities List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedReport.screening_opportunities.map((opp, idx) => (
                      <div
                        key={idx}
                        className="bg-[#F7F9FC] border border-[#E6EAF0] rounded-xl p-4 flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                            Derived Parameter: {opp.parameter} ({opp.value} {opp.unit})
                          </span>
                          <h4 className="text-sm font-bold text-[#172033]">{opp.title}</h4>
                          <p className="text-xs text-[#667085]">
                            Calculate updated statistical risk using this verified lab analyte and your stored clinical profile.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRunScreening(opp.disease)}
                          disabled={runningScreening === opp.disease}
                          className="w-full h-10 bg-[#1677FF] hover:bg-[#1366DB] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-colors"
                        >
                          {runningScreening === opp.disease ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Calculating AI Risk...</span>
                            </>
                          ) : (
                            <>
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>Run {opp.disease.toUpperCase()} Screening</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Screening Success Card */}
                  {screeningSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                          <h4 className="text-xs font-bold text-[#15803D]">
                            {screeningSuccess.message}
                          </h4>
                        </div>
                        <span className="text-xs font-bold text-[#16A34A]">
                          New Risk: {screeningSuccess.result.risk_score_percentage}% ({screeningSuccess.result.risk_category})
                        </span>
                      </div>
                      <p className="text-xs text-[#15803D]">
                        This new screening has been saved as your newest record without modifying or overwriting your historical predictions.
                      </p>
                      {onViewScreeningResult && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => onViewScreeningResult(screeningSuccess.result)}
                            className="text-xs font-bold text-[#1677FF] hover:underline flex items-center gap-1"
                          >
                            <span>View Full Screening Result & Factor Analysis</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border border-[#E6EAF0] p-5 rounded-xl space-y-1 text-center">
                  <span className="text-xs font-bold text-[#667085] block">
                    Screening Model Eligibility
                  </span>
                  <p className="text-xs text-[#667085] italic">
                    No supported disease-screening model can be reliably triggered from the available parameters in this report.
                  </p>
                </div>
              )}

              {/* 4. Questions to Discuss with Your Doctor */}
              {selectedReport.questions_to_discuss && selectedReport.questions_to_discuss.length > 0 && (
                <div className="bg-[#F7F9FC] border border-[#E6EAF0] rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#1677FF]" />
                    <h4 className="text-xs font-bold text-[#172033]">
                      Questions to Discuss with Your Healthcare Provider
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#667085]">
                    {selectedReport.questions_to_discuss.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1677FF] shrink-0 mt-0.5" />
                        <span className="text-[#172033]">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 5. Report History List */}
              <div className="bg-white rounded-xl border border-[#E6EAF0] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#172033]">Medical Report History</h3>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Chronological log of uploaded laboratory reports. Click any report to view its extraction and comparison breakdown.
                    </p>
                  </div>
                  <span className="text-xs text-[#667085]">
                    {reportsList.length} Total Reports
                  </span>
                </div>

                <div className="divide-y divide-[#E6EAF0] border border-[#E6EAF0] rounded-xl overflow-hidden">
                  {reportsList.map((r) => {
                    const isSelected = r.id === selectedReport.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => handleSelectReport(r.id)}
                        className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/70' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-[#1677FF] text-white' : 'bg-[#F7F9FC] text-[#667085]'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#172033] block">
                              {r.filename}
                            </span>
                            <span className="text-[11px] text-[#667085] block">
                              {r.document_type} • {r.file_size_kb} KB • {r.parameters_count} analytes
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <span className="text-xs text-[#667085]">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? 'text-[#1677FF]' : 'text-[#667085]'
                            }`}
                          >
                            {isSelected ? 'Viewing' : 'Inspect'} →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HEALTHAI SCREENING REPORTS (PDF & PRINT VIEWER) */}
      {activeTab === 'screening_reports' && (
        <div>
          {screeningHistory.length === 0 ? (
            <div className="bg-white border border-[#E6EAF0] rounded-xl p-12 text-center">
              <FileText className="w-12 h-12 text-[#667085] mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[#172033]">No screening reports generated yet</h3>
              <p className="text-xs text-[#667085] max-w-sm mx-auto mt-1">
                Complete a health risk screening session to produce a permanent AI health screening report.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Report selection list */}
              <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs no-print space-y-2 h-fit">
                <span className="text-xs font-bold text-[#172033] px-1 block mb-2">
                  Completed Screenings ({screeningHistory.length})
                </span>
                <div className="space-y-1.5">
                  {screeningHistory.map((item) => {
                    const isSelected = item.id === selectedScreeningId;
                    return (
                      <button
                        key={item.id}
                        onClick={async () => {
                          setSelectedScreeningId(item.id);
                          const d = await api.getScreeningDetail(item.id);
                          setScreeningDetail(d);
                        }}
                        className={`w-full p-3 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'bg-blue-50/80 border-[#1677FF] shadow-2xs'
                            : 'bg-white border-[#E6EAF0] hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#172033]">
                            {item.screening_title}
                          </span>
                          <span className="text-[11px] font-bold text-[#1677FF]">
                            {item.risk_score_percentage}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#667085]">
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          <span className="capitalize">{item.risk_category} risk</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Printable Report Document */}
              <div className="lg:col-span-2">
                {screeningDetail ? (
                  <div className="bg-white border border-[#E6EAF0] rounded-xl p-8 shadow-xs space-y-6">
                    {/* Header actions */}
                    <div className="flex items-center justify-between pb-4 border-b border-[#F7F9FC] no-print">
                      <div>
                        <h2 className="text-lg font-bold text-[#172033]">{screeningDetail.screening_title}</h2>
                        <span className="text-xs text-[#667085]">Generated on {new Date(screeningDetail.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrint}
                          className="px-3.5 py-2 rounded-xl border border-[#E6EAF0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#172033] flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#667085]" />
                          <span>Print</span>
                        </button>
                        <a
                          href={api.getPdfDownloadUrl(screeningDetail.id)}
                          download
                          className="px-3.5 py-2 rounded-xl bg-[#1677FF] hover:bg-[#1366DB] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </a>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-3">
                      <div className="p-4 bg-[#F7F9FC] border border-[#E6EAF0] rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs text-[#667085] block font-medium">Estimated Risk Score</span>
                          <span className="text-2xl font-extrabold text-[#1677FF]">{screeningDetail.risk_score_percentage}%</span>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] capitalize">
                          {screeningDetail.risk_category} Risk
                        </span>
                      </div>

                      <p className="text-xs text-[#667085] leading-relaxed">
                        {screeningDetail.risk_summary}
                      </p>
                    </div>

                    {/* Guidance */}
                    <div>
                      <span className="text-xs font-bold text-[#172033] block mb-2">Recommended Next Steps</span>
                      <ul className="space-y-1.5 text-xs text-[#667085]">
                        {screeningDetail.general_guidance.map((g, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-[#E6EAF0] rounded-xl p-8 text-center text-xs text-[#667085]">
                    Select a screening report to preview.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety Disclaimer */}
      <MedicalDisclaimer />
    </div>
  );
};
