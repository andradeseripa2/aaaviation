import React, { useState, useMemo } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Post } from '../../types';
import { isPostPublishedAndActive } from '../../lib/scheduleUtils';
import { CoverImage } from '../common/CoverImage';
import {
  Compass,
  TrendingUp,
  Clock,
  Eye,
  Heart,
  Bookmark,
  Sparkles,
  ArrowRight,
  Flame,
  Layers
} from 'lucide-react';

interface RecommendedPostsProps {
  currentPost: Post;
  layout?: 'sidebar' | 'bottom';
  className?: string;
}

export const RecommendedPosts: React.FC<RecommendedPostsProps> = ({
  currentPost,
  layout = 'bottom',
  className = ''
}) => {
  const {
    posts,
    navigate,
    getCategoryName,
    getCategoryVisual,
    postMatchesCategoryFilter,
    isBookmarked,
    toggleBookmark
  } = useBlog();

  const [activeTab, setActiveTab] = useState<'category' | 'popular' | 'latest'>('category');

  // Filter and compute candidate lists
  const { categoryPosts, popularPosts, latestPosts } = useMemo(() => {
    // Exclude current post and drafts/future scheduled posts
    const availablePosts = posts.filter(
      p => p.id !== currentPost.id && isPostPublishedAndActive(p)
    );

    // 1. Same Category
    const inCategory = availablePosts.filter(p =>
      postMatchesCategoryFilter(p.category, currentPost.category)
    );

    // 2. Most Read / Popular (by viewsCount, then likesCount)
    const popular = [...availablePosts].sort((a, b) => {
      const viewsA = a.viewsCount || 0;
      const viewsB = b.viewsCount || 0;
      if (viewsB !== viewsA) return viewsB - viewsA;
      return (b.likesCount || 0) - (a.likesCount || 0);
    });

    // 3. Latest Published
    const latest = [...availablePosts].sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      return dateB - dateA;
    });

    return {
      categoryPosts: inCategory.length > 0 ? inCategory : popular,
      popularPosts: popular,
      latestPosts: latest
    };
  }, [posts, currentPost.id, currentPost.category, postMatchesCategoryFilter]);

  // Determine displayed items according to layout and tab
  const displayedPosts = useMemo(() => {
    let source = categoryPosts;
    if (activeTab === 'popular') source = popularPosts;
    else if (activeTab === 'latest') source = latestPosts;

    // Limit counts
    const maxItems = layout === 'sidebar' ? 4 : 3;
    return source.slice(0, maxItems);
  }, [activeTab, categoryPosts, popularPosts, latestPosts, layout]);

  if (displayedPosts.length === 0) {
    return null;
  }

  // --- SIDEBAR LAYOUT (Desktop Sticky Aside) ---
  if (layout === 'sidebar') {
    return (
      <div
        className={`bg-white dark:bg-[#0B1528] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs overflow-hidden ${className}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold font-['Outfit'] text-[#0A192F] dark:text-white uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-blue-400" />
              <span>Você Pode Gostar</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
              {displayedPosts.length} sugestões
            </span>
          </div>

          {/* Quick tab switcher chips */}
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('category')}
              className={`flex-1 py-1 px-1.5 rounded-md text-center transition-all cursor-pointer truncate ${
                activeTab === 'category'
                  ? 'bg-white dark:bg-slate-700 text-[#1D4ED8] dark:text-blue-300 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Artigos da mesma categoria"
            >
              Categoria
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('popular')}
              className={`flex-1 py-1 px-1.5 rounded-md text-center transition-all cursor-pointer truncate flex items-center justify-center gap-1 ${
                activeTab === 'popular'
                  ? 'bg-white dark:bg-slate-700 text-[#1D4ED8] dark:text-blue-300 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Artigos mais lidos e comentados"
            >
              <Flame className="w-2.5 h-2.5 text-amber-500 shrink-0" />
              <span>Mais Lidos</span>
            </button>
          </div>
        </div>

        {/* List of articles */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {displayedPosts.map(post => {
            const bookmarked = isBookmarked(post.id);
            return (
              <div
                key={post.id}
                onClick={() => {
                  navigate('post', { postSlug: post.slug });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group p-3.5 hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-3 items-start"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 relative border border-slate-200/80 dark:border-slate-700/60">
                  {post.coverImage ? (
                    <CoverImage
                      src={post.coverImage}
                      alt={post.title}
                      category={post.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800">
                      {getCategoryVisual(post.category, 'w-6 h-6')}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                    <span className="text-[#1D4ED8] dark:text-blue-400 font-bold uppercase truncate max-w-[120px]">
                      {getCategoryName(post.category)}
                    </span>
                    <span>•</span>
                    <span>{post.readTimeMinutes} min</span>
                  </div>

                  <h5 className="text-xs font-bold font-['Outfit'] text-[#0A192F] dark:text-slate-200 group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h5>

                  <div className="flex items-center justify-between text-[10px] text-[#94A3B8] dark:text-slate-500 font-mono mt-1.5">
                    <span>{post.date}</span>
                    {post.viewsCount !== undefined && post.viewsCount > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Eye className="w-2.5 h-2.5" />
                        {post.viewsCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Link */}
        <div className="p-2.5 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={() => navigate('category', { categorySlug: currentPost.category })}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D4ED8] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-['Outfit'] cursor-pointer transition-colors"
          >
            <span>Ver mais em {getCategoryName(currentPost.category)}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // --- BOTTOM / IN-ARTICLE MOBILE-FIRST LAYOUT ---
  return (
    <section
      aria-label="Artigos recomendados"
      className={`my-10 pt-8 border-t-2 border-slate-200 dark:border-slate-800 ${className}`}
    >
      {/* Section Heading & Category Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#1D4ED8] dark:text-blue-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Continue sua Leitura Técnica</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black font-['Outfit'] text-[#0A192F] dark:text-white tracking-tight">
            Você Também Pode Gostar de Ler
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('category')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['Outfit'] transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'category'
                ? 'bg-white dark:bg-slate-800 text-[#1D4ED8] dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{getCategoryName(currentPost.category)}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('popular')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['Outfit'] transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'popular'
                ? 'bg-white dark:bg-slate-800 text-[#1D4ED8] dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Mais Lidos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('latest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['Outfit'] transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'latest'
                ? 'bg-white dark:bg-slate-800 text-[#1D4ED8] dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Recentes</span>
          </button>
        </div>
      </div>

      {/* Cards Grid: 1 col on mobile, 2 on tablet, 3 on large screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedPosts.map(post => {
          const bookmarked = isBookmarked(post.id);
          return (
            <article
              key={post.id}
              onClick={() => {
                navigate('post', { postSlug: post.slug });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group bg-white dark:bg-[#0B1528] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/60 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
            >
              {/* Card Cover Image */}
              <div className="h-40 sm:h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
                {post.coverImage ? (
                  <CoverImage
                    src={post.coverImage}
                    alt={post.title}
                    category={post.category}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-900">
                    {getCategoryVisual(post.category, 'w-10 h-10')}
                  </div>
                )}

                {/* Category Pill Tag */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs text-[10px] font-bold text-[#0A192F] dark:text-slate-200 shadow-xs flex items-center gap-1.5 uppercase font-mono border border-slate-200/60 dark:border-slate-700/50">
                  {getCategoryVisual(post.category, 'w-3 h-3')}
                  <span>{getCategoryName(post.category)}</span>
                </div>

                {/* Bookmark Action */}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    toggleBookmark(post.id);
                  }}
                  className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer ${
                    bookmarked
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-black/40 text-white hover:bg-black/60'
                  }`}
                  title={bookmarked ? 'Salvo nos favoritos' : 'Salvar artigo'}
                >
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-slate-400 font-mono mb-2">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#94A3B8]" />
                      {post.readTimeMinutes} min de leitura
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold font-['Outfit'] text-[#0A192F] dark:text-white group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-2">
                    {post.title}
                  </h4>

                  {(post.excerpt || post.subtitle) && (
                    <p className="text-xs text-[#475569] dark:text-slate-300 line-clamp-2 leading-relaxed font-normal">
                      {post.excerpt || post.subtitle}
                    </p>
                  )}
                </div>

                {/* Card Footer: Views/Likes and 'Ler artigo' link */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                    {post.viewsCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.viewsCount}
                      </span>
                    )}
                    {post.likesCount !== undefined && post.likesCount > 0 && (
                      <span className="flex items-center gap-1 text-rose-500/80">
                        <Heart className="w-3 h-3 fill-current" />
                        {post.likesCount}
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 font-bold font-['Outfit'] text-[#1D4ED8] dark:text-blue-400 text-xs group-hover:translate-x-0.5 transition-transform">
                    <span>Ler Artigo</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
