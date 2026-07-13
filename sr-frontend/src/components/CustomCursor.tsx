import { useEffect, useState } from 'react';

interface CustomCursorProps {
  enabled?: boolean;
}

export const CustomCursor = ({ enabled = true }: CustomCursorProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHover, setIsHover] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Jika tidak enabled, jangan tambahkan event listener
    if (!enabled) {
      // Reset cursor ke default
      document.body.style.cursor = 'default';
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
      // Sembunyikan cursor default
      document.body.style.cursor = 'none';
    };

    const onMouseLeave = () => {
      setIsVisible(false);
      document.body.style.cursor = 'default';
    };

    const onMouseEnter = () => {
      setIsVisible(true);
      document.body.style.cursor = 'none';
    };

    const onElementHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.matches(
        'button, a, input, select, textarea, [role="button"], .cursor-pointer, .hover-scale-bounce, .card-lift, .card-lift-premium, [onclick]'
      );
      setIsHover(!!isInteractive);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mouseover', onElementHover);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseover', onElementHover);
      // Reset cursor
      document.body.style.cursor = 'default';
    };
  }, [enabled]);

  // Jika tidak enabled atau di mobile, return null
  if (typeof window === 'undefined' || !enabled || window.innerWidth < 768) return null;

  return (
    <div
      id="custom-cursor"
      className={isHover ? 'hover' : ''}
      style={{
        transform: `translate(${position.x - 16}px, ${position.y - 16}px)`,
        opacity: isVisible ? 1 : 0,
        pointerEvents: 'none',
        position: 'fixed',
        zIndex: 99999,
        mixBlendMode: 'difference',
        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div 
        className="cursor-ring"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isHover ? '48px' : '32px',
          height: isHover ? '48px' : '32px',
          border: `2px solid ${isHover ? '#7F1D1D' : '#C9A227'}`,
          borderRadius: '50%',
          transition: 'width 0.3s, height 0.3s, border-color 0.3s, border-width 0.3s',
        }}
      />
      <div 
        className="cursor-dot"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isHover ? '10px' : '6px',
          height: isHover ? '10px' : '6px',
          background: isHover ? '#7F1D1D' : '#C9A227',
          borderRadius: '50%',
          transition: 'width 0.2s, height 0.2s, background 0.2s',
        }}
      />
    </div>
  );
};