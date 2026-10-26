import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Settings,
  Lock,
  Shield,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Globe,
  KeyRound,
  X,
  UserCheck,
} from 'lucide-react';

interface SettingsPageProps {
  onNavigateTab?: (tab: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigateTab }) => {
  const { user, logout } = useAuth();

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Deletion Modals State
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [deleteDataLoading, setDeleteDataLoading] = useState(false);
  const [deleteDataSuccess, setDeleteDataSuccess] = useState<string | null>(null);
  const [deleteDataError, setDeleteDataError] = useState<string | null>(null);

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [confirmEmailInput, setConfirmEmailInput] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password. Please verify current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAllHealthData = async () => {
    setDeleteDataLoading(true);
    setDeleteDataError(null);
    try {
      const res = await api.deleteAllHealthData();
      setShowDeleteDataModal(false);
      setDeleteDataSuccess(
        `Successfully removed ${res.screenings_removed} health assessments and ${res.measurements_removed} measurement records.`
      );
      setTimeout(() => setDeleteDataSuccess(null), 5000);
    } catch (err: any) {
      setDeleteDataError(err?.message || 'Failed to delete health data.');
    } finally {
      setDeleteDataLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmEmailInput.trim().toLowerCase() !== user?.email.trim().toLowerCase()) {
      setDeleteAccountError('The entered email address does not match your account.');
      return;
    }

    setDeleteAccountLoading(true);
    setDeleteAccountError(null);
    try {
      await api.deleteAccount();
      setShowDeleteAccountModal(false);
      logout();
    } catch (err: any) {
      setDeleteAccountError(err?.message || 'Failed to delete account. Please try again.');
      setDeleteAccountLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-md border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-[#0F766E] border border-teal-200">
              Account Control
            </span>
            <span className="text-xs text-[#64748B]">Security and Privacy Preferences</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#172B3A]">Settings</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage your credentials, clinical localization preferences, and health data retention options.
          </p>
        </div>
      </div>

      {deleteDataSuccess && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-md flex items-center gap-2 text-xs text-[#0F766E]">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0F766E]" />
          <span>{deleteDataSuccess}</span>
        </div>
      )}

      {/* 1. Account Information */}
      <div className="bg-white p-6 rounded-md border border-[#E2E8F0] space-y-4">
        <h2 className="text-sm font-bold text-[#172B3A] pb-2 border-b border-[#E2E8F0] flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#0F766E]" />
          <span>Account Overview</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-[#F7F9FA] rounded-md border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-semibold">
              Authenticated User
            </span>
            <span className="text-sm font-bold text-[#172B3A] mt-0.5 block">
              {user?.full_name || 'Himanshu Sharma'}
            </span>
          </div>

          <div className="p-3 bg-[#F7F9FA] rounded-md border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-semibold">
              Email Address
            </span>
            <span className="text-xs font-semibold text-[#172B3A] mt-0.5 block truncate">
              {user?.email || 'user@healthai.local'}
            </span>
          </div>

          <div className="p-3 bg-[#F7F9FA] rounded-md border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-semibold">
              Account Status
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-800">Active Patient Account</span>
              {user?.is_demo && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Demo
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Security and Password Change */}
      <div className="bg-white p-6 rounded-md border border-[#E2E8F0] space-y-4">
        <h2 className="text-sm font-bold text-[#172B3A] pb-2 border-b border-[#E2E8F0] flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#0F766E]" />
          <span>Security and Password Change</span>
        </h2>

        {passwordSuccess && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-md flex items-center gap-2 text-xs text-[#0F766E]">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0F766E]" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs text-[#B91C1C]">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-[#172B3A] mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="Enter current password"
              className="w-full h-9 px-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                className="w-full h-9 px-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Re-enter new password"
                className="w-full h-9 px-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{passwordLoading ? 'Updating Password...' : 'Update Password'}</span>
          </button>
        </form>
      </div>

      {/* 3. Localization & Regional Standards */}
      <div className="bg-white p-6 rounded-md border border-[#E2E8F0] space-y-4">
        <h2 className="text-sm font-bold text-[#172B3A] pb-2 border-b border-[#E2E8F0] flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#0F766E]" />
          <span>Regional and Clinical Standards</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-md border border-[#E2E8F0] bg-[#F7F9FA]">
            <span className="font-semibold text-[#172B3A] block mb-1">Date and Time Display</span>
            <p className="text-[#64748B] text-[11px] mb-2">
              Indian standard calendar formatting (DD/MM/YYYY) is applied across all assessments and history records.
            </p>
            <span className="inline-block px-2.5 py-1 rounded-md bg-white border border-[#E2E8F0] font-mono text-[11px] text-[#172B3A]">
              DD/MM/YYYY hh:mm AM/PM
            </span>
          </div>

          <div className="p-3.5 rounded-md border border-[#E2E8F0] bg-[#F7F9FA]">
            <span className="font-semibold text-[#172B3A] block mb-1">Clinical Measurement Standard</span>
            <p className="text-[#64748B] text-[11px] mb-2">
              All physiological risk algorithms require standardized metric units.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[10px] font-semibold text-[#172B3A]">
                Height: cm
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[10px] font-semibold text-[#172B3A]">
                Weight: kg
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[10px] font-semibold text-[#172B3A]">
                BP: mmHg
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[10px] font-semibold text-[#172B3A]">
                Labs: mg/dL
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Danger Zone: Data and Account Deletion */}
      <div className="bg-white p-6 rounded-md border border-red-200 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Data Privacy and Retention Control</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            You maintain full ownership of your health records. Deleted data is permanently purged from the system immediately.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {/* Action A: Delete Health Data */}
          <div className="p-4 rounded-md border border-[#E2E8F0] bg-[#F7F9FA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#172B3A] block">
                Clear All Screening and Health Data
              </span>
              <span className="text-[11px] text-[#64748B] block mt-0.5 max-w-md">
                Permanently deletes all disease risk screenings, symptom evaluations, and biometric logs while keeping your account login active.
              </span>
            </div>
            <button
              onClick={() => setShowDeleteDataModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Health Data</span>
            </button>
          </div>

          {/* Action B: Delete Entire Account */}
          <div className="p-4 rounded-md border border-red-200 bg-red-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#B91C1C] block">
                Delete HealthAI Account
              </span>
              <span className="text-[11px] text-[#64748B] block mt-0.5 max-w-md">
                Permanently terminates your account, authentication credentials, and all associated personal health history records.
              </span>
            </div>
            <button
              onClick={() => setShowDeleteAccountModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Health Data Modal */}
      {showDeleteDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white w-full max-w-md rounded-md border border-[#E2E8F0] shadow-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold text-[#172B3A]">Clear All Health Records?</h3>
              </div>
              <button
                onClick={() => setShowDeleteDataModal(false)}
                className="p-1 text-[#64748B] hover:text-[#172B3A] rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              This action will permanently delete all your completed disease risk assessments, symptom checks, and biometric measurement logs. This operation cannot be undone.
            </p>

            {deleteDataError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-[#B91C1C]">
                {deleteDataError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setShowDeleteDataModal(false)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[#64748B] bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllHealthData}
                disabled={deleteDataLoading}
                className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {deleteDataLoading ? 'Clearing Records...' : 'Permanently Clear Records'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white w-full max-w-md rounded-md border border-red-200 shadow-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold text-[#172B3A]">Delete HealthAI Account</h3>
              </div>
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="p-1 text-[#64748B] hover:text-[#172B3A] rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              You are about to permanently delete your HealthAI account and all personal health data. This cannot be undone.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                To confirm, enter your email address: <span className="font-mono text-[#0F766E]">{user?.email}</span>
              </label>
              <input
                type="text"
                placeholder={user?.email}
                value={confirmEmailInput}
                onChange={(e) => setConfirmEmailInput(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F7F9FA] focus:bg-white focus:outline-none focus:border-red-500"
              />
            </div>

            {deleteAccountError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-[#B91C1C]">
                {deleteAccountError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[#64748B] bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={
                  deleteAccountLoading ||
                  confirmEmailInput.trim().toLowerCase() !== user?.email.trim().toLowerCase()
                }
                className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {deleteAccountLoading ? 'Deleting Account...' : 'Permanently Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
