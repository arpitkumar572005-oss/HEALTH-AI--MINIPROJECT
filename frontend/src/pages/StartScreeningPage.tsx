import React, { useState } from 'react';
import { ScreeningType, ScreeningResult } from '../types';
import { api } from '../services/api';
import { ScreeningWizard } from '../components/ScreeningWizard';
import { ScreeningLoadingScreen } from '../components/ScreeningLoadingScreen';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import {
  Brain,
  HeartPulse,
  Activity,
  Sparkles,
  ChevronRight,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface StartScreeningPageProps {
  initialDisease?: string;
  onScreeningCompleted: (result: ScreeningResult) => void;
  onCancel: () => void;
}

export const StartScreeningPage: React.FC<StartScreeningPageProps> = ({
  initialDisease,
  onScreeningCompleted,
  onCancel,
}) => {
  const [selectedDisease, setSelectedDisease] = useState<ScreeningType | null>(
    (initialDisease as ScreeningType) || null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    {
      id: 'diabetes' as ScreeningType,
      title: 'Diabetes',
      badge: 'Metabolic Risk Model',
      icon: Brain,
      iconColor: 'text-[#1677FF]',
      iconBg: 'bg-blue-50',
      duration: '2-3 min',
      description:
        'Evaluates current fasting plasma glucose, body mass index, blood pressure, family genetics, and weekly physical exercise to estimate early statistical diabetes risk.',
    },
    {
      id: 'cardiovascular' as ScreeningType,
      title: 'Cardiovascular',
      badge: 'Framingham Profile',
      icon: HeartPulse,
      iconColor: 'text-[#EF4444]',
      iconBg: 'bg-red-50',
      duration: '3 min',
      description:
        'Estimates 10-year cardiovascular risk by evaluating current systolic blood pressure, circulating cholesterol, resting pulse, and personal health background.',
    },
    {
      id: 'hypertension' as ScreeningType,
      title: 'Hypertension',
      badge: 'Arterial Pressure Model',
      icon: Activity,
      iconColor: 'text-[#F59E0B]',
      iconBg: 'bg-amber-50',
      duration: '2 min',
      description:
        'Assesses current resting arterial pressure gradients (systolic & diastolic), vascular tension indicators, and cardiovascular lifestyle habits.',
    },
    {
      id: 'symptom_risk' as ScreeningType,
      title: 'Symptom-Based Early Risk',
      badge: 'Multi-Condition Clustering',
      icon: Sparkles,
      iconColor: 'text-[#0EA5A4]',
      iconBg: 'bg-teal-50',
      duration: '2 min',
      description:
        'Identifies early warning signals across metabolic and cardiovascular indicators by analyzing current reported symptom clusters, onset timing, severity, and longitudinal symptom shifts.',
    },
  ];

  const handleStartForm = (disease: ScreeningType) => {
    setSelectedDisease(disease);
    setError(null);
  };

  const handleWizardSubmit = async (formData: any) => {
    if (!selectedDisease) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      let res: ScreeningResult;
      if (selectedDisease === 'diabetes') {
        res = await api.screenDiabetes(formData);
      } else if (selectedDisease === 'cardiovascular') {
        res = await api.screenCardiovascular(formData);
      } else if (selectedDisease === 'hypertension') {
        res = await api.screenHypertension(formData);
      } else {
        res = await api.screenSymptoms({
          symptoms: formData.symptoms || [],
          duration: formData.duration || 'weeks',
          severity: formData.severity || 'moderate',
          onset: formData.onset || 'gradual',
          description: formData.description || '',
          current_glucose: formData.fasting_glucose,
          current_systolic_bp: formData.systolic_bp,
          current_diastolic_bp: formData.diastolic_bp,
          current_heart_rate: formData.heart_rate,
          current_weight_kg: formData.weight_kg,
          age: formData.age,
          gender: formData.gender,
        });
      }

      // Allow 2.5s for polished AI analysis animation
      setTimeout(() => {
        setIsAnalyzing(false);
        onScreeningCompleted(res);
      }, 2500);
    } catch (err: any) {
      setIsAnalyzing(false);
      setError(err?.message || 'Something went wrong during screening inference. Please try again.');
    }
  };

  if (isAnalyzing && selectedDisease) {
    const currentTitle = categories.find((c) => c.id === selectedDisease)?.title || 'Health';
    return (
      <div className="bg-white border border-[#E6EAF0] rounded-xl shadow-xs p-8 animate-in fade-in">
        <ScreeningLoadingScreen screeningTitle={currentTitle} />
      </div>
    );
  }

  if (selectedDisease) {
    return (
      <div className="space-y-6 animate-in fade-in">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-[#B91C1C]">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
            <span>{error}</span>
          </div>
        )}
        <ScreeningWizard
          screeningType={selectedDisease}
          onSubmit={handleWizardSubmit}
          onCancel={() => setSelectedDisease(null)}
        />
        <MedicalDisclaimer compact />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 font-sans animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#172033]">
          Health Screening
        </h1>
        <p className="text-sm text-[#667085] mt-1">
          Select an AI-assisted health screening below to evaluate your current risk status.
        </p>
      </div>

      {/* Automated Longitudinal Comparison Active Banner */}
      <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3.5 shadow-2xs">
        <Sparkles className="w-5 h-5 text-[#1677FF] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-[#172033]">
              Intelligent Historical Comparison Active
            </h4>
            <span className="text-[10px] font-semibold bg-blue-100 text-[#1677FF] px-2 py-0.5 rounded-full">
              Automated Retrieval
            </span>
          </div>
          <p className="text-xs text-[#667085] leading-relaxed">
            Please enter your <strong>current health information only</strong>. HealthAI automatically retrieves your relevant previous health records from the database, compares matching parameters, generates an updated risk prediction, and explains what changed.
          </p>
        </div>
      </div>

      {/* Screening Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className="bg-white border border-[#E6EAF0] rounded-xl p-6 shadow-xs flex flex-col justify-between hover:border-[#1677FF]/40 hover:shadow-subtle transition-all duration-200"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl ${cat.iconBg} ${cat.iconColor} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-medium text-[#667085] flex items-center gap-1 bg-[#F7F9FC] px-2.5 py-1 rounded-lg border border-[#E6EAF0]">
                    <Clock className="w-3 h-3 text-[#667085]" /> {cat.duration}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block mb-1">
                    {cat.badge}
                  </span>
                  <h3 className="text-lg font-bold text-[#172033]">
                    {cat.title}
                  </h3>
                </div>

                <p className="text-xs text-[#667085] leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="pt-6 border-t border-[#F7F9FC] mt-6">
                <button
                  onClick={() => handleStartForm(cat.id)}
                  className="w-full h-11 bg-[#1677FF] hover:bg-[#1366DB] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Start Screening</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice Banner Matching Reference Screen 2 */}
      <div className="p-4 bg-white border border-[#E6EAF0] rounded-xl shadow-xs flex items-center gap-3 text-xs text-[#667085]">
        <ShieldCheck className="w-5 h-5 text-[#16A34A] shrink-0" />
        <p>
          HealthAI provides educational risk estimations only. No prescription or clinical diagnosis is rendered. Always consult your healthcare provider.
        </p>
      </div>
    </div>
  );
};
