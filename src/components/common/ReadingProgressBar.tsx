import React, { useEffect, useState } from 'react';

interface ReadingProgressBarProps {
  targetRef?: React.RefObject<HTMLElement | null>;
}

export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({ targetRef }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (targetRef?.current) {
        const el = targetRef.current;
        const rect = el.getBoundingClientRect();
        const elementHeight = el.offsetHeight;
        const windowHeight = window.innerHeight;
        
        // Calculate scroll relative to the element
        const scrolled = -rect.top;
        const maxScroll = elementHeight - windowHeight;
        
        if (scrolled <= 0) {
          setProgress(0);
        } else if (scrolled >= maxScroll) {
          setProgress(100);
        } else {
          const pct = Math.min(100, Math.max(0, (scrolled / maxScroll) * 100));
          setProgress(pct);
        }
      } else {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight > 0) {
          const currentProgress = (window.scrollY / totalHeight) * 100;
          setProgress(Math.min(100, Math.max(0, currentProgress)));
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetRef]);

  if (progress <= 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] transition-all duration-150 ease-out shadow-[0_0_10px_rgba(37,99,235,0.6)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
