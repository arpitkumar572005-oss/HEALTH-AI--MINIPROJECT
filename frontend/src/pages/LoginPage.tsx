import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  HeartPulse,
  Lock,
  Mail,
  AlertCircle,
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  X,
  KeyRound,
} from 'lucide-react';

interface LoginPageProps {
  onGoToRegister: () => void;
  onBackToHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onGoToRegister, onBackToHome }) => {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Demo Personas
  const demoPersonas = [
    { key: 'himanshu', name: 'Himanshu Sharma', desc: 'Default Demo Patient' },
    { key: 'priya', name: 'Priya Verma', desc: 'Demo Profile' },
    { key: 'rahul', name: 'Rahul Singh', desc: 'Demo Profile' },
    { key: 'ananya', name: 'Ananya Gupta', desc: 'Demo Profile' },
    { key: 'neha', name: 'Neha Mishra', desc: 'Demo Profile' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (personaKey: string) => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(personaKey);
    } catch (err: any) {
      setError(err?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    if (!forgotEmail) {
      setForgotError('Please enter your account email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail);
      setForgotSuccess(res.message || 'Password reset instructions have been generated.');
    } catch (err: any) {
      setForgotError(err?.message || 'Unable to process password reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] flex flex-col justify-center items-center p-4">
      {/* Back to Landing */}
      <button
        onClick={onBackToHome}
        className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172B3A] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to HealthAI Home
      </button>

      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-md shadow-sm p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-md bg-[#0F766E] flex items-center justify-center text-white mx-auto">
            <HeartPulse className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#172B3A]">Sign In to HealthAI</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Access your personalized health screenings and assessment history.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs text-[#B91C1C]">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B3A] mb-1">
              Email Address
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#172B3A]">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
                className="text-[11px] font-semibold text-[#0F766E] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full h-9 pl-9 pr-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 rounded-md text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Personas Quick Access */}
        <div className="pt-4 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Demonstration Access
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              Demo Data
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {demoPersonas.slice(0, 3).map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handleDemoSignIn(p.key)}
                className="w-full flex items-center justify-between p-2 rounded-md border border-[#E2E8F0] bg-[#F7F9FA] hover:bg-teal-50 hover:border-teal-200 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span className="text-xs font-semibold text-[#172B3A]">{p.name}</span>
                </div>
                <span className="text-[10px] text-[#64748B]">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Link to Registration */}
        <div className="text-center text-xs text-[#64748B] pt-2">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onGoToRegister}
            className="font-semibold text-[#0F766E] hover:underline"
          >
            Create an Account
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white w-full max-w-md rounded-md border border-[#E2E8F0] shadow-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#0F766E]" />
                <h3 className="text-sm font-bold text-[#172B3A]">Password Reset Request</h3>
              </div>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess(null);
                  setForgotError(null);
                }}
                className="p-1 text-[#64748B] hover:text-[#172B3A] rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Enter your registered email address. For prototype demonstration, a reset token or recovery link will be securely authorized.
            </p>

            {forgotSuccess && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-md text-xs text-[#0F766E] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Request Processed</span>
                </div>
                <p className="text-[11px] text-[#64748B]">{forgotSuccess}</p>
              </div>
            )}

            {forgotError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-[#B91C1C]">
                {forgotError}
              </div>
            )}

            {!forgotSuccess && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full h-9 px-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-[#64748B] bg-slate-100 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-50"
                  >
                    {forgotLoading ? 'Submitting...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}

            {forgotSuccess && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E]"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
