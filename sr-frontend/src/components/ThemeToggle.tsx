import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? 'Aktifkan light mode' : 'Aktifkan dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="relative text-muted-foreground hover:text-foreground transition-colors duration-300"
    >
      <Sun
        className={cn(
          'absolute size-5 transition-all duration-300',
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        )}
      />
      <Moon
        className={cn(
          'absolute size-5 transition-all duration-300',
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        )}
      />
      <span className="sr-only">
        {isDark ? 'Aktifkan light mode' : 'Aktifkan dark mode'}
      </span>
    </Button>
  );
}
