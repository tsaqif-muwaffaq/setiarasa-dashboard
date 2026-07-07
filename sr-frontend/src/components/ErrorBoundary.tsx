import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary menangkap error render:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#FFFDF7] text-[#18181B] dark:bg-[#18181B] dark:text-[#FFFDF7] flex items-center justify-center p-4">
          <div className="w-full max-w-lg border-4 border-[#18181B] bg-[#FFFDF7] p-5 shadow-[8px_8px_0px_#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:shadow-[8px_8px_0px_#FFFDF7]">
            <h1 className="text-xl font-black mb-2">Terjadi kesalahan pada tampilan</h1>
            <p className="text-sm font-bold text-[#18181B]/70 dark:text-[#FFFDF7]/70 mb-4">
              Detail error di bawah ini bisa dipakai untuk debug di browser HP.
            </p>

            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words border-2 border-[#18181B] bg-[#E7D9B8] p-3 text-xs font-bold text-[#18181B] dark:border-[#FFFDF7] dark:bg-[#18181B] dark:text-[#FFFDF7]">
              {this.state.error.message}
              {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
              {this.state.errorInfo?.componentStack ? `\n\nComponent stack:${this.state.errorInfo.componentStack}` : ''}
            </pre>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 w-full border-4 border-[#18181B] bg-[#7F1D1D] px-5 py-3 font-black text-[#FFFDF7] shadow-[6px_6px_0px_#18181B] transition-all active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#18181B] dark:border-[#FFFDF7] dark:shadow-[6px_6px_0px_#FFFDF7]"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
