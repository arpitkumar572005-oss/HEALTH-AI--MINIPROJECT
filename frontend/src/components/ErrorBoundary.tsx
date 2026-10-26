import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, LogOut, LayoutDashboard } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetSession = () => {
    try {
      localStorage.removeItem('healthai_token');
      localStorage.removeItem('healthai_user');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans selection:bg-blue-100">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E6EAF0] shadow-md p-6 sm:p-8 text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 text-[#DC2626] flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h1>
              <p className="text-xs text-[#667085] leading-relaxed">
                HealthAI encountered an unexpected error while displaying this view. Don't worry, your health data and screenings are safe.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-[#F7F9FC] border border-[#E6EAF0] rounded-xl p-3 text-[11px] text-[#DC2626] font-mono break-words max-h-32 overflow-y-auto">
                <span className="font-semibold block text-[#667085] text-[10px] uppercase tracking-wider mb-1">
                  Error Details:
                </span>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-[#1677FF] hover:bg-[#1366DB] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleResetSession}
                className="w-full py-2 px-4 bg-white hover:bg-slate-50 text-[#667085] hover:text-[#172033] border border-[#E6EAF0] text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Clear Session & Restart</span>
              </button>
            </div>

            <p className="text-[10px] text-[#98A2B3]">
              If this issue persists, please verify the backend server is running at http://127.0.0.1:8000.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
