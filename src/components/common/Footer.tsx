import React, { useState } from 'react';
import { Logo } from './Logo';
import { useBlog } from '../../context/BlogContext';
import { INITIAL_CONTACT_INFO } from '../../data/seedData';
import {
  ShieldCheck,
  Linkedin,
  Instagram,
  Mail,
  ArrowUp,
  Info,
  X,
  Phone
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate, contactInfo } = useBlog();
  const [modalText, setModalText] = useState<{ title: string; body: string } | null>(null);

  const info = contactInfo || INITIAL_CONTACT_INFO;

  // Format clean digits for WhatsApp
  const rawPhone = info.phoneWhatsapp || '5511999999999';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}`;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.location.reload();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <footer className="mt-20 bg-white dark:bg-[#070F1E] border-t border-[#E2E8F0] dark:border-slate-800 text-[#475569] dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#F1F5F9] dark:border-slate-800">
          {/* Logo */}
          <button
            onClick={handleGoHome}
            className="flex items-center text-left focus:outline-hidden cursor-pointer"
            aria-label="Alexandre Andrade Aviation - Atualizar Início"
          >
            <Logo variant="compact" size="md" />
          </button>

          {/* Nav & Social Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs md:text-sm font-medium">
            {/* Dynamic LinkedIn */}
            {info.linkedinUrl && (
              <a
                href={info.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#0E2954] dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                title="LinkedIn Oficial"
              >
                <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                <span>LinkedIn</span>
              </a>
            )}

            {/* Dynamic Instagram */}
            {info.instagramUrl && (
              <a
                href={info.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-600 dark:hover:text-pink-400 flex items-center gap-1.5 transition-colors"
                title="Instagram Oficial"
              >
                <Instagram className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                <span>Instagram</span>
              </a>
            )}

            {/* Dynamic WhatsApp */}
            {info.phoneWhatsapp && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
                title="WhatsApp Oficial"
              >
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            )}

            <button
              onClick={() => navigate('about')}
              className="hover:text-[#0E2954] dark:hover:text-blue-400 transition-colors"
            >
              Sobre o Autor
            </button>

            <button
              onClick={() => navigate('contact')}
              className="hover:text-[#0E2954] dark:hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              Contato
            </button>

            <button
              onClick={() => navigate('terms')}
              className="hover:text-[#0E2954] dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Termos de Uso
            </button>

            <button
              onClick={() => navigate('privacy')}
              className="hover:text-[#0E2954] dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Política de Privacidade
            </button>
          </div>

          {/* Back to top button */}
          <button
            onClick={scrollToTop}
            className="p-2 rounded-full border border-[#E2E8F0] dark:border-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 text-[#64748B] dark:text-slate-400 hover:text-[#0E2954] dark:hover:text-white transition-all cursor-pointer"
            aria-label="Voltar ao topo"
            title="Voltar ao topo"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom meta row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#475569] dark:text-slate-400">
          <p>© {new Date().getFullYear()} Alexandre Andrade. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2 text-[#0A192F] dark:text-blue-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#1D4ED8] dark:text-blue-400" />
            <span className="font-['Outfit'] tracking-wider uppercase text-[11px]">Safety First • SIPAER Culture</span>
          </div>
        </div>
      </div>

      {/* Mandatory Institutional Disclaimer Box */}
      <div className="bg-[#F1F5F9] dark:bg-[#050C18] border-t border-[#CBD5E1] dark:border-slate-800/80 py-3.5 px-4 text-center">
        <p className="max-w-4xl mx-auto text-xs text-[#334155] dark:text-slate-300 leading-relaxed">
          <strong className="text-[#0A192F] dark:text-white">Aviso Institucional:</strong> As opiniões expressas neste blog são pessoais e não representam posição oficial do CENIPA, ANAC ou da Força Aérea Brasileira.
        </p>
      </div>

      {/* Simple Policy Modal */}
      {modalText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0B1528] rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#1D4ED8] dark:text-blue-400">
                <Info className="w-5 h-5" />
                <h3 className="text-base font-bold font-['Outfit'] text-slate-900 dark:text-white">
                  {modalText.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalText(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {modalText.body}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setModalText(null)}
                className="px-4 py-1.5 bg-[#0A192F] dark:bg-blue-600 text-white text-xs font-bold rounded-lg font-['Outfit']"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
