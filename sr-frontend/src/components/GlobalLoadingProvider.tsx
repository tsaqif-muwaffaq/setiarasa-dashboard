import { createContext, useContext, useState, useCallback, type ReactNode, useRef, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

interface GlobalLoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  isLoading: boolean;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within GlobalLoadingProvider');
  }
  return context;
}

interface GlobalLoadingProviderProps {
  children: ReactNode;
}

export function GlobalLoadingProvider({ children }: GlobalLoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Memuat data...');
  // ── FIX: Gunakan ReturnType dari setTimeout ──
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingRef = useRef(false);

  const showLoading = useCallback((msg?: string) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    setMessage(msg || 'Memuat data...');
    isLoadingRef.current = true;

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoadingRef.current) {
        setIsLoading(true);
      }
    }, 300);
  }, []);

  const hideLoading = useCallback(() => {
    isLoadingRef.current = false;

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <GlobalLoadingContext.Provider value={{ showLoading, hideLoading, isLoading }}>
      {children}
      {isLoading && <LoadingScreen message={message} />}
    </GlobalLoadingContext.Provider>
  );
}