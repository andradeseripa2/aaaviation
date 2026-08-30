import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { useAuth } from '../../context/AuthContext';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { INITIAL_ABOUT_PAGE_DATA } from '../../data/seedData';
import { resolveImageUrl, useResolvedImageUrl, getMediaDataUrl } from '../../services/mediaService';
import {
  ShieldCheck,
  Search,
  GraduationCap,
  Award,
  CheckCircle2,
  PlaneTakeoff,
  ArrowRight
} from 'lucide-react';

export const AboutAuthor: React.FC = () => {
  const { navigate, aboutData } = useBlog();

  const data = aboutData || INITIAL_ABOUT_PAGE_DATA;
  const fallbackAuthorPhoto = '/author.webp';
  const rawAuthorPhoto = data.photoUrl || fallbackAuthorPhoto;
  const authorPhoto = useResolvedImageUrl(rawAuthorPhoto, fallbackAuthorPhoto);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Top Hero Section */}
      <div className="bg-white dark:bg-[#070F1E] border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 sm:p-10 lg:p-12 mb-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column Bio */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 text-xs font-bold font-['Outfit'] uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              {data.heroBadge || 'Perfil Técnico & Biografia'}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A192F] dark:text-white font-['Outfit'] tracking-tight">
              {data.authorName || 'Alexandre Andrade'}
            </h1>

            {data.heroHighlight && (
              <p className="text-base sm:text-lg font-medium text-[#1E3A8A] dark:text-blue-300 leading-relaxed">
                {data.heroHighlight}
              </p>
            )}

            {data.bioParagraphs && data.bioParagraphs.map((para, idx) => (
              <p
                key={idx}
                className={
                  idx === 0
                    ? 'text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed'
                    : 'text-sm text-[#64748B] dark:text-slate-400 leading-relaxed'
                }
              >
                {para}
              </p>
            ))}
          </div>

          {/* Right Column Photo Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-[#CBD5E1] dark:border-slate-700 shadow-lg bg-[#0A192F]">
              <img
                src={authorPhoto}
                alt={`${data.authorName} - Especialista em Manutenção & Investigador SIPAER`}
                className="w-full h-96 object-cover object-center filter grayscale contrast-125"
                onError={async e => {
                  const target = e.target as HTMLImageElement;
                  if (rawAuthorPhoto && (rawAuthorPhoto.startsWith('/api/media/') || rawAuthorPhoto.startsWith('media:'))) {
                    const fromFirestore = await getMediaDataUrl(rawAuthorPhoto);
                    if (fromFirestore && fromFirestore !== target.src) {
                      target.src = fromFirestore;
                      return;
                    }
                  }
                  target.src = fallbackAuthorPhoto;
                }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F] via-[#0A192F]/20 to-transparent opacity-95" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-xs font-mono tracking-widest text-[#93C5FD] uppercase">
                  {data.photoBadge || 'INSPETOR ILA • SIPAER'}
                </p>
                <p className="text-lg font-bold font-['Outfit']">{data.authorName}</p>
                <p className="text-[11px] text-slate-300">{data.photoSubtitle || 'Força Aérea Brasileira & Segurança de Voo'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Pillars Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Card 1: Certificação SIPAER */}
        <div className="p-8 bg-white dark:bg-[#070F1E] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#1D4ED8] dark:text-blue-400">
              <div className="p-2.5 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                {data.pillar1Title || 'Certificação SIPAER'}
              </h3>
            </div>
            <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
              {data.pillar1Description}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#F1F5F9] dark:border-slate-800 flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400">
            <span className="font-mono">{data.pillar1FooterLeft || 'Elemento Credenciado'}</span>
            <span className="text-[#1D4ED8] dark:text-blue-400 font-bold">{data.pillar1FooterRight || 'Investigação e Prevenção'}</span>
          </div>
        </div>

        {/* Card 2: Investigação & Prevenção (Dark Navy) */}
        <div className="p-8 bg-[#0A192F] text-white rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#93C5FD]">
              <div className="p-2.5 rounded-xl bg-[#1E293B] text-[#93C5FD]">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-['Outfit']">
                {data.pillar2Title || 'Investigação & Prevenção'}
              </h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {data.pillar2Description}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">{data.pillar2FooterLeft || 'Prevenção Sistêmica'}</span>
            <span className="text-[#93C5FD] font-semibold">{data.pillar2FooterRight || 'Técnica & Não-Punitiva'}</span>
          </div>
        </div>
      </div>

      {/* Aeronaves e Vivência Técnica */}
      <div className="bg-white dark:bg-[#070F1E] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-6 sm:p-8 mb-12 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <PlaneTakeoff className="w-6 h-6 text-[#0E2954] dark:text-blue-400" />
          <div>
            <h3 className="text-xl font-extrabold text-[#0A192F] dark:text-white font-['Outfit']">
              {data.aircraftSectionTitle || 'Modelos de Aeronaves & Experiência Prática'}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              {data.aircraftSectionSubtitle || 'Vivência técnica em vetores turboélice, transporte pressurizado e caça a jato da FAB'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.aircraftList && data.aircraftList.map((ac, idx) => (
            <div
              key={ac.id || idx}
              className="p-5 rounded-xl bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                {ac.imageUrl && (
                  <div className="h-32 w-full rounded-lg overflow-hidden mb-3 border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800">
                    <img
                      src={ac.imageUrl}
                      alt={ac.model}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <span className="text-[11px] font-mono font-bold text-[#1D4ED8] dark:text-blue-400 uppercase">
                  {ac.role}
                </span>
                <h4 className="text-base font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                  {ac.model}
                </h4>
                <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed">
                  {ac.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Qualifications List */}
      <div className="bg-white dark:bg-[#070F1E] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-6 sm:p-8 mb-12 shadow-xs">
        <h3 className="text-xl font-extrabold text-[#0A192F] dark:text-white font-['Outfit'] mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#0E2954] dark:text-blue-400" />
          {data.credentialsSectionTitle || 'Credenciais e Formação Profissional'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.credentialsList && data.credentialsList.map((cred, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50 transition-colors">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-[#334155] dark:text-slate-300 leading-relaxed">{cred}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Call to action to read blog / contact */}
      <div className="p-8 bg-gradient-to-r from-[#0A192F] to-[#0E2954] text-white rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
        <div>
          <h4 className="text-xl font-bold font-['Outfit']">
            {data.ctaTitle || 'Quer conversar sobre consultoria ou segurança de voo?'}
          </h4>
          <p className="text-sm text-slate-300 mt-1">
            {data.ctaSubtitle || 'Entre em contato para palestras, consultorias técnicas e análises especializadas.'}
          </p>
        </div>
        <button
          onClick={() => navigate('contact')}
          className="px-6 py-3 bg-white text-[#0A192F] hover:bg-[#F1F5F9] font-bold text-sm rounded-xl transition-colors shrink-0 flex items-center gap-2 font-['Outfit'] cursor-pointer"
        >
          <span>{data.ctaButtonText || 'Fale Conosco'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Institutional Disclaimer */}
      <DisclaimerBanner variant="safety" />
    </div>
  );
};
