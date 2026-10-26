import {
  User,
  PatientProfile,
  ScreeningResult,
  ScreeningHistoryItem,
  HealthMeasurement,
  HealthTrends,
  DailyCheckIn,
  HealthGoal,
  HealthReminder,
  TimelineEvent,
  HealthInsight,
  WeeklySummary,
  ScreeningComparison,
  LabReportAnalysis,
  SymptomScreeningFormData,
  ReportAnalysis,
  ReportHistoryItem,
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('healthai_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'An unexpected error occurred. Please try again.';
    try {
      const errorData = await response.json();
      if (errorData?.detail) {
        errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(data: any): Promise<{ access_token: string; user: User }> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async demoLogin(persona: string = 'himanshu'): Promise<{ access_token: string; user: User }> {
    return request('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ persona, role: 'patient' }),
    });
  },

  async forgotPassword(email: string): Promise<{ message: string; reset_token?: string }> {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, new_password: string): Promise<{ message: string }> {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    });
  },

  async changePassword(current_password: string, new_password: string): Promise<{ message: string }> {
    return request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    });
  },

  async getMe(): Promise<User> {
    return request('/users/me');
  },

  // Profile
  async getProfile(): Promise<PatientProfile> {
    return request('/profile');
  },

  async updateProfile(data: Partial<PatientProfile>): Promise<PatientProfile> {
    return request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Screenings
  async screenDiabetes(data: any): Promise<ScreeningResult> {
    return request('/screening/diabetes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async screenCardiovascular(data: any): Promise<ScreeningResult> {
    return request('/screening/cardiovascular', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async screenHypertension(data: any): Promise<ScreeningResult> {
    return request('/screening/hypertension', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async screenKidney(data: any): Promise<ScreeningResult> {
    return request('/screening/kidney', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async screenSymptoms(data: SymptomScreeningFormData): Promise<ScreeningResult> {
    return request('/screening/symptoms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteScreening(id: string): Promise<{ message: string; id: string }> {
    return request(`/screening/${id}`, {
      method: 'DELETE',
    });
  },

  async deleteAllHealthData(): Promise<{ message: string; screenings_removed: number; measurements_removed: number }> {
    return request('/users/me/health-data', {
      method: 'DELETE',
    });
  },

  async deleteAccount(): Promise<{ message: string; user_id: string }> {
    return request('/users/me', {
      method: 'DELETE',
    });
  },

  async getScreeningHistory(diseaseType?: string, search?: string): Promise<ScreeningHistoryItem[]> {
    const params = new URLSearchParams();
    if (diseaseType && diseaseType !== 'all') params.append('disease_type', diseaseType);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/screening/history${qs}`);
  },

  async getScreeningDetail(id: string): Promise<ScreeningResult> {
    return request(`/screening/details/${id}`);
  },

  async compareScreenings(id1?: string, id2?: string): Promise<ScreeningComparison> {
    const params = new URLSearchParams();
    if (id1) params.append('id1', id1);
    if (id2) params.append('id2', id2);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/screening/compare${qs}`);
  },

  async getModelsMetadata(): Promise<Record<string, any>> {
    return request('/screening/models/metadata');
  },

  // Health Data & Measurements
  async logMeasurement(data: { measurement_type: string; value: number; unit: string; notes?: string }): Promise<HealthMeasurement> {
    return request('/health/measurements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMeasurements(): Promise<HealthMeasurement[]> {
    return request('/health/measurements');
  },

  async getTrends(timeframe: string = '30d'): Promise<HealthTrends> {
    return request(`/health/trends?timeframe=${timeframe}`);
  },

  async getDashboardOverview(timeframe: string = '30d'): Promise<any> {
    return request(`/health/dashboard-overview?timeframe=${timeframe}`);
  },

  // Daily Check-ins
  async getTodayCheckin(): Promise<DailyCheckIn | null> {
    return request('/checkins/today');
  },

  async submitCheckin(data: {
    mood: string;
    energy_level: number;
    stress_level: string;
    sleep_hours: number;
    symptoms?: string[];
    physical_activity_mins: number;
    notes?: string;
  }): Promise<DailyCheckIn> {
    return request('/checkins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getCheckinHistory(days: number = 14): Promise<DailyCheckIn[]> {
    return request(`/checkins?days=${days}`);
  },

  // Health Goals
  async getGoals(): Promise<HealthGoal[]> {
    return request('/goals');
  },

  async createGoal(data: {
    title: string;
    category: string;
    target_value: number;
    current_value?: number;
    unit: string;
    deadline?: string;
  }): Promise<HealthGoal> {
    return request('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateGoal(id: string, data: Partial<HealthGoal>): Promise<HealthGoal> {
    return request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteGoal(id: string): Promise<{ success: boolean }> {
    return request(`/goals/${id}`, {
      method: 'DELETE',
    });
  },

  // Reminders
  async getReminders(): Promise<HealthReminder[]> {
    return request('/reminders');
  },

  async toggleReminder(id: string): Promise<HealthReminder> {
    return request(`/reminders/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  async createReminder(data: {
    title: string;
    category: string;
    time_of_day: string;
    frequency: string;
  }): Promise<HealthReminder> {
    return request('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteReminder(id: string): Promise<{ success: boolean }> {
    return request(`/reminders/${id}`, {
      method: 'DELETE',
    });
  },

  // AI Health Insights
  async getInsights(): Promise<{ insights: HealthInsight[]; weekly_summary: WeeklySummary }> {
    return request('/insights');
  },

  // Timeline
  async getTimeline(eventType?: string): Promise<TimelineEvent[]> {
    const qs = eventType && eventType !== 'all' ? `?event_type=${eventType}` : '';
    return request(`/timeline${qs}`);
  },

  // AI Assistant Chat & Lab Report Analyzer
  async chatWithAssistant(message: string, history?: { role: string; content: string }[]): Promise<{
    reply: string;
    suggested_followups: string[];
    disclaimer: string;
  }> {
    return request('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history: history || [] }),
    });
  },

  async analyzeReport(filename?: string): Promise<LabReportAnalysis> {
    return request('/assistant/analyze-report', {
      method: 'POST',
      body: JSON.stringify({ filename: filename || 'comprehensive_metabolic_panel.pdf' }),
    });
  },

  // Reports
  async uploadReport(formData: FormData): Promise<ReportAnalysis> {
    const headers = {
      ...getAuthHeader(),
    };
    const response = await fetch(`${API_BASE}/reports/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      let errorMsg = 'Failed to upload report';
      try {
        const errorData = await response.json();
        if (errorData?.detail) {
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {}
      throw new Error(errorMsg);
    }
    return response.json();
  },

  async getReportsList(): Promise<ReportHistoryItem[]> {
    return request('/reports/list');
  },

  async getReportDetails(id: string): Promise<ReportAnalysis> {
    return request(`/reports/details/${id}`);
  },

  async runScreeningFromReport(documentId: string, diseaseType: string): Promise<ScreeningResult> {
    return request(`/reports/${documentId}/run-screening`, {
      method: 'POST',
      body: JSON.stringify({ disease_type: diseaseType }),
    });
  },

  async getReportSummary(id: string): Promise<any> {
    return request(`/reports/${id}/summary`);
  },

  getPdfDownloadUrl(id: string): string {
    return `${API_BASE}/reports/${id}/pdf`;
  },
};
