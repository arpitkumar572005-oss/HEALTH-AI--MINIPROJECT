import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { HealthReminder } from '../types';
import {
  Pill,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  Activity,
  Droplet,
  Footprints,
  Stethoscope,
  X,
  Bell
} from 'lucide-react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<HealthReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Add Reminder Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('blood_pressure');
  const [timeOfDay, setTimeOfDay] = useState('8:00 PM');
  const [frequency, setFrequency] = useState('daily');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const data = await api.getReminders();
      setReminders(data || []);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await api.toggleReminder(id);
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: updated.is_active } : r))
      );
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setSubmitting(true);
    try {
      await api.createReminder({
        title,
        category,
        time_of_day: timeOfDay,
        frequency,
      });
      setShowAddModal(false);
      setTitle('');
      await loadReminders();
    } catch (err) {
      console.error('Failed to add reminder:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'medication':
        return <Pill className="w-5 h-5 text-[#DC2626]" />;
      case 'blood_pressure':
        return <Activity className="w-5 h-5 text-[#1677FF]" />;
      case 'blood_glucose':
        return <Droplet className="w-5 h-5 text-[#0284C7]" />;
      case 'exercise':
        return <Footprints className="w-5 h-5 text-[#16A34A]" />;
      default:
        return <Bell className="w-5 h-5 text-[#7C3AED]" />;
    }
  };

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'active') return r.is_active;
    if (filter === 'inactive') return !r.is_active;
    return true;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6EAF0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1677FF] border border-blue-200">
              Timely Adherence
            </span>
            <span className="text-xs text-[#667085]">Medications & Vital Monitoring</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">
            Health Reminders & Notifications
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Never miss scheduled blood pressure checks, fasting glucose checks, supplements, or physical walks.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1677FF] hover:bg-[#1366DB] shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'active', 'inactive'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === tab
                ? 'bg-[#1677FF] text-white shadow-2xs'
                : 'bg-white text-[#667085] border border-[#E6EAF0] hover:bg-slate-50'
            }`}
          >
            {tab} Reminders {tab === 'all' && `(${reminders.length})`}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredReminders.map((r) => (
          <div
            key={r.id}
            className={`bg-white p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 shadow-2xs ${
              r.is_active ? 'border-[#E6EAF0] hover:border-blue-300' : 'border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E6EAF0] flex items-center justify-center shrink-0">
                {getCategoryIcon(r.category)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#172033]">{r.title}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] capitalize">
                    {r.frequency}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-[#667085]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Scheduled: {r.time_of_day}</span>
                  {r.next_due && <span>• Next: {r.next_due}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggle(r.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  r.is_active
                    ? 'bg-blue-50 text-[#1677FF] border-blue-200 hover:bg-blue-100'
                    : 'bg-slate-100 text-[#667085] border-slate-300 hover:bg-slate-200'
                }`}
              >
                {r.is_active ? 'Active' : 'Paused'}
              </button>

              <button
                onClick={() => handleDelete(r.id)}
                className="p-2 text-[#94A3B8] hover:text-[#DC2626] rounded-xl hover:bg-red-50 transition-colors"
                title="Delete Reminder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Safety Disclaimer */}
      <MedicalDisclaimer />

      {/* ADD REMINDER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E6EAF0] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#1677FF]" />
                <h3 className="text-base font-bold text-[#172033]">Add New Reminder</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-[#94A3B8] hover:text-[#172033]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddReminder} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#334155] block mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Evening BP Measurement"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              <div>
                <label className="font-bold text-[#334155] block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#1677FF]"
                >
                  <option value="blood_pressure">Blood Pressure Check</option>
                  <option value="blood_glucose">Blood Glucose Check</option>
                  <option value="medication">Medication / Supplement</option>
                  <option value="exercise">Physical Exercise / Walk</option>
                  <option value="water">Hydration</option>
                  <option value="screening">Health Screening Follow-up</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#334155] block mb-1">Time of Day</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8:00 PM"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#334155] block mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#1677FF]"
                  >
                    <option value="daily">Daily</option>
                    <option value="twice_daily">Twice Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="every_2_hours">Every 2 Hours</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#E6EAF0] rounded-xl text-[#667085] hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1677FF] hover:bg-[#1366DB] text-white rounded-xl font-bold shadow-xs"
                >
                  {submitting ? 'Adding...' : 'Save Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
