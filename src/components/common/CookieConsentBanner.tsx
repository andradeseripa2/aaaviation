import React, { useState, useEffect } from 'react';
import { Cookie, Check } from 'lucide-react';
import { safeGetJSON, safeSetJSON } from '../../lib/safeStorage';

const COOKIE_CONSENT_KEY = 'aaa_cookie_consent_v1';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const savedConsent = safeGetJSON<'accepted' | 'essential' | null>(COOKIE_CONSENT_KEY, null);
    if (!savedConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    safeSetJSON(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    safeSetJSON(COOKIE_CONSENT_KEY, 'essential');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Aviso de Privacidade e Cookies"
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-5 pointer-events-none"
      style={{ contain: 'layout paint' }}
    >
      <div className="max-w-4xl mx-auto pointer-events-auto bg-[#0A192F] dark:bg-[#070F1E] text-white rounded-2xl border border-blue-800 shadow-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Text & Icon */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-900/80 border border-blue-700 flex items-center justify-center shrink-0 text-amber-400">
              <Cookie className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold font-['Outfit'] text-white">
                  Privacidade & Sessão Conectada (LGPD)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 border border-blue-600 text-blue-200 font-bold uppercase">
                  Cookies
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed max-w-2xl">
                Utilizamos armazenamento local para manter sua sessão conectada com segurança, lembrar seus artigos salvos e preferências.
              </p>
            </div>
          </div>

          {/* Action Buttons with 44px min touch target */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleAcceptEssential}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold font-['Outfit'] border border-slate-600 transition-colors cursor-pointer"
            >
              Apenas Essenciais
            </button>

            <button
              type="button"
              onClick={handleAcceptAll}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-['Outfit'] shadow-md transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aceitar Todos</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
