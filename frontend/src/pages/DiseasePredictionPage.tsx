import React, { useState } from 'react';
import { api } from '../services/api';
import { ScreeningResult } from '../types';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import {
  ShieldAlert,
  Brain,
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Calendar,
  Clock,
  Info,
  ChevronRight,
  Sparkles,
  Droplet,
  Heart,
  Layers,
} from 'lucide-react';

interface DiseasePredictionPageProps {
  initialDisease?: 'diabetes' | 'cardiovascular' | 'kidney';
  onAssessmentCompleted?: (result: ScreeningResult) => void;
  onBackToDashboard: () => void;
  onViewInsights?: () => void;
}

export const DiseasePredictionPage: React.FC<DiseasePredictionPageProps> = ({
  initialDisease = 'diabetes',
  onAssessmentCompleted,
  onBackToDashboard,
  onViewInsights,
}) => {
  const [selectedDisease, setSelectedDisease] = useState<'diabetes' | 'cardiovascular' | 'kidney'>(
    initialDisease
  );

  // Common inputs
  const [age, setAge] = useState<number>(46);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [heightCm, setHeightCm] = useState<number>(178);
  const [weightKg, setWeightKg] = useState<number>(77.5);
  const [systolicBp, setSystolicBp] = useState<number>(120);

  // Diabetes specific
  const [fastingGlucose, setFastingGlucose] = useState<number>(98);
  const [diastolicBp, setDiastolicBp] = useState<number>(80);
  const [familyDiabetes, setFamilyDiabetes] = useState<boolean>(true);
  const [activityHours, setActivityHours] = useState<number>(3.0);

  // Heart disease specific
  const [cholesterol, setCholesterol] = useState<number>(185);
  const [heartRate, setHeartRate] = useState<number>(72);
  const [smokingStatus, setSmokingStatus] = useState<string>('former');
  const [chestDiscomfort, setChestDiscomfort] = useState<number>(0);

  // Kidney specific
  const [serumCreatinine, setSerumCreatinine] = useState<number>(0.95);
  const [bloodUrea, setBloodUrea] = useState<number>(28.0);
  const [albuminGrade, setAlbuminGrade] = useState<number>(0);
  const [hemoglobin, setHemoglobin] = useState<number>(14.5);
  const [historyHtn, setHistoryHtn] = useState<boolean>(false);
  const [historyDm, setHistoryDm] = useState<boolean>(false);
  const [pedalEdema, setPedalEdema] = useState<boolean>(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScreeningResult | null>(null);

  // Dynamic BMI Calculation in metric units (kg/m^2)
  const calculateBmi = () => {
    if (heightCm > 0 && weightKg > 0) {
      const hM = heightCm / 100;
      return +(weightKg / (hM * hM)).toFixed(1);
    }
    return 24.5;
  };
  const bmi = calculateBmi();

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: 'Underweight', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (val < 25) return { label: 'Normal weight', color: 'text-teal-700 bg-teal-50 border-teal-200' };
    if (val < 30) return { label: 'Overweight', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Obese', color: 'text-red-700 bg-red-50 border-red-200' };
  };
  const bmiInfo = getBmiCategory(bmi);

  const diseaseTabs = [
    {
      id: 'diabetes',
      title: 'Diabetes Risk',
      subtitle: 'Type-2 Diabetes & Glycemia',
      icon: Droplet,
      accent: 'border-[#0F766E] text-[#0F766E] bg-[#F0FDFA]',
    },
    {
      id: 'cardiovascular',
      title: 'Heart Disease Risk',
      subtitle: 'Cardiovascular & Arterial Health',
      icon: Heart,
      accent: 'border-[#0284C7] text-[#0284C7] bg-[#F0F9FF]',
    },
    {
      id: 'kidney',
      title: 'Chronic Kidney Disease',
      subtitle: 'Renal Function & Filtration',
      icon: Layers,
      accent: 'border-[#D97706] text-[#D97706] bg-[#FFFBEB]',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let res: ScreeningResult;

      if (selectedDisease === 'diabetes') {
        res = await api.screenDiabetes({
          age: Number(age),
          gender,
          height_cm: Number(heightCm),
          weight_kg: Number(weightKg),
          bmi,
          fasting_glucose: Number(fastingGlucose),
          systolic_bp: Number(systolicBp),
          diastolic_bp: Number(diastolicBp),
          family_history: familyDiabetes,
          physical_activity_hours: Number(activityHours),
        });
      } else if (selectedDisease === 'cardiovascular') {
        res = await api.screenCardiovascular({
          age: Number(age),
          gender,
          height_cm: Number(heightCm),
          weight_kg: Number(weightKg),
          bmi,
          systolic_bp: Number(systolicBp),
          cholesterol: Number(cholesterol),
          fasting_glucose: Number(fastingGlucose),
          heart_rate: Number(heartRate),
          smoking_status: smokingStatus,
          chest_discomfort_level: Number(chestDiscomfort),
          physical_activity_hours: Number(activityHours),
        });
      } else {
        res = await api.screenKidney({
          age: Number(age),
          gender,
          height_cm: Number(heightCm),
          weight_kg: Number(weightKg),
          bmi,
          systolic_bp: Number(systolicBp),
          serum_creatinine: Number(serumCreatinine),
          blood_urea: Number(bloodUrea),
          albumin: Number(albuminGrade),
          fasting_glucose: Number(fastingGlucose),
          hemoglobin: Number(hemoglobin),
          history_hypertension: historyHtn,
          history_diabetes: historyDm,
          pedal_edema: pedalEdema,
        });
      }

      setResult(res);
      if (onAssessmentCompleted) {
        onAssessmentCompleted(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to complete disease risk assessment. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskBadge = (cat: string) => {
    switch (cat) {
      case 'lower':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            Lower Risk Category
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            Moderate Risk Category
          </span>
        );
      case 'elevated':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            Elevated Risk Category
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-[#64748B]">
            {cat}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0F766E] shrink-0">
            <ShieldAlert className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#172B3A]">
              Disease Risk Assessment
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Calibrated machine learning risk estimation across Diabetes, Heart Disease, and Chronic Kidney Disease.
            </p>
          </div>
        </div>

        {/* Live BMI pill */}
        <div className="flex items-center gap-2 p-2 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] self-start sm:self-auto">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">BMI:</span>
          <span className="text-xs font-bold text-[#172B3A]">{bmi} kg/m²</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${bmiInfo.color}`}>
            {bmiInfo.label}
          </span>
        </div>
      </div>

      {/* Disease Selectors: Three Compact Tabs at the Top */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {diseaseTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedDisease === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedDisease(tab.id as any);
                setResult(null);
                setError(null);
              }}
              className={`p-3.5 rounded-lg border text-left transition-all flex items-center gap-3 ${
                isActive
                  ? `${tab.accent} shadow-2xs font-semibold ring-1 ring-[#0F766E]`
                  : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-white text-current shadow-2xs' : 'bg-[#F8FAFC] text-[#64748B]'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#172B3A] block truncate">
                  {tab.title}
                </span>
                <span className="text-[10px] text-[#64748B] block truncate mt-0.5">
                  {tab.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Assessment Form vs Result */}
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Common Demographics & Physical Measurements */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#172B3A] pb-3 border-b border-[#F1F5F9] flex items-center justify-between">
              <span>1. Baseline Demographics & Biometrics</span>
              <span className="text-[11px] font-normal text-[#64748B]">Metric Standard</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Age (years)
                </label>
                <input
                  type="number"
                  min={18}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  required
                  className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Biological Sex
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                  <span>Height</span>
                  <span className="text-[10px] text-[#64748B]">cm</span>
                </label>
                <input
                  type="number"
                  min={50}
                  max={250}
                  step="0.5"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  required
                  className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                  <span>Weight</span>
                  <span className="text-[10px] text-[#64748B]">kg</span>
                </label>
                <input
                  type="number"
                  min={20}
                  max={300}
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  required
                  className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Dynamically Rendered Disease-Specific Fields */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#172B3A] pb-3 border-b border-[#F1F5F9] flex items-center justify-between">
              <span>
                2. {selectedDisease === 'diabetes' && 'Diabetes Specific Biomarkers'}
                {selectedDisease === 'cardiovascular' && 'Cardiovascular Specific Biomarkers'}
                {selectedDisease === 'kidney' && 'Renal & Kidney Specific Biomarkers'}
              </span>
              <span className="text-[11px] font-semibold text-[#0F766E]">
                {selectedDisease === 'diabetes' && 'Calibrated Model v1.1'}
                {selectedDisease === 'cardiovascular' && 'Calibrated Model v1.1'}
                {selectedDisease === 'kidney' && 'Calibrated Model v1.0'}
              </span>
            </h2>

            {/* A. DIABETES FIELDS */}
            {selectedDisease === 'diabetes' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                    <span>Fasting Blood Glucose</span>
                    <span className="text-[10px] text-[#64748B]">mg/dL</span>
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={400}
                    value={fastingGlucose}
                    onChange={(e) => setFastingGlucose(Number(e.target.value))}
                    required
                    className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">Standard: 70 to 99 mg/dL</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                    <span>Systolic Blood Pressure</span>
                    <span className="text-[10px] text-[#64748B]">mmHg</span>
                  </label>
                  <input
                    type="number"
                    min={70}
                    max={260}
                    value={systolicBp}
                    onChange={(e) => setSystolicBp(Number(e.target.value))}
                    required
                    className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">Standard: 90 to 120 mmHg</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                    <span>Diastolic Blood Pressure</span>
                    <span className="text-[10px] text-[#64748B]">mmHg</span>
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={160}
                    value={diastolicBp}
                    onChange={(e) => setDiastolicBp(Number(e.target.value))}
                    required
                    className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">Standard: 60 to 80 mmHg</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                    <span>Physical Activity</span>
                    <span className="text-[10px] text-[#64748B]">hours/wk</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    step="0.5"
                    value={activityHours}
                    onChange={(e) => setActivityHours(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center pt-5">
                  <label className="flex items-center gap-2.5 p-3 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer hover:bg-slate-50 w-full">
                    <input
                      type="checkbox"
                      checked={familyDiabetes}
                      onChange={(e) => setFamilyDiabetes(e.target.checked)}
                      className="w-4 h-4 text-[#0F766E] border-slate-300 rounded focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-[#172B3A]">
                      Immediate family history of diabetes (parents or siblings)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* B. CARDIOVASCULAR FIELDS */}
            {selectedDisease === 'cardiovascular' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                    <span>Systolic Blood Pressure</span>
                    <span className="text-[10px] text-[#64748B]">mmHg</span>
                  </label>
                  <input
                    type="number"
                    min={70}
                    max={260}
                    value={systolicBp}
                    onChange={(e) => setSystolicBp(Number(e.target.value))}
                    required
                    className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">Standard: 90 to 120 mmHg</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                    <span>Total Serum Cholesterol</span>
                    <span className="text-[10px] text-[#64748B]">mg/dL</span>
                  </label>
                  <input
                    type="number"
                    min={90}
                    max={550}
                    value={cholesterol}
                    onChange={(e) => setCholesterol(Number(e.target.value))}
                    required
                    className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">Desirable: &lt; 200 mg/dL</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                    <span>Resting Heart Rate</span>
                    <span className="text-[10px] text-[#64748B]">bpm</span>
                  </label>
                  <input
                    type="number"
                    min={35}
                    max={220}
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    required
                    className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">Standard: 60 to 100 bpm</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Smoking History
                  </label>
                  <select
                    value={smokingStatus}
                    onChange={(e) => setSmokingStatus(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                  >
                    <option value="never">Never smoked</option>
                    <option value="former">Former smoker</option>
                    <option value="current">Current smoker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Chest Discomfort Level
                  </label>
                  <select
                    value={chestDiscomfort}
                    onChange={(e) => setChestDiscomfort(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                  >
                    <option value={0}>0: None</option>
                    <option value={1}>1: Mild tightness on heavy exertion</option>
                    <option value={2}>2: Moderate discomfort on exercise</option>
                    <option value={3}>3: Frequent / atypical pressure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                    <span>Physical Activity</span>
                    <span className="text-[10px] text-[#64748B]">hours/wk</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    step="0.5"
                    value={activityHours}
                    onChange={(e) => setActivityHours(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>
            )}

            {/* C. CHRONIC KIDNEY DISEASE FIELDS */}
            {selectedDisease === 'kidney' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                      <span>Serum Creatinine</span>
                      <span className="text-[10px] text-[#64748B]">mg/dL</span>
                    </label>
                    <input
                      type="number"
                      min={0.2}
                      max={15.0}
                      step="0.05"
                      value={serumCreatinine}
                      onChange={(e) => setSerumCreatinine(Number(e.target.value))}
                      required
                      className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                    />
                    <span className="text-[10px] text-[#64748B] mt-0.5 block">Standard: 0.6 to 1.2 mg/dL</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                      <span>Blood Urea Nitrogen</span>
                      <span className="text-[10px] text-[#64748B]">mg/dL</span>
                    </label>
                    <input
                      type="number"
                      min={5.0}
                      max={250.0}
                      step="0.5"
                      value={bloodUrea}
                      onChange={(e) => setBloodUrea(Number(e.target.value))}
                      required
                      className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                    />
                    <span className="text-[10px] text-[#64748B] mt-0.5 block">Standard: 15 to 45 mg/dL</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                      <span>Hemoglobin</span>
                      <span className="text-[10px] text-[#64748B]">g/dL</span>
                    </label>
                    <input
                      type="number"
                      min={4.0}
                      max={22.0}
                      step="0.1"
                      value={hemoglobin}
                      onChange={(e) => setHemoglobin(Number(e.target.value))}
                      required
                      className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                    />
                    <span className="text-[10px] text-[#64748B] mt-0.5 block">Standard: 12 to 17.5 g/dL</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                      Urine Albumin (Protein)
                    </label>
                    <select
                      value={albuminGrade}
                      onChange={(e) => setAlbuminGrade(Number(e.target.value))}
                      className="w-full h-9 px-3 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:bg-white focus:outline-none focus:border-[#0F766E]"
                    >
                      <option value={0}>Grade 0 (Negative / Trace)</option>
                      <option value={1}>Grade 1 (Mild Proteinuria)</option>
                      <option value={2}>Grade 2 (Moderate)</option>
                      <option value={3}>Grade 3 (Significant)</option>
                      <option value={4}>Grade 4 (Heavy)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <label className="flex items-center gap-2.5 p-3 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={historyHtn}
                      onChange={(e) => setHistoryHtn(e.target.checked)}
                      className="w-4 h-4 text-[#0F766E] border-slate-300 rounded focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-[#172B3A]">
                      Prior Diagnosis of Hypertension
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={historyDm}
                      onChange={(e) => setHistoryDm(e.target.checked)}
                      className="w-4 h-4 text-[#0F766E] border-slate-300 rounded focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-[#172B3A]">
                      Prior Diagnosis of Diabetes
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={pedalEdema}
                      onChange={(e) => setPedalEdema(e.target.checked)}
                      className="w-4 h-4 text-[#0F766E] border-slate-300 rounded focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-[#172B3A]">
                      Lower Leg / Ankle Swelling (Pedal Edema)
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#991B1B] text-xs rounded-md flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-4 py-2 border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#0F766E] text-white text-xs font-bold rounded-md hover:bg-[#0D655E] disabled:opacity-50 transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Risk Model...</span>
                </>
              ) : (
                <>
                  <span>Run Risk Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Result Screen: Visual, Concise, Non-Verbose */
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
              <div>
                <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">
                  Model Estimated Result
                </span>
                <h2 className="text-base font-bold text-[#172B3A] mt-0.5">
                  {result.screening_title}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>Model: {result.algorithm} (v{result.model_version})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E]">
                  {result.risk_score_percentage}% Estimated Risk
                </span>
                {getRiskBadge(result.risk_category)}
              </div>
            </div>

            <p className="text-xs text-[#172B3A] leading-relaxed bg-[#F8FAFC] p-3 rounded-md border border-[#E2E8F0]">
              {result.risk_summary}
            </p>

            {/* Visual Ranking of Factors */}
            {result.feature_contributions && result.feature_contributions.length > 0 && (
              <div>
                <span className="text-xs font-bold text-[#172B3A] block mb-2">
                  Key Influencing Variables
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.feature_contributions.slice(0, 4).map((fc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md border border-[#E2E8F0] bg-white text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#172B3A]">{fc.label}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            fc.direction === 'increases_risk'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {fc.direction === 'increases_risk' ? 'Elevates Risk' : 'Protective Factor'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B]">{fc.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-[#172B3A] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Adjust Parameters</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBackToDashboard}
                  className="px-3.5 py-2 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#172B3A] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
                >
                  Dashboard
                </button>
                {onViewInsights && (
                  <button
                    type="button"
                    onClick={onViewInsights}
                    className="px-4 py-2 rounded-md text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>View Detailed Insights</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[11px] text-[#64748B]">
            <strong className="text-[#172B3A]">Assessment Limitation:</strong> This result is an automated risk estimation based on calibrated statistical models and user-provided inputs. It does not replace diagnostic clinical tests or physician evaluation.
          </div>
        </div>
      )}

      {/* Compact Medical Disclaimer */}
      <MedicalDisclaimer compact={true} />
    </div>
  );
};
