import React from 'react';
import { Info, ShieldAlert } from 'lucide-react';

interface DisclaimerBannerProps {
  variant?: 'safety' | 'footer' | 'compact';
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  variant = 'safety',
  className = ''
}) => {
  if (variant === 'footer') {
    return (
      <div className={`p-3 bg-[#F1F5F9] border-t border-[#E2E8F0] text-center text-xs text-[#64748B] ${className}`}>
        <p className="max-w-4xl mx-auto leading-relaxed">
          <strong className="text-[#334155]">Aviso Institucional:</strong> As opiniões expressas neste blog são pessoais e não representam posição oficial do CENIPA, ANAC ou da Força Aérea Brasileira.
        </p>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-start gap-2.5 p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E40AF] ${className}`}>
        <Info className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
        <span>
          <strong>Aviso:</strong> As opiniões expressas neste blog são pessoais e não representam posição oficial do CENIPA, ANAC ou da Força Aérea Brasileira.
        </span>
      </div>
    );
  }

  return (
    <div className={`my-6 p-4 md:p-5 rounded-xl bg-[#F0F7FF] border-l-4 border-l-[#2563EB] border border-[#DBEAFE] shadow-sm ${className}`}>
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-[#DBEAFE] text-[#1D4ED8] flex-shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-sm text-[#1E3A8A]">
          <h4 className="font-bold text-[#0F172A] flex items-center gap-1.5 font-['Outfit'] tracking-wide uppercase text-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-[#2563EB]" />
            Aviso de Isenção de Responsabilidade
          </h4>
          <p className="leading-relaxed text-[#334155] text-xs md:text-sm">
            As opiniões expressas neste blog são de caráter estritamente pessoal e técnico-educacional. Elas não representam posição oficial, parecer normativo ou diretriz vinculante do <strong>CENIPA</strong> (Centro de Investigação e Prevenção de Acidentes Aeronáuticos), <strong>ANAC</strong> (Agência Nacional de Aviação Civil) ou da <strong>Força Aérea Brasileira (FAB)</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
