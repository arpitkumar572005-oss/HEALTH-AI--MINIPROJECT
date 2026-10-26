import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Stethoscope,
  ShieldAlert,
  Brain,
  Activity,
  User,
  Settings,
  LogOut,
  HeartPulse,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'symptoms', label: 'Symptom Detector', icon: Stethoscope },
    { id: 'predictions', label: 'Disease Prediction', icon: ShieldAlert },
    { id: 'insights', label: 'Health Insights', icon: Brain },
    { id: 'history', label: 'Health History', icon: Activity },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'HS';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 w-[240px] bg-[#FFFFFF] border-r border-[#E2E8F0] z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Brand & Navigation */}
        <div className="flex-1 overflow-y-auto">
          {/* Brand Wordmark matching strict visual identity */}
          <div className="h-16 flex items-center px-5 border-b border-[#E2E8F0] gap-2.5 bg-white sticky top-0 z-10">
            <div className="w-8 h-8 rounded-md bg-[#0F766E] flex items-center justify-center text-white shrink-0">
              <HeartPulse className="w-5 h-5 text-white stroke-[2]" />
            </div>
            <div className="min-w-0">
              <span className="text-base font-bold tracking-tight text-[#172B3A] block leading-none">
                HealthAI
              </span>
              <span className="text-[10px] text-[#64748B] font-medium block mt-1 tracking-wide truncate">
                Health Risk Assessment
              </span>
            </div>
          </div>

          {/* Navigation Links (Strict 7 Items) */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentTab === item.id ||
                (item.id === 'predictions' && (currentTab === 'screening' || currentTab === 'screening-result'));

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-[#0F766E] text-white font-semibold'
                      : 'text-[#64748B] hover:text-[#172B3A] hover:bg-[#F7F9FA]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: User Card and Logout */}
        <div className="p-3 border-t border-[#E2E8F0] bg-white">
          <div className="flex items-center justify-between p-2 rounded-md bg-[#F7F9FA] mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] font-semibold text-xs flex items-center justify-center shrink-0">
                {getInitials(user?.full_name)}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[#172B3A] block truncate leading-tight">
                  {user?.full_name || 'Himanshu Sharma'}
                </span>
                <span className="text-[10px] text-[#64748B] block truncate leading-tight mt-0.5">
                  {user?.email || 'himanshu.sharma@healthai.local'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
