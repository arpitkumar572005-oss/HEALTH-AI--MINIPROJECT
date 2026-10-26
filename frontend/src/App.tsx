import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SymptomDetectorPage } from './pages/SymptomDetectorPage';
import { DiseasePredictionPage } from './pages/DiseasePredictionPage';
import { InsightsPage } from './pages/InsightsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScreeningResult } from './types';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, demoLogin } = useAuth();

  // Unauthenticated subview: 'landing' | 'login' | 'register' | 'privacy' | 'terms'
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register' | 'privacy' | 'terms'>('landing');

  // Authenticated current tab (7 primary tabs + legal pages)
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Initial disease selection when moving to DiseasePredictionPage
  const [initialDisease, setInitialDisease] = useState<'diabetes' | 'cardiovascular' | 'kidney'>('diabetes');

  // Selected assessment ID for deep linking into InsightsPage
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] flex flex-col items-center justify-center">
        <div className="w-9 h-9 border-2 border-teal-200 border-t-[#0F766E] rounded-full animate-spin mb-3" />
        <span className="text-xs font-semibold text-[#64748B]">Initializing HealthAI Platform...</span>
      </div>
    );
  }

  // Unauthenticated user views
  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <LoginPage
          onGoToRegister={() => setAuthView('register')}
          onBackToHome={() => setAuthView('landing')}
        />
      );
    }
    if (authView === 'register') {
      return (
        <RegisterPage
          onGoToLogin={() => setAuthView('login')}
          onBackToHome={() => setAuthView('landing')}
        />
      );
    }
    if (authView === 'privacy') {
      return (
        <div className="min-h-screen bg-[#F7F9FA] p-4 sm:p-8">
          <PrivacyPolicyPage onBack={() => setAuthView('landing')} />
        </div>
      );
    }
    if (authView === 'terms') {
      return (
        <div className="min-h-screen bg-[#F7F9FA] p-4 sm:p-8">
          <TermsPage onBack={() => setAuthView('landing')} />
        </div>
      );
    }
    return (
      <LandingPage
        onStartScreening={async () => {
          await demoLogin('himanshu');
          setCurrentTab('predictions');
        }}
        onLogin={() => setAuthView('login')}
        onRegister={() => setAuthView('register')}
        onDemoAccess={async () => {
          await demoLogin('himanshu');
          setCurrentTab('dashboard');
        }}
      />
    );
  }

  // Authenticated Application Handlers
  const handleStartDiseaseAssessment = (disease?: string) => {
    if (disease === 'diabetes' || disease === 'cardiovascular' || disease === 'kidney') {
      setInitialDisease(disease);
    } else {
      setInitialDisease('diabetes');
    }
    setCurrentTab('predictions');
  };

  const handleViewAssessmentDetail = (id: string) => {
    setSelectedAssessmentId(id);
    setCurrentTab('insights');
  };

  return (
    <AppShell currentTab={currentTab} onSelectTab={setCurrentTab}>
      <ErrorBoundary key={currentTab} fallbackTitle={`Error loading ${currentTab}`}>
        {/* 1. Dashboard */}
        {currentTab === 'dashboard' && (
          <DashboardPage
            onStartScreening={handleStartDiseaseAssessment}
            onViewScreeningDetail={handleViewAssessmentDetail}
            onViewAllHistory={() => setCurrentTab('history')}
            onNavigateTab={setCurrentTab}
          />
        )}

        {/* 2. Symptom Detector */}
        {currentTab === 'symptoms' && (
          <SymptomDetectorPage
            onViewInsights={() => setCurrentTab('insights')}
            onViewHistory={() => setCurrentTab('history')}
          />
        )}

        {/* 3. Disease Prediction */}
        {currentTab === 'predictions' && (
          <DiseasePredictionPage
            initialDisease={initialDisease}
            onBackToDashboard={() => setCurrentTab('dashboard')}
            onViewInsights={() => setCurrentTab('insights')}
          />
        )}

        {/* 4. Explainable Health Insights */}
        {currentTab === 'insights' && (
          <InsightsPage
            selectedAssessmentId={selectedAssessmentId}
            onNavigateTab={setCurrentTab}
          />
        )}

        {/* 5. Health History */}
        {currentTab === 'history' && (
          <HistoryPage
            onViewScreeningDetail={handleViewAssessmentDetail}
            onStartNewScreening={() => handleStartDiseaseAssessment('diabetes')}
            onNavigateTab={setCurrentTab}
          />
        )}

        {/* 6. My Profile */}
        {currentTab === 'profile' && <ProfilePage />}

        {/* 7. Settings */}
        {currentTab === 'settings' && (
          <SettingsPage onNavigateTab={setCurrentTab} />
        )}

        {/* Dedicated Legal Pages */}
        {currentTab === 'privacy-policy' && (
          <PrivacyPolicyPage onBack={() => setCurrentTab('dashboard')} />
        )}

        {currentTab === 'terms-and-conditions' && (
          <TermsPage onBack={() => setCurrentTab('dashboard')} />
        )}
      </ErrorBoundary>
    </AppShell>
  );
};
