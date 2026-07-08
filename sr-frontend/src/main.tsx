import { Suspense, lazy, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/ThemeProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { GlobalLoadingProvider } from '@/components/GlobalLoadingProvider';
import LoadingScreenGlobal from '@/components/LoadingScreenGlobal';
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

function AppWrapper() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreenGlobal message="Mempersiapkan sistem..." />;
  }

  return (
    <Suspense fallback={<LoadingScreenGlobal message="Memuat aplikasi..." />}>
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