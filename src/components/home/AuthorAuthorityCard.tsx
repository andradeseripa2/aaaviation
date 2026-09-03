import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { useAuth } from '../../context/AuthContext';
import { Award, ArrowRight, ShieldCheck, Wrench, FileText, ChevronRight } from 'lucide-react';
import { INITIAL_ABOUT_PAGE_DATA } from '../../data/seedData';
import { resolveImageUrl, useResolvedImageUrl, getMediaDataUrl } from '../../services/mediaService';
import { isPostPublishedAndActive } from '../../lib/scheduleUtils';

export const AuthorAuthorityCard: React.FC = () => {
  const { navigate, aboutData, posts } = useBlog();

  const data = aboutData || INITIAL_ABOUT_PAGE_DATA;

  const authorName = data?.homeAuthorityTitle || data?.authorName || 'Alexandre Andrade';
  const authorRole = data?.homeAuthorityRole || data?.heroHighlight || 'Especialista em Manutenção Aeronáutica & Investigação SIPAER';
  const authorTag = data?.homeAuthorityTag || 'Autor & Editor';
  const authorBio = data?.homeAuthorityBio || 'Mais de 20 anos de vivência técnica na Força Aérea Brasileira e aviação civil, dedicados à manutenção estrutural, motores, fatores humanos e segurança de voo.';
  const authorBadgeText = data?.homeAuthorityBadgeText || 'Doutrina Técnica & Hangar';
  const authorButtonText = data?.homeAuthorityButtonText || 'Ver Trajetória Completa';
  const fallbackAuthorPhoto = '/author.webp';
  const rawAuthorPhotoUrl = data?.photoUrl || fallbackAuthorPhoto;
  const authorPhotoUrl = useResolvedImageUrl(rawAuthorPhotoUrl, fallbackAuthorPhoto);

  const publishedCount = posts.filter(isPostPublishedAndActive).length;

  return (
    <section className="mb-16 bg-white dark:bg-[#0B1528] rounded-2xl md:rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs p-6 sm:p-8 transition-colors">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-8">
        {/* Left Side: Avatar & Bio Quick Summary */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="relative shrink-0">
            <img
              src={authorPhotoUrl}
              alt={authorName}
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-[#CBD5E1] dark:border-slate-700 shadow-sm"
              onError={async e => {
                const target = e.target as HTMLImageElement;
                if (rawAuthorPhotoUrl && (rawAuthorPhotoUrl.startsWith('/api/media/') || rawAuthorPhotoUrl.startsWith('media:'))) {
                  const fromFirestore = await getMediaDataUrl(rawAuthorPhotoUrl);
                  if (fromFirestore && fromFirestore !== target.src) {
                    target.src = fromFirestore;
                    return;
                  }
                }
                target.src = fallbackAuthorPhoto;
              }}
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-[#0A192F] dark:bg-blue-600 text-white shadow-xs border border-white dark:border-slate-900">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>

          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                {authorName}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-mono font-bold uppercase">
                {authorTag}
              </span>
            </div>

            <p className="text-xs text-[#1D4ED8] dark:text-blue-400 font-bold">
              {authorRole}
            </p>

            <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed line-clamp-2">
              {authorBio}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action & Articles Count */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800 shrink-0">
          <div className="text-left sm:text-right">
            <span className="text-xs font-mono font-bold text-[#0A192F] dark:text-white block">
              {publishedCount} Artigos Publicados
            </span>
            <span className="text-[11px] text-[#475569] dark:text-slate-400 font-medium">
              {authorBadgeText}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('about')}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0A192F] dark:text-white text-xs font-bold transition-colors font-['Outfit'] cursor-pointer"
          >
            <span>{authorButtonText}</span>
            <ChevronRight className="w-4 h-4 text-[#1D4ED8] dark:text-blue-400" />
          </button>
        </div>
      </div>
    </section>
  );
};
