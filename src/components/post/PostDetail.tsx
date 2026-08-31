import React, { useEffect, useState, useRef } from 'react';
import { useBlog } from '../../context/BlogContext';
import { useAuth } from '../../context/AuthContext';
import { Post, FontSizeScale } from '../../types';
import { isPostPublishedAndActive } from '../../lib/scheduleUtils';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { CommentSection } from './CommentSection';
import { PostRating } from './PostRating';
import { NewsletterSection } from '../home/NewsletterSection';
import { LeadCaptureCTA } from '../common/LeadCaptureCTA';
import { AdBanner } from '../common/AdBanner';
import { MarkdownContent } from '../common/MarkdownContent';
import { ReadingProgressBar } from '../common/ReadingProgressBar';
import { TableOfContents } from './TableOfContents';
import { ShareModal } from './ShareModal';
import { CitationModal } from './CitationModal';
import { AuthModal } from '../auth/AuthModal';
import { RecommendedPosts } from './RecommendedPosts';
import { downloadExecutivePdf } from '../../utils/pdfExport';
import { CoverImage } from '../common/CoverImage';
import { resolveImageUrl, useResolvedImageUrl, getMediaDataUrl } from '../../services/mediaService';
import {
  Calendar,
  Clock,
  Share2,
  Link as LinkIcon,
  Heart,
  Bookmark,
  ChevronLeft,
  Building2,
  Compass,
  Check,
  ShieldCheck,
  Award,
  ArrowUpRight,
  Type,
  Eye,
  MessageCircle,
  Send,
  Linkedin,
  Download,
  Quote,
  Sparkles,
  BookOpen,
  Copy
} from 'lucide-react';

interface PostDetailProps {
  post: Post;
}

export const PostDetail: React.FC<PostDetailProps> = ({ post }) => {
  if (!post) {
    return null;
  }

  const {
    navigate,
    incrementViews,
    toggleLikePost,
    isPostLiked,
    isBookmarked,
    toggleBookmark,
    fontSize,
    setFontSize,
    posts,
    getCategoryName,
    getCategoryVisual,
    postMatchesCategoryFilter,
    aboutData
  } = useBlog();

  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [citationCopied, setCitationCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const liked = post?.id ? isPostLiked(post.id) : false;
  const bookmarked = post?.id ? isBookmarked(post.id) : false;

  // Author resolution: Always defaults to Alexandre Andrade and /author.webp, completely isolated from whoever is logged in
  const defaultAuthorName = aboutData?.authorName || 'Alexandre Andrade';
  const defaultAuthorRole = aboutData?.heroHighlight || 'Especialista em Manutenção Aeronáutica & Investigação SIPAER';
  const defaultAuthorAvatar = aboutData?.photoUrl || '/author.webp';

  const isAlexandre =
    !post.author?.name ||
    post.author.name.toLowerCase().includes('alexandre') ||
    (user && post.author.name === user.name && user.role !== 'admin');

  const resolvedAuthorName = isAlexandre ? defaultAuthorName : post.author!.name.trim();
  const resolvedAuthorRole = isAlexandre ? defaultAuthorRole : (post.author?.role?.trim() || defaultAuthorRole);
  const rawAuthorAvatar = isAlexandre ? defaultAuthorAvatar : (post.author?.avatar?.trim() || defaultAuthorAvatar);
  const resolvedAuthorAvatar = useResolvedImageUrl(rawAuthorAvatar, '/author.webp');

  const handleDownloadPdf = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    downloadExecutivePdf(post, resolvedAuthorName, resolvedAuthorRole);
  };

  const handleQuickCopyAbnt = async () => {
    const currentYear = new Date().getFullYear();
    const todayFormatted = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');
    const currentUrl = window.location.href;
    const authorUpper = (resolvedAuthorName || 'ALEXANDRE ANDRADE').toUpperCase();
    const abnt = `${authorUpper}. ${post.title}. Alexandre Andrade Aviation, ${currentYear}. Disponível em: <${currentUrl}>. Acesso em: ${todayFormatted}.`;

    try {
      await navigator.clipboard.writeText(abnt);
      setCitationCopied(true);
      setTimeout(() => setCitationCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = abnt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCitationCopied(true);
      setTimeout(() => setCitationCopied(false), 2500);
    }
  };

  useEffect(() => {
    if (!post || !post.id) return;

    incrementViews(post.id);

    // Update document title and Open Graph meta tags for rich social sharing with cover image
    const prevTitle = document.title;
    try {
      document.title = `${post.title || 'Artigo'} | Alexandre Andrade`;

      const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
        let meta = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute(attr, key);
          document.head.appendChild(meta);
        }
        meta.content = content;
      };

      if (post.coverImage && typeof post.coverImage === 'string') {
        const absoluteImageUrl = post.coverImage.startsWith('http') || post.coverImage.startsWith('data:')
          ? post.coverImage
          : `${window.location.origin}${post.coverImage.startsWith('/') ? '' : '/'}${post.coverImage}`;
        setMetaTag('property', 'og:image', absoluteImageUrl);
        setMetaTag('name', 'twitter:image', absoluteImageUrl);
      }
      setMetaTag('property', 'og:title', post.title || 'Artigo Técnico');
      setMetaTag('property', 'og:description', post.excerpt || post.subtitle || 'Análise Técnica de Manutenção Aeronáutica por Alexandre Andrade');
      setMetaTag('property', 'og:type', 'article');
      setMetaTag('name', 'twitter:card', 'summary_large_image');
      setMetaTag('name', 'twitter:title', post.title || 'Artigo Técnico');
      setMetaTag('name', 'twitter:description', post.excerpt || post.subtitle || 'Análise Técnica de Aviação');
    } catch (e) {
      console.warn('Meta tags injection note:', e);
    }

    return () => {
      document.title = prevTitle;
    };
  }, [post?.id, post?.title, post?.coverImage, post?.excerpt, post?.subtitle]);

  const getPostShareUrl = () => {
    try {
      const origin = window.location.origin;
      return `${origin}/post/${post.slug}`;
    } catch {
      return window.location.href;
    }
  };

  const handleCopyLink = () => {
    const shareUrl = getPostShareUrl();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getPostShareUrl();
    const text = encodeURIComponent(`✈️ *${post.title}*\n\n${post.excerpt || post.subtitle || 'Confira esta análise técnica de aviação'}\n\n🔗 *Acesse o artigo completo:*\n${shareUrl}`);
    
    // Check if on mobile device to use direct whatsapp scheme if preferred, or standard wa.me
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const whatsappUrl = isMobile 
      ? `whatsapp://send?text=${text}`
      : `https://web.whatsapp.com/send?text=${text}`;

    // Fallback handler if whatsapp protocol is not installed or fails
    const win = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!win || isMobile) {
      // Also fallback to universal wa.me link
      window.location.href = `https://api.whatsapp.com/send?text=${text}`;
    }
  };

  const handleShareTelegram = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getPostShareUrl();
    const text = encodeURIComponent(`✈️ ${post.title}\n\n${post.excerpt || post.subtitle || ''}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getPostShareUrl();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer,width=600,height=600');
  };

  const handleNativeShare = async () => {
    const shareUrl = getPostShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `${post.title}\n${post.excerpt || post.subtitle || ''}`,
          url: shareUrl
        });
        return;
      } catch {
        // user cancelled or failed, open modal
      }
    }
    setIsShareModalOpen(true);
  };

  const handleLike = () => {
    toggleLikePost(post.id);
  };

  const handleBookmark = () => {
    toggleBookmark(post.id);
  };

  const fontSizeOptions: { key: FontSizeScale; label: string; title: string }[] = [
    { key: 'sm', label: 'A-', title: 'Fonte Compacta' },
    { key: 'md', label: 'A', title: 'Fonte Padrão' },
    { key: 'lg', label: 'A+', title: 'Fonte Ampla' },
    { key: 'xl', label: 'A++', title: 'Fonte Máxima' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Top Reading Progress Bar */}
      <ReadingProgressBar targetRef={articleRef} />

      {/* Top Navigation & Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('blog')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B] dark:text-slate-400 hover:text-[#0A192F] dark:hover:text-white transition-colors uppercase tracking-wider font-['Outfit'] cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar aos Artigos</span>
        </button>

        {/* Category & Read Time Tags */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1D4ED8] dark:text-blue-400 uppercase tracking-widest">
          <button
            onClick={() => navigate('category', { categorySlug: post.category })}
            className="hover:underline cursor-pointer flex items-center gap-1.5"
          >
            {getCategoryVisual(post.category, 'w-3.5 h-3.5')}
            <span>{getCategoryName(post.category)}</span>
          </button>
          <span>•</span>
          <span>{post.date}</span>
        </div>
      </div>

      {/* Main Grid: Post Article (Left) & Sticky Sidebar (Right) */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-10">
        {/* Left Column: Main Post Article */}
        <article ref={articleRef} className="w-full lg:flex-1 lg:max-w-3xl min-w-0">
          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A192F] dark:text-white font-['Outfit'] tracking-tight leading-[1.15] mb-4">
            {post.title}
          </h1>

          {/* Subtitle / Excerpt */}
          {post.subtitle && (
            <p className="text-base sm:text-lg text-[#475569] dark:text-slate-300 leading-relaxed mb-6 font-normal">
              {post.subtitle}
            </p>
          )}

          {/* Author Card & Reading Controls Bar */}
          <div className="py-4 border-y border-[#E2E8F0] dark:border-slate-800 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={resolvedAuthorAvatar}
                alt={resolvedAuthorName}
                className="w-12 h-12 rounded-full object-cover border border-[#CBD5E1] dark:border-slate-700"
                onError={async e => {
                  const target = e.target as HTMLImageElement;
                  if (rawAuthorAvatar && (rawAuthorAvatar.startsWith('/api/media/') || rawAuthorAvatar.startsWith('media:'))) {
                    const fromFirestore = await getMediaDataUrl(rawAuthorAvatar);
                    if (fromFirestore && fromFirestore !== target.src) {
                      target.src = fromFirestore;
                      return;
                    }
                  }
                  target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    resolvedAuthorName || 'Autor'
                  )}`;
                }}
              />
              <div>
                <h4 className="text-sm font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-1.5">
                  <span>{resolvedAuthorName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-mono uppercase tracking-wide">
                    Autor
                  </span>
                </h4>
                <p className="text-xs text-[#64748B] dark:text-slate-400">{resolvedAuthorRole}</p>
              </div>
            </div>

            {/* Read time and actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#64748B] dark:text-slate-400">
              <div className="flex items-center gap-1 font-medium mr-1">
                <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>{post.readTimeMinutes} min</span>
              </div>

              {post.viewsCount !== undefined && (
                <div className="flex items-center gap-1 font-medium mr-1 text-[#64748B] dark:text-slate-400">
                  <Eye className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>{post.viewsCount}</span>
                </div>
              )}

              {/* Font Size Adjuster Tool */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                {fontSizeOptions.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFontSize(opt.key)}
                    className={`px-1.5 py-1 rounded text-[11px] font-bold font-mono transition-colors ${
                      fontSize === opt.key
                        ? 'bg-white dark:bg-slate-700 text-[#1D4ED8] dark:text-blue-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={opt.title}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Bookmark Button */}
              <button
                type="button"
                onClick={handleBookmark}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  bookmarked
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 font-bold shadow-2xs'
                    : 'border-[#CBD5E1] dark:border-slate-700 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 text-[#334155] dark:text-slate-300'
                }`}
                title={bookmarked ? 'Salvo em Favoritos' : 'Salvar para Ler Depois'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">{bookmarked ? 'Salvo' : 'Salvar'}</span>
              </button>

              {/* Like Button */}
              <button
                type="button"
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  liked
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 shadow-2xs font-bold'
                    : 'border-[#CBD5E1] dark:border-slate-700 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 text-[#334155] dark:text-slate-300 font-medium'
                }`}
                title={liked ? 'Remover curtida' : 'Curtir este artigo'}
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                    liked ? 'fill-rose-500 text-rose-500' : 'text-[#64748B] dark:text-slate-400'
                  }`}
                />
                <span>{post.likesCount || 0}</span>
              </button>

              {/* PDF Download Button (Executive Format) */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-slate-700 hover:bg-[#0A192F] hover:text-white dark:hover:bg-blue-600 text-[#334155] dark:text-slate-300 transition-all font-['Outfit'] font-bold text-xs cursor-pointer shadow-2xs group"
                title={user ? 'Baixar Artigo em PDF Executivo' : 'Cadastre-se grátis para baixar este artigo em PDF'}
              >
                <Download className="w-3.5 h-3.5 text-[#1D4ED8] group-hover:text-white dark:text-blue-400" />
                <span className="hidden sm:inline">PDF Executivo</span>
              </button>

              {/* Citation Button */}
              <button
                type="button"
                onClick={() => setIsCitationModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#334155] dark:text-slate-300 transition-all font-['Outfit'] font-bold text-xs cursor-pointer shadow-2xs group"
                title="Copiar citação deste artigo (ABNT, APA, BibTeX)"
              >
                <Quote className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-blue-400" />
                <span className="hidden sm:inline">Citar Artigo</span>
              </button>

              {/* Share Menu Trigger Button */}
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-slate-700 hover:bg-[#1D4ED8] hover:text-white dark:hover:bg-blue-600 text-[#334155] dark:text-slate-300 transition-all font-['Outfit'] font-bold text-xs cursor-pointer shadow-2xs"
                title="Compartilhar Artigo"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>

              {/* Quick WhatsApp shortcut */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-[#25D366] hover:text-white text-emerald-700 dark:text-emerald-400 transition-all cursor-pointer"
                title="Compartilhar no WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
              </button>

              {/* Copy link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg border border-[#CBD5E1] dark:border-slate-700 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 text-[#334155] dark:text-slate-300 transition-colors cursor-pointer"
                title="Copiar Link da Publicação"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <LinkIcon className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Featured Cover Image with Caption */}
          {post.coverImage && (
            <figure className="mb-8">
              <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900 max-h-[500px]">
                <CoverImage
                  src={post.coverImage}
                  alt={post.title}
                  category={post.category}
                  priority={true}
                  className="w-full h-auto max-h-[500px] object-cover"
                />
              </div>
              {post.coverImageCaption && (
                <figcaption className="mt-2.5 text-center text-xs text-[#64748B] dark:text-slate-400 italic font-medium">
                  📷 {post.coverImageCaption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Mandatory Disclaimer for Safety / Investigation posts */}
          {post.isSafetyPost && <DisclaimerBanner variant="safety" />}

          {/* AdSense Top In-Article Banner */}
          <AdBanner type="in-content" />

          {/* In-Article Table of Contents */}
          <TableOfContents content={post.content} />

          {/* Main Post Body with Selected Reader Font Scale */}
          <div className={`my-6 reader-size-${fontSize}`}>
            <MarkdownContent content={post.content} />
          </div>

          {/* Custom Technical Diagram Cards (if post has diagramData) */}
          {post.diagramData && (
            <div className="my-10 space-y-6">
              <h3 className="text-xl font-black text-[#0A192F] dark:text-white font-['Outfit']">
                {post.diagramData.title}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {post.diagramData.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-white dark:bg-[#0B1528] border border-[#E2E8F0] dark:border-slate-800 shadow-xs space-y-2"
                  >
                    <div className="flex items-center gap-2 text-[#1D4ED8] dark:text-blue-400">
                      {idx === 0 ? <Building2 className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
                      <h4 className="font-bold text-[#0A192F] dark:text-white font-['Outfit'] text-base">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              {post.diagramData.callout && (
                <div className="p-4 rounded-xl bg-[#F0F7FF] dark:bg-blue-950/40 border-l-4 border-l-[#1D4ED8] dark:border-l-blue-400 text-xs text-[#1E3A8A] dark:text-blue-200 leading-relaxed">
                  <span className="font-mono font-bold text-[10px] uppercase text-[#1D4ED8] dark:text-blue-400 block mb-1">
                    PROTOCOLO OPERACIONAL PADRÃO
                  </span>
                  {post.diagramData.callout}
                </div>
              )}
            </div>
          )}

          {/* Regulatory Comparison (if present) */}
          {post.regulatoryComparison && (
            <div className="my-8 p-6 bg-white dark:bg-[#0B1528] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-lg font-black text-[#0A192F] dark:text-white font-['Outfit']">
                {post.regulatoryComparison.title}
              </h3>
              <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed">
                {post.regulatoryComparison.description}
              </p>

              <div className="space-y-3 pt-2">
                {post.regulatoryComparison.items.map((comp, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#334155] dark:text-slate-300">
                    <span className="font-bold text-[#0A192F] dark:text-white min-w-[130px] font-mono">
                      • {comp.entity}:
                    </span>
                    <span className="leading-relaxed">{comp.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Executive Study, Citation & PDF Download Box */}
          <div className="my-8 p-5 sm:p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-[#0B1528] dark:via-[#0E1B33] dark:to-[#070F1E] rounded-3xl border border-blue-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 dark:bg-blue-950/80 text-[#1D4ED8] dark:text-blue-400 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold font-['Outfit'] text-[#0A192F] dark:text-white">
                    Estudo Técnico, Citação & Relatório
                  </h4>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">
                    Material formatado para acadêmicos, instrutores e mantenedores
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 text-white text-xs font-bold font-['Outfit'] transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{user ? 'Baixar em PDF Executivo' : 'PDF Executivo (Grátis)'}</span>
              </button>
            </div>

            {/* Quick ABNT Citation Snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#475569] dark:text-slate-300 font-semibold font-['Outfit']">
                <span className="flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-blue-400" />
                  <span>Citação ABNT (NBR 6023):</span>
                </span>

                <button
                  type="button"
                  onClick={() => setIsCitationModalOpen(true)}
                  className="text-[#1D4ED8] dark:text-blue-400 hover:underline cursor-pointer text-xs font-bold"
                >
                  Ver outros formatos (APA, BibTeX)...
                </button>
              </div>

              <div className="relative group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 pr-24 font-mono text-[11px] text-[#0F172A] dark:text-slate-300 leading-relaxed select-all overflow-x-auto">
                <p>
                  {(resolvedAuthorName || 'ALEXANDRE ANDRADE').toUpperCase()}. {post.title}. Alexandre Andrade Aviation, {new Date().getFullYear()}.
                </p>

                <button
                  type="button"
                  onClick={handleQuickCopyAbnt}
                  className={`absolute right-2 top-2 px-2.5 py-1.5 rounded-lg text-xs font-bold font-['Outfit'] transition-all flex items-center gap-1 cursor-pointer ${
                    citationCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-[#1D4ED8] hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                  title="Copiar citação ABNT"
                >
                  {citationCopied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Post Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[#E2E8F0] dark:border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#64748B] dark:text-slate-400 uppercase mr-2">
                Tags:
              </span>
              {post.tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => navigate('blog', { search: tag })}
                  className="px-2.5 py-1 rounded-md bg-[#F1F5F9] dark:bg-slate-800 hover:bg-[#E2E8F0] dark:hover:bg-slate-700 text-xs font-mono font-semibold text-[#475569] dark:text-slate-300 transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* AdSense In-Article Bottom Banner */}
          <AdBanner type="in-content" />

          {/* Bottom Social Share Bar */}
          <div className="my-8 p-5 sm:p-6 bg-slate-50 dark:bg-[#0B1528] rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-bold font-['Outfit'] text-[#0A192F] dark:text-white flex items-center justify-center sm:justify-start gap-2">
                <Share2 className="w-4 h-4 text-[#1D4ED8] dark:text-blue-400" />
                <span>Gostou desta análise? Compartilhe com outros profissionais!</span>
              </h4>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Divulgue em seus grupos da aviação, colegas de hangar ou nas redes sociais.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="p-2.5 rounded-xl bg-[#25D366] text-white hover:opacity-90 shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Compartilhar no WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleShareTelegram}
                className="p-2.5 rounded-xl bg-[#0088CC] text-white hover:opacity-90 shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Compartilhar no Telegram"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={handleShareLinkedIn}
                className="p-2.5 rounded-xl bg-[#0A66C2] text-white hover:opacity-90 shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Compartilhar no LinkedIn"
              >
                <Linkedin className="w-4 h-4 fill-current" />
              </button>

              {/* Mais opções / Copiar */}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0A192F] dark:bg-slate-800 text-white text-xs font-bold font-['Outfit'] hover:bg-[#1D4ED8] dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <span>Mais Opções</span>
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 1) Post Rating System (Stars + Popup Login/Signup) */}
          <PostRating postId={post.id} />

          {/* Lead Capture CTA Component: Checklist Técnico SGSO */}
          <LeadCaptureCTA postTitle={post.title} category={post.category} />

          {/* 2) Recommended Posts Section ("Você Também Pode Gostar de Ler") */}
          <RecommendedPosts currentPost={post} layout="bottom" />

          {/* 3) Threaded Comments & Replies Section */}
          <CommentSection post={post} />
        </article>

        {/* Right Column: Sticky Vertical Sidebar */}
        <aside className="w-full lg:w-[320px] lg:shrink-0 lg:sticky lg:top-24 space-y-6 mt-8 lg:mt-0">
          {/* Sidebar Banner */}
          <AdBanner type="sidebar" className="my-0" />

          {/* Recommended Posts in Sidebar (with category & most read switcher) */}
          <RecommendedPosts currentPost={post} layout="sidebar" />

          {/* Technical Author Authority Card with LinkedIn & Direct Contact */}
          <div className="p-5 bg-gradient-to-br from-[#0A192F] via-[#0E2954] to-[#0A192F] text-white rounded-2xl shadow-lg border border-blue-900/60 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={resolvedAuthorAvatar}
                alt={resolvedAuthorName}
                width={56}
                height={56}
                loading="lazy"
                className="w-14 h-14 rounded-xl object-cover border-2 border-blue-400/40 shadow-xs shrink-0 aspect-square"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Autor do Artigo</span>
                </div>
                <h4 className="text-base font-bold font-['Outfit'] text-white truncate">
                  {resolvedAuthorName}
                </h4>
                <p className="text-[11px] text-blue-200 truncate font-mono">
                  SIPAER • ILA • FAB
                </p>
              </div>
            </div>

            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              Mecânico de Aeronaves formado pela FAB, inspetor aeronáutico formado pelo ILA e investigador credenciado SIPAER. Vivência prática em C-95, C-97 e F-5.
            </p>

            {/* Quick Action Links for Author Authority & Conversion */}
            <div className="pt-2 border-t border-blue-800/60 flex flex-col gap-2">
              <a
                href="https://www.linkedin.com/in/alexandre-andrade-aviation/"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#0A66C2] hover:bg-blue-600 text-white text-xs font-bold font-['Outfit'] flex items-center justify-between transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  <span>Conectar no LinkedIn</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => navigate('contact')}
                className="min-h-[38px] px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold font-['Outfit'] border border-slate-700 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Enviar Mensagem</span>
                <ChevronLeft className="w-4 h-4 rotate-180 text-blue-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate('about')}
                className="text-[11px] font-mono text-center text-blue-300 hover:text-white hover:underline transition-colors pt-1 cursor-pointer"
              >
                Ver biografia e certificações completas →
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Share Modal Dialog */}
      <ShareModal
        post={post}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Citation Modal Dialog (ABNT, APA, BibTeX, Citação Rápida) */}
      <CitationModal
        post={post}
        authorName={resolvedAuthorName}
        isOpen={isCitationModalOpen}
        onClose={() => setIsCitationModalOpen(false)}
      />

      {/* Gated Auth Modal for PDF and Protected Actions */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          // Download immediately upon successful signup/login
          downloadExecutivePdf(post, resolvedAuthorName, resolvedAuthorRole);
        }}
        actionType="pdf"
        title="Baixar Artigo em PDF Executivo"
        subtitle="Crie sua conta 100% gratuita ou faça login para baixar este artigo completo em PDF executivo limpo para estudo offline."
      />
    </div>
  );
};
