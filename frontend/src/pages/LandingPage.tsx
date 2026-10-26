import React from 'react';
import {
  HeartPulse,
  Stethoscope,
  ShieldAlert,
  Brain,
  Activity,
  ArrowRight,
  Lock,
  FileCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface LandingPageProps {
  onStartScreening: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onDemoAccess: (role?: 'patient') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartScreening,
  onLogin,
  onRegister,
  onDemoAccess,
}) => {
  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#172B3A] flex flex-col">
      {/* Navigation Header */}
      <header className="h-16 border-b border-[#E2E8F0] sticky top-0 bg-white/95 backdrop-blur-xs z-30 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#0F766E] flex items-center justify-center text-white shrink-0">
            <HeartPulse className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-[#172B3A] block leading-none">
              HealthAI
            </span>
            <span className="text-[10px] text-[#64748B] font-medium tracking-wide">
              AI-assisted health risk assessment and understandable health insights.
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#64748B]">
          <a href="#features" className="hover:text-[#0F766E] transition-colors">Core Modules</a>
          <a href="#disease-models" className="hover:text-[#0F766E] transition-colors">Prediction Models</a>
          <a href="#explainability" className="hover:text-[#0F766E] transition-colors">Explainability</a>
          <a href="#clinical-safety" className="hover:text-[#0F766E] transition-colors">Safety Standard</a>
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onDemoAccess('patient')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Demo Patient</span>
          </button>
          <button
            onClick={onLogin}
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-[#172B3A] border border-[#E2E8F0] hover:bg-slate-50 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onRegister}
            className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors"
          >
            Create Account
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-20 px-4 sm:px-8 max-w-6xl mx-auto w-full flex flex-col items-center text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-50 border border-teal-200 text-[#0F766E] text-xs font-semibold">
          <Activity className="w-3.5 h-3.5" />
          <span>Clinical Prototype: Developed for Himanshu Sharma and Project Team</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#172B3A] max-w-3xl leading-tight">
          AI-Assisted Health Risk Assessment and Understandable Health Insights
        </h1>

        <p className="text-sm sm:text-base text-[#64748B] max-w-2xl leading-relaxed">
          HealthAI provides validated machine learning risk estimation across Diabetes, Heart Disease, and Chronic Kidney Disease alongside rule-based symptom triage and explainable factor breakdowns.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={onStartScreening}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold transition-colors"
          >
            <span>Start Risk Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDemoAccess('patient')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172B3A] text-xs font-semibold transition-colors"
          >
            <span>Launch Himanshu Sharma Demo</span>
          </button>
        </div>

        {/* Regulatory disclaimer notice banner */}
        <div className="max-w-xl text-[11px] text-[#64748B] bg-white p-3 rounded-md border border-[#E2E8F0] mt-4">
          <strong className="text-[#172B3A]">Educational Screening Notice:</strong> HealthAI produces preliminary educational risk estimates based on user-submitted physiological variables. It does not provide medical diagnoses or replace licensed clinical evaluation.
        </div>
      </section>

      {/* Core Features Overview */}
      <section id="features" className="py-12 px-4 sm:px-8 max-w-6xl mx-auto w-full border-t border-[#E2E8F0]">
        <div className="text-center space-y-1 mb-10">
          <h2 className="text-xl font-bold tracking-tight text-[#172B3A]">Three Core Healthcare Features</h2>
          <p className="text-xs text-[#64748B]">
            Engineered with strict clinical boundaries and tenant-isolated data architectures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Symptom Detector */}
          <div className="bg-white p-6 rounded-md border border-[#E2E8F0] space-y-3 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] mb-3">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#172B3A]">AI Symptom Detector</h3>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                Review your symptoms and explore possible explanations. Evaluates severity, duration, and patient age using a rule-based triage heuristic with immediate emergency warnings.
              </p>
            </div>
            <div className="pt-3 border-t border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-[#0F766E] flex items-center gap-1">
                Rule-Based Clinical Triage <CheckCircle2 className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Card 2: Disease Prediction */}
          <div className="bg-white p-6 rounded-md border border-[#E2E8F0] space-y-3 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] mb-3">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#172B3A]">Multiple Disease Prediction</h3>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                Complete a supported health risk assessment. Features three distinct, independently trained machine learning models for Diabetes, Heart Disease, and Chronic Kidney Disease.
              </p>
            </div>
            <div className="pt-3 border-t border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-[#0F766E] flex items-center gap-1">
                Calibrated ML Classifiers <CheckCircle2 className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Card 3: Explainable Health Insights */}
          <div className="bg-white p-6 rounded-md border border-[#E2E8F0] space-y-3 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] mb-3">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#172B3A]">Explainable Health Insights</h3>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                Understand the factors behind your assessment results. Real feature contributions explain elevating and moderating variables without claiming clinical causation.
              </p>
            </div>
            <div className="pt-3 border-t border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-[#0F766E] flex items-center gap-1">
                Transparent Feature Breakdown <CheckCircle2 className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Disease Models Specifications */}
      <section id="disease-models" className="py-12 px-4 sm:px-8 max-w-6xl mx-auto w-full border-t border-[#E2E8F0]">
        <div className="text-center space-y-1 mb-8">
          <h2 className="text-xl font-bold tracking-tight text-[#172B3A]">Supported Disease Risk Assessments</h2>
          <p className="text-xs text-[#64748B]">
            Each assessment module employs distinct preprocessing pipelines, clinical variables, and evaluation metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-md border border-[#E2E8F0] bg-white space-y-2">
            <span className="font-bold text-[#172B3A] block">1. Diabetes Risk Assessment</span>
            <p className="text-[#64748B] text-[11px] leading-relaxed">
              Assesses type-2 diabetes risk using fasting glucose, body mass index, blood pressure, physical activity, and family history indicators.
            </p>
            <div className="text-[10px] text-[#0F766E] font-semibold">ROC-AUC: 0.81 | Calibrated Classifier</div>
          </div>

          <div className="p-4 rounded-md border border-[#E2E8F0] bg-white space-y-2">
            <span className="font-bold text-[#172B3A] block">2. Heart Disease Risk Assessment</span>
            <p className="text-[#64748B] text-[11px] leading-relaxed">
              Evaluates cardiovascular risk utilizing blood pressure, total cholesterol, smoking history, resting heart rate, and patient age.
            </p>
            <div className="text-[10px] text-[#0F766E] font-semibold">ROC-AUC: 0.79 | Logistic & Random Forest</div>
          </div>

          <div className="p-4 rounded-md border border-[#E2E8F0] bg-white space-y-2">
            <span className="font-bold text-[#172B3A] block">3. Chronic Kidney Disease Assessment</span>
            <p className="text-[#64748B] text-[11px] leading-relaxed">
              Analyzes renal impairment probability via serum creatinine, blood urea, albumin, hemoglobin, hypertension, and pedal edema.
            </p>
            <div className="text-[10px] text-[#0F766E] font-semibold">ROC-AUC: 0.87 | StandardScaler + Logistic</div>
          </div>
        </div>
      </section>

      {/* Safety & Standards */}
      <section id="clinical-safety" className="py-12 px-4 sm:px-8 max-w-6xl mx-auto w-full border-t border-[#E2E8F0]">
        <div className="bg-white p-6 sm:p-8 rounded-md border border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-left">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0F766E]" />
              <h3 className="text-sm font-bold text-[#172B3A]">Security, Privacy, and Tenant Isolation</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              User health records are encrypted and protected by strict tenant isolation. HealthAI does not monetize user records or share patient data with third parties. Users can permanently delete individual records or their entire account at any time.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onRegister}
              className="px-5 py-2 rounded-md text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={onLogin}
              className="px-4 py-2 rounded-md text-xs font-semibold text-[#172B3A] border border-[#E2E8F0] hover:bg-[#F7F9FA] transition-colors"
            >
              Patient Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E2E8F0] bg-white py-6 px-4 sm:px-8 text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <span className="font-bold text-[#172B3A]">HealthAI</span>: AI-assisted health risk assessment and understandable health insights.
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Developed for Himanshu Sharma and Project Team. Educational screening prototype.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs shrink-0">
            <span>Standard Metric Units</span>
            <span className="text-[#E2E8F0]">|</span>
            <span>Indian Format DD/MM/YYYY</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
