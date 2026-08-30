import React from 'react';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { MarkdownContent } from '../common/MarkdownContent';
import { CoverImage } from '../common/CoverImage';
import {
  X,
  Clock,
  Calendar,
  Eye,
  Tag,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Sparkles,
  Award
} from 'lucide-react';

interface ArticlePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  categoryName: string;
  badge: string;
  coverImage: string;
  coverCaption: string;
  content: string;
  readTime: number;
  isSafetyPost: boolean;
  tags: string[];
}

export const ArticlePreviewModal: React.FC<ArticlePreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  categoryName,
  badge,
  coverImage,
  coverCaption,
  content,
  readTime,
  isSafetyPost,
  tags
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 overflow-y-auto flex items-start justify-center p-2 sm:p-6 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-[#CBD5E1] shadow-2xl overflow-hidden my-6">
        {/* Modal Top Bar */}
        <div className="bg-[#0A192F] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-bold font-['Outfit'] flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Pré-visualização Real do Leitor
            </span>
            <span className="text-xs text-slate-300 hidden sm:inline">
              Assim é como o artigo aparecerá para os visitantes do blog
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Fechar Visualização"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post Simulated Page */}
        <div className="p-6 sm:p-12 space-y-8 bg-[#F8FAFC]">
          {/* Article Header */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-[#1D4ED8] text-xs font-bold uppercase tracking-wider rounded-full font-['Outfit']">
                {categoryName || 'MANUTENÇÃO'}
              </span>
              {badge && (
                <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider rounded-full font-['Outfit']">
                  {badge}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-[#64748B] font-medium ml-auto">
                <Clock className="w-3.5 h-3.5" /> {readTime || 5} min de leitura
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0A192F] font-['Outfit'] leading-tight">
              {title || 'Título do Artigo Técnico'}
            </h1>

            {subtitle && (
              <p className="text-base sm:text-lg text-[#475569] leading-relaxed font-normal">
                {subtitle}
              </p>
            )}

            {/* Author Meta */}
            <div className="flex items-center gap-3 pt-4 border-t border-[#E2E8F0]">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0A192F] to-[#1D4ED8] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                AA
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-[#0A192F] font-['Outfit']">Alexandre Andrade</span>
                  <Award className="w-4 h-4 text-[#1D4ED8]" />
                </div>
                <p className="text-xs text-[#64748B]">Especialista em Manutenção Aeronáutica & Investigação</p>
              </div>
              <span className="text-xs text-[#94A3B8] ml-auto flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Hoje
              </span>
            </div>
          </div>

          {/* Cover Image */}
          {coverImage && (
            <div className="max-w-3xl mx-auto space-y-2">
              <div className="rounded-3xl overflow-hidden shadow-lg border border-[#E2E8F0] aspect-video bg-slate-900">
                <CoverImage
                  src={coverImage}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
              {coverCaption && (
                <p className="text-xs text-center text-[#64748B] italic">
                  📷 {coverCaption}
                </p>
              )}
            </div>
          )}

          {/* Safety Disclaimer if enabled */}
          {isSafetyPost && (
            <div className="max-w-3xl mx-auto">
              <DisclaimerBanner variant="safety" />
            </div>
          )}

          {/* Article Main Body */}
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-[#E2E8F0] shadow-sm">
            <MarkdownContent content={content || '## Nenhum conteúdo inserido ainda.\n\nEscreva seu texto no editor para visualizar a formatação completa.'} />

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="pt-8 mt-8 border-t border-[#F1F5F9] flex flex-wrap items-center gap-2">
                <Tag className="w-4 h-4 text-[#64748B]" />
                {tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] text-xs font-medium text-[#475569]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-[#F8FAFC] px-6 py-4 border-t border-[#E2E8F0] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#0A192F] hover:bg-[#0E2954] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Fechar Pré-visualização
          </button>
        </div>
      </div>
    </div>
  );
};
