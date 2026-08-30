import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { isPostPublishedAndActive } from '../../lib/scheduleUtils';
import { Logo } from '../common/Logo';
import { ArrowRight } from 'lucide-react';
import { CoverImage } from '../common/CoverImage';

export const HeroFeatured: React.FC = () => {
  const { posts, navigate, getCategoryName, getCategoryVisual } = useBlog();
  
  const publishedPosts = posts.filter(isPostPublishedAndActive);
  const featuredPost =
    publishedPosts.find(p => p.featured) ||
    publishedPosts.find(p => p.id === 'post-sobre-fab') ||
    publishedPosts[0] ||
    posts[0];

  if (!featuredPost) {
    return (
      <section className="relative overflow-hidden bg-white dark:bg-[#0B1528] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-xs p-6 sm:p-8 lg:p-12 mb-12 transition-colors">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#F1F5F9_1px,transparent_1px),linear-gradient(to_bottom,#F1F5F9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1E293B_1px,transparent_1px),linear-gradient(to_bottom,#1E293B_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] dark:bg-blue-950/60 border border-[#BFDBFE] dark:border-blue-800 text-[#1D4ED8] dark:text-blue-300 text-xs font-bold tracking-widest uppercase font-['Outfit']">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-blue-400 animate-pulse" />
              Portal Técnico de Aviação
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A192F] dark:text-white font-['Outfit'] tracking-tight leading-[1.15]">
              Alexandre Andrade
            </h1>

            <p className="text-base sm:text-lg text-[#475569] dark:text-slate-300 leading-relaxed max-w-2xl">
              Bem-vindo ao espaço doutrinário sobre manutenção aeronáutica, investigação SIPAER e segurança operacional da aviação brasileira.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('about')}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 text-white text-sm font-bold tracking-wide transition-all shadow-md hover:shadow-lg font-['Outfit'] cursor-pointer"
              >
                <span>Conhecer a Trajetória do Autor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md">
              <Logo variant="badge" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#0B1528] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-xs p-6 sm:p-8 lg:p-12 mb-12 transition-colors">
      {/* Background subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#F1F5F9_1px,transparent_1px),linear-gradient(to_bottom,#F1F5F9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1E293B_1px,transparent_1px),linear-gradient(to_bottom,#1E293B_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Text & CTA */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] dark:bg-blue-950/60 border border-[#BFDBFE] dark:border-blue-800 text-[#1D4ED8] dark:text-blue-300 text-xs font-bold tracking-widest uppercase font-['Outfit']">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-blue-400 animate-pulse" />
            Artigo em Destaque
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A192F] dark:text-white font-['Outfit'] tracking-tight leading-[1.15]">
            {featuredPost.title}
          </h1>

          <p className="text-base sm:text-lg text-[#475569] dark:text-slate-300 leading-relaxed max-w-2xl">
            {featuredPost.excerpt || 'O mundo da aviação, na visão de quem vive por dentro. Uma jornada técnica e humana pelos bastidores da segurança de voo no Brasil.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('post', { postSlug: featuredPost.slug })}
              className="min-h-[44px] inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 text-white text-sm font-bold tracking-wide transition-all shadow-md hover:shadow-lg font-['Outfit'] group cursor-pointer"
            >
              <span>Leia o Artigo Completo</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            
            <button
              type="button"
              onClick={() => navigate('about')}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#CBD5E1] dark:border-slate-700 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 text-[#0A192F] dark:text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
            >
              Conhecer o Autor
            </button>
          </div>
        </div>

        {/* Right Column: Post Cover Image if available, or Emblem Badge */}
        <div className="lg:col-span-5 flex justify-center">
          {featuredPost.coverImage ? (
            <div
              onClick={() => navigate('post', { postSlug: featuredPost.slug })}
              className="relative w-full max-w-md aspect-video sm:aspect-4/3 rounded-2xl md:rounded-3xl overflow-hidden border border-[#E2E8F0] dark:border-slate-800 shadow-md group cursor-pointer bg-slate-100 dark:bg-slate-900 transition-all hover:shadow-xl hover:border-[#CBD5E1] dark:hover:border-slate-700"
            >
              <CoverImage
                src={featuredPost.coverImage}
                alt={featuredPost.title}
                category={featuredPost.category}
                priority={true}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F]/80 via-[#0A192F]/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              
              <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs text-xs font-bold text-[#0A192F] dark:text-slate-200 shadow-sm uppercase font-mono tracking-wider flex items-center gap-1.5">
                {getCategoryVisual(featuredPost.category, 'w-3.5 h-3.5')}
                <span>{getCategoryName(featuredPost.category)}</span>
              </div>

              {featuredPost.coverImageCaption && (
                <div className="absolute bottom-3 left-3.5 right-3.5 text-white text-xs font-medium bg-[#0A192F]/85 backdrop-blur-xs px-3 py-1.5 rounded-xl truncate">
                  📷 {featuredPost.coverImageCaption}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-md">
              <Logo variant="badge" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
