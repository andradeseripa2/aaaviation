import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { Bookmark, Trash2, ArrowRight, Clock, Calendar, BookOpen } from 'lucide-react';
import { CoverImage } from '../common/CoverImage';

export const BookmarksView: React.FC = () => {
  const { posts, bookmarks, toggleBookmark, navigate, getCategoryName, getCategoryVisual } = useBlog();

  const savedPosts = posts.filter(p => bookmarks.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold font-['Outfit'] uppercase tracking-wider mb-2">
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>Lista de Leitura Pessoal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0A192F] dark:text-white font-['Outfit'] tracking-tight">
            Artigos Salvos & Favoritos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Artigos marcados para estudo aprofundado, consultas técnicas e leitura posterior.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('blog')}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#1D4ED8] dark:text-blue-400 hover:underline font-['Outfit'] cursor-pointer"
        >
          <span>Explorar mais artigos</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {savedPosts.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-white dark:bg-[#0B1528] border border-slate-200 dark:border-slate-800 shadow-xs max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">
            Nenhum artigo salvo ainda
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Ao ler qualquer publicação técnica, clique no botão <strong>"Salvar"</strong> para guardá-la na sua lista de favoritos.
          </p>
          <button
            type="button"
            onClick={() => navigate('blog')}
            className="mt-2 px-5 py-2.5 rounded-xl bg-[#0A192F] dark:bg-blue-600 text-white text-xs font-bold font-['Outfit'] hover:bg-[#0E2954] dark:hover:bg-blue-500 transition-colors cursor-pointer"
          >
            Explorar Acervo Técnico
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedPosts.map(post => (
            <article
              key={post.id}
              className="group bg-white dark:bg-[#0B1528] rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {post.coverImage && (
                <div
                  onClick={() => navigate('post', { postSlug: post.slug })}
                  className="h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-900 cursor-pointer relative"
                >
                  <CoverImage
                    src={post.coverImage}
                    alt={post.title}
                    category={post.category}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-[11px] font-bold text-[#0A192F] dark:text-slate-200 shadow-xs font-mono uppercase flex items-center gap-1.5">
                    {getCategoryVisual(post.category, 'w-3.5 h-3.5')}
                    <span>{getCategoryName(post.category)}</span>
                  </div>
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTimeMinutes} min
                    </span>
                  </div>

                  <h3
                    onClick={() => navigate('post', { postSlug: post.slug })}
                    className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400 transition-colors font-['Outfit'] leading-snug cursor-pointer mb-2"
                  >
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigate('post', { postSlug: post.slug })}
                    className="text-xs font-bold text-[#1D4ED8] dark:text-blue-400 flex items-center gap-1 font-['Outfit'] cursor-pointer"
                  >
                    <span>Continuar Leitura</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleBookmark(post.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Remover dos favoritos"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
