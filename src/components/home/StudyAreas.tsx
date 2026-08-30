import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { ArrowRight } from 'lucide-react';

export const StudyAreas: React.FC = () => {
  const { navigate, categories } = useBlog();

  return (
    <section className="mb-16">
      <div className="text-center mb-8">
        <span className="text-xs font-mono font-bold tracking-[0.25em] text-[#1D4ED8] dark:text-blue-400 uppercase">
          ÁREAS DE ESTUDO & PILARES
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A192F] dark:text-white font-['Outfit'] mt-1">
          Pilares Técnicos da Aviação
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {categories.map(cat => {
          const count = cat.count || 0;
          const emoji = cat.emoji || '✈️';

          return (
            <button
              key={cat.id || cat.slug}
              type="button"
              onClick={() => navigate('category', { categorySlug: cat.slug })}
              className="group min-h-[140px] p-6 bg-white dark:bg-[#0B1528] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 hover:border-[#1D4ED8] dark:hover:border-blue-500 hover:shadow-md transition-all duration-200 text-center flex flex-col items-center justify-between cursor-pointer hover:-translate-y-0.5"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/80 group-hover:bg-[#EFF6FF] dark:group-hover:bg-blue-950/60 transition-colors mb-4 border border-[#E2E8F0] dark:border-slate-700 flex items-center justify-center text-2xl shadow-xs">
                <span className="group-hover:scale-110 transition-transform">{emoji}</span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#0A192F] dark:text-white group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400 transition-colors font-['Outfit']">
                {cat.name}
              </h3>

              <p className="text-xs text-[#475569] dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>

              <span className="mt-4 inline-flex items-center gap-1 text-xs font-mono text-[#1D4ED8] dark:text-blue-400 font-semibold">
                <span>{count} {count === 1 ? 'artigo' : 'artigos'}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
