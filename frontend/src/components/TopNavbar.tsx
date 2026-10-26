import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  ShieldCheck,
  User,
  LogOut,
} from 'lucide-react';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
  currentTab?: string;
}

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  symptoms: 'AI Symptom Detector',
  predictions: 'Multiple Disease Prediction',
  screening: 'Disease Risk Assessment',
  'screening-result': 'Assessment Results',
  insights: 'Explainable Health Insights',
  history: 'Health Assessment History',
  profile: 'My Profile',
  settings: 'Settings',
  'privacy-policy': 'Privacy Policy',
  'terms-and-conditions': 'Terms and Conditions',
};

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onOpenMobileMenu,
  currentTab = 'dashboard',
}) => {
  const { user, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'HS';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const title = TAB_TITLES[currentTab] || 'Dashboard';

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger + Active Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 -ml-1.5 text-[#64748B] hover:text-[#172B3A] rounded-md lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm font-semibold text-[#172B3A] leading-tight">
            {title}
          </h1>
          <span className="text-[11px] text-[#64748B] hidden sm:block">
            HealthAI Risk Screening Platform
          </span>
        </div>
      </div>

      {/* Right: Clinical Prototype Notice & Authenticated User Info */}
      <div className="flex items-center gap-4">
        {/* Verification badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>Educational Risk Model</span>
        </div>

        {/* User Account Menu Display */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-md bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] font-semibold text-xs flex items-center justify-center shrink-0">
            {getInitials(user?.full_name)}
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-xs font-semibold text-[#172B3A] block leading-tight">
              {user?.full_name || 'Himanshu Sharma'}
            </span>
            <span className="text-[10px] text-[#64748B] block leading-tight mt-0.5">
              {user?.is_demo ? 'Demo Account' : 'Authenticated User'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
