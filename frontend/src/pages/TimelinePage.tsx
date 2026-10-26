import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TimelineEvent } from '../types';
import {
  Clock,
  Sparkles,
  Activity,
  FileText,
  Flame,
  ChevronRight,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface TimelinePageProps {
  onNavigateTab?: (tab: string) => void;
  onViewScreeningDetail?: (id: string) => void;
}

export const TimelinePage: React.FC<TimelinePageProps> = ({
  onNavigateTab,
  onViewScreeningDetail,
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    async function loadTimeline() {
      setLoading(true);
      try {
        const data = await api.getTimeline(selectedFilter);
        setEvents(data || []);
      } catch (err) {
        console.error('Failed to load timeline:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTimeline();
  }, [selectedFilter]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'screening':
        return 'border-[#1677FF] text-[#1677FF] bg-blue-50';
      case 'measurement':
        return 'border-[#0EA5A4] text-[#0EA5A4] bg-teal-50';
      case 'checkin':
        return 'border-[#F59E0B] text-[#F59E0B] bg-amber-50';
      case 'document':
        return 'border-[#3B82F6] text-[#3B82F6] bg-blue-50';
      default:
        return 'border-[#667085] text-[#667085] bg-slate-50';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'screening':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'measurement':
        return <Activity className="w-3.5 h-3.5" />;
      case 'checkin':
        return <Flame className="w-3.5 h-3.5" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      {/* Header Matching Screen 8 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#172033]">
            Health Timeline
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            A chronological history of your screenings, measurements, and health milestones.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 bg-[#F7F9FC] border border-[#E6EAF0] p-1 rounded-xl self-start sm:self-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'screening', label: 'Screenings' },
            { id: 'measurement', label: 'Vitals' },
            { id: 'checkin', label: 'Check-ins' },
            { id: 'document', label: 'Reports' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                selectedFilter === f.id
                  ? 'bg-white text-[#1677FF] shadow-2xs'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Vertical Timeline Feed Matching Reference Screen 8 */}
      <div className="relative pl-7 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E6EAF0]">
        {loading ? (
          <div className="text-center py-12 text-xs text-[#667085]">
            Loading health timeline...
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white border border-[#E6EAF0] rounded-xl p-8 text-center text-xs text-[#667085]">
            No timeline events recorded yet. Complete a screening or log a measurement to begin.
          </div>
        ) : (
          events.map((evt, idx) => (
            <div key={evt.id || idx} className="relative flex items-start gap-4 group">
              {/* Circular Colored Node on the Timeline */}
              <div
                className={`absolute -left-7 top-1 w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-2xs z-10 ${getNodeColor(
                  evt.event_type || (evt as any).type
                )}`}
              >
                {getEventIcon(evt.event_type || (evt as any).type)}
              </div>

              {/* Event Card */}
              <div className="flex-1 bg-white p-5 rounded-xl border border-[#E6EAF0] shadow-xs group-hover:border-[#1677FF]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#172033]">{evt.title}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize bg-[#F7F9FC] border border-[#E6EAF0] text-[#667085]">
                      {evt.event_type || (evt as any).type}
                    </span>
                  </div>
                  <p className="text-xs text-[#667085] leading-relaxed">
                    {evt.description || (evt as any).details}
                  </p>
                  <span className="text-[11px] text-[#667085] flex items-center gap-1 pt-1">
                    <Calendar className="w-3 h-3 text-[#667085]" />
                    {evt.timestamp || (evt as any).date_display}
                  </span>
                </div>

                {/* Right Action Button */}
                <div className="shrink-0">
                  {evt.event_type === 'screening' && evt.metadata?.screening_id && onViewScreeningDetail ? (
                    <button
                      onClick={() => onViewScreeningDetail(evt.metadata?.screening_id)}
                      className="px-3.5 py-1.5 rounded-xl border border-[#E6EAF0] hover:border-[#1677FF] hover:bg-blue-50/50 text-xs font-semibold text-[#1677FF] transition-all flex items-center gap-1"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : evt.event_type === 'measurement' && onNavigateTab ? (
                    <button
                      onClick={() => onNavigateTab('trends')}
                      className="px-3.5 py-1.5 rounded-xl border border-[#E6EAF0] hover:border-[#1677FF] hover:bg-blue-50/50 text-xs font-semibold text-[#1677FF] transition-all flex items-center gap-1"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : evt.event_type === 'document' && onNavigateTab ? (
                    <button
                      onClick={() => onNavigateTab('reports')}
                      className="px-3.5 py-1.5 rounded-xl border border-[#E6EAF0] hover:border-[#1677FF] hover:bg-blue-50/50 text-xs font-semibold text-[#1677FF] transition-all flex items-center gap-1"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Safety Disclaimer */}
      <MedicalDisclaimer />
    </div>
  );
};
