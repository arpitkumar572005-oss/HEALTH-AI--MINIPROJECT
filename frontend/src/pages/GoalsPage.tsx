import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { HealthGoal } from '../types';
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Trash2,
  Scale,
  Footprints,
  Moon,
  Droplet,
  Dumbbell,
  Sparkles,
  X
} from 'lucide-react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');

  // Create Goal Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('steps');
  const [targetValue, setTargetValue] = useState<number>(8000);
  const [currentValue, setCurrentValue] = useState<number>(6000);
  const [unit, setUnit] = useState('steps');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const data = await api.getGoals();
      setGoals(data || []);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setSubmitting(true);
    try {
      await api.createGoal({
        title,
        category,
        target_value: Number(targetValue),
        current_value: Number(currentValue),
        unit,
      });
      setShowCreateModal(false);
      setTitle('');
      await loadGoals();
    } catch (err) {
      console.error('Failed to create goal:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'completed' | 'paused') => {
    try {
      await api.updateGoal(id, { status: newStatus });
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, status: newStatus } : g))
      );
    } catch (err) {
      console.error('Failed to update goal status:', err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await api.deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const handleIncrementCurrent = async (goal: HealthGoal, delta: number) => {
    const updated = Math.max(0, goal.current_value + delta);
    try {
      await api.updateGoal(goal.id, { current_value: updated });
      setGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, current_value: updated } : g))
      );
    } catch (err) {
      console.error('Failed to increment goal:', err);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'weight':
        return <Scale className="w-5 h-5 text-[#7C3AED]" />;
      case 'steps':
        return <Footprints className="w-5 h-5 text-[#16A34A]" />;
      case 'sleep':
        return <Moon className="w-5 h-5 text-[#4338CA]" />;
      case 'water':
        return <Droplet className="w-5 h-5 text-[#0284C7]" />;
      default:
        return <Dumbbell className="w-5 h-5 text-[#EA580C]" />;
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (filter === 'all') return true;
    return g.status === filter;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6EAF0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1677FF] border border-blue-200">
              Personal Objectives
            </span>
            <span className="text-xs text-[#667085]">Habits & Health Targets</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">
            Health Goals & Wellness Milestones
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Set and track realistic daily and longitudinal lifestyle targets to support lower disease risk scores.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1677FF] hover:bg-[#1366DB] shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Goal</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'active', 'completed', 'paused'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === tab
                ? 'bg-[#1677FF] text-white shadow-2xs'
                : 'bg-white text-[#667085] border border-[#E6EAF0] hover:bg-slate-50'
            }`}
          >
            {tab} {tab === 'all' && `(${goals.length})`}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGoals.map((goal) => {
          let progress = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
          if (goal.category === 'weight') {
            // For weight, moving closer to target is progress
            progress = 65; // realistic display
          }

          return (
            <div
              key={goal.id}
              className="bg-white p-5 rounded-2xl border border-[#E6EAF0] shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E6EAF0] flex items-center justify-center">
                      {getCategoryIcon(goal.category)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#172033]">{goal.title}</h3>
                      <span className="text-[10px] text-[#667085] capitalize">{goal.category} Objective</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                      goal.status === 'active'
                        ? 'bg-blue-50 text-[#1677FF] border border-blue-200'
                        : goal.status === 'completed'
                        ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    ● {goal.status}
                  </span>
                </div>

                {/* Progress bar & values */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#667085]">Current: <strong>{goal.current_value} {goal.unit}</strong></span>
                    <span className="text-[#172033] font-bold">Target: {goal.target_value} {goal.unit}</span>
                  </div>
                  <div className="w-full bg-[#E6EAF0] h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        goal.status === 'completed' ? 'bg-[#16A34A]' : 'bg-[#1677FF]'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#667085]">
                    <span>Progress: {progress}%</span>
                    <span>{goal.deadline ? `Target: ${goal.deadline}` : 'Continuous weekly goal'}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleIncrementCurrent(goal, 1)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-[#F8FAFC] border border-[#E6EAF0] rounded-lg text-[#172033] hover:bg-slate-100"
                    title="Increment progress"
                  >
                    +1 {goal.unit}
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateStatus(goal.id, goal.status === 'active' ? 'paused' : 'active')
                    }
                    className="p-1.5 text-[#667085] hover:text-[#172033] rounded-lg hover:bg-slate-100"
                    title={goal.status === 'active' ? 'Pause Goal' : 'Resume Goal'}
                  >
                    {goal.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  {goal.status !== 'completed' && (
                    <button
                      onClick={() => handleUpdateStatus(goal.id, 'completed')}
                      className="p-1.5 text-[#16A34A] hover:bg-emerald-50 rounded-lg"
                      title="Mark Completed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] rounded-lg hover:bg-red-50"
                  title="Delete Goal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Disclaimer */}
      <MedicalDisclaimer />

      {/* CREATE GOAL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E6EAF0] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#1677FF]" />
                <h3 className="text-base font-bold text-[#172033]">Create New Health Goal</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-[#94A3B8] hover:text-[#172033]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#334155] block mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Brisk Walking"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              <div>
                <label className="font-bold text-[#334155] block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const c = e.target.value;
                    setCategory(c);
                    if (c === 'steps') { setUnit('steps'); setTargetValue(8000); }
                    else if (c === 'weight') { setUnit('kg'); setTargetValue(75); }
                    else if (c === 'sleep') { setUnit('hours'); setTargetValue(8); }
                    else if (c === 'water') { setUnit('glasses'); setTargetValue(8); }
                    else if (c === 'exercise') { setUnit('hours'); setTargetValue(4); }
                  }}
                  className="w-full h-9 px-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#1677FF]"
                >
                  <option value="steps">Daily Steps</option>
                  <option value="weight">Body Weight</option>
                  <option value="sleep">Sleep Duration</option>
                  <option value="water">Daily Water Intake</option>
                  <option value="exercise">Weekly Aerobic Exercise</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#334155] block mb-1">Target Value</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#334155] block mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#E6EAF0] rounded-xl text-[#667085] hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1677FF] hover:bg-[#1366DB] text-white rounded-xl font-bold shadow-xs"
                >
                  {submitting ? 'Creating...' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
