import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = 'setiarasa-theme';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const isTheme = (value: string | null): value is Theme =>
  value === 'light' || value === 'dark';

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(storedTheme) ? storedTheme : null;
  } catch {
    return null;
  }
};

const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [hasStoredPreference, setHasStoredPreference] = useState(
    () => getStoredTheme() !== null
  );
  const [theme, setThemeState] = useState<Theme>(
    () => getStoredTheme() ?? getSystemTheme()
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (hasStoredPreference || typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setThemeState(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [hasStoredPreference]);

  const setTheme = useCallback((nextTheme: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Theme still changes even if localStorage is unavailable.
    }

    setHasStoredPreference(true);
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
