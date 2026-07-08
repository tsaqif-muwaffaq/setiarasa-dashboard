import { Suspense, lazy, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/ThemeProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { GlobalLoadingProvider } from '@/components/GlobalLoadingProvider';
import './index.css';

const App = lazy(() => import('./App'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

// ── Loading Screen Component (Inline) ──
function LoadingScreen({ message = 'Memuat data...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#18181B]/95 backdrop-blur-sm">
      <div className="absolute inset-0 bg-pattern bg-dot-grid opacity-20 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#7F1D1D]/10 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#C9A227]/10 rounded-full blur-3xl animate-float-delay-1" />
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-24 h-24 rounded-2xl border-4 border-[#FFFDF7] bg-[#FFFDF7] p-2 shadow-[8px_8px_0px_#C9A227] flex items-center justify-center animate-float">
          <img 
            src="/logo.png" 
            alt="Setia Rasa" 
            className="w-full h-full object-contain" 
          />
        </div>
        
        <h1 className="text-2xl font-black text-[#FFFDF7] tracking-tight">
          Setia Rasa
        </h1>
        
        <div className="relative mt-2">
          <div className="w-12 h-12 rounded-full border-4 border-[#FFFDF7]/20 border-t-[#C9A227] animate-spin shadow-[0_0_30px_rgba(201,162,39,0.15)]" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-r-[#7F1D1D]/30 animate-spin" style={{ animationDuration: '1.5s' }} />
        </div>
        
        <p className="text-sm font-bold text-[#FFFDF7]/70 animate-pulse-soft mt-2">
          {message}
        </p>
        
        <div className="flex gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-[#C9A227] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#C9A227] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#C9A227] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        
        <p className="text-[10px] font-bold text-[#FFFDF7]/30 mt-4 tracking-wider">
          POS System v2.0
        </p>
      </div>
    </div>
  );
}

function AppWrapper() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Mempersiapkan sistem..." />;
  }

  return (
    <Suspense fallback={<LoadingScreen message="Memuat aplikasi..." />}>
      <App />
    </Suspense>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <GlobalLoadingProvider>
            <AppWrapper />
          </GlobalLoadingProvider>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);