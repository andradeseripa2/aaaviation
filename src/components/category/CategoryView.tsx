import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { CategorySlug } from '../../types';
import { isPostPublishedAndActive } from '../../lib/scheduleUtils';
import { NewsletterSection } from '../home/NewsletterSection';
import { AdBanner } from '../common/AdBanner';
import { CoverImage } from '../common/CoverImage';
import {
  Calendar,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  Wrench,
  ShieldCheck,
  Compass,
  Plane,
  Bookmark
} from 'lucide-react';

interface CategoryViewProps {
  categorySlug?: CategorySlug;
}

export const CategoryView: React.FC<CategoryViewProps> = ({ categorySlug }) => {
  const {
    posts,
    categories,
    selectedCategorySlug,
    navigate,
    searchQuery,
    setSearchQuery,
    isBookmarked,
    toggleBookmark,
    getCategoryName,
    getCategoryVisual,
    postMatchesCategoryFilter
  } = useBlog();
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;

  const currentSlug = categorySlug || selectedCategorySlug || 'manutencao';
  const categoryInfo = categories.find(c => c.slug === currentSlug) || categories[0];

  // Filter posts
  const filteredPosts = posts.filter(p => {
    const matchesCategory = postMatchesCategoryFilter(p.category, currentSlug);
    const matchesPublish = isPostPublishedAndActive(p);
    const matchesSearch = searchQuery
      ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesCategory && matchesPublish && matchesSearch;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage) || 1;
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'manutencao':
        return <Wrench className="w-4 h-4 text-[#1D4ED8] dark:text-blue-400" />;
      case 'safety':
        return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'curiosidades':
        return <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Plane className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Category Header Banner */}
      <div className="mb-10 pb-6 border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1D4ED8] dark:text-blue-400 uppercase tracking-widest mb-2">
          <Layers className="w-3.5 h-3.5" />
          <span>CATEGORIA</span>
        </div>
        <div className="flex items-start gap-3.5">
          {categoryInfo?.emoji && (
            <span className="text-3xl sm:text-4xl p-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs select-none">
              {categoryInfo.emoji}
            </span>
          )}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0A192F] dark:text-white font-['Outfit'] tracking-tight">
              {categoryInfo?.name || 'Artigos'}
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] dark:text-slate-400 mt-2 max-w-3xl leading-relaxed">
              {categoryInfo?.description || 'Explore nossos artigos técnicos e análises aprofundadas.'}
            </p>
          </div>
        </div>

        {searchQuery && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/60 text-xs text-[#1D4ED8] dark:text-blue-300">
            <span>Filtrando por: <strong>"{searchQuery}"</strong></span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-500 dark:text-slate-400 hover:text-rose-600 font-bold ml-2 cursor-pointer"
            >
              ✕ Limpar
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Articles List + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Posts List */}
        <div className="lg:col-span-8 space-y-6">
          {paginatedPosts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#0B1528] rounded-2xl border border-[#E2E8F0] dark:border-slate-800">
              <p className="text-base text-[#64748B] dark:text-slate-400">
                Nenhum artigo encontrado nesta categoria com os filtros atuais.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  navigate('blog');
                }}
                className="mt-4 px-4 py-2 bg-[#0A192F] dark:bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Ver todos os artigos
              </button>
            </div>
          ) : (
            paginatedPosts.map(post => {
              const bookmarked = isBookmarked(post.id);
              return (
                <article
                  key={post.id}
                  className="group bg-white dark:bg-[#0B1528] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 hover:border-[#CBD5E1] dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row"
                >
                  {/* Cover Image */}
                  {post.coverImage && (
                    <div
                      onClick={() => navigate('post', { postSlug: post.slug })}
                      className="sm:w-64 sm:min-w-64 h-48 sm:h-auto overflow-hidden bg-slate-100 dark:bg-slate-900 relative cursor-pointer"
                    >
                      <CoverImage
                        src={post.coverImage}
                        alt={post.title}
                        category={post.category}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Badge & Date Header */}
                      <div className="flex items-center justify-between gap-3 text-xs mb-2.5">
                        <div className="flex items-center gap-2">
                          {post.technicalBadge && (
                            <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-sm bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-300 uppercase tracking-wider">
                              {post.technicalBadge}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 text-[#94A3B8] dark:text-slate-500 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{post.date}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleBookmark(post.id)}
                          className={`p-1 rounded-md transition-colors ${
                            bookmarked ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                          title={bookmarked ? 'Salvo' : 'Salvar artigo'}
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>

                      <h2
                        onClick={() => navigate('post', { postSlug: post.slug })}
                        className="text-xl font-bold text-[#0A192F] dark:text-white group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400 transition-colors leading-snug font-['Outfit'] mb-2 cursor-pointer"
                      >
                        {post.title}
                      </h2>

                      <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#F8FAFC] dark:border-slate-800/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => navigate('post', { postSlug: post.slug })}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0A192F] dark:text-blue-400 group-hover:text-[#1D4ED8] uppercase font-['Outfit'] tracking-wider cursor-pointer"
                      >
                        <span>Ler Artigo Completo</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </button>
                      <span className="text-[11px] text-[#94A3B8] dark:text-slate-500">
                        {post.readTimeMinutes} min de leitura
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          )}

          {/* AdSense In-Content / List Banner */}
          <AdBanner type="in-content" />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-6 flex items-center justify-between border-t border-[#E2E8F0] dark:border-slate-800 text-xs font-semibold text-[#64748B] dark:text-slate-400">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#0A192F] dark:bg-blue-600 text-white'
                        : 'border border-[#E2E8F0] dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 text-[#334155] dark:text-slate-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <span>Próxima</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Outras Categorias Box */}
          <div className="bg-white dark:bg-[#0B1528] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-6 shadow-xs">
            <h3 className="text-base font-bold text-[#0A192F] dark:text-white font-['Outfit'] mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1D4ED8] dark:text-blue-400" />
              Outras Categorias
            </h3>

            <div className="space-y-1.5">
              {categories.map(cat => {
                const isActive = cat.slug === currentSlug;
                return (
                  <button
                    key={cat.id || cat.slug}
                    onClick={() => {
                      setCurrentPage(1);
                      navigate('category', { categorySlug: cat.slug });
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer font-['Outfit'] ${
                      isActive
                        ? 'bg-[#0A192F] dark:bg-blue-600 text-white shadow-xs'
                        : 'text-[#334155] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {getCategoryVisual(cat.slug, 'w-4 h-4')}
                      <span>{cat.name}</span>
                    </div>
                    {isActive ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="text-[11px] text-[#94A3B8] dark:text-slate-500 font-mono font-normal">
                        ({cat.count || 0})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Newsletter Sidebar Card */}
          <NewsletterSection variant="card" />

          {/* AdSense Sidebar Medium Rectangle 300x250 */}
          <AdBanner type="sidebar" />
        </aside>
      </div>
    </div>
  );
};
