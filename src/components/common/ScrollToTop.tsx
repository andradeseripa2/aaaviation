import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (scrollY > 280) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      if (totalHeight > 0) {
        const pct = Math.min(100, Math.max(0, (scrollY / totalHeight) * 100));
        setScrollProgress(pct);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <button
        type="button"
        onClick={scrollToTop}
        className="relative group flex items-center justify-center w-11 h-11 rounded-full bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-slate-700 text-[#0A192F] dark:text-slate-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Voltar ao topo"
        aria-label="Voltar ao topo da página"
      >
        {/* Circular Progress Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r="19"
            className="stroke-slate-200 dark:stroke-slate-800 fill-none"
            strokeWidth="2"
          />
          <circle
            cx="22"
            cy="22"
            r="19"
            className="stroke-[#1D4ED8] dark:stroke-blue-400 fill-none transition-all duration-150"
            strokeWidth="2.5"
            strokeDasharray={119.38}
            strokeDashoffset={119.38 - (119.38 * scrollProgress) / 100}
            strokeLinecap="round"
          />
        </svg>

        <ArrowUp className="w-4 h-4 text-[#1D4ED8] dark:text-blue-400 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
};
