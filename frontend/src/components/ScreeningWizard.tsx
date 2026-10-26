import React, { useState } from 'react';
import { ScreeningType } from '../types';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Search,
  Activity,
  HeartPulse,
  Brain,
  AlertTriangle,
  Info,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface ScreeningWizardProps {
  screeningType: ScreeningType;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  initialProfile?: any;
}

const COMMON_SYMPTOMS = [
  'Fatigue',
  'Excessive thirst',
  'Frequent urination',
  'Shortness of breath',
  'Dizziness',
  'Chest discomfort',
  'Headache',
  'Blurred vision',
  'Heart palpitations',
  'Slow healing cuts',
  'Swollen feet or ankles',
];

const SYMPTOM_CATEGORIES = [
  {
    category: 'Metabolic & Glycemic Signs',
    symptoms: [
      'Excessive thirst',
      'Frequent urination',
      'Unexplained weight loss',
      'Increased hunger',
      'Fatigue',
      'Blurred vision',
      'Slow healing cuts',
    ],
  },
  {
    category: 'Cardiovascular & Circulation Signs',
    symptoms: [
      'Shortness of breath',
      'Chest discomfort',
      'Heart palpitations',
      'Swollen feet or ankles',
      'Dizziness',
      'Cold extremities',
    ],
  },
  {
    category: 'Arterial Pressure & Neurological Signs',
    symptoms: [
      'Headache',
      'Neck stiffness / tension',
      'Ear ringing (tinnitus)',
      'Transient vision changes',
      'Daytime sleepiness',
    ],
  },
];

export const ScreeningWizard: React.FC<ScreeningWizardProps> = ({
  screeningType,
  onSubmit,
  onCancel,
  initialProfile,
}) => {
  const isSymptomScreening = screeningType === 'symptom_risk';
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    age: initialProfile?.age || 45,
    gender: initialProfile?.gender || 'male',
    height_cm: initialProfile?.height_cm || 175,
    weight_kg: initialProfile?.weight_kg || 77.5,
    // Step 2: Measurements (CURRENT ONLY)
    fasting_glucose: 98,
    systolic_bp: 122,
    diastolic_bp: 80,
    cholesterol: 188,
    heart_rate: 72,
    chest_discomfort_level: 0,
    // Step 3: Symptoms
    symptoms: [] as string[],
    otherSymptomText: '',
    noneOfThese: false,
    symptomSearch: '',
    // Symptom-specific
    duration: 'weeks',
    severity: 'moderate',
    onset: 'gradual',
    description: '',
    // Step 4: Medical History & Lifestyle
    family_history: initialProfile?.family_history_diabetes || false,
    smoking_status: initialProfile?.smoking_status || 'never',
    alcohol_consumption: initialProfile?.alcohol_consumption || 'none',
    sodium_intake: 'moderate',
    physical_activity_hours: initialProfile?.physical_activity_hours || 3.5,
    existing_conditions: initialProfile?.existing_conditions || '',
  });

  // Calculate live BMI
  const calculateBmi = () => {
    if (formData.height_cm > 0 && formData.weight_kg > 0) {
      const h_m = formData.height_cm / 100;
      return (formData.weight_kg / (h_m * h_m)).toFixed(1);
    }
    return '24.5';
  };

  const calculatedBmi = calculateBmi();

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSymptom = (symptom: string) => {
    setFormData((prev) => {
      let updated = [...prev.symptoms];
      if (updated.includes(symptom)) {
        updated = updated.filter((s) => s !== symptom);
      } else {
        updated.push(symptom);
      }
      return {
        ...prev,
        symptoms: updated,
        noneOfThese: false,
      };
    });
  };

  const handleNoneOfThese = () => {
    setFormData((prev) => ({
      ...prev,
      noneOfThese: true,
      symptoms: [],
    }));
  };

  const handleAddOtherSymptom = () => {
    if (formData.otherSymptomText.trim()) {
      setFormData((prev) => ({
        ...prev,
        symptoms: [...prev.symptoms, prev.otherSymptomText.trim()],
        otherSymptomText: '',
        noneOfThese: false,
      }));
    }
  };

  const handleFormSubmit = () => {
    const payload = {
      ...formData,
      bmi: parseFloat(calculatedBmi),
    };
    onSubmit(payload);
  };

  const stepsList = isSymptomScreening
    ? [
        { num: 1, label: 'Current Symptoms' },
        { num: 2, label: 'Context & Vitals' },
        { num: 3, label: 'AI Review & Analyze' },
      ]
    : [
        { num: 1, label: 'Personal Info' },
        { num: 2, label: 'Current Measurements' },
        { num: 3, label: 'Current Symptoms' },
        { num: 4, label: 'Lifestyle & History' },
        { num: 5, label: 'AI Prediction' },
      ];

  const totalSteps = stepsList.length;

  const getScreeningTitle = () => {
    if (screeningType === 'diabetes') return 'Diabetes Risk Screening';
    if (screeningType === 'cardiovascular') return 'Cardiovascular Risk Screening';
    if (screeningType === 'hypertension') return 'Hypertension Risk Screening';
    return 'Symptom-Based Early Risk Screening';
  };

  const hasRedFlag =
    formData.symptoms.includes('Chest discomfort') ||
    formData.symptoms.includes('Shortness of breath') && formData.severity === 'severe';

  return (
    <div className="bg-white border border-[#E6EAF0] rounded-xl shadow-xs overflow-hidden max-w-4xl mx-auto font-sans">
      {/* Wizard Header & Progress Bar */}
      <div className="p-6 border-b border-[#E6EAF0]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#172033]">
                {getScreeningTitle()}
              </h2>
              <span className="text-[10px] font-semibold bg-blue-50 text-[#1677FF] border border-blue-200 px-2 py-0.5 rounded-full">
                Current Data Input Only
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-1">
              Step {currentStep} of {totalSteps}: {stepsList[currentStep - 1].label}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-[#667085] hover:text-[#172033] font-medium px-3 py-1.5 rounded-lg border border-[#E6EAF0] bg-white hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Automated Comparison Reminder Pill */}
        <div className="mb-4 px-3.5 py-2 bg-blue-50/60 border border-blue-100 rounded-lg flex items-center gap-2 text-xs text-[#1677FF]">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>Automatic Comparison Active:</strong> Your previous health records will be automatically retrieved from the database to compute changes and calibrate risk.
          </span>
        </div>

        {/* Stepper Indicators */}
        <div className={`grid ${isSymptomScreening ? 'grid-cols-3' : 'grid-cols-5'} gap-2`}>
          {stepsList.map((step) => {
            const isCompleted = step.num < currentStep;
            const isCurrent = step.num === currentStep;
            return (
              <div
                key={step.num}
                onClick={() => isCompleted && setCurrentStep(step.num)}
                className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                  isCompleted
                    ? 'cursor-pointer bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D]'
                    : isCurrent
                    ? 'bg-blue-50 border border-blue-200 text-[#1677FF]'
                    : 'bg-[#F7F9FC] border border-[#E6EAF0] text-[#667085]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCompleted
                      ? 'bg-[#16A34A] text-white'
                      : isCurrent
                      ? 'bg-[#1677FF] text-white'
                      : 'bg-white text-[#667085] border border-[#E6EAF0]'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.num}
                </div>
                <span className="text-xs font-semibold hidden md:inline truncate">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Red flag alert if severe chest pain or shortness of breath */}
      {hasRedFlag && (
        <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-[#B91C1C]">
          <ShieldAlert className="w-4 h-4 shrink-0 text-[#EF4444]" />
          <span>
            <strong>Safety Note:</strong> If you are experiencing sudden, severe chest pain or acute difficulty breathing, please seek immediate emergency medical care (call 911 / emergency services).
          </span>
        </div>
      )}

      {/* Wizard Content Body */}
      <div className="p-6 md:p-8">
        {/* ========================================================
            SYMPTOM SCREENING FLOW (3 STEPS)
           ======================================================== */}
        {isSymptomScreening && (
          <>
            {/* Symptom Step 1: Current Symptoms, Duration, Severity, Onset */}
            {currentStep === 1 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Current Reported Symptoms</h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Select any symptoms you are experiencing today or over the past week.
                  </p>
                </div>

                {/* Categorized Symptom Selection */}
                <div className="space-y-4">
                  {SYMPTOM_CATEGORIES.map((catGroup) => (
                    <div key={catGroup.category} className="space-y-2">
                      <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block">
                        {catGroup.category}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {catGroup.symptoms.map((sym) => {
                          const isSelected = formData.symptoms.includes(sym);
                          return (
                            <button
                              key={sym}
                              type="button"
                              onClick={() => toggleSymptom(sym)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                isSelected
                                  ? 'bg-blue-50 text-[#1677FF] border-[#1677FF] shadow-2xs font-semibold'
                                  : 'bg-white text-[#172033] border-[#E6EAF0] hover:bg-[#F7F9FC]'
                              }`}
                            >
                              {sym}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Free text symptom entry */}
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-[#172033] block mb-1.5">
                      Other Symptoms
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.otherSymptomText}
                        onChange={(e) => handleInputChange('otherSymptomText', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOtherSymptom())}
                        placeholder="Type any other symptom and press Add..."
                        className="flex-1 h-10 px-3.5 rounded-xl border border-[#E6EAF0] text-xs focus:outline-none focus:border-[#1677FF]"
                      />
                      <button
                        type="button"
                        onClick={handleAddOtherSymptom}
                        className="px-4 h-10 bg-white border border-[#E6EAF0] text-[#172033] hover:bg-slate-50 text-xs font-semibold rounded-xl"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Duration, Severity, Onset Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E6EAF0]">
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Symptom Duration
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-[#E6EAF0] text-xs bg-white text-[#172033] focus:outline-none focus:border-[#1677FF]"
                    >
                      <option value="days">Few days (&lt; 1 week)</option>
                      <option value="weeks">1 to 4 weeks</option>
                      <option value="months">Over 1 month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Overall Severity
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) => handleInputChange('severity', e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-[#E6EAF0] text-xs bg-white text-[#172033] focus:outline-none focus:border-[#1677FF]"
                    >
                      <option value="mild">Mild (Noticeable but manageable)</option>
                      <option value="moderate">Moderate (Interferes with routine)</option>
                      <option value="severe">Severe (Significant discomfort)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Symptom Onset
                    </label>
                    <select
                      value={formData.onset}
                      onChange={(e) => handleInputChange('onset', e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-[#E6EAF0] text-xs bg-white text-[#172033] focus:outline-none focus:border-[#1677FF]"
                    >
                      <option value="gradual">Gradual (Slowly developed)</option>
                      <option value="sudden">Sudden (Quick onset)</option>
                      <option value="intermittent">Intermittent (Comes and goes)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Symptom Step 2: Context Description & Optional Current Vitals */}
            {currentStep === 2 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Clinical Description & Current Measurements</h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Provide optional clinical context or recent measurements. Enter current values only; HealthAI automatically retrieves your previous baselines.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                    Symptom Description & Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe specific triggers, time of day symptoms appear, or recent dietary / activity changes..."
                    className="w-full p-3 text-xs rounded-xl border border-[#E6EAF0] focus:outline-none focus:border-[#1677FF]"
                  />
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#172033]">
                      Current Health Biomarkers (Optional)
                    </span>
                    <span className="text-[11px] text-[#667085]">
                      Pre-filled with your current profile
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                        Current Fasting Glucose
                      </label>
                      <div className="flex rounded-xl border border-[#E6EAF0] overflow-hidden focus-within:border-[#1677FF]">
                        <input
                          type="number"
                          value={formData.fasting_glucose}
                          onChange={(e) => handleInputChange('fasting_glucose', parseFloat(e.target.value) || 98)}
                          className="w-full h-11 px-3.5 text-sm text-[#172033] focus:outline-none"
                        />
                        <span className="bg-[#F7F9FC] border-l border-[#E6EAF0] px-3 flex items-center text-xs text-[#667085] shrink-0">
                          mg/dL
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                        Current Blood Pressure
                      </label>
                      <div className="flex gap-2">
                        <div className="flex flex-1 rounded-xl border border-[#E6EAF0] overflow-hidden focus-within:border-[#1677FF]">
                          <input
                            type="number"
                            value={formData.systolic_bp}
                            onChange={(e) => handleInputChange('systolic_bp', parseInt(e.target.value) || 120)}
                            className="w-full h-11 px-3 text-sm text-[#172033] focus:outline-none"
                            placeholder="Sys"
                          />
                          <span className="bg-[#F7F9FC] border-l border-[#E6EAF0] px-2 flex items-center text-[10px] text-[#667085] shrink-0">
                            Sys
                          </span>
                        </div>
                        <div className="flex flex-1 rounded-xl border border-[#E6EAF0] overflow-hidden focus-within:border-[#1677FF]">
                          <input
                            type="number"
                            value={formData.diastolic_bp}
                            onChange={(e) => handleInputChange('diastolic_bp', parseInt(e.target.value) || 80)}
                            className="w-full h-11 px-3 text-sm text-[#172033] focus:outline-none"
                            placeholder="Dia"
                          />
                          <span className="bg-[#F7F9FC] border-l border-[#E6EAF0] px-2 flex items-center text-[10px] text-[#667085] shrink-0">
                            Dia
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                        Current Resting Heart Rate
                      </label>
                      <div className="flex rounded-xl border border-[#E6EAF0] overflow-hidden focus-within:border-[#1677FF]">
                        <input
                          type="number"
                          value={formData.heart_rate}
                          onChange={(e) => handleInputChange('heart_rate', parseInt(e.target.value) || 72)}
                          className="w-full h-11 px-3.5 text-sm text-[#172033] focus:outline-none"
                        />
                        <span className="bg-[#F7F9FC] border-l border-[#E6EAF0] px-3 flex items-center text-xs text-[#667085] shrink-0">
                          BPM
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                        Current Weight
                      </label>
                      <div className="flex rounded-xl border border-[#E6EAF0] overflow-hidden focus-within:border-[#1677FF]">
                        <input
                          type="number"
                          step="0.1"
                          value={formData.weight_kg}
                          onChange={(e) => handleInputChange('weight_kg', parseFloat(e.target.value) || 75)}
                          className="w-full h-11 px-3.5 text-sm text-[#172033] focus:outline-none"
                        />
                        <span className="bg-[#F7F9FC] border-l border-[#E6EAF0] px-3 flex items-center text-xs text-[#667085] shrink-0">
                          kg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Symptom Step 3: Review & Automated Analysis */}
            {currentStep === 3 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Review & Execute AI Early Risk Analysis</h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Review your reported symptoms. HealthAI will compare them with previous records to evaluate symptom progression and risk shifts.
                  </p>
                </div>

                <div className="bg-[#F7F9FC] border border-[#E6EAF0] rounded-xl p-5 space-y-4 text-xs">
                  <div>
                    <span className="text-[#667085] block font-medium mb-1.5">Current Reported Symptoms</span>
                    {formData.symptoms.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {formData.symptoms.map((s) => (
                          <span
                            key={s}
                            className="bg-white border border-[#E6EAF0] text-[#172033] px-2.5 py-1 rounded-lg font-semibold shadow-2xs"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#667085] italic">No acute symptoms reported</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#E6EAF0]">
                    <div>
                      <span className="text-[#667085] block font-medium">Duration</span>
                      <span className="text-[#172033] font-bold capitalize">{formData.duration}</span>
                    </div>
                    <div>
                      <span className="text-[#667085] block font-medium">Severity</span>
                      <span className="text-[#172033] font-bold capitalize">{formData.severity}</span>
                    </div>
                    <div>
                      <span className="text-[#667085] block font-medium">Onset</span>
                      <span className="text-[#172033] font-bold capitalize">{formData.onset}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E6EAF0] bg-blue-50/70 p-3 rounded-lg flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#1677FF] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#172033] leading-relaxed">
                      <strong>Longitudinal Symptom Tracking:</strong> HealthAI will compare these symptoms with your last screening, classifying them into <em>Newly Reported</em>, <em>Continuing</em>, or <em>Resolved</em>, and detect emerging multi-system patterns.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========================================================
            DISEASE SCREENING FLOW (5 STEPS)
           ======================================================== */}
        {!isSymptomScreening && (
          <>
            {/* STEP 1: PERSONAL INFORMATION */}
            {currentStep === 1 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Personal Information</h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Standard demographic and anthropometric parameters used for baseline risk calibration.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Age (years)
                    </label>
                    <div className="flex rounded-xl border border-[#E6EAF0] overflow-hidden focus-within:border-[#1677FF]">
                      <input
                        type="number"
                        min="18"
                        max="120"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 18)}
                        className="w-full h-11 px-3.5 text-sm text-[#172033] focus:outline-none"
                        required
                      />
                      <span className="bg-[#F7F9FC] border-l border-[#E6EAF0] px-3.5 flex items-center text-xs text-[#667085] font-medium shrink-0">
                        years
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Biological Sex
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E6EAF0] text-sm bg-white text-[#172033] focus:outline-none focus:border-[#1677FF]"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Prefer not to specify</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Height (cm)
                    </label>
                    <div className="flex rounded-xl border border-[#E6EAF0] overflow-hidden focus-within:border-[#1677FF]">
                      <input
                        type="number"
                        min="100"
                        max="250"
                        value={formData.height_cm}
                        onChange={(e) => handleInputChange('height_cm', parseFloat(e.target.value) || 170)}
                        className="w-full h-11 px-3.5 text-sm text-[#172033] focus:outline-none"
                        placeholder="175"
                      />
                      <span className="bg-[#F7F9FC] border-l border-[#E6EAF0] px-3.5 flex items-center text-xs text-[#667085] font-medium shrink-0">
                        cm
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Current Weight (kg)
                    </label>
                    <div className="flex rounded-xl border border-[#E6EAF0] overflow-hidden focus-within:border-[#1677FF]">
                      <input
                        type="number"
                        min="30"
                        max="300"
                        step="0.1"
                        value={formData.weight_kg}
                        onChange={(e) => handleInputChange('weight_kg', parseFloat(e.target.value) || 70)}
                        className="w-full h-11 px-3.5 text-sm text-[#172033] focus:outline-none"
                        placeholder="77.5"
                      />
                      <span className="bg-[#F7F9FC] border-l border-[#E6EAF0] px-3.5 flex items-center text-xs text-[#667085] font-medium shrink-0">
                        kg
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live BMI Card */}
                <div className="p-4 bg-[#F7F9FC] border border-[#E6EAF0] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">
                      Current Calculated Body Mass Index (BMI)
                    </span>
                    <span className="text-[11px] text-[#667085]">
                      Computed dynamically from your current height and weight.
                    </span>
                  </div>
                  <div className="px-3.5 py-1.5 bg-white border border-[#E6EAF0] rounded-lg text-sm font-bold text-[#1677FF] shadow-2xs">
                    {calculatedBmi} kg/m²
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: CURRENT HEALTH MEASUREMENTS */}
            {currentStep === 2 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#172033]">Current Health Measurements</h3>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Enter your current health information. HealthAI will automatically compare this entry with your previous records from the database.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Fasting Glucose */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Current Blood Glucose (Fasting)
                    </label>
                    <div className="flex rounded-xl border border-[#E6EAF0] overflow-hidden focus-within:border-[#1677FF]">
                      <input
                        type="number"
                        min="50"
                        max="450"
                        value={formData.fasting_glucose}
                        onChange={(e) => handleInputChange('fasting_glucose', parseFloat(e.target.value) || 95)}
                        className="w-full h-11 px-3.5 text-sm text-[#172033] focus:outline-none"
                        placeholder="98"
                      />
                      <span className="bg-[#F7F9FC] border-l border-[#E6EAF0] px-3.5 flex items-center text-xs text-[#667085] font-medium shrink-0">
                        mg/dL
                      </span>
                    </div>
                    <span className="text-[10px] text-[#667085] mt-1 block">Normal fasting: 70–99 mg/dL</span>
                  </div>

                  {/* Systolic BP */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Current Systolic Blood Pressure
                    </label>
                    <div className="flex rounded-xl border border-[#E6EAF0] overflow-hidden focus-within:border-[#1677FF]">
                      <input
                        type="number"
                        min="80"
                        max="240"
                        value={formData.systolic_bp}
                        onChange={(e) => handleInputChange('systolic_bp', parseInt(e.target.value) || 120)}
                        className="w-full h-11 px-3.5 text-sm text-[#172033] focus:outline-none"
                        placeholder="122"
                      />
                      <span className="bg-[#F7F9FC] border-l border-[#E6EAF0] px-3.5 flex items-center text-xs text-[#667085] font-medium shrink-0">
                        mmHg
                      </span>
                    </div>
                    <span className="text-[10px] text-[#667085] mt-1 block">Upper blood pressure reading</span>
                  </div>

                  {/* Diastolic BP */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Current Diastolic Blood Pressure
                    </label>
                    <div className="flex rounded-xl border border-[#E6EAF0] overflow-hidden focus-within:border-[#1677FF]">
                      <input
                        type="number"
                        min="50"
                        max="160"
                        value={formData.diastolic_bp}
                        onChange={(e) => handleInputChange('diastolic_bp', parseInt(e.target.value) || 80)}
                        className="w-full h-11 px-3.5 text-sm text-[#172033] focus:outline-none"
                        placeholder="80"
                      />
                      <span className="bg-[#F7F9FC] border-l border-[#E6EAF0] px-3.5 flex items-center text-xs text-[#667085] font-medium shrink-0">
                        mmHg
                      </span>
                    </div>
                    <span className="text-[10px] text-[#667085] mt-1 block">Lower blood pressure reading</span>
                  </div>

                  {/* Total Cholesterol */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Current Total Cholesterol
                    </label>
                    <div className="flex rounded-xl border border-[#E6EAF0] overflow-hidden focus-within:border-[#1677FF]">
                      <input
                        type="number"
                        min="100"
                        max="450"
                        value={formData.cholesterol}
                        onChange={(e) => handleInputChange('cholesterol', parseInt(e.target.value) || 190)}
                        className="w-full h-11 px-3.5 text-sm text-[#172033] focus:outline-none"
                        placeholder="188"
                      />
                      <span className="bg-[#F7F9FC] border-l border-[#E6EAF0] px-3.5 flex items-center text-xs text-[#667085] font-medium shrink-0">
                        mg/dL
                      </span>
                    </div>
                    <span className="text-[10px] text-[#667085] mt-1 block">Desirable range: &lt;200 mg/dL</span>
                  </div>

                  {/* Resting Heart Rate */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Current Resting Heart Rate
                    </label>
                    <div className="flex rounded-xl border border-[#E6EAF0] overflow-hidden focus-within:border-[#1677FF]">
                      <input
                        type="number"
                        min="40"
                        max="180"
                        value={formData.heart_rate}
                        onChange={(e) => handleInputChange('heart_rate', parseInt(e.target.value) || 72)}
                        className="w-full h-11 px-3.5 text-sm text-[#172033] focus:outline-none"
                        placeholder="72"
                      />
                      <span className="bg-[#F7F9FC] border-l border-[#E6EAF0] px-3.5 flex items-center text-xs text-[#667085] font-medium shrink-0">
                        BPM
                      </span>
                    </div>
                    <span className="text-[10px] text-[#667085] mt-1 block">Typical resting: 60–100 BPM</span>
                  </div>

                  {/* Body Mass Index */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Current Body Mass Index
                    </label>
                    <div className="flex rounded-xl border border-[#E6EAF0] overflow-hidden bg-[#F7F9FC]">
                      <input
                        type="text"
                        disabled
                        value={calculatedBmi}
                        className="w-full h-11 px-3.5 text-sm text-[#172033] font-bold bg-[#F7F9FC] cursor-not-allowed"
                      />
                      <span className="bg-white border-l border-[#E6EAF0] px-3.5 flex items-center text-xs text-[#1677FF] font-bold shrink-0">
                        kg/m²
                      </span>
                    </div>
                    <span className="text-[10px] text-[#16A34A] mt-1 block font-semibold">● Normal range (18.5–24.9)</span>
                  </div>

                  {/* Chest Discomfort Level (Cardiovascular Specific) */}
                  {screeningType === 'cardiovascular' && (
                    <div className="sm:col-span-2 p-4 bg-amber-50/50 border border-amber-200/70 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#172033]">
                          Chest Discomfort / Exertional Sensation
                        </label>
                        <span className="text-[10px] text-[#F59E0B] font-semibold bg-amber-100/70 px-2 py-0.5 rounded-full">
                          Cardiovascular Risk Indicator
                        </span>
                      </div>
                      <select
                        value={formData.chest_discomfort_level}
                        onChange={(e) => handleInputChange('chest_discomfort_level', parseInt(e.target.value) || 0)}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#E6EAF0] text-sm bg-white text-[#172033] focus:outline-none focus:border-[#1677FF]"
                      >
                        <option value={0}>0 — None (No chest discomfort or tightness)</option>
                        <option value={1}>1 — Mild (Occasional slight tightness with heavy exertion)</option>
                        <option value={2}>2 — Moderate (Noticeable discomfort or pressure during exercise)</option>
                        <option value={3}>3 — Atypical / Exertional (Frequent or atypical pressure requiring rest)</option>
                      </select>
                      <p className="text-[11px] text-[#667085]">
                        Used by the Framingham-derived cardiovascular model to estimate ischemic vascular risk weighting.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: CURRENT SYMPTOMS */}
            {currentStep === 3 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Current Symptoms</h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Select any symptoms you are experiencing recently. HealthAI will compare these with earlier entries.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleNoneOfThese}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      formData.noneOfThese
                        ? 'bg-[#1677FF] text-white border-[#1677FF] shadow-xs'
                        : 'bg-white text-[#667085] border-[#E6EAF0] hover:bg-slate-50'
                    }`}
                  >
                    No symptoms / Feeling healthy
                  </button>

                  {COMMON_SYMPTOMS.map((sym) => {
                    const isSelected = formData.symptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => toggleSymptom(sym)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-blue-50 text-[#1677FF] border-[#1677FF] shadow-2xs'
                            : 'bg-white text-[#667085] border-[#E6EAF0] hover:bg-slate-50'
                        }`}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </div>

                {/* Other symptom entry */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={formData.otherSymptomText}
                    onChange={(e) => handleInputChange('otherSymptomText', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOtherSymptom())}
                    placeholder="Other symptom (type and press Add)..."
                    className="flex-1 h-10 px-3.5 rounded-xl border border-[#E6EAF0] text-xs focus:outline-none focus:border-[#1677FF]"
                  />
                  <button
                    type="button"
                    onClick={handleAddOtherSymptom}
                    className="px-4 h-10 bg-white border border-[#E6EAF0] text-[#172033] hover:bg-slate-50 text-xs font-semibold rounded-xl"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: LIFESTYLE & MEDICAL HISTORY */}
            {currentStep === 4 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Lifestyle & Medical History</h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Habits and genetic factors used for multi-variable risk weighting.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Weekly Physical Activity (Hours)
                    </label>
                    <div className="flex rounded-xl border border-[#E6EAF0] overflow-hidden focus-within:border-[#1677FF]">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="40"
                        value={formData.physical_activity_hours}
                        onChange={(e) => handleInputChange('physical_activity_hours', parseFloat(e.target.value) || 0)}
                        className="w-full h-11 px-3.5 text-sm text-[#172033] focus:outline-none"
                      />
                      <span className="bg-[#F7F9FC] border-l border-[#E6EAF0] px-3.5 flex items-center text-xs text-[#667085] font-medium shrink-0">
                        hrs/week
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Smoking Status
                    </label>
                    <select
                      value={formData.smoking_status}
                      onChange={(e) => handleInputChange('smoking_status', e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E6EAF0] text-sm bg-white text-[#172033] focus:outline-none focus:border-[#1677FF]"
                    >
                      <option value="never">Never smoked</option>
                      <option value="former">Former smoker</option>
                      <option value="current">Current smoker</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Family History of Disease
                    </label>
                    <select
                      value={formData.family_history ? 'yes' : 'no'}
                      onChange={(e) => handleInputChange('family_history', e.target.value === 'yes')}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E6EAF0] text-sm bg-white text-[#172033] focus:outline-none focus:border-[#1677FF]"
                    >
                      <option value="no">No immediate family history</option>
                      <option value="yes">Immediate family history (parents/siblings)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Alcohol Consumption
                    </label>
                    <select
                      value={formData.alcohol_consumption}
                      onChange={(e) => handleInputChange('alcohol_consumption', e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E6EAF0] text-sm bg-white text-[#172033] focus:outline-none focus:border-[#1677FF]"
                    >
                      <option value="none">None / Non-drinker</option>
                      <option value="light">Light (1-3 drinks / week)</option>
                      <option value="moderate">Moderate (4-7 drinks / week)</option>
                      <option value="heavy">Heavy (8+ drinks / week)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Dietary Sodium Intake
                    </label>
                    <select
                      value={formData.sodium_intake}
                      onChange={(e) => handleInputChange('sodium_intake', e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E6EAF0] text-sm bg-white text-[#172033] focus:outline-none focus:border-[#1677FF]"
                    >
                      <option value="low">Low (Minimal added salt / whole foods)</option>
                      <option value="moderate">Moderate (Standard seasoning)</option>
                      <option value="high">High (Frequent processed / high-sodium foods)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW & AI PREDICTION */}
            {currentStep === 5 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Review & Execute AI Inference</h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Verify your current parameters. HealthAI will automatically retrieve earlier baseline records to compute changes.
                  </p>
                </div>

                <div className="bg-[#F7F9FC] border border-[#E6EAF0] rounded-xl p-5 space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[#667085] block font-medium">Demographics</span>
                      <span className="text-[#172033] font-bold">{formData.age} yrs • {formData.gender}</span>
                    </div>
                    <div>
                      <span className="text-[#667085] block font-medium">Current BMI</span>
                      <span className="text-[#172033] font-bold">{calculatedBmi} kg/m²</span>
                    </div>
                    <div>
                      <span className="text-[#667085] block font-medium">Current Fasting Glucose</span>
                      <span className="text-[#172033] font-bold">{formData.fasting_glucose} mg/dL</span>
                    </div>
                    <div>
                      <span className="text-[#667085] block font-medium">Current Blood Pressure</span>
                      <span className="text-[#172033] font-bold">{formData.systolic_bp}/{formData.diastolic_bp} mmHg</span>
                    </div>
                    <div>
                      <span className="text-[#667085] block font-medium">Current Total Cholesterol</span>
                      <span className="text-[#172033] font-bold">{formData.cholesterol} mg/dL</span>
                    </div>
                    <div>
                      <span className="text-[#667085] block font-medium">Current Heart Rate</span>
                      <span className="text-[#172033] font-bold">{formData.heart_rate} BPM</span>
                    </div>
                    {screeningType === 'cardiovascular' && (
                      <div>
                        <span className="text-[#667085] block font-medium">Chest Discomfort</span>
                        <span className="text-[#172033] font-bold">
                          {formData.chest_discomfort_level === 0
                            ? '0 — None'
                            : formData.chest_discomfort_level === 1
                            ? '1 — Mild'
                            : formData.chest_discomfort_level === 2
                            ? '2 — Moderate'
                            : '3 — Atypical/Exertional'}
                        </span>
                      </div>
                    )}
                    {screeningType === 'hypertension' && (
                      <div>
                        <span className="text-[#667085] block font-medium">Dietary Sodium</span>
                        <span className="text-[#172033] font-bold capitalize">
                          {formData.sodium_intake} Intake
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#E6EAF0] bg-blue-50/70 p-3 rounded-lg flex items-start gap-2 text-[11px] text-[#172033]">
                    <Sparkles className="w-4 h-4 text-[#1677FF] shrink-0 mt-0.5" />
                    <span>
                      <strong>Automated Historical Comparison:</strong> Upon clicking Calculate AI Risk, HealthAI will retrieve your most recent previous screening to compare each biomarker, calculate points changes, identify trends, and explain what changed.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div className="p-6 border-t border-[#E6EAF0] bg-white flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E6EAF0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#172033] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-[#E6EAF0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#667085] transition-colors"
          >
            Cancel
          </button>
        )}

        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.min(prev + 1, totalSteps))}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1677FF] hover:bg-[#1366DB] text-xs font-bold text-white shadow-xs transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFormSubmit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1677FF] hover:bg-[#1366DB] text-xs font-bold text-white shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Calculate AI Risk</span>
          </button>
        )}
      </div>
    </div>
  );
};
