import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  HeartPulse,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';
import { PrivacyPolicyPage } from './PrivacyPolicyPage';
import { TermsPage } from './TermsPage';

interface RegisterPageProps {
  onGoToLogin: () => void;
  onBackToHome: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onGoToLogin, onBackToHome }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState('female');
  const [heightCm, setHeightCm] = useState<number>(168);
  const [weightKg, setWeightKg] = useState<number>(65);
  const [termsConsented, setTermsConsented] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Policy modal state
  const [policyModal, setPolicyModal] = useState<'privacy' | 'terms' | null>(null);

  // Password validation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (!termsConsented) {
      setError('You must review and consent to the Privacy Policy and Terms and Conditions to create an account.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        age: Number(age),
        gender,
        height_cm: Number(heightCm),
        weight_kg: Number(weightKg),
        terms_consented: true,
      });
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] flex flex-col justify-center items-center p-4 py-10">
      {/* Back to landing */}
      <button
        onClick={onBackToHome}
        className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172B3A] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to HealthAI Home
      </button>

      <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-md shadow-sm p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-md bg-[#0F766E] flex items-center justify-center text-white mx-auto">
            <HeartPulse className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#172B3A]">Create HealthAI Account</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Begin personal health risk assessments and longitudinal biomarker tracking.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs text-[#B91C1C]">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[#172B3A] mb-1">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Himanshu Sharma"
                required
                className="w-full h-9 pl-9 pr-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-[#172B3A] mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full h-9 pl-9 pr-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 chars"
                  required
                  minLength={8}
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  minLength={8}
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>
          </div>

          {/* Password Validation Indicators */}
          <div className="flex items-center gap-4 text-[11px] text-[#64748B]">
            <span className={`flex items-center gap-1 ${hasMinLength ? 'text-teal-700 font-semibold' : ''}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-teal-600' : 'bg-slate-300'}`} />
              8+ Characters
            </span>
            <span className={`flex items-center gap-1 ${hasNumber ? 'text-teal-700 font-semibold' : ''}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-teal-600' : 'bg-slate-300'}`} />
              Includes Number
            </span>
            <span className={`flex items-center gap-1 ${passwordsMatch ? 'text-teal-700 font-semibold' : ''}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? 'bg-teal-600' : 'bg-slate-300'}`} />
              Passwords Match
            </span>
          </div>

          {/* Baseline Biometrics (Optional initial setup) */}
          <div className="p-3 rounded-md border border-[#E2E8F0] bg-[#F7F9FA] space-y-2">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Baseline Demographics (Optional)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] text-[#64748B] mb-0.5">Age</label>
                <input
                  type="number"
                  min={18}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full h-8 px-2 rounded-md border border-[#E2E8F0] text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#64748B] mb-0.5">Sex</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-8 px-2 rounded-md border border-[#E2E8F0] text-xs bg-white"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#64748B] mb-0.5">Height (cm)</label>
                <input
                  type="number"
                  min={50}
                  max={250}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full h-8 px-2 rounded-md border border-[#E2E8F0] text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#64748B] mb-0.5">Weight (kg)</label>
                <input
                  type="number"
                  min={20}
                  max={300}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full h-8 px-2 rounded-md border border-[#E2E8F0] text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Mandatory Consent Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 p-3 rounded-md border border-[#E2E8F0] bg-white cursor-pointer hover:bg-[#F7F9FA]">
              <input
                type="checkbox"
                checked={termsConsented}
                onChange={(e) => setTermsConsented(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-[#0F766E] border-slate-300 rounded focus:ring-0 shrink-0"
              />
              <span className="text-xs text-[#172B3A] leading-relaxed">
                I have read and consent to the{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPolicyModal('privacy');
                  }}
                  className="font-semibold text-[#0F766E] underline underline-offset-2 hover:text-[#0D655E]"
                >
                  Privacy Policy
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPolicyModal('terms');
                  }}
                  className="font-semibold text-[#0F766E] underline underline-offset-2 hover:text-[#0D655E]"
                >
                  Terms and Conditions
                </button>
                , acknowledging that HealthAI provides educational risk assessments and not clinical medical diagnoses.
                <span className="text-red-500 font-semibold ml-1">*</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 rounded-md text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : 'Agree and Create Account'}
          </button>
        </form>

        <div className="text-center text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onGoToLogin}
            className="font-semibold text-[#0F766E] hover:underline"
          >
            Sign In
          </button>
        </div>
      </div>

      {/* In-Register Policy Modals */}
      {policyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white w-full max-w-3xl rounded-md border border-[#E2E8F0] shadow-xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F7F9FA]">
              <span className="text-xs font-bold text-[#172B3A]">
                {policyModal === 'privacy' ? 'Privacy Policy' : 'Terms and Conditions'}
              </span>
              <button
                onClick={() => setPolicyModal(null)}
                className="p-1 text-[#64748B] hover:text-[#172B3A] rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {policyModal === 'privacy' ? (
                <PrivacyPolicyPage />
              ) : (
                <TermsPage />
              )}
            </div>
            <div className="p-3 border-t border-[#E2E8F0] flex justify-end bg-[#F7F9FA]">
              <button
                onClick={() => {
                  setTermsConsented(true);
                  setPolicyModal(null);
                }}
                className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E]"
              >
                Accept and Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
