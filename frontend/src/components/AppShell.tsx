import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import {
  LayoutDashboard,
  Stethoscope,
  ShieldAlert,
  Brain,
  Activity,
} from 'lucide-react';

interface AppShellProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mobileNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'symptoms', label: 'Symptoms', icon: Stethoscope },
    { id: 'predictions', label: 'Diseases', icon: ShieldAlert },
    { id: 'insights', label: 'Insights', icon: Brain },
    { id: 'history', label: 'History', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FA] flex flex-col lg:flex-row text-[#172B3A]">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <TopNavbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          currentTab={currentTab}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Global Clinical Footer */}
        <footer className="border-t border-[#E2E8F0] bg-white px-4 md:px-8 py-5 text-xs text-[#64748B]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <span className="font-semibold text-[#172B3A]">HealthAI</span>: AI-assisted health risk assessment and understandable health insights.
              <p className="mt-0.5 text-[11px] text-[#64748B]">
                Educational screening tool. Not a substitute for professional clinical diagnosis or emergency care.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs shrink-0">
              <button
                onClick={() => onSelectTab('privacy-policy')}
                className="hover:text-[#0F766E] underline-offset-2 hover:underline transition-colors"
              >
                Privacy Policy
              </button>
              <span className="text-[#E2E8F0]">|</span>
              <button
                onClick={() => onSelectTab('terms-and-conditions')}
                className="hover:text-[#0F766E] underline-offset-2 hover:underline transition-colors"
              >
                Terms and Conditions
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#FFFFFF] border-t border-[#E2E8F0] z-40 flex items-center justify-around px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center w-14 py-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-[#0F766E] font-semibold' : 'text-[#64748B] hover:text-[#172B3A]'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#0F766E]' : 'text-[#64748B]'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
