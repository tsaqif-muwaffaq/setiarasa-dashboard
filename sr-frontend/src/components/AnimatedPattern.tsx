import { useEffect, useState } from 'react';

export const AnimatedPattern = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const dark = document.documentElement.classList.contains('dark');
      setIsDark(dark);
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="pattern-layer">
      {/* LAYER 1: GRID */}
      <div className="pattern-grid" style={{ 
        opacity: isDark ? 0.9 : 0.8,
        transition: 'opacity 0.5s ease'
      }} />
      
      {/* LAYER 2: DOTS */}
      <div className="pattern-dots" style={{ 
        opacity: isDark ? 0.8 : 0.7,
        transition: 'opacity 0.5s ease'
      }} />
      
      {/* LAYER 3: DIAGONAL */}
      <div className="pattern-diagonal" style={{ 
        opacity: isDark ? 0.7 : 0.6,
        transition: 'opacity 0.5s ease'
      }} />
      
      {/* LAYER 4: STARS */}
      <div className="pattern-stars" style={{ 
        opacity: isDark ? 0.6 : 0.5,
        transition: 'opacity 0.5s ease'
      }} />
      
      {/* LAYER 5: CROSSHATCH */}
      <div className="pattern-cross" style={{ 
        opacity: isDark ? 0.5 : 0.4,
        transition: 'opacity 0.5s ease'
      }} />
    </div>
  );
};