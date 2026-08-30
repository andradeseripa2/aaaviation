import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Post, SortOption } from '../../types';
import { isPostPublishedAndActive } from '../../lib/scheduleUtils';
import { CoverImage } from '../common/CoverImage';
import {
  ArrowRight,
  Calendar,
  Clock,
  Flame,
  Sparkles,
  Heart,
  Bookmark,
  Eye,
  TrendingUp,
  Layers
} from 'lucide-react';

export const LatestAnalysis: React.FC = () => {
  const {
    posts,
    categories,
    navigate,
    isBookmarked,
    toggleBookmark,
    getCategoryName,
    getCategoryVisual,
    postMatchesCategoryFilter
  } = useBlog();
  const [activeSort, setActiveSort] = useState<SortOption>('recent');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter published and actively released posts
  const publishedPosts = posts.filter(isPostPublishedAndActive);

  // Dynamic category filter options from context
  const categoryFilters: { id: string; label: string; slug?: string; emoji?: string }[] = [
    { id: 'all', label: 'Todas as Áreas', emoji: '✨' },
    ...categories.map(c => ({
      id: c.slug,
      label: c.name,
      slug: c.slug,
      emoji: c.emoji
    }))
  ];

  // Filter by category
  const filteredByCategory = publishedPosts.filter(p => {
    if (selectedCategory === 'all') return true;
    return postMatchesCategoryFilter(p.category, selectedCategory);
  });

  // Apply sorting
  const sortedPosts = [...filteredByCategory].sort((a, b) => {
    if (activeSort === 'popular') {
      return (b.viewsCount || 0) - (a.viewsCount || 0);
    }
    if (activeSort === 'rating') {
      return (b.likesCount || 0) - (a.likesCount || 0);
    }
    return 0; // already sorted by date
  });

  const displayPosts = sortedPosts.slice(0, 6);

  // Top 4 trending/most read posts for the right-hand trending widget
  const trendingPosts = [...publishedPosts]
    .sort((a, b) => ((b.viewsCount || 0) + (b.likesCount || 0) * 3) - ((a.viewsCount || 0) + (a.likesCount || 0) * 3))
    .slice(0, 4);

  return (
    <section className="mb-16">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#1D4ED8] dark:bg-blue-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
              Acervo Doutrinário
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0A192F] dark:text-white font-['Outfit'] tracking-tight">
            Últimas postagens
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
            Publicações técnicas, ensinamentos de hangar e segurança operacional
          </p>
        </div>

        {/* Quick Sorting Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSort('recent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['Outfit'] transition-all cursor-pointer ${
              activeSort === 'recent'
                ? 'bg-white dark:bg-slate-700 text-[#0A192F] dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Recentes
          </button>
          <button
            type="button"
            onClick={() => setActiveSort('popular')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold font-['Outfit'] transition-all cursor-pointer ${
              activeSort === 'popular'
                ? 'bg-white dark:bg-slate-700 text-[#0A192F] dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-500" />
            <span>Em Alta</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSort('rating')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold font-['Outfit'] transition-all cursor-pointer ${
              activeSort === 'rating'
                ? 'bg-white dark:bg-slate-700 text-[#0A192F] dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Heart className="w-3 h-3 text-rose-500" />
            <span>Curtidos</span>
          </button>
        </div>
      </div>

      {/* Quick Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
        {categoryFilters.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedCategory(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-['Outfit'] tracking-wide shrink-0 transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              selectedCategory === f.id
                ? 'bg-[#0A192F] dark:bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {f.id === 'all' ? <span>✨</span> : getCategoryVisual(f.slug || f.id, 'w-3 h-3')}
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Layout Grid: 8 cols for Main Articles + 4 cols for Trending/Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main 6 Articles Section */}
        <div className="lg:col-span-8">
          {displayPosts.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-[#0B1528] rounded-2xl border border-dashed border-[#CBD5E1] dark:border-slate-800 space-y-3">
              <p className="text-base font-semibold text-[#0A192F] dark:text-white font-['Outfit']">
                Nenhuma publicação encontrada para esta categoria
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="text-xs font-bold text-[#1D4ED8] dark:text-blue-400 hover:underline font-['Outfit'] cursor-pointer"
              >
                Ver todas as publicações
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayPosts.map(post => {
                const bookmarked = isBookmarked(post.id);
                return (
                  <article
                    key={post.id}
                    className="group bg-white dark:bg-[#0B1528] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md hover:border-[#CBD5E1] dark:hover:border-slate-700 transition-all flex flex-col justify-between duration-200"
                  >
                    {/* Cover image */}
                    {post.coverImage && (
                      <div
                        onClick={() => navigate('post', { postSlug: post.slug })}
                        className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-900 cursor-pointer"
                      >
                        <CoverImage
                          src={post.coverImage}
                          alt={post.title}
                          category={post.category}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs text-xs font-bold text-[#0A192F] dark:text-slate-200 shadow-xs">
                          {getCategoryVisual(post.category)}
                          <span>{getCategoryName(post.category)}</span>
                        </div>

                        {/* Quick bookmark button over image */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(post.id);
                          }}
                          className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer ${
                            bookmarked
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-black/40 text-white hover:bg-black/60'
                          }`}
                          title={bookmarked ? 'Salvo nos favoritos' : 'Salvar para ler depois'}
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    )}

                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {!post.coverImage && (
                          <div className="flex items-center justify-between mb-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EFF6FF] dark:bg-blue-950/60 text-xs font-bold text-[#1D4ED8] dark:text-blue-300">
                              {getCategoryVisual(post.category)}
                              {getCategoryName(post.category)}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleBookmark(post.id)}
                              className={`p-1 rounded-md transition-colors ${
                                bookmarked
                                  ? 'text-amber-500'
                                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                              }`}
                              title={bookmarked ? 'Salvo' : 'Salvar'}
                            >
                              <Bookmark className="w-4 h-4 fill-current" />
                            </button>
                          </div>
                        )}

                        <h3
                          onClick={() => navigate('post', { postSlug: post.slug })}
                          className="text-lg sm:text-xl font-bold text-[#0A192F] dark:text-white group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400 transition-colors leading-snug mb-2 font-['Outfit'] cursor-pointer line-clamp-2"
                        >
                          {post.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-300 line-clamp-2 leading-relaxed mb-4">
                          {post.excerpt}
                        </p>
                      </div>

                      {/* Meta row */}
                      <div className="pt-3.5 border-t border-[#F1F5F9] dark:border-slate-800/80 flex items-center justify-between text-xs text-[#475569] dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-blue-400" />
                          <span>{post.date}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {post.viewsCount !== undefined && post.viewsCount > 0 && (
                            <span className="flex items-center gap-1 font-mono">
                              <Eye className="w-3.5 h-3.5" />
                              {post.viewsCount}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {post.readTimeMinutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Mais Lidos / Em Destaque no Radar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#0B1528] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F1F5F9] dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold uppercase font-['Outfit'] tracking-wider text-[#0A192F] dark:text-white">
                  Mais Lidos da Semana
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                RADAR
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {trendingPosts.map((tp, idx) => (
                <div
                  key={tp.id}
                  onClick={() => navigate('post', { postSlug: tp.slug })}
                  className="py-3.5 first:pt-0 last:pb-0 group cursor-pointer flex items-start gap-3.5"
                >
                  <span className="text-xl font-black font-mono text-slate-400 dark:text-slate-600 group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400 transition-colors w-5 shrink-0">
                    0{idx + 1}
                  </span>
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#1D4ED8] dark:text-blue-400 flex items-center gap-1">
                      {getCategoryVisual(tp.category, 'w-3 h-3')}
                      <span>{getCategoryName(tp.category)}</span>
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#0A192F] dark:text-white group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug font-['Outfit']">
                      {tp.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-[#475569] dark:text-slate-400 pt-0.5">
                      <span>{tp.readTimeMinutes} min de leitura</span>
                      {tp.viewsCount !== undefined && tp.viewsCount > 0 && (
                        <>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Eye className="w-3 h-3" />
                            {tp.viewsCount}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-[#F1F5F9] dark:border-slate-800">
              <button
                type="button"
                onClick={() => navigate('blog')}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-[#0A192F] dark:text-white text-xs font-bold transition-colors font-['Outfit'] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Explorar Todos os Artigos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
