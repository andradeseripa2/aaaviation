import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  Check,
  Copy,
  ExternalLink,
  Award,
  ShieldAlert,
  Compass,
  FileSearch,
  ShieldCheck,
  Info,
  Maximize2,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { slugifyHeader } from '../post/TableOfContents';
import { resolveImageUrl, getAviationFallbackImage, getMediaDataUrl } from '../../services/mediaService';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  const [lightboxImg, setLightboxImg] = useState<{ src: string; alt: string } | null>(null);

  const normalizedContent = React.useMemo(() => {
    if (!content) return '';
    // Normalize newlines inside markdown image tags so multiline URLs/data URIs parse cleanly
    return content.replace(/!\[(.*?)\]\(([\s\S]*?)\)/g, (match, alt, url) => {
      return `![${alt}](${url.replace(/\s+/g, '')})`;
    });
  }, [content]);

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-6 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl shadow-xs bg-white dark:bg-[#0B1528]">
              <table {...props} className="min-w-full text-sm text-left border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead {...props} className="bg-[#0A192F] dark:bg-[#06101E] text-white font-['Outfit'] font-bold text-xs uppercase tracking-wider">
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th {...props} className="px-4 py-3.5 border-b border-[#CBD5E1] dark:border-slate-800 text-[#FFFFFF] font-bold">
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td {...props} className="px-4 py-3 border-b border-[#F1F5F9] dark:border-slate-800/80 text-[#334155] dark:text-slate-300 text-xs sm:text-sm">
              {children}
            </td>
          ),
          a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith('http') || href?.startsWith('//');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-0.5 text-[#1D4ED8] dark:text-blue-400 hover:text-[#0A192F] dark:hover:text-blue-300 font-semibold underline underline-offset-4 decoration-[#93C5FD] dark:decoration-blue-800 transition-colors"
                {...props}
              >
                <span>{children}</span>
                {isExternal && <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-70 ml-0.5" />}
              </a>
            );
          },
          pre: ({ children, ...props }) => {
            return <CodeBlockWrapper {...props}>{children}</CodeBlockWrapper>;
          },
          code: ({ className, children, ...props }) => {
            const isInline = !className && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[#F1F5F9] dark:bg-slate-800/80 border border-[#E2E8F0] dark:border-slate-700 text-[#0E2954] dark:text-blue-300 font-mono text-[0.85em] font-semibold"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          blockquote: ({ children, ...props }) => {
            return <EditorialCallout {...props}>{children}</EditorialCallout>;
          },
          hr: ({ ...props }) => (
            <div className="my-8 flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#CBD5E1] dark:via-slate-700 to-transparent" />
              <span className="text-xs font-mono text-[#94A3B8] dark:text-slate-500 tracking-widest uppercase">✈ ✈ ✈</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#CBD5E1] dark:via-slate-700 to-transparent" />
            </div>
          ),
          h1: ({ children, ...props }) => (
            <h1 {...props} className="text-2xl sm:text-3xl font-extrabold text-[#0A192F] dark:text-slate-100 font-['Outfit'] mt-8 mb-4 tracking-tight leading-tight">
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => {
            const textContent = extractStringFromChildren(children);
            const id = slugifyHeader(textContent);
            return (
              <h2
                id={id}
                {...props}
                className="text-xl sm:text-2xl font-extrabold text-[#0A192F] dark:text-slate-100 font-['Outfit'] mt-9 mb-4 pb-2 border-b border-[#E2E8F0] dark:border-slate-800 tracking-tight flex items-center gap-2.5 scroll-mt-24"
              >
                <span className="w-2 h-2 rounded-full bg-[#1D4ED8] dark:bg-blue-500 shrink-0" />
                <span>{children}</span>
              </h2>
            );
          },
          h3: ({ children, ...props }) => {
            const textContent = extractStringFromChildren(children);
            const id = slugifyHeader(textContent);
            return (
              <h3
                id={id}
                {...props}
                className="text-lg sm:text-xl font-bold text-[#0E2954] dark:text-blue-300 font-['Outfit'] mt-7 mb-3 tracking-tight scroll-mt-24"
              >
                {children}
              </h3>
            );
          },
          h4: ({ children, ...props }) => (
            <h4 {...props} className="text-base font-bold text-[#1E293B] dark:text-slate-200 font-['Outfit'] mt-5 mb-2">
              {children}
            </h4>
          ),
          ul: ({ children, ...props }) => (
            <ul {...props} className="my-4 pl-6 list-disc space-y-1.5 text-[#334155] dark:text-slate-300 leading-relaxed">
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol {...props} className="my-4 pl-6 list-decimal space-y-1.5 text-[#334155] dark:text-slate-300 leading-relaxed">
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li {...props} className="text-sm sm:text-base leading-relaxed text-[#334155] dark:text-slate-300">
              {children}
            </li>
          ),
          p: ({ node, children, ...props }) => {
            const hasBlockOrImage = (node as any)?.children?.some(
              (child: any) =>
                child.type === 'element' &&
                (child.tagName === 'img' ||
                  child.tagName === 'div' ||
                  child.tagName === 'figure' ||
                  child.tagName === 'table' ||
                  child.tagName === 'blockquote' ||
                  child.tagName === 'pre')
            );

            if (hasBlockOrImage) {
              return (
                <div className="my-4 leading-relaxed text-[#334155] dark:text-slate-300 text-sm sm:text-base" {...props}>
                  {children}
                </div>
              );
            }

            return (
              <p className="my-4 leading-relaxed text-[#334155] dark:text-slate-300 text-sm sm:text-base" {...props}>
                {children}
              </p>
            );
          },
          img: ({ src, alt, ...props }) => {
            if (!src || !src.trim()) {
              return null;
            }
            const resolvedSrc = resolveImageUrl(src);
            return (
              <ArticleImage
                src={resolvedSrc}
                alt={alt || ''}
                onOpenLightbox={() => setLightboxImg({ src: resolvedSrc, alt: alt || '' })}
                {...props}
              />
            );
          }
        }}
      >
        {normalizedContent}
      </ReactMarkdown>

      {/* Lightbox for zooming diagrams & high-res aviation photos */}
      {lightboxImg && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-slate-800/80 rounded-full cursor-pointer transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImg.src}
              alt={lightboxImg.alt}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-700"
            />
            {lightboxImg.alt && (
              <p className="mt-3 text-sm text-slate-200 font-medium text-center bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700">
                📷 {lightboxImg.alt}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual article image with load states and fallback
const ArticleImage: React.FC<{
  src: string;
  alt: string;
  onOpenLightbox: () => void;
}> = ({ src, alt, onOpenLightbox }) => {
  const [currentSrc, setCurrentSrc] = useState(() => resolveImageUrl(src));
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const initial = resolveImageUrl(src);
    setCurrentSrc(initial);
    setIsLoaded(false);
    setHasError(false);
    setHasTriedFallback(false);

    // If it's a media token or endpoint and not already a raw data URL in memory, resolve asynchronously from IndexedDB/Firestore
    if (src && (src.startsWith('/api/media/') || src.startsWith('media:')) && !initial.startsWith('data:')) {
      getMediaDataUrl(src).then(dataUrl => {
        if (isMounted && dataUrl) {
          setCurrentSrc(dataUrl);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [src]);

  const handleError = () => {
    if (!hasTriedFallback) {
      setHasTriedFallback(true);
      if (src && (src.startsWith('/api/media/') || src.startsWith('media:'))) {
        getMediaDataUrl(src).then(dataUrl => {
          if (dataUrl) {
            setCurrentSrc(dataUrl);
            return;
          }
          setCurrentSrc(getAviationFallbackImage());
        });
      } else {
        setCurrentSrc(getAviationFallbackImage());
      }
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <span className="block my-6 p-4 rounded-2xl border border-dashed border-[#CBD5E1] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/50 text-center">
        <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1" />
        <span className="block text-xs font-bold text-[#64748B] dark:text-slate-400">
          {alt || 'Figura do Artigo Técnico'}
        </span>
        <span className="text-[11px] text-slate-400 block mt-0.5">
          Não foi possível carregar a imagem externa.
        </span>
      </span>
    );
  }

  return (
    <figure className="my-6 text-center group cursor-pointer" onClick={onOpenLightbox}>
      <div className="relative inline-block overflow-hidden rounded-2xl shadow-md border border-[#E2E8F0] dark:border-slate-800 bg-slate-900/5 max-w-full">
        <img
          src={currentSrc}
          alt={alt || 'Imagem do Artigo'}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          className={`max-h-[520px] w-auto max-w-full mx-auto object-cover transition-transform duration-300 group-hover:scale-[1.01] ${
            isLoaded ? 'opacity-100' : 'opacity-70'
          }`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs text-xs flex items-center gap-1">
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">Ampliar</span>
        </div>
      </div>
      {alt && (
        <figcaption className="mt-2 text-xs text-[#64748B] dark:text-slate-400 italic font-medium max-w-2xl mx-auto">
          📷 {alt}
        </figcaption>
      )}
    </figure>
  );
};

// Helper to extract plain text string from React children for slug generation
function extractStringFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(extractStringFromChildren).join('');
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(children) && children.props && 'children' in children.props) {
    return extractStringFromChildren(children.props.children);
  }
  return '';
}

// Callout component detecting aeronautical badges
const EditorialCallout: React.FC<React.HTMLAttributes<HTMLElement>> = ({ children, ...props }) => {
  const fullText = extractStringFromChildren(children).trim();

  // Pattern detection
  const isExpertNote = fullText.includes('NOTA DO ESPECIALISTA') || fullText.includes('OPINIÃO TÉCNICA');
  const isOperationalAlert = fullText.includes('ALERTA OPERACIONAL') || fullText.includes('ATENÇÃO');
  const isGlossary = fullText.includes('GLOSSÁRIO') || fullText.includes('DEFINIÇÃO AERONÁUTICA');
  const isInvestigation = fullText.includes('INVESTIGAÇÃO') || fullText.includes('CENIPA') || fullText.includes('RELATÓRIO FINAL');
  const isSafetyTip = fullText.includes('DICA DE SEGURANÇA') || fullText.includes('SEGURANÇA DE VOO');

  if (isExpertNote) {
    return (
      <div className="my-6 p-4 sm:p-5 rounded-2xl border border-amber-300/80 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 shadow-2xs">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold font-['Outfit'] uppercase tracking-wider text-amber-800 dark:text-amber-300">
          <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Nota do Especialista & Experiência Prática</span>
        </div>
        <div className="text-sm sm:text-[15px] leading-relaxed text-amber-900 dark:text-amber-200">
          {children}
        </div>
      </div>
    );
  }

  if (isOperationalAlert) {
    return (
      <div className="my-6 p-4 sm:p-5 rounded-2xl border border-rose-300/80 dark:border-rose-500/40 bg-rose-50/70 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100 shadow-2xs">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold font-['Outfit'] uppercase tracking-wider text-rose-800 dark:text-rose-300">
          <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>Alerta Operacional / Ponto Crítico</span>
        </div>
        <div className="text-sm sm:text-[15px] leading-relaxed text-rose-900 dark:text-rose-200">
          {children}
        </div>
      </div>
    );
  }

  if (isGlossary) {
    return (
      <div className="my-6 p-4 sm:p-5 rounded-2xl border border-sky-300/80 dark:border-sky-500/40 bg-sky-50/70 dark:bg-sky-950/30 text-sky-950 dark:text-sky-100 shadow-2xs">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold font-['Outfit'] uppercase tracking-wider text-sky-800 dark:text-sky-300">
          <Compass className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Glossário Aeronáutico & Terminologia</span>
        </div>
        <div className="text-sm sm:text-[15px] leading-relaxed text-sky-900 dark:text-sky-200">
          {children}
        </div>
      </div>
    );
  }

  if (isInvestigation) {
    return (
      <div className="my-6 p-4 sm:p-5 rounded-2xl border border-indigo-300/80 dark:border-indigo-500/40 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100 shadow-2xs">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold font-['Outfit'] uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
          <FileSearch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Análise de Investigação / Lições Aprendidas</span>
        </div>
        <div className="text-sm sm:text-[15px] leading-relaxed text-indigo-900 dark:text-indigo-200">
          {children}
        </div>
      </div>
    );
  }

  if (isSafetyTip) {
    return (
      <div className="my-6 p-4 sm:p-5 rounded-2xl border border-emerald-300/80 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 shadow-2xs">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold font-['Outfit'] uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Diretriz de Segurança Operacional</span>
        </div>
        <div className="text-sm sm:text-[15px] leading-relaxed text-emerald-900 dark:text-emerald-200">
          {children}
        </div>
      </div>
    );
  }

  // Standard editorial blockquote
  return (
    <blockquote
      {...props}
      className="my-6 pl-4 sm:pl-5 py-3 pr-4 border-l-4 border-[#1D4ED8] dark:border-blue-500 bg-[#F8FAFC] dark:bg-slate-900/60 rounded-r-2xl text-[#1E293B] dark:text-slate-200 italic shadow-2xs leading-relaxed"
    >
      {children}
    </blockquote>
  );
};

// Helper component to add a copy button to code blocks
const CodeBlockWrapper: React.FC<React.HTMLAttributes<HTMLPreElement>> = ({ children, ...props }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const codeElement = React.Children.toArray(children).find(
      (child): child is React.ReactElement<{ children?: React.ReactNode }> =>
        React.isValidElement(child) && child.type === 'code'
    );
    const textToCopy = codeElement?.props?.children ? String(codeElement.props.children) : '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative my-6 rounded-2xl overflow-hidden border border-[#1E293B] dark:border-slate-800 shadow-md bg-[#0A192F] group">
      <div className="flex items-center justify-between px-4 py-2 bg-[#06101E] border-b border-[#1E293B] text-slate-400 text-xs font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          <span className="ml-2 text-[11px] text-slate-400">Snippet Técnico</span>
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Copiar código"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-sans font-bold">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="font-sans">Copiar</span>
            </>
          )}
        </button>
      </div>
      <pre {...props} className="p-4 sm:p-5 overflow-x-auto text-xs sm:text-sm font-mono text-slate-100 leading-relaxed bg-transparent m-0">
        {children}
      </pre>
    </div>
  );
};
