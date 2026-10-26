import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ScreeningHistoryItem, ScreeningResult, RiskCategory } from '../types';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import {
  Activity,
  Search,
  Eye,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
  Stethoscope,
  ShieldAlert,
  ArrowRight,
  Filter,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';

interface HistoryPageProps {
  onViewScreeningDetail?: (id: string) => void;
  onStartNewScreening: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onViewScreeningDetail,
  onStartNewScreening,
  onNavigateTab,
}) => {
  const [history, setHistory] = useState<ScreeningHistoryItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Detail Modal State
  const [selectedResult, setSelectedResult] = useState<ScreeningResult | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getScreeningHistory();
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOpenDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const result = await api.getScreeningDetail(id);
      setSelectedResult(result);
    } catch (err) {
      console.error('Failed to load screening detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteScreening(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setConfirmDeleteId(null);
      if (selectedResult && selectedResult.id === id) {
        setSelectedResult(null);
      }
    } catch (err) {
      console.error('Failed to delete screening record:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Indian Date Formatter (DD/MM/YYYY hh:mm A)
  const formatIndianDateTime = (isoString?: string) => {
    if (!isoString) return 'Not recorded';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
      return `${day}/${month}/${year} ${strTime}`;
    } catch {
      return isoString;
    }
  };

  const getRiskBadge = (category: RiskCategory) => {
    if (category === 'elevated') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          Elevated Risk
        </span>
      );
    }
    if (category === 'moderate') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          Moderate Risk
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
        Lower Risk
      </span>
    );
  };

  // Filter list
  const filteredHistory = history.filter((item) => {
    const sType = (item.screening_type || '').toLowerCase();
    const matchesType =
      filterType === 'all' ||
      (filterType === 'symptoms' && (sType === 'symptoms' || sType === 'symptom_risk')) ||
      sType === filterType.toLowerCase();

    const titleStr = (item.screening_title || item.title || '').toLowerCase();
    const summaryStr = (item.risk_summary || item.summary || '').toLowerCase();
    const matchesSearch =
      !searchTerm ||
      titleStr.includes(searchTerm.toLowerCase()) ||
      summaryStr.includes(searchTerm.toLowerCase()) ||
      item.risk_category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesSearch;
  });

  // Sort list by date
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime() || 0;
    const timeB = new Date(b.created_at).getTime() || 0;
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'diabetes', label: 'Diabetes' },
    { id: 'cardiovascular', label: 'Heart Disease' },
    { id: 'kidney', label: 'Kidney' },
    { id: 'symptoms', label: 'Symptoms' },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-8">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
              Saved Records
            </span>
            <span className="text-xs text-[#64748B]">{history.length} assessments</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#172B3A]">Health History</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Compact record archive with search, disease filtering, and verified data deletion.
          </p>
        </div>

        <button
          onClick={onStartNewScreening}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors self-start sm:self-auto shadow-2xs"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>New Assessment</span>
        </button>
      </div>

      {/* Filter, Search, and Sort Controls */}
      <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-[#64748B] mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilterType(opt.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterType === opt.id
                  ? 'bg-[#0F766E] text-white shadow-2xs font-semibold'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172B3A] border border-[#E2E8F0]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search and Sort Buttons */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-md border border-[#E2E8F0] text-xs bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            title="Toggle sort order"
            className="h-8 px-2.5 rounded-md border border-[#E2E8F0] text-xs font-medium bg-[#F8FAFC] hover:bg-slate-100 text-[#172B3A] inline-flex items-center gap-1.5 shrink-0"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      </div>

      {/* Compact Table (Exact 4 Columns: Assessment, Date, Result, Actions) */}
      {loading ? (
        <div className="p-10 text-center bg-white rounded-lg border border-[#E2E8F0] shadow-sm">
          <div className="w-6 h-6 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#64748B]">Loading your health assessment records...</p>
        </div>
      ) : sortedHistory.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-lg border border-[#E2E8F0] shadow-sm">
          <Activity className="w-10 h-10 text-[#64748B] mx-auto mb-2 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-[#172B3A] mb-1">
            {history.length === 0
              ? 'You have not completed an assessment yet.'
              : 'No assessments match the selected filter.'}
          </h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mb-4">
            {history.length === 0
              ? 'Complete a health risk assessment to build your verified personal health record.'
              : 'Try clearing your search query or selecting a different filter.'}
          </p>
          {history.length === 0 ? (
            <button
              onClick={onStartNewScreening}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Start Assessment</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setFilterType('all');
                setSearchTerm('');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#172B3A] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-slate-100"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                  <th className="py-3 px-4">Assessment</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {sortedHistory.map((item) => {
                  const isSymptom =
                    item.screening_type === 'symptoms' || item.screening_type === 'symptom_risk';

                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      {/* Column 1: Assessment */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#172B3A]">
                            {isSymptom ? (
                              <Stethoscope className="w-3.5 h-3.5 text-[#0F766E]" />
                            ) : (
                              <ShieldAlert className="w-3.5 h-3.5 text-[#0284C7]" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-[#172B3A] block">
                              {item.screening_title || item.title}
                            </span>
                            <span className="text-[10px] text-[#64748B] uppercase tracking-wider">
                              {item.screening_type}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Date */}
                      <td className="py-3 px-4 text-[#64748B] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>{formatIndianDateTime(item.created_at)}</span>
                        </div>
                      </td>

                      {/* Column 3: Result */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRiskBadge(item.risk_category)}
                          <span className="text-xs font-semibold text-[#172B3A]">
                            {item.risk_score_percentage}%
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] border border-[#CCFBF1] hover:bg-[#CCFBF1]/60 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>

                          {confirmDeleteId === item.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                                className="px-2 py-1 rounded-md text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
                              >
                                {deletingId === item.id ? 'Deleting...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded-md text-[11px] font-medium text-[#64748B] bg-slate-100 hover:bg-slate-200"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(item.id)}
                              title="Delete record"
                              className="p-1 rounded-md text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* In-Modal Details Inspector */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white w-full max-w-xl rounded-lg border border-[#E2E8F0] shadow-xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#0F766E] text-white flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172B3A]">
                    {selectedResult.screening_title || selectedResult.title}
                  </h3>
                  <span className="text-[11px] text-[#64748B]">
                    Recorded on {formatIndianDateTime(selectedResult.created_at)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="p-1 text-[#64748B] hover:text-[#172B3A] rounded-md hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-semibold">
                    Category Classification
                  </span>
                  <p className="text-sm font-bold text-[#172B3A] mt-0.5 capitalize">
                    {selectedResult.risk_category} Risk ({selectedResult.risk_score_percentage}%)
                  </p>
                </div>
                {getRiskBadge(selectedResult.risk_category)}
              </div>

              <div>
                <strong className="text-[#172B3A] block mb-1">Assessment Findings</strong>
                <p className="text-[#64748B] leading-relaxed bg-[#F8FAFC] p-3 rounded-md border border-[#E2E8F0]">
                  {selectedResult.risk_summary || selectedResult.summary}
                </p>
              </div>

              {selectedResult.feature_contributions && selectedResult.feature_contributions.length > 0 && (
                <div>
                  <strong className="text-[#172B3A] block mb-1.5">Influencing Parameters</strong>
                  <div className="space-y-1.5">
                    {selectedResult.feature_contributions.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-md border border-[#E2E8F0] bg-white flex items-center justify-between"
                      >
                        <span className="font-semibold text-[#172B3A]">{f.label || f.feature}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            f.direction === 'increases_risk'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {f.direction === 'increases_risk' ? 'Elevates Risk' : 'Protective Factor'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <button
                onClick={() => {
                  if (confirm('Permanently delete this assessment record?')) {
                    handleDelete(selectedResult.id);
                  }
                }}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D655E]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Medical Disclaimer */}
      <MedicalDisclaimer compact={true} />
    </div>
  );
};
