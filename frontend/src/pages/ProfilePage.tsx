import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PatientProfile } from '../types';
import {
  User,
  Save,
  CheckCircle2,
  AlertCircle,
  Activity,
  Heart,
  Scale,
  Ruler,
  Calendar,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields - standard metric units
  const [fullName, setFullName] = useState<string>('');
  const [age, setAge] = useState<number>(45);
  const [gender, setGender] = useState<string>('male');
  const [heightCm, setHeightCm] = useState<number>(172);
  const [weightKg, setWeightKg] = useState<number>(74.0);
  const [smoking, setSmoking] = useState<string>('never');
  const [alcohol, setAlcohol] = useState<string>('none');
  const [activityHours, setActivityHours] = useState<number>(3.0);
  const [famDiabetes, setFamDiabetes] = useState<boolean>(false);
  const [famHtn, setFamHtn] = useState<boolean>(false);
  const [famCardio, setFamCardio] = useState<boolean>(false);
  const [existingConditions, setExistingConditions] = useState<string>('');

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const data = await api.getProfile();
        setFullName(data.full_name || user?.full_name || 'Himanshu Sharma');
        setAge(data.age || 45);
        setGender(data.gender || 'male');
        setHeightCm(data.height_cm || 172);
        setWeightKg(data.weight_kg || 74.0);
        setSmoking(data.smoking_status || 'never');
        setAlcohol(data.alcohol_consumption || 'none');
        setActivityHours(data.physical_activity_hours || 3.0);
        setFamDiabetes(data.family_history_diabetes ?? false);
        setFamHtn(data.family_history_hypertension ?? false);
        setFamCardio(data.family_history_cardiovascular ?? false);
        setExistingConditions(data.existing_conditions || '');
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  // Compute BMI dynamically in metric units: kg / (m^2)
  const calculateBmi = () => {
    if (!heightCm || !weightKg || heightCm <= 0) return 0;
    const heightM = heightCm / 100;
    const bmiVal = weightKg / (heightM * heightM);
    return Math.round(bmiVal * 10) / 10;
  };

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (bmi < 25) return { label: 'Normal weight', color: 'text-teal-700 bg-teal-50 border-teal-200' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Obesity classification', color: 'text-red-700 bg-red-50 border-red-200' };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setToastMsg(null);

    try {
      await api.updateProfile({
        full_name: fullName,
        age: Number(age),
        gender,
        height_cm: Number(heightCm),
        weight_kg: Number(weightKg),
        smoking_status: smoking,
        alcohol_consumption: alcohol,
        physical_activity_hours: Number(activityHours),
        family_history_diabetes: famDiabetes,
        family_history_hypertension: famHtn,
        family_history_cardiovascular: famCardio,
        existing_conditions: existingConditions,
      });
      await refreshUser();
      setToastMsg('Your baseline health profile has been successfully updated.');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const bmi = calculateBmi();
  const bmiInfo = getBmiCategory(bmi);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-md border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-[#0F766E] border border-teal-200">
              Personal Health Baseline
            </span>
            <span className="text-xs text-[#64748B]">Metric Standard (kg, cm, mmHg)</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#172B3A]">My Health Profile</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Maintain your verified biometric measurements and background health history for accurate risk screenings.
          </p>
        </div>

        {/* Dynamic BMI Summary */}
        <div className="flex items-center gap-3 p-2.5 rounded-md border border-[#E2E8F0] bg-[#F7F9FA]">
          <Scale className="w-4 h-4 text-[#0F766E]" />
          <div>
            <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">
              Calculated BMI
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#172B3A]">{bmi} kg/m²</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${bmiInfo.color}`}>
                {bmiInfo.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-md flex items-center gap-2 text-xs text-[#0F766E]">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0F766E]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs text-[#B91C1C]">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-white rounded-md border border-[#E2E8F0]">
          <div className="w-7 h-7 border-2 border-teal-200 border-t-[#0F766E] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#64748B]">Loading your profile data...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Identity & Demographics */}
          <div className="bg-white p-6 rounded-md border border-[#E2E8F0] space-y-4">
            <h2 className="text-sm font-bold text-[#172B3A] pb-2 border-b border-[#E2E8F0] flex items-center gap-2">
              <User className="w-4 h-4 text-[#0F766E]" />
              <span>Identity and Demographics</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
                />
              </div>

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
                  className="w-full h-9 px-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Biological Sex
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Metric Biometrics */}
          <div className="bg-white p-6 rounded-md border border-[#E2E8F0] space-y-4">
            <h2 className="text-sm font-bold text-[#172B3A] pb-2 border-b border-[#E2E8F0] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0F766E]" />
              <span>Biometric Measurements (Metric)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                  <span>Height</span>
                  <span className="text-[11px] text-[#64748B] font-normal">centimeters (cm)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min={50}
                    max={250}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    required
                    className="w-full h-9 pl-3 pr-10 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-[#64748B]">cm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1 flex items-center justify-between">
                  <span>Weight</span>
                  <span className="text-[11px] text-[#64748B] font-normal">kilograms (kg)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min={20}
                    max={300}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    required
                    className="w-full h-9 pl-3 pr-10 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-[#64748B]">kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lifestyle Variables */}
          <div className="bg-white p-6 rounded-md border border-[#E2E8F0] space-y-4">
            <h2 className="text-sm font-bold text-[#172B3A] pb-2 border-b border-[#E2E8F0] flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#0F766E]" />
              <span>Lifestyle and Behavioral Factors</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Smoking Status
                </label>
                <select
                  value={smoking}
                  onChange={(e) => setSmoking(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="never">Never smoked</option>
                  <option value="former">Former smoker</option>
                  <option value="current">Current smoker</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Alcohol Consumption
                </label>
                <select
                  value={alcohol}
                  onChange={(e) => setAlcohol(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="none">None / Non-drinker</option>
                  <option value="moderate">Moderate intake</option>
                  <option value="heavy">Frequent / Heavy intake</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Physical Activity (hours/week)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  max={40}
                  value={activityHours}
                  onChange={(e) => setActivityHours(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>
          </div>

          {/* Family Health History */}
          <div className="bg-white p-6 rounded-md border border-[#E2E8F0] space-y-4">
            <h2 className="text-sm font-bold text-[#172B3A] pb-2 border-b border-[#E2E8F0]">
              Family Medical History
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-md border border-[#E2E8F0] bg-[#F7F9FA] cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={famDiabetes}
                  onChange={(e) => setFamDiabetes(e.target.checked)}
                  className="w-4 h-4 text-[#0F766E] border-slate-300 rounded focus:ring-0"
                />
                <span className="text-xs font-medium text-[#172B3A]">Family Diabetes History</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-md border border-[#E2E8F0] bg-[#F7F9FA] cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={famHtn}
                  onChange={(e) => setFamHtn(e.target.checked)}
                  className="w-4 h-4 text-[#0F766E] border-slate-300 rounded focus:ring-0"
                />
                <span className="text-xs font-medium text-[#172B3A]">Family Hypertension History</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-md border border-[#E2E8F0] bg-[#F7F9FA] cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={famCardio}
                  onChange={(e) => setFamCardio(e.target.checked)}
                  className="w-4 h-4 text-[#0F766E] border-slate-300 rounded focus:ring-0"
                />
                <span className="text-xs font-medium text-[#172B3A]">Family Heart Disease History</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                Existing Conditions or Notes
              </label>
              <textarea
                rows={2}
                value={existingConditions}
                onChange={(e) => setExistingConditions(e.target.value)}
                placeholder="e.g. Mild seasonal allergies, occasional reflux"
                className="w-full p-2.5 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Profile...' : 'Save Health Profile'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
