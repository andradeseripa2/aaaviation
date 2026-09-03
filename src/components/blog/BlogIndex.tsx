import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { SortOption } from '../../types';
import { isPostPublishedAndActive } from '../../lib/scheduleUtils';
import { AdBanner } from '../common/AdBanner';
import { CoverImage } from '../common/CoverImage';
import {
  Calendar,
  Clock,
  ArrowRight,
  Search,
  Wrench,
  ShieldCheck,
  Compass,
  Plane,
  Sparkles,
  Bookmark,
  Eye,
  Heart,
  Flame,
  SlidersHorizontal
} from 'lucide-react';

export const BlogIndex: React.FC = () => {
  const {
    posts,
    categories,
    navigate,
    searchQuery,
    setSearchQuery,
    isBookmarked,
    toggleBookmark,
    getCategoryName,
    getCategoryVisual,
    postMatchesCategoryFilter
  } = useBlog();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  const filteredPosts = posts
    .filter(p => {
      const matchCat = postMatchesCategoryFilter(p.category, selectedFilter);
      const matchPub = isPostPublishedAndActive(p);
      const matchSearch = searchQuery
        ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      return matchCat && matchPub && matchSearch;
    })
    .sort((a, b) => {
      if (sortOption === 'popular') {
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      }
      if (sortOption === 'rating') {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      if (sortOption === 'time') {
        return (a.readTimeMinutes || 0) - (b.readTimeMinutes || 0);
      }
      return 0; // default recent
    });

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'manutencao':
        return <Wrench className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-blue-400" />;
      case 'safety':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'curiosidades':
        return <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      default:
        return <Plane className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-300 text-xs font-bold font-['Outfit'] uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Acervo Técnico & Artigos
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A192F] dark:text-white font-['Outfit'] tracking-tight">
          Blog de Aviação
        </h1>
        <p className="text-sm sm:text-base text-[#64748B] dark:text-slate-400 mt-3 leading-relaxed">
          Estudos detalhados sobre mecânica aeronáutica, investigações de segurança de voo, trajetória na FAB e os bastidores técnicos de quem vive a aviação.
        </p>

        {/* Search Bar */}
        <div className="mt-6 max-w-lg mx-auto relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por termo, sigla (ex: CHT, SIPAER, MSG-3)..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0B1528] border border-[#CBD5E1] dark:border-slate-800 text-[#0F172A] dark:text-white placeholder-slate-400 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0E2954] dark:focus:ring-blue-500 shadow-xs"
          />
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-[#94A3B8]" />
        </div>
      </div>

      {/* Filter and Sorting Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
        {/* Category Pills Filter */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all font-['Outfit'] cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-[#0A192F] dark:bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#0B1528] border border-[#CBD5E1] dark:border-slate-800 text-[#475569] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800'
            }`}
          >
            Todos ({posts.filter(isPostPublishedAndActive).length})
          </button>

          {categories.map(cat => {
            const isActive = selectedFilter === cat.slug;
            return (
              <button
                key={cat.id || cat.slug}
                type="button"
                onClick={() => setSelectedFilter(cat.slug)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all font-['Outfit'] cursor-pointer ${
                  isActive
                    ? 'bg-[#0A192F] dark:bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#0B1528] border border-[#CBD5E1] dark:border-slate-800 text-[#475569] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800'
                }`}
              >
                {getCategoryVisual(cat.slug, 'w-3.5 h-3.5')}
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({cat.count || 0})</span>
              </button>
            );
          })}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ordenar:</span>
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value as SortOption)}
            className="text-xs bg-white dark:bg-[#0B1528] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2.5 py-1.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="recent">Mais Recentes</option>
            <option value="popular">Mais Lidos (Em Alta)</option>
            <option value="rating">Mais Curtidos</option>
            <option value="time">Leitura Rápida</option>
          </select>
        </div>
      </div>

      {/* AdSense Header Leaderboard */}
      <AdBanner type="header" />

      {/* Articles Grid */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0B1528] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 my-8">
          <p className="text-base text-[#64748B] dark:text-slate-400">
            Nenhum artigo encontrado com os filtros selecionados.
          </p>
          <button
            onClick={() => {
              setSelectedFilter('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-[#0A192F] dark:bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map(post => {
            const bookmarked = isBookmarked(post.id);
            return (
              <article
                key={post.id}
                className="group bg-white dark:bg-[#0B1528] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 hover:border-[#CBD5E1] dark:hover:border-slate-700 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* Cover Image */}
                {post.coverImage && (
                  <div
                    onClick={() => navigate('post', { postSlug: post.slug })}
                    className="h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-900 relative cursor-pointer"
                  >
                    <CoverImage
                      src={post.coverImage}
                      alt={post.title}
                      category={post.category}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-[11px] font-bold text-[#0A192F] dark:text-slate-200 shadow-xs flex items-center gap-1.5 uppercase font-mono">
                      {getCategoryVisual(post.category, 'w-3.5 h-3.5')}
                      <span>{getCategoryName(post.category)}</span>
                    </div>

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
                )}

                {/* Text content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {!post.coverImage && (
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold font-mono text-slate-700 dark:text-slate-300 uppercase">
                          {getCategoryVisual(post.category, 'w-3.5 h-3.5')}
                          <span>{getCategoryName(post.category)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleBookmark(post.id)}
                          className={`p-1 rounded-md transition-colors ${
                            bookmarked ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-[#94A3B8] dark:text-slate-500 mb-3">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{post.date}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.readTimeMinutes} min</span>
                    </div>

                    <h2
                      onClick={() => navigate('post', { postSlug: post.slug })}
                      className="text-xl font-bold text-[#0A192F] dark:text-white group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400 transition-colors leading-snug font-['Outfit'] mb-3 cursor-pointer"
                    >
                      {post.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#F1F5F9] dark:border-slate-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => navigate('post', { postSlug: post.slug })}
                      className="text-xs font-bold text-[#0A192F] dark:text-blue-400 group-hover:text-[#1D4ED8] flex items-center gap-1 uppercase font-['Outfit'] tracking-wider cursor-pointer"
                    >
                      <span>Ler Artigo</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </button>

                    <div className="flex items-center gap-2">
                      {post.likesCount !== undefined && post.likesCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-rose-500 font-mono">
                          <Heart className="w-3 h-3 fill-rose-500" />
                          {post.likesCount}
                        </span>
                      )}
                      {post.technicalBadge && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-300 uppercase">
                          {post.technicalBadge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
