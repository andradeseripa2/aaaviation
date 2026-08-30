import React, { useState } from 'react';
import { Post } from '../../types';
import { useBlog } from '../../context/BlogContext';
import {
  Share2,
  Copy,
  Check,
  X,
  MessageCircle,
  Send,
  Linkedin,
  Instagram,
  ExternalLink,
  ImageIcon,
  Download
} from 'lucide-react';

interface ShareModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ post, isOpen, onClose }) => {
  const { getCategoryName, getCategoryVisual } = useBlog();
  const [copied, setCopied] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aaaviation.com.br';
  const shareUrl = `${origin}/post/${post.slug}`;
  const shareTitle = post.title;
  const shareSummary = post.excerpt || post.subtitle || 'Confira esta análise técnica de aviação por Alexandre Andrade';
  const coverImageUrl = post.coverImage;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyFullMessage = async () => {
    const fullText = `✈️ *${shareTitle}*\n\n${shareSummary}\n\n${coverImageUrl ? `🖼️ Imagem de Capa: ${coverImageUrl}\n\n` : ''}Leia a análise técnica completa no blog de Alexandre Andrade:\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Pre-configured Share Actions with cover image
  const shareWhatsApp = () => {
    const text = encodeURIComponent(`✈️ *${shareTitle}*\n\n${shareSummary}\n\n🔗 *Acesse o artigo completo:*\n${shareUrl}`);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `https://api.whatsapp.com/send?text=${text}`;
    } else {
      window.open(`https://web.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
    }
  };

  const shareTelegram = () => {
    const text = encodeURIComponent(`✈️ ${shareTitle}\n\n${shareSummary}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const shareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener,noreferrer,width=600,height=600'
    );
  };

  const shareInstagram = () => {
    handleCopyLink();
    window.open('https://instagram.com', '_blank', 'noopener,noreferrer');
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator
        .share({
          title: shareTitle,
          text: `${shareSummary}\n\n${shareUrl}`,
          url: shareUrl
        })
        .catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#0B1528] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 overflow-hidden text-slate-900 dark:text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Outfit'] text-[#0A192F] dark:text-white leading-tight">
                Compartilhar Artigo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Divulgue o conhecimento aeronáutico com foto de capa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Article Summary Box with Cover Image Preview */}
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 overflow-hidden mb-5 flex items-stretch">
          {coverImageUrl ? (
            <div className="w-24 shrink-0 relative bg-slate-900">
              <img
                src={coverImageUrl}
                alt={post.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 shrink-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
          <div className="p-3 flex-1 flex flex-col justify-center min-w-0">
            <span className="text-[10px] font-mono font-bold uppercase text-[#1D4ED8] dark:text-blue-400 flex items-center gap-1 mb-1">
              {getCategoryVisual(post.category, 'w-3 h-3')}
              <span className="truncate">{getCategoryName(post.category)}</span>
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug font-['Outfit']">
              {post.title}
            </h4>
          </div>
        </div>

        {/* Social Share Grid (WhatsApp, Telegram, LinkedIn, Instagram) */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {/* WhatsApp */}
          <button
            type="button"
            onClick={shareWhatsApp}
            className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Compartilhar no WhatsApp com Imagem de Capa"
          >
            <div className="w-11 h-11 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
              <MessageCircle className="w-6 h-6 fill-current" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-['Outfit']">
              WhatsApp
            </span>
          </button>

          {/* Telegram */}
          <button
            type="button"
            onClick={shareTelegram}
            className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#0088CC]/10 hover:bg-[#0088CC]/20 border border-[#0088CC]/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Compartilhar no Telegram"
          >
            <div className="w-11 h-11 rounded-xl bg-[#0088CC] text-white flex items-center justify-center shadow-xs">
              <Send className="w-5 h-5 ml-0.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-['Outfit']">
              Telegram
            </span>
          </button>

          {/* LinkedIn */}
          <button
            type="button"
            onClick={shareLinkedIn}
            className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border border-[#0A66C2]/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Compartilhar no LinkedIn (gera preview da imagem)"
          >
            <div className="w-11 h-11 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center shadow-xs">
              <Linkedin className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-['Outfit']">
              LinkedIn
            </span>
          </button>

          {/* Instagram */}
          <button
            type="button"
            onClick={shareInstagram}
            className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-purple-500/10 hover:from-amber-500/20 hover:via-rose-500/20 hover:to-purple-500/20 border border-rose-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Copiar link para o Instagram Stories / Bio"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-xs">
              <Instagram className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-['Outfit']">
              Instagram
            </span>
          </button>
        </div>

        {/* Copy Direct Link Box */}
        <div className="space-y-2 mb-3">
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Link direto da publicação
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 font-mono focus:outline-hidden select-all truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-['Outfit'] transition-all shrink-0 cursor-pointer shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#1D4ED8] hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Extra Action: Copy formatted message with image and link */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={handleCopyFullMessage}
            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#1D4ED8] dark:hover:text-blue-400 font-['Outfit'] inline-flex items-center gap-1.5 cursor-pointer py-1"
          >
            {copiedMsg ? (
              <span className="text-emerald-600 flex items-center gap-1 font-bold">
                <Check className="w-3.5 h-3.5" /> Mensagem + Imagem copiada!
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="w-3.5 h-3.5" /> Copiar texto completo c/ foto
              </span>
            )}
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={shareNative}
              className="text-xs font-bold text-[#1D4ED8] dark:text-blue-400 hover:underline font-['Outfit'] inline-flex items-center gap-1 cursor-pointer py-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mais opções</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
