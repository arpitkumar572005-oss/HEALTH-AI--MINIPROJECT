import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { HealthTrends } from '../types';
import { Activity, Calendar, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface HealthTrendChartProps {
  trends: HealthTrends | null;
  selectedTimeframe: string;
  onTimeframeChange: (tf: string) => void;
  isLoading?: boolean;
}

export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({
  trends,
  selectedTimeframe,
  onTimeframeChange,
  isLoading = false,
}) => {
  const [activeMetric, setActiveMetric] = useState<string>('blood_glucose');

  const metricTabs = [
    { key: 'blood_glucose', label: 'Blood Glucose', unit: 'mg/dL', color: '#1677FF' },
    { key: 'systolic_bp', label: 'Blood Pressure', unit: 'mmHg', color: '#3B82F6' },
    { key: 'heart_rate', label: 'Heart Rate', unit: 'BPM', color: '#EF4444' },
    { key: 'weight', label: 'Weight', unit: 'kg', color: '#0EA5A4' },
    { key: 'bmi', label: 'BMI', unit: 'kg/m²', color: '#16A34A' },
    { key: 'cholesterol', label: 'Cholesterol', unit: 'mg/dL', color: '#8B5CF6' },
  ];

  const currentTab = metricTabs.find((m) => m.key === activeMetric) || metricTabs[0];

  // Extract metric data directly from centralized trends API
  const rawMetricData: Array<{ timestamp?: string; date_label: string; value: number }> =
    (trends?.metrics as any)?.[activeMetric] || [];

  const dataCount = rawMetricData.length;
  const hasSufficientData = dataCount >= 2;

  // Dynamic statistics from real historical data
  const values = rawMetricData.map((d) => d.value);
  const avgVal = dataCount > 0 ? (values.reduce((a, b) => a + b, 0) / dataCount).toFixed(1) : null;
  const minVal = dataCount > 0 ? Math.min(...values).toFixed(1) : null;
  const maxVal = dataCount > 0 ? Math.max(...values).toFixed(1) : null;

  let trendLabel = 'No data';
  let trendSubtext = 'No records in period';
  let trendShift = 0;

  if (dataCount === 1) {
    trendLabel = 'Baseline only';
    trendSubtext = 'Single reading logged';
  } else if (dataCount >= 2) {
    trendShift = Number((values[values.length - 1] - values[0]).toFixed(1));
    if (Math.abs(trendShift) <= 0.5) {
      trendLabel = 'Stable';
      trendSubtext = 'Consistent range maintained';
    } else if (trendShift < -0.5) {
      trendLabel = 'Decreasing';
      trendSubtext = `${trendShift} ${currentTab.unit} net shift`;
    } else {
      trendLabel = 'Increasing';
      trendSubtext = `+${trendShift} ${currentTab.unit} net shift`;
    }
  }

  return (
    <div className="bg-white border border-[#E6EAF0] rounded-xl p-6 shadow-xs space-y-6 font-sans">
      {/* Metric Pill Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#F7F9FC]">
        <div className="flex flex-wrap items-center gap-2">
          {metricTabs.map((tab) => {
            const isActive = tab.key === activeMetric;
            const tabDataCount = ((trends?.metrics as any)?.[tab.key] || []).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveMetric(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#1677FF] text-white shadow-xs'
                    : 'bg-[#F7F9FC] text-[#667085] border border-[#E6EAF0] hover:bg-slate-100 hover:text-[#172033]'
                }`}
              >
                <span>{tab.label}</span>
                {tabDataCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-[#667085]'
                    }`}
                  >
                    {tabDataCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Date Dropdown */}
        <div className="flex items-center gap-1.5 bg-[#F7F9FC] border border-[#E6EAF0] rounded-xl px-3 py-1.5 text-xs text-[#667085]">
          <Calendar className="w-3.5 h-3.5 text-[#1677FF]" />
          <select
            value={selectedTimeframe}
            onChange={(e) => onTimeframeChange(e.target.value)}
            className="bg-transparent font-medium text-[#172033] focus:outline-none cursor-pointer"
          >
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="3m">3 Months</option>
            <option value="6m">6 Months</option>
            <option value="1y">1 Year</option>
          </select>
        </div>
      </div>

      {/* Main Line Chart Canvas or Insufficient Data State */}
      <div className="h-72 w-full pt-2">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-[#667085]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1677FF] mr-2" />
            Loading trend data...
          </div>
        ) : dataCount === 0 ? (
          /* Empty state: 0 records */
          <div className="h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E6EAF0] rounded-xl text-center bg-[#F8FAFC]">
            <Activity className="w-10 h-10 text-[#94A3B8] mb-2" />
            <h4 className="text-sm font-bold text-[#172033]">
              No {currentTab.label} Measurements
            </h4>
            <p className="text-xs text-[#667085] max-w-sm mt-1">
              No biometric measurements recorded for {currentTab.label.toLowerCase()} in the selected {selectedTimeframe} window. Log a measurement or complete a screening to begin tracking trends.
            </p>
          </div>
        ) : dataCount === 1 ? (
          /* Single measurement state: Insufficient Data for a Trend */
          <div className="h-full flex flex-col items-center justify-center p-6 border border-amber-200 bg-amber-50/50 rounded-xl text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
              <Info className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#172033]">
              Not enough historical data for a trend.
            </h4>
            <p className="text-xs text-[#667085] max-w-md mt-1 mb-4 leading-relaxed">
              Only 1 measurement ({rawMetricData[0].value} {currentTab.unit} on {rawMetricData[0].date_label}) is recorded in this timeframe. HealthAI requires at least 2 historical measurements to calculate an accurate trajectory.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-semibold text-amber-900 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Current Baseline: {rawMetricData[0].value} {currentTab.unit}</span>
            </div>
          </div>
        ) : (
          /* Sufficient data (>= 2 records): Render real LineChart */
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rawMetricData} margin={{ top: 15, right: 25, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6EAF0" />
              <XAxis
                dataKey="date_label"
                tick={{ fontSize: 11, fill: '#667085' }}
                axisLine={{ stroke: '#E6EAF0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#667085' }}
                axisLine={false}
                tickLine={false}
                unit={` ${currentTab.unit}`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E6EAF0',
                  boxShadow: '0 4px 12px rgba(23, 32, 51, 0.06)',
                  fontSize: '12px',
                }}
                formatter={(val: number) => [`${val} ${currentTab.unit}`, currentTab.label]}
                labelStyle={{ fontWeight: 600, color: '#172033', marginBottom: '2px' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={currentTab.color}
                strokeWidth={3}
                dot={{ r: 5, fill: currentTab.color, strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 7, fill: currentTab.color, stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 4 Bottom Stat Cards Grounded in Actual Patient Records */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E6EAF0]">
          <span className="text-xs font-medium text-[#667085] block">Average</span>
          <span className="text-xl font-bold text-[#172033] mt-1 block">
            {avgVal ? `${avgVal} ${currentTab.unit}` : '--'}
          </span>
          <span className="text-[10px] text-[#667085] mt-0.5 block">
            {dataCount > 0 ? `Across ${dataCount} readings` : 'No data in timeframe'}
          </span>
        </div>

        <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E6EAF0]">
          <span className="text-xs font-medium text-[#667085] block">Minimum</span>
          <span className="text-xl font-bold text-[#172033] mt-1 block">
            {minVal ? `${minVal} ${currentTab.unit}` : '--'}
          </span>
          <span className="text-[10px] text-[#16A34A] font-semibold mt-0.5 block">
            {minVal ? 'Lowest recorded' : 'No data'}
          </span>
        </div>

        <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E6EAF0]">
          <span className="text-xs font-medium text-[#667085] block">Maximum</span>
          <span className="text-xl font-bold text-[#172033] mt-1 block">
            {maxVal ? `${maxVal} ${currentTab.unit}` : '--'}
          </span>
          <span className="text-[10px] text-[#667085] mt-0.5 block">
            {maxVal ? 'Peak recorded' : 'No data'}
          </span>
        </div>

        <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E6EAF0]">
          <span className="text-xs font-medium text-[#667085] block">Trend Trajectory</span>
          <div className="flex items-center gap-1.5 text-xl font-bold text-[#172033] mt-1">
            {hasSufficientData ? (
              <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            )}
            <span>{trendLabel}</span>
          </div>
          <span
            className={`text-[10px] font-semibold mt-0.5 block ${
              hasSufficientData ? 'text-[#16A34A]' : 'text-amber-600'
            }`}
          >
            {trendSubtext}
          </span>
        </div>
      </div>
    </div>
  );
};
