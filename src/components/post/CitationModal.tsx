import React, { useState, useMemo } from 'react';
import { Post } from '../../types';
import {
  X,
  Copy,
  Check,
  Quote,
  BookOpen,
  FileText,
  Share2,
  Sparkles
} from 'lucide-react';

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  authorName?: string;
}

export const CitationModal: React.FC<CitationModalProps> = ({
  isOpen,
  onClose,
  post,
  authorName = 'Alexandre Andrade'
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'abnt' | 'apa' | 'bibtex' | 'quote'>('abnt');
  const [copied, setCopied] = useState(false);

  const citationData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const todayFormatted = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');

    const currentUrl = window.location.href;

    // 1. ABNT (NBR 6023)
    // ANDRADE, Alexandre. Título da matéria. Alexandre Andrade Aviation, ano. Disponível em: <url>. Acesso em: dia mês. ano.
    const surnameFirst = authorName.toUpperCase().split(' ');
    const abntAuthor =
      surnameFirst.length > 1
        ? `${surnameFirst[surnameFirst.length - 1]}, ${surnameFirst.slice(0, -1).join(' ')}`
        : authorName.toUpperCase();

    const abnt = `${abntAuthor}. ${post.title}. Alexandre Andrade Aviation, ${currentYear}. Disponível em: <${currentUrl}>. Acesso em: ${todayFormatted}.`;

    // 2. APA 7th
    // Andrade, A. (Year). Title of article. Alexandre Andrade Aviation. URL
    const nameParts = authorName.split(' ');
    const apaAuthor =
      nameParts.length > 1
        ? `${nameParts[nameParts.length - 1]}, ${nameParts[0].charAt(0)}.`
        : authorName;

    const apa = `${apaAuthor} (${currentYear}). ${post.title}. Alexandre Andrade Aviation. ${currentUrl}`;

    // 3. BibTeX
    const citeKey = `andrade${currentYear}${post.slug.replace(/[^a-zA-Z0-9]/g, '')}`;
    const bibtex = `@article{${citeKey},
  author    = {${authorName}},
  title     = {{${post.title}}},
  journal   = {Alexandre Andrade Aviation},
  year      = {${currentYear}},
  url       = {${currentUrl}},
  note      = {Acessado em: ${todayFormatted}}
}`;

    // 4. Quick Quote / Social Media format
    const quoteText = `"${post.subtitle || post.excerpt || post.title}"\n— ${authorName} (Alexandre Andrade Aviation)\n${currentUrl}`;

    return {
      abnt,
      apa,
      bibtex,
      quote: quoteText
    };
  }, [post, authorName]);

  const activeText = citationData[selectedFormat];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback copy
      const textarea = document.createElement('textarea');
      textarea.value = activeText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0B1528] rounded-3xl border border-[#CBD5E1] dark:border-slate-800 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative p-5 sm:p-6 pb-4 bg-slate-50 dark:bg-slate-900/60 border-b border-[#E2E8F0] dark:border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-[#64748B] hover:text-[#0A192F] dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 rounded-2xl border border-blue-200 dark:border-blue-800/60">
              <Quote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#0A192F] dark:text-white font-['Outfit']">
                Como Citar este Artigo
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Copie a referência bibliográfica nos padrões acadêmicos e técnicos
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Format Selection Tabs */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedFormat('abnt')}
              className={`py-2 px-2 rounded-lg text-xs font-bold font-['Outfit'] transition-all cursor-pointer text-center ${
                selectedFormat === 'abnt'
                  ? 'bg-white dark:bg-slate-800 text-[#1D4ED8] dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ABNT
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat('apa')}
              className={`py-2 px-2 rounded-lg text-xs font-bold font-['Outfit'] transition-all cursor-pointer text-center ${
                selectedFormat === 'apa'
                  ? 'bg-white dark:bg-slate-800 text-[#1D4ED8] dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              APA 7th
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat('quote')}
              className={`py-2 px-2 rounded-lg text-xs font-bold font-['Outfit'] transition-all cursor-pointer text-center ${
                selectedFormat === 'quote'
                  ? 'bg-white dark:bg-slate-800 text-[#1D4ED8] dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Citação Rápida
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat('bibtex')}
              className={`py-2 px-2 rounded-lg text-xs font-bold font-['Outfit'] transition-all cursor-pointer text-center ${
                selectedFormat === 'bibtex'
                  ? 'bg-white dark:bg-slate-800 text-[#1D4ED8] dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              BibTeX
            </button>
          </div>

          {/* Description of format */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <BookOpen className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-blue-400" />
            <span>
              {selectedFormat === 'abnt' && 'Norma ABNT NBR 6023 (Padrão para trabalhos acadêmicos no Brasil)'}
              {selectedFormat === 'apa' && 'American Psychological Association 7th Edition (Padrão Internacional)'}
              {selectedFormat === 'quote' && 'Formato para redes sociais, apresentações de aula e artigos'}
              {selectedFormat === 'bibtex' && 'Código BibTeX para Overleaf, LaTeX e gerenciadores de referências'}
            </span>
          </div>

          {/* Citation Output Box */}
          <div className="relative group bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 font-mono text-xs text-[#0A192F] dark:text-slate-200 leading-relaxed break-words whitespace-pre-wrap select-all">
            {activeText}
          </div>

          {/* Action Button: Copy */}
          <button
            type="button"
            onClick={handleCopy}
            className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-['Outfit'] cursor-pointer shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copiado para a Área de Transferência!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Citação Formatada</span>
              </>
            )}
          </button>
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-center text-slate-500 dark:text-slate-400 font-medium shrink-0">
          Recomendado para citações em TCC, monografias, manuais de instrução e relatórios de segurança.
        </div>
      </div>
    </div>
  );
};
