import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ScreeningHistoryItem, RiskCategory } from '../types';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import {
  Stethoscope,
  ShieldAlert,
  Brain,
  Calendar,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock,
  Eye,
} from 'lucide-react';

interface DashboardPageProps {
  onStartScreening: (disease?: string) => void;
  onViewScreeningDetail: (id: string) => void;
  onViewAllHistory: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onStartScreening,
  onViewScreeningDetail,
  onViewAllHistory,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ScreeningHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      setLoading(true);
      try {
        const histData = await api.getScreeningHistory();
        if (isMounted) {
          setHistory(histData || []);
        }
      } catch (err) {
        console.error('Failed to load health history:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getFirstName = () => {
    if (!user?.full_name) return 'Himanshu';
    return user.full_name.trim().split(/\s+/)[0];
  };

  const formatDateIndian = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const getRiskBadge = (category: RiskCategory) => {
    switch (category) {
      case 'lower':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            Lower Risk
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            Moderate Risk
          </span>
        );
      case 'elevated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            Elevated Risk
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-[#64748B]">
            Completed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with requested copy */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#172B3A]">
              Welcome back, {getFirstName()}
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Your health assessments, all in one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E]">
              <Activity className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>{history.length} Saved {history.length === 1 ? 'Record' : 'Records'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Feature Area: Three colourful, compact feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Symptom Detector (Teal/Mint Theme) */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm flex flex-col justify-between hover:border-[#0F766E] transition-all group">
          <div>
            <div className="w-10 h-10 rounded-md bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0F766E] mb-3 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5 stroke-[2]" />
            </div>
            <h2 className="text-base font-bold text-[#172B3A]">
              Symptom Detector
            </h2>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Explore possible causes of your symptoms.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-[#F1F5F9]">
            <button
              onClick={() => onNavigateTab ? onNavigateTab('symptoms') : onStartScreening('symptoms')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors"
            >
              <span>Check Symptoms</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Disease Prediction (Blue/Navy Theme) */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm flex flex-col justify-between hover:border-[#0284C7] transition-all group">
          <div>
            <div className="w-10 h-10 rounded-md bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] mb-3 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 stroke-[2]" />
            </div>
            <h2 className="text-base font-bold text-[#172B3A]">
              Disease Prediction
            </h2>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Assess diabetes, heart, and kidney disease risk.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-[#F1F5F9]">
            <button
              onClick={() => onNavigateTab ? onNavigateTab('predictions') : onStartScreening('diabetes')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-[#142B3B] text-white hover:bg-[#1E3A8A] transition-colors"
            >
              <span>Start Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Health Insights (Amber/Teal Theme) */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm flex flex-col justify-between hover:border-[#D97706] transition-all group">
          <div>
            <div className="w-10 h-10 rounded-md bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#D97706] mb-3 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5 stroke-[2]" />
            </div>
            <h2 className="text-base font-bold text-[#172B3A]">
              Health Insights
            </h2>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Understand what influenced your results.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-[#F1F5F9]">
            <button
              onClick={() => onNavigateTab ? onNavigateTab('insights') : onViewAllHistory()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] text-[#172B3A] hover:bg-[#F1F5F9] transition-colors"
            >
              <span>View Insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Latest Four Saved Assessments Section */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#172B3A] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0F766E]" />
              Latest Assessments
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Review your most recent completed screenings.
            </p>
          </div>

          {history.length > 0 && (
            <button
              onClick={onViewAllHistory}
              className="text-xs font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1"
            >
              <span>View all records</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center text-[#64748B]">
            <div className="w-6 h-6 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Loading latest assessments...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="py-10 px-4 text-center max-w-md mx-auto">
            <div className="w-10 h-10 rounded-md bg-[#F7F9FA] border border-[#E2E8F0] flex items-center justify-center mx-auto mb-3 text-[#64748B]">
              <Activity className="w-5 h-5 text-[#64748B]" />
            </div>
            <h3 className="text-sm font-bold text-[#172B3A]">
              You have not completed an assessment yet.
            </h3>
            <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
              Start your first assessment to estimate health risks and understand your personalized insights.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={() => onNavigateTab ? onNavigateTab('symptoms') : onStartScreening('symptoms')}
                className="w-full sm:w-auto px-4 py-2 rounded-md text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors"
              >
                Check Symptoms
              </button>
              <button
                onClick={() => onNavigateTab ? onNavigateTab('predictions') : onStartScreening('diabetes')}
                className="w-full sm:w-auto px-4 py-2 rounded-md text-xs font-semibold bg-[#142B3B] text-white hover:bg-[#1E3A8A] transition-colors"
              >
                Start Assessment
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {/* Exactly latest 4 saved assessments per prompt */}
            {history.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] rounded-md px-2.5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#172B3A]">
                    {(item.screening_type as string) === 'symptom_risk' || (item.screening_type as string) === 'symptoms' ? (
                      <Stethoscope className="w-4 h-4 text-[#0F766E]" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-[#0284C7]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#172B3A] block truncate">
                      {item.screening_title || item.title}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDateIndian(item.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {getRiskBadge(item.risk_category)}
                  <button
                    onClick={() => onViewScreeningDetail(item.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] border border-[#CCFBF1] hover:bg-[#CCFBF1]/60 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medical Disclaimer */}
      <MedicalDisclaimer compact={true} />
    </div>
  );
};
