import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { Logo } from './Logo';

export const BrandBanner: React.FC = () => {
  const handleGoHome = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.location.reload();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#070F1E] border-b border-[#E2E8F0] dark:border-slate-800/80 transition-colors py-4 sm:py-6 lg:py-8 mb-6 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Prominent Centered Aviation Brand Logo */}
          <button
            type="button"
            onClick={handleGoHome}
            className="group cursor-pointer focus:outline-hidden flex flex-col items-center justify-center transition-transform duration-300 hover:scale-[1.02]"
            title="Alexandre Andrade Aviation - Atualizar Início"
            aria-label="Alexandre Andrade Aviation - Atualizar Início"
          >
            <Logo variant="banner" />
          </button>
        </div>
      </div>
    </div>
  );
};


