import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBlog } from '../../context/BlogContext';
import { Post, CategorySlug } from '../../types';
import { AdBanner } from '../common/AdBanner';
import { ImageUploader } from './ImageUploader';
import { RichArticleEditor } from './RichArticleEditor';
import { ArticlePreviewModal } from './ArticlePreviewModal';
import { EditAboutSection } from './EditAboutSection';
import { EditContactSection } from './EditContactSection';
import { EditRadarSection } from './EditRadarSection';
import { CategoryManager } from './CategoryManager';
import { WeeklyBriefingManager } from './WeeklyBriefingManager';
import { AIAgentsModerationManager } from './AIAgentsModerationManager';
import { AVAILABLE_BADGES } from '../../data/badgesData';
import { BadgePill } from '../common/BadgePill';
import { resolveImageUrl } from '../../services/mediaService';
import { isPostPublishedAndActive, getPostScheduleInfo } from '../../lib/scheduleUtils';
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Star,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Users,
  Layers,
  Settings,
  Mail,
  Shield,
  Search,
  ExternalLink,
  Download,
  DollarSign,
  AlertTriangle,
  UserCheck,
  Phone,
  Send,
  Zap,
  Award,
  Calendar,
  Clock,
  Radio,
  Bot,
  Sparkles,
  ChevronDown,
  Save,
  BookmarkCheck,
  FileEdit,
  RotateCcw,
  Check,
  Loader2
} from 'lucide-react';
import { draftService, PostDraft } from '../../services/draftService';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, usersList, deleteUserByAdmin, toggleUserRole, grantBadgeToUser, removeBadgeFromUser } = useAuth();
  const {
    posts,
    categories,
    comments,
    newsletterSubscribers,
    contactMessages,
    adConfig,
    createPost,
    updatePost,
    deletePost,
    togglePublishPost,
    setFeaturedPost,
    approveComment,
    rejectComment,
    deleteComment,
    addCommentReply,
    deleteCommentReply,
    markContactRead,
    deleteContactMessage,
    updateAdConfig,
    addCategory,
    navigate,
    getCategoryName,
    getCategoryVisual,
    aiAgents,
    aiModerationConfig,
    generateAIReplyForComment,
    approveSuggestedAIReply,
    dismissSuggestedAIReply
  } = useBlog();

  const [activeTab, setActiveTab] = useState<'posts' | 'new-post' | 'drafts' | 'ai-agents' | 'briefing' | 'radar' | 'about' | 'contact' | 'comments' | 'users' | 'categories' | 'ads' | 'messages'>('posts');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [globalFeedback, setGlobalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [commentFilter, setCommentFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [commentSearch, setCommentSearch] = useState('');
  const [adminReplyCommentId, setAdminReplyCommentId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [generatingAIReplyId, setGeneratingAIReplyId] = useState<string | null>(null);
  const [aiMenuOpenCommentId, setAiMenuOpenCommentId] = useState<string | null>(null);

  // Post form state
  const [postTitle, setPostTitle] = useState('');
  const [postSubtitle, setPostSubtitle] = useState('');
  const [postCategory, setPostCategory] = useState<CategorySlug>('manutencao');
  const [postSubcategory, setPostSubcategory] = useState('');
  const [postBadge, setPostBadge] = useState('NOTAS TÉCNICAS');
  const [postCoverImage, setPostCoverImage] = useState('');
  const [postCoverCaption, setPostCoverCaption] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postReadTime, setPostReadTime] = useState(6);
  const [postIsSafety, setPostIsSafety] = useState(false);
  const [postFeatured, setPostFeatured] = useState(false);
  const [postPublished, setPostPublished] = useState(true);
  const [postIsScheduled, setPostIsScheduled] = useState(false);
  const [postScheduledDate, setPostScheduledDate] = useState('');
  const [postNotifyNewsletter, setPostNotifyNewsletter] = useState(false);
  const [postTags, setPostTags] = useState('MANUTENÇÃO, AVIAÇÃO');
  const [formMsg, setFormMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Draft Management State
  const [draftSaveStatus, setDraftSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<Date | null>(null);
  const [recoverableDraft, setRecoverableDraft] = useState<PostDraft | null>(null);
  const [savedDraftsList, setSavedDraftsList] = useState<PostDraft[]>(() => draftService.getAllDrafts());
  const [draftFeedback, setDraftFeedback] = useState<string | null>(null);

  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeletingPost(true);
    try {
      const title = postToDelete.title;
      const targetId = postToDelete.id;
      await deletePost(targetId);

      if (editingPost && (editingPost.id === targetId || editingPost.slug === targetId)) {
        setEditingPost(null);
        setPostTitle('');
        setPostSubtitle('');
        setPostContent('');
        setActiveTab('posts');
      }

      setGlobalFeedback({
        type: 'success',
        text: `A postagem "${title}" foi excluída com sucesso do banco de dados.`
      });
      setTimeout(() => setGlobalFeedback(null), 5000);
    } catch (err) {
      console.error('Error deleting post:', err);
      setGlobalFeedback({
        type: 'error',
        text: 'Ocorreu um erro ao excluir a postagem. Tente novamente.'
      });
      setTimeout(() => setGlobalFeedback(null), 5000);
    } finally {
      setIsDeletingPost(false);
      setPostToDelete(null);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const userName = userToDelete.name || userToDelete.email;
      await deleteUserByAdmin(userToDelete.id);
      setGlobalFeedback({
        type: 'success',
        text: `O usuário "${userName}" foi excluído com sucesso.`
      });
      setTimeout(() => setGlobalFeedback(null), 5000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setGlobalFeedback({
        type: 'error',
        text: 'Erro ao excluir usuário.'
      });
      setTimeout(() => setGlobalFeedback(null), 5000);
    } finally {
      setIsDeletingUser(false);
      setUserToDelete(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#E2E8F0] text-center space-y-4 shadow-sm">
        <Shield className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-xl font-bold text-[#0A192F] font-['Outfit']">Acesso Restrito ao Autor</h2>
        <p className="text-xs text-[#64748B]">Este painel é de uso exclusivo do administrador (Alexandre Andrade).</p>
        <button
          onClick={() => navigate('login')}
          className="px-6 py-2.5 bg-[#0A192F] text-white text-xs font-bold rounded-xl"
        >
          Fazer Login como Admin
        </button>
      </div>
    );
  }

  const startEditPost = (post: Post) => {
    setEditingPost(post);
    setPostTitle(post.title);
    setPostSubtitle(post.subtitle || '');
    setPostCategory(post.category);
    setPostSubcategory(post.subcategory || '');
    setPostBadge(post.technicalBadge || 'NOTAS TÉCNICAS');
    setPostCoverImage(post.coverImage || '');
    setPostCoverCaption(post.coverImageCaption || '');
    setPostContent(post.content);
    setPostReadTime(post.readTimeMinutes);
    setPostIsSafety(post.isSafetyPost);
    setPostFeatured(post.featured || false);
    setPostPublished(post.published);
    if (post.scheduledAt) {
      setPostIsScheduled(true);
      // Format to datetime-local value (YYYY-MM-DDTHH:mm)
      try {
        const d = new Date(post.scheduledAt);
        const iso = d.toISOString().slice(0, 16);
        setPostScheduledDate(iso);
      } catch {
        setPostScheduledDate('');
      }
    } else {
      setPostIsScheduled(false);
      setPostScheduledDate('');
    }
    setPostNotifyNewsletter(post.notifyNewsletterOnPublish || false);
    setPostTags(post.tags.join(', '));
    setActiveTab('new-post');
  };

  // Check for auto-saved draft when switching tabs
  React.useEffect(() => {
    const current = draftService.getCurrentDraft();
    if (current) {
      // If the current form is empty and there's a stored draft, present restore option
      if (!postTitle.trim() && !postContent.trim() && (current.title || current.content)) {
        setRecoverableDraft(current);
      }
    }
    setSavedDraftsList(draftService.getAllDrafts());
  }, [activeTab]);

  // Debounced auto-save engine while author is typing in new-post tab
  React.useEffect(() => {
    if (activeTab !== 'new-post') return;
    if (!postTitle.trim() && !postContent.trim()) return;

    setDraftSaveStatus('saving');
    const timer = setTimeout(() => {
      const saved = draftService.saveCurrentDraft({
        id: editingPost ? `edit_${editingPost.id}` : 'current_active_draft',
        title: postTitle,
        subtitle: postSubtitle,
        category: postCategory,
        subcategory: postSubcategory,
        technicalBadge: postBadge,
        coverImage: postCoverImage,
        coverImageCaption: postCoverCaption,
        content: postContent,
        tags: postTags,
        readTimeMinutes: postReadTime,
        isSafetyPost: postIsSafety,
        featured: postFeatured,
        scheduledAt: postIsScheduled ? postScheduledDate : undefined,
        notifyNewsletter: postNotifyNewsletter,
        editingPostId: editingPost ? editingPost.id : null
      });
      setDraftSaveStatus('saved');
      setLastDraftSavedAt(new Date(saved.savedAt));
      setSavedDraftsList(draftService.getAllDrafts());
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    activeTab,
    postTitle,
    postSubtitle,
    postCategory,
    postSubcategory,
    postBadge,
    postCoverImage,
    postCoverCaption,
    postContent,
    postTags,
    postReadTime,
    postIsSafety,
    postFeatured,
    postIsScheduled,
    postScheduledDate,
    postNotifyNewsletter,
    editingPost
  ]);

  // Browser beforeunload protection to guarantee zero data loss
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      if (postTitle.trim() || postContent.trim()) {
        draftService.saveCurrentDraft({
          id: editingPost ? `edit_${editingPost.id}` : 'current_active_draft',
          title: postTitle,
          subtitle: postSubtitle,
          category: postCategory,
          subcategory: postSubcategory,
          technicalBadge: postBadge,
          coverImage: postCoverImage,
          coverImageCaption: postCoverCaption,
          content: postContent,
          tags: postTags,
          readTimeMinutes: postReadTime,
          isSafetyPost: postIsSafety,
          featured: postFeatured,
          scheduledAt: postIsScheduled ? postScheduledDate : undefined,
          notifyNewsletter: postNotifyNewsletter,
          editingPostId: editingPost ? editingPost.id : null
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [
    postTitle,
    postSubtitle,
    postCategory,
    postSubcategory,
    postBadge,
    postCoverImage,
    postCoverCaption,
    postContent,
    postTags,
    postReadTime,
    postIsSafety,
    postFeatured,
    postIsScheduled,
    postScheduledDate,
    postNotifyNewsletter,
    editingPost
  ]);

  // Manual save draft handler
  const handleManualSaveDraft = () => {
    if (!postTitle.trim() && !postContent.trim()) {
      setDraftFeedback('⚠️ Digite um título ou conteúdo antes de salvar o rascunho.');
      setTimeout(() => setDraftFeedback(null), 3000);
      return;
    }

    const saved = draftService.saveCurrentDraft({
      id: editingPost ? `edit_${editingPost.id}` : `draft_${Date.now()}`,
      title: postTitle.trim() || 'Rascunho Sem Título',
      subtitle: postSubtitle,
      category: postCategory,
      subcategory: postSubcategory,
      technicalBadge: postBadge,
      coverImage: postCoverImage,
      coverImageCaption: postCoverCaption,
      content: postContent,
      tags: postTags,
      readTimeMinutes: postReadTime,
      isSafetyPost: postIsSafety,
      featured: postFeatured,
      scheduledAt: postIsScheduled ? postScheduledDate : undefined,
      notifyNewsletter: postNotifyNewsletter,
      editingPostId: editingPost ? editingPost.id : null
    });

    setDraftSaveStatus('saved');
    const now = new Date(saved.savedAt);
    setLastDraftSavedAt(now);
    setSavedDraftsList(draftService.getAllDrafts());
    setDraftFeedback(`💾 Rascunho salvo às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}! Pode fechar a aba com segurança.`);
    setTimeout(() => setDraftFeedback(null), 4500);
  };

  // Restore draft handler
  const handleRestoreDraft = (draftToRestore: PostDraft) => {
    setPostTitle(draftToRestore.title || '');
    setPostSubtitle(draftToRestore.subtitle || '');
    setPostCategory((draftToRestore.category as CategorySlug) || 'manutencao');
    setPostSubcategory(draftToRestore.subcategory || '');
    setPostBadge(draftToRestore.technicalBadge || 'NOTAS TÉCNICAS');
    setPostCoverImage(draftToRestore.coverImage || '');
    setPostCoverCaption(draftToRestore.coverImageCaption || '');
    setPostContent(draftToRestore.content || '');
    setPostTags(draftToRestore.tags || 'MANUTENÇÃO, AVIAÇÃO');
    setPostReadTime(draftToRestore.readTimeMinutes || 6);
    setPostIsSafety(draftToRestore.isSafetyPost || false);
    setPostFeatured(draftToRestore.featured || false);
    if (draftToRestore.scheduledAt) {
      setPostIsScheduled(true);
      setPostScheduledDate(draftToRestore.scheduledAt);
    }
    setPostNotifyNewsletter(draftToRestore.notifyNewsletter || false);
    setRecoverableDraft(null);
    setActiveTab('new-post');
    setDraftFeedback('✅ Rascunho restaurado com sucesso!');
    setTimeout(() => setDraftFeedback(null), 3500);
  };

  // Discard active draft
  const handleDiscardDraft = () => {
    draftService.clearCurrentDraft();
    setRecoverableDraft(null);
    setSavedDraftsList(draftService.getAllDrafts());
    setDraftFeedback('🗑️ Rascunho descartado.');
    setTimeout(() => setDraftFeedback(null), 2500);
  };

  // Delete a specific draft from the archive list
  const handleDeleteDraft = (id: string) => {
    draftService.deleteDraft(id);
    setSavedDraftsList(draftService.getAllDrafts());
    setDraftFeedback('🗑️ Rascunho removido.');
    setTimeout(() => setDraftFeedback(null), 2500);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      setFormMsg({ success: false, text: 'Título e conteúdo são obrigatórios.' });
      return;
    }

    const tagsArray = postTags.split(',').map(t => t.trim()).filter(Boolean);
    const scheduledAtValue = postIsScheduled && postScheduledDate ? new Date(postScheduledDate).toISOString() : undefined;

    setIsSubmittingPost(true);
    setFormMsg(null);

    try {
      if (editingPost) {
        await updatePost(editingPost.id, {
          title: postTitle.trim(),
          subtitle: postSubtitle.trim(),
          excerpt: postSubtitle.trim() || postContent.slice(0, 150) + '...',
          category: postCategory,
          subcategory: postSubcategory.trim(),
          technicalBadge: postBadge.trim(),
          coverImage: postCoverImage.trim() || 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
          coverImageCaption: postCoverCaption.trim(),
          content: postContent,
          readTimeMinutes: Number(postReadTime) || 5,
          isSafetyPost: postIsSafety,
          featured: postFeatured,
          published: postPublished,
          scheduledAt: scheduledAtValue,
          notifyNewsletterOnPublish: postNotifyNewsletter,
          tags: tagsArray
        });
        setFormMsg({ success: true, text: 'Artigo atualizado e sincronizado na nuvem com sucesso!' });
        draftService.clearCurrentDraft(`edit_${editingPost.id}`);
      } else {
        await createPost({
          slug: postTitle
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, ''),
          title: postTitle.trim(),
          subtitle: postSubtitle.trim(),
          excerpt: postSubtitle.trim() || postContent.slice(0, 150) + '...',
          category: postCategory,
          subcategory: postSubcategory.trim(),
          technicalBadge: postBadge.trim(),
          coverImage: postCoverImage.trim() || 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
          coverImageCaption: postCoverCaption.trim(),
          content: postContent,
          date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
          readTimeMinutes: Number(postReadTime) || 5,
          isSafetyPost: postIsSafety,
          featured: postFeatured,
          published: postPublished,
          scheduledAt: scheduledAtValue,
          notifyNewsletterOnPublish: postNotifyNewsletter,
          tags: tagsArray,
          author: {
            name: 'Alexandre Andrade',
            role: 'Especialista em Manutenção & Investigador SIPAER',
            avatar: '/author.webp'
          }
        });
        setFormMsg({
          success: true,
          text: postIsScheduled
            ? `Artigo agendado para publicação em ${new Date(postScheduledDate).toLocaleString('pt-BR')}!`
            : 'Artigo publicado e salvo na nuvem com sucesso!'
        });
        draftService.clearCurrentDraft();
      }

      setSavedDraftsList(draftService.getAllDrafts());
      setRecoverableDraft(null);

      setTimeout(() => {
        setFormMsg(null);
        setEditingPost(null);
        setActiveTab('posts');
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao salvar artigo:', err);
      setFormMsg({
        success: false,
        text: `Erro ao salvar artigo na nuvem: ${err?.message || 'Verifique a conexão e tente novamente.'}`
      });
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const exportData = () => {
    const data = {
      posts,
      categories,
      comments,
      subscribers: newsletterSubscribers,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aaa-aviation-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Admin Header */}
      <div className="bg-[#0A192F] text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-800 text-[#93C5FD] rounded-2xl">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-['Outfit']">
                  Painel Administrativo
                </h1>
                <span className="px-2 py-0.5 rounded-sm bg-[#1E3A8A] text-[#93C5FD] text-[10px] font-mono font-bold uppercase">
                  v1.0 • Alexandre Andrade
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Gestão editorial de artigos, categorias, moderação de comentários e monetização AdSense.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportData}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Backup</span>
            </button>
            <button
              onClick={() => {
                setEditingPost(null);
                setPostTitle('');
                setPostContent('');
                setActiveTab('new-post');
              }}
              className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 font-['Outfit'] shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Artigo</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Total de Artigos</span>
            <p className="text-2xl font-black font-['Outfit'] text-white">{posts.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Comentários</span>
            <p className="text-2xl font-black font-['Outfit'] text-white">{comments.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Inscritos Newsletter</span>
            <p className="text-2xl font-black font-['Outfit'] text-white">{newsletterSubscribers.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Mensagens</span>
            <p className="text-2xl font-black font-['Outfit'] text-white">{contactMessages.length}</p>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {globalFeedback && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold border shadow-xs animate-in fade-in duration-200 ${
            globalFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {globalFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{globalFeedback.text}</span>
          <button
            type="button"
            onClick={() => setGlobalFeedback(null)}
            className="text-xs font-bold underline opacity-75 hover:opacity-100 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
        {[
          { id: 'posts', label: 'Gerenciar Artigos', icon: FileText, count: posts.length },
          { id: 'new-post', label: editingPost ? 'Editar Artigo' : 'Criar Artigo', icon: Plus },
          { id: 'drafts', label: 'Rascunhos Salvos', icon: BookmarkCheck, count: savedDraftsList.length, highlightDraft: savedDraftsList.length > 0 },
          { id: 'ai-agents', label: 'Agentes de IA & Moderação', icon: Bot, count: aiAgents.filter(a => a.enabled).length, highlightAi: true },
          { id: 'radar', label: 'Radar (Avisos)', icon: Radio, highlight: true },
          { id: 'briefing', label: 'Briefing Semanal', icon: Send, count: newsletterSubscribers.length, highlight: true },
          { id: 'about', label: 'Página "Sobre o Autor"', icon: UserCheck },
          { id: 'contact', label: 'Contato & Redes', icon: Phone },
          { id: 'comments', label: 'Moderação de Comentários', icon: MessageSquare, count: comments.length },
          { id: 'users', label: 'Usuários Cadastrados', icon: Users, count: usersList.length },
          { id: 'categories', label: 'Categorias', icon: Layers, count: categories.length },
          { id: 'ads', label: 'Espaços AdSense', icon: DollarSign },
          { id: 'messages', label: 'Mensagens de Contato', icon: Mail, count: contactMessages.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all font-['Outfit'] cursor-pointer ${
                isActive
                  ? 'bg-[#0A192F] text-white shadow-xs'
                  : (tab as any).highlightDraft
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                  : (tab as any).highlightAi
                  ? 'bg-blue-50 border border-blue-300 text-blue-900 hover:bg-blue-100'
                  : (tab as any).highlight
                  ? 'bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100'
                  : 'bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#F8FAFC]'
              }`}
            >
              <Icon className={`w-4 h-4 ${
                (tab as any).highlightDraft && !isActive ? 'text-emerald-600' : (tab as any).highlightAi && !isActive ? 'text-blue-600' : (tab as any).highlight && !isActive ? 'text-amber-600' : ''
              }`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  (tab as any).highlightDraft && !isActive ? 'bg-emerald-200 text-emerald-900 font-bold' : (tab as any).highlightAi && !isActive ? 'bg-blue-200 text-blue-900' : (tab as any).highlight && !isActive ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-800'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: POSTS LIST */}
      {activeTab === 'posts' && (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[#F1F5F9] flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0A192F] font-['Outfit']">Todos os Artigos do Blog</h2>
            <span className="text-xs text-[#64748B]">Clique em editar para modificar ou alternar publicação</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#334155]">
              <thead className="bg-[#F8FAFC] text-[11px] font-mono uppercase text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-6 py-3">Título & Categoria</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Destaque</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Visualizações</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {posts.map(p => (
                  <tr key={p.id} className={`transition-colors ${p.featured ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-[#F8FAFC]'}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0A192F] text-sm leading-snug">{p.title}</div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#64748B]">
                        <span className="uppercase font-mono text-[#1D4ED8] inline-flex items-center gap-1 font-bold">
                          {getCategoryVisual(p.category, 'w-3 h-3')}
                          <span>{getCategoryName(p.category)}</span>
                        </span>
                        {p.isSafetyPost && (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-sm text-[10px]">
                            Safety Disclaimer
                          </span>
                        )}
                        {p.featured && (
                          <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                            Destaque Principal
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[#64748B] whitespace-nowrap">{p.date}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setFeaturedPost(p.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          p.featured
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                            : 'bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 hover:border-amber-200'
                        }`}
                        title={p.featured ? 'Artigo em destaque na página inicial' : 'Clique para definir este artigo como destaque'}
                      >
                        <Star className={`w-3.5 h-3.5 ${p.featured ? 'fill-amber-500 text-amber-600' : 'text-slate-400'}`} />
                        <span>{p.featured ? 'Em Destaque' : 'Destacar'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {(() => {
                        const schedInfo = getPostScheduleInfo(p);
                        if (p.published && schedInfo.isScheduled) {
                          return (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300" title={`Agendado para ${schedInfo.scheduledDateFormatted}`}>
                              <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                              <span>Agendado ({schedInfo.scheduledDateFormatted})</span>
                            </div>
                          );
                        }
                        return (
                          <button
                            onClick={() => togglePublishPost(p.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              p.published
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {p.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{p.published ? 'Publicado' : 'Rascunho'}</span>
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4 font-mono">{p.viewsCount || 0} views</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate('post', { postSlug: p.slug })}
                          className="p-1.5 text-[#64748B] hover:text-[#1D4ED8] rounded-lg transition-colors"
                          title="Visualizar Artigo"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditPost(p)}
                          className="p-1.5 text-[#64748B] hover:text-[#0A192F] rounded-lg transition-colors"
                          title="Editar Artigo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPostToDelete(p)}
                          className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir Artigo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: SAVED DRAFTS ARCHIVE */}
      {activeTab === 'drafts' && (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-6 h-6 text-emerald-600" />
                <h2 className="text-lg font-bold text-[#0A192F] font-['Outfit']">Rascunhos & Salvamentos Automáticos</h2>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Suas postagens são salvas localmente enquanto você escreve. Caso a aba feche por engano, você não perde nada.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingPost(null);
                setPostTitle('');
                setPostSubtitle('');
                setPostContent('');
                setActiveTab('new-post');
              }}
              className="px-4 py-2 bg-[#0A192F] hover:bg-[#0E2954] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 font-['Outfit'] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Escrever Novo Artigo</span>
            </button>
          </div>

          {savedDraftsList.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Save className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0A192F]">Nenhum rascunho pendente</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                Quando você começar a digitar um novo artigo no editor, o sistema salvará automaticamente a cada 1 segundo em segundo plano.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {savedDraftsList.map(draft => {
                const words = (draft.content || '').trim().split(/\s+/).filter(Boolean).length;
                const savedDate = new Date(draft.savedAt).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={draft.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#0A192F] font-['Outfit'] truncate">
                          {draft.title || 'Rascunho Sem Título'}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase">
                          {draft.category || 'manutencao'}
                        </span>
                        {draft.editingPostId && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                            Edição de Artigo Existente
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#64748B] line-clamp-2">
                        {draft.subtitle || draft.content?.slice(0, 140) || 'Sem conteúdo adicional...'}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-[#94A3B8] font-mono pt-1">
                        <span>🕒 Salvo em: {savedDate}</span>
                        <span>📄 {words} palavras</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRestoreDraft(draft)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>Continuar Escrevendo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
                        title="Excluir este rascunho"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE / EDIT POST */}
      {activeTab === 'new-post' && (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
          {/* Recoverable Draft Top Alert Banner */}
          {recoverableDraft && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <BookmarkCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-950 font-['Outfit']">
                    Encontramos um rascunho recente não publicado!
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    <strong>"{recoverableDraft.title || 'Sem título'}"</strong> • Salvo automaticamente em{' '}
                    {new Date(recoverableDraft.savedAt).toLocaleString('pt-BR')} ({(recoverableDraft.content || '').split(/\s+/).filter(Boolean).length} palavras).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRestoreDraft(recoverableDraft)}
                  className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Rascunho</span>
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-3 py-1.5 bg-transparent hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Descartar
                </button>
              </div>
            </div>
          )}

          {/* Draft Feedback Toast Banner */}
          {draftFeedback && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{draftFeedback}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-[#0A192F] font-['Outfit']">
                  {editingPost ? 'Editar Artigo Técnico' : 'Criar Novo Artigo Técnico'}
                </h2>
                
                {/* Realtime Auto-Save Status Badge */}
                {draftSaveStatus === 'saving' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                    <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
                    <span>Salvando rascunho...</span>
                  </span>
                )}
                {draftSaveStatus === 'saved' && lastDraftSavedAt && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Salvo em segurança local">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Salvo automaticamente ({lastDraftSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Editor enriquecido com suporte a upload de fotos, formatação visual e salvamento automático sem risco de perda.
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Quick Save Draft Button */}
              <button
                type="button"
                onClick={handleManualSaveDraft}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Salvar o rascunho agora para não perder nada ao fechar a aba"
              >
                <Save className="w-3.5 h-3.5 text-emerald-600" />
                <span>Salvar Rascunho</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] text-xs font-bold rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Ver como o artigo fica exatamente para o leitor"
              >
                <Eye className="w-4 h-4" />
                <span>Pré-visualizar</span>
              </button>

              {editingPost && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPost(null);
                    setActiveTab('posts');
                  }}
                  className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold"
                >
                  Cancelar Edição
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handlePostSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                  Título do Artigo *
                </label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={e => setPostTitle(e.target.value)}
                  placeholder="Ex: Como funciona a inspeção de boroscopia em turbinas aeronáuticas"
                  className="w-full px-4 py-3 text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0E2954]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                  Subtítulo / Resumo Explicativo
                </label>
                <input
                  type="text"
                  value={postSubtitle}
                  onChange={e => setPostSubtitle(e.target.value)}
                  placeholder="Breve resumo exibido na listagem e abaixo do título principal..."
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0E2954]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                  Categoria Principal *
                </label>
                <select
                  value={postCategory}
                  onChange={e => setPostCategory(e.target.value as CategorySlug)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0E2954]"
                >
                  {categories.map(c => (
                    <option key={c.slug} value={c.slug}>
                      {c.emoji ? `${c.emoji} ` : ''}{c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                  Badge Técnico (Pill de Destaque)
                </label>
                <input
                  type="text"
                  value={postBadge}
                  onChange={e => setPostBadge(e.target.value)}
                  placeholder="Ex: CONCEITOS, INSPEÇÕES, INVESTIGAÇÃO, MSG-3"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0E2954]"
                />
              </div>

              {/* Upload de Imagem de Capa */}
              <div className="md:col-span-2">
                <ImageUploader
                  label="Imagem de Capa do Artigo"
                  value={postCoverImage}
                  onChange={setPostCoverImage}
                  caption={postCoverCaption}
                  onCaptionChange={setPostCoverCaption}
                  placeholder="https://images.unsplash.com/photo-..."
                  helperText="Faça upload da imagem do seu computador ou informe um link externo."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                  Tempo Estimado de Leitura (minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={postReadTime}
                  onChange={e => setPostReadTime(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0E2954]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={postTags}
                  onChange={e => setPostTags(e.target.value)}
                  placeholder="MANUTENÇÃO, CHT, ANAC, MOTOR"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0E2954]"
                />
              </div>
            </div>

            {/* Toggles & Scheduling Box */}
            <div className="space-y-4">
              <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0A192F]">
                  <input
                    type="checkbox"
                    checked={postIsSafety}
                    onChange={e => setPostIsSafety(e.target.checked)}
                    className="w-4 h-4 text-[#1D4ED8] rounded-sm"
                  />
                  <span>Exibir Disclaimer Obrigatório de Safety/SIPAER/ANAC</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0A192F]">
                  <input
                    type="checkbox"
                    checked={postFeatured}
                    onChange={e => setPostFeatured(e.target.checked)}
                    className="w-4 h-4 text-[#1D4ED8] rounded-sm"
                  />
                  <span>Definir como Artigo em Destaque na Home</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0A192F]">
                  <input
                    type="checkbox"
                    checked={postPublished}
                    onChange={e => setPostPublished(e.target.checked)}
                    className="w-4 h-4 text-[#1D4ED8] rounded-sm"
                  />
                  <span>Artigo Ativo ({postIsScheduled ? 'Agendado' : 'Publicar Imediatamente'})</span>
                </label>
              </div>

              {/* POST SCHEDULING CARD */}
              <div className="p-4 bg-gradient-to-r from-blue-50/70 to-slate-50 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0A192F]">
                    <input
                      type="checkbox"
                      checked={postIsScheduled}
                      onChange={e => {
                        setPostIsScheduled(e.target.checked);
                        if (e.target.checked && !postScheduledDate) {
                          // Default to tomorrow 09:00 AM
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          tomorrow.setHours(9, 0, 0, 0);
                          setPostScheduledDate(tomorrow.toISOString().slice(0, 16));
                        }
                      }}
                      className="w-4 h-4 text-[#1D4ED8] rounded-sm"
                    />
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#1D4ED8]" />
                      <span className="font-bold">Agendar Publicação para Data/Hora Futura</span>
                    </div>
                  </label>
                  <span className="text-[11px] text-[#64748B]">
                    O artigo ficará guardado e só aparecerá para os leitores no momento agendado.
                  </span>
                </div>

                {postIsScheduled && (
                  <div className="pt-2 border-t border-blue-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                        Data e Horário de Lançamento *
                      </label>
                      <input
                        type="datetime-local"
                        required={postIsScheduled}
                        value={postScheduledDate}
                        onChange={e => setPostScheduledDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-[#334155] font-medium mt-4 sm:mt-0">
                        <input
                          type="checkbox"
                          checked={postNotifyNewsletter}
                          onChange={e => setPostNotifyNewsletter(e.target.checked)}
                          className="w-4 h-4 text-[#1D4ED8] rounded-sm"
                        />
                        <span>Notificar lista de assinantes da Newsletter no momento do lançamento</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rich Markdown & Docs Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider font-['Outfit']">
                  Corpo do Artigo & Ferramentas de Redação *
                </label>
                <span className="text-[11px] text-[#64748B]">
                  Use a barra de botões acima para formatar cores, tabelas, imagens e notas aeronáuticas
                </span>
              </div>

              <RichArticleEditor
                content={postContent}
                onChange={setPostContent}
                minHeight="420px"
              />
            </div>

            {formMsg && (
              <div
                className={`p-4 rounded-xl flex items-center gap-2 text-xs font-medium ${
                  formMsg.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {formMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{formMsg.text}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] text-xs font-bold rounded-xl border border-blue-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Pré-visualizar Postagem</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualSaveDraft}
                  className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Salvar rascunho manualmente para evitar qualquer perda"
                >
                  <Save className="w-4 h-4 text-emerald-600" />
                  <span>Salvar Rascunho</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {editingPost && (
                  <button
                    type="button"
                    onClick={() => setPostToDelete(editingPost)}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Excluir este artigo permanentemente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Artigo</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditingPost(null);
                    setActiveTab('posts');
                  }}
                  className="px-5 py-2.5 border border-[#CBD5E1] text-[#64748B] text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost}
                  className="px-6 py-2.5 bg-[#0A192F] hover:bg-[#0E2954] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm font-['Outfit'] cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingPost ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando na Nuvem...</span>
                    </>
                  ) : (
                    <>
                      {postIsScheduled && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                      <span>
                        {editingPost
                          ? (postIsScheduled ? 'Salvar Agendamento' : 'Salvar Modificações')
                          : (postIsScheduled ? 'Agendar Publicação' : 'Publicar Artigo')}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Modal de Pré-visualização Real do Leitor */}
          <ArticlePreviewModal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            title={postTitle}
            subtitle={postSubtitle}
            categoryName={categories.find(c => c.slug === postCategory)?.name || postCategory}
            badge={postBadge}
            coverImage={postCoverImage}
            coverCaption={postCoverCaption}
            content={postContent}
            readTime={postReadTime}
            isSafetyPost={postIsSafety}
            tags={postTags.split(',').map(t => t.trim()).filter(Boolean)}
          />
        </div>
      )}

      {/* TAB: AGENTES DE IA & MODERAÇÃO */}
      {activeTab === 'ai-agents' && (
        <AIAgentsModerationManager />
      )}

      {/* TAB 3: MODERAÇÃO DE COMENTÁRIOS */}
      {activeTab === 'comments' && (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[#F1F5F9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#0A192F] font-['Outfit']">Moderação de Comentários</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                  {comments.length} total
                </span>
                {comments.filter(c => c.suggestedAIReply).length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-600 text-white animate-pulse">
                    {comments.filter(c => c.suggestedAIReply).length} sugestão(ões) de IA prontas
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">Aprove, reprove, responda manualmente ou use os Especialistas de IA para responder dúvidas técnicas.</p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setCommentFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  commentFilter === 'all'
                    ? 'bg-[#0A192F] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({comments.length})
              </button>
              <button
                type="button"
                onClick={() => setCommentFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  commentFilter === 'approved'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Aprovados ({comments.filter(c => c.status === 'approved').length})
              </button>
              <button
                type="button"
                onClick={() => setCommentFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  commentFilter === 'rejected'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Ocultos ({comments.filter(c => c.status === 'rejected').length})
              </button>
            </div>
          </div>

          {/* Search bar inside comments tab */}
          <div className="px-6 py-3 bg-[#F8FAFC] border-b border-[#F1F5F9] flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por autor, conteúdo ou título do artigo..."
              value={commentSearch}
              onChange={e => setCommentSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-[#334155] placeholder:text-slate-400 focus:outline-hidden"
            />
            {commentSearch && (
              <button
                onClick={() => setCommentSearch('')}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="p-6 space-y-4">
            {(() => {
              const filteredComments = comments.filter(c => {
                if (commentFilter === 'approved' && c.status !== 'approved') return false;
                if (commentFilter === 'rejected' && c.status !== 'rejected') return false;
                if (commentSearch.trim()) {
                  const q = commentSearch.toLowerCase();
                  const author = (c.userName || '').toLowerCase();
                  const text = (c.content || '').toLowerCase();
                  const postTitle = (posts.find(p => p.id === c.postId || p.slug === c.postId)?.title || c.postTitle || '').toLowerCase();
                  return author.includes(q) || text.includes(q) || postTitle.includes(q);
                }
                return true;
              });

              if (filteredComments.length === 0) {
                return (
                  <div className="text-center py-12 text-[#64748B]">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold">Nenhum comentário encontrado com os filtros selecionados.</p>
                  </div>
                );
              }

              return filteredComments.map(c => {
                const targetPost = posts.find(p => p.id === c.postId || p.slug === c.postId);
                const postTitleDisplay = targetPost?.title || c.postTitle || 'Artigo';
                const isReplying = adminReplyCommentId === c.id;
                const isGeneratingAI = generatingAIReplyId === c.id;
                const isAIMenuOpen = aiMenuOpenCommentId === c.id;
                const hasScheduledAuto = c.aiAutoReplyScheduledAt && (!c.replies || !c.replies.some(r => r.isAIReply));

                return (
                  <div
                    key={c.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      c.status === 'rejected'
                        ? 'bg-amber-50/40 border-amber-200'
                        : c.suggestedAIReply
                        ? 'bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border-blue-300 shadow-xs'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[#0A192F] text-xs font-['Outfit']">{c.userName}</span>
                          <span className="text-[11px] text-[#64748B]">({c.userTitle || 'Leitor'})</span>
                          
                          {c.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprovado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <XCircle className="w-3 h-3 text-amber-600" /> Ocultado
                            </span>
                          )}

                          {hasScheduledAuto && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              <Clock className="w-3 h-3 text-blue-600" /> Auto-Resposta Agendada
                            </span>
                          )}

                          <span className="text-[10px] text-[#94A3B8] font-mono">
                            {new Date(c.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        {/* Linked Post Title */}
                        <div className="flex items-center gap-1.5 text-xs text-[#1D4ED8] font-medium">
                          <span className="text-[#64748B]">Publicado em:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const targetSlug = targetPost?.slug || targetPost?.id || c.postId;
                              navigate('post', { postSlug: targetSlug });
                            }}
                            className="font-bold hover:underline inline-flex items-center gap-1 text-left"
                            title="Abrir este artigo no blog"
                          >
                            <span>{postTitleDisplay}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 text-[#1D4ED8]" />
                          </button>
                        </div>

                        {/* Comment Content */}
                        <p className="text-xs text-[#334155] leading-relaxed bg-white p-3 rounded-xl border border-slate-200 shadow-2xs mt-1">
                          "{c.content}"
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center flex-wrap gap-1.5 shrink-0 self-end sm:self-start">
                        {/* AI Reply Trigger Dropdown Button */}
                        <div className="relative">
                          <button
                            type="button"
                            disabled={isGeneratingAI}
                            onClick={() => setAiMenuOpenCommentId(isAIMenuOpen ? null : c.id)}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                            title="Gerar resposta com Inteligência Artificial"
                          >
                            {isGeneratingAI ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Gerando...</span>
                              </>
                            ) : (
                              <>
                                <Bot className="w-3.5 h-3.5" />
                                <span>IA Especialista</span>
                                <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>

                          {isAIMenuOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-20 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                              <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-bold">
                                Escolher Especialista:
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  setAiMenuOpenCommentId(null);
                                  setGeneratingAIReplyId(c.id);
                                  await generateAIReplyForComment(c.id);
                                  setGeneratingAIReplyId(null);
                                }}
                                className="w-full text-left p-2 rounded-xl text-xs hover:bg-blue-50 text-[#0A192F] font-bold flex items-center gap-2 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <div>
                                  <div>Roteamento Inteligente</div>
                                  <div className="text-[10px] text-slate-400 font-normal">A IA escolhe o melhor perfil</div>
                                </div>
                              </button>
                              
                              <div className="border-t border-slate-100 my-1"></div>

                              {aiAgents.filter(a => a.enabled).map(agent => (
                                <button
                                  key={agent.id}
                                  type="button"
                                  onClick={async () => {
                                    setAiMenuOpenCommentId(null);
                                    setGeneratingAIReplyId(c.id);
                                    await generateAIReplyForComment(c.id, agent.id);
                                    setGeneratingAIReplyId(null);
                                  }}
                                  className="w-full text-left p-2 rounded-xl text-xs hover:bg-blue-50 text-[#0A192F] flex items-center gap-2 cursor-pointer"
                                >
                                  <img src={agent.avatar} alt={agent.name} className="w-5 h-5 rounded-full object-cover border" />
                                  <div className="truncate">
                                    <div className="font-bold truncate">{agent.name}</div>
                                    <div className="text-[9px] text-blue-600 font-mono uppercase">{agent.badge}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {c.status !== 'approved' && (
                          <button
                            onClick={() => approveComment(c.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            title="Aprovar e exibir publicamente"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                          </button>
                        )}
                        {c.status !== 'rejected' && (
                          <button
                            onClick={() => rejectComment(c.id)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            title="Ocultar do público"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Ocultar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (isReplying) {
                              setAdminReplyCommentId(null);
                              setAdminReplyText('');
                            } else {
                              setAdminReplyCommentId(c.id);
                              setAdminReplyText('');
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1 cursor-pointer ${
                            isReplying
                              ? 'bg-blue-50 border-blue-300 text-[#1D4ED8]'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#1D4ED8]" />
                          <span>{isReplying ? 'Cancelar' : 'Manual'}</span>
                        </button>
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Excluir Permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* SUGGESTED AI REPLY CARD */}
                    {c.suggestedAIReply && (
                      <div className="mt-4 p-4 rounded-2xl bg-white border-2 border-blue-300 shadow-md space-y-3 animate-in zoom-in-95 duration-150">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={resolveImageUrl(c.suggestedAIReply.agentAvatar)}
                              alt={c.suggestedAIReply.agentName}
                              className="w-8 h-8 rounded-xl object-cover border-2 border-blue-400 shadow-2xs"
                              onError={e => {
                                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                                  c.suggestedAIReply?.agentName || 'Agent'
                                )}`;
                              }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#0A192F] font-['Outfit']">
                                  {c.suggestedAIReply.agentName}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-black uppercase">
                                  {c.suggestedAIReply.agentBadge}
                                </span>
                              </div>
                              <span className="text-[10px] text-[#64748B]">{c.suggestedAIReply.agentRole}</span>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md self-start sm:self-auto">
                            💡 Sugestão Gerada por IA — Aguardando Sua Aprovação
                          </span>
                        </div>

                        {c.suggestedAIReply.reasoning && (
                          <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <strong>Critério de Seleção:</strong> {c.suggestedAIReply.reasoning}
                          </p>
                        )}

                        <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 text-xs text-[#334155] leading-relaxed whitespace-pre-line font-medium">
                          {c.suggestedAIReply.text}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => dismissSuggestedAIReply(c.id)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                          >
                            Descartar Sugestão
                          </button>
                          <button
                            type="button"
                            onClick={() => approveSuggestedAIReply(c.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer font-['Outfit']"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Aprovar & Publicar Resposta da IA</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Admin Reply Form */}
                    {isReplying && (
                      <div className="mt-3 pt-3 border-t border-slate-200 bg-white p-3.5 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-3.5 h-3.5 text-[#1D4ED8]" />
                          <span className="text-xs font-bold text-[#0A192F]">Responder como Alexandre Andrade (Autor)</span>
                        </div>
                        <textarea
                          rows={2}
                          value={adminReplyText}
                          onChange={e => setAdminReplyText(e.target.value)}
                          placeholder="Digite sua resposta técnica ou de moderação..."
                          className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#1D4ED8] bg-slate-50 focus:bg-white"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminReplyCommentId(null);
                              setAdminReplyText('');
                            }}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!adminReplyText.trim()) return;
                              await addCommentReply(c.id, adminReplyText.trim());
                              setAdminReplyCommentId(null);
                              setAdminReplyText('');
                            }}
                            className="px-3.5 py-1.5 text-xs bg-[#1D4ED8] hover:bg-[#2563EB] text-white rounded-lg font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            Enviar Resposta
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Nested Replies Display */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                          Respostas aninhadas ({c.replies.length}):
                        </span>
                        {c.replies.map(r => {
                          const isAI = r.isAIReply || r.userId?.startsWith('ai-agent-');
                          return (
                            <div
                              key={r.id}
                              className={`pl-3 py-2 pr-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                                isAI
                                  ? 'bg-blue-50/80 border-blue-200'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-[#0A192F]">{r.userName}</span>
                                  {isAI ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-blue-600 text-white text-[9px] font-black uppercase">
                                      <Bot className="w-2.5 h-2.5" />
                                      {r.agentBadge || 'ESPECIALISTA IA'}
                                    </span>
                                  ) : (
                                    r.userTitle && <span className="text-[10px] text-slate-500">({r.userTitle})</span>
                                  )}
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(r.createdAt).toLocaleString('pt-BR')}
                                  </span>
                                </div>
                                <p className="text-slate-700 text-xs whitespace-pre-line">"{r.content}"</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => deleteCommentReply(c.id, r.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                                title="Excluir esta resposta"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* TAB 4: USUÁRIOS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[#F1F5F9]">
            <h2 className="text-lg font-bold text-[#0A192F] font-['Outfit']">Usuários Cadastrados</h2>
            <p className="text-xs text-[#64748B]">Controle de permissões e membros registrados.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#334155]">
              <thead className="bg-[#F8FAFC] text-[11px] font-mono uppercase text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-6 py-3">Membro</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Assinatura / Título</th>
                  <th className="px-4 py-3">Badges</th>
                  <th className="px-4 py-3">Papel</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {usersList.map(u => {
                  const userBadges = Array.isArray(u.badges) ? u.badges : [];

                  return (
                    <tr key={u.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border"
                        />
                        <span className="font-bold text-[#0A192F]">{u.name}</span>
                      </td>
                      <td className="px-4 py-4 text-[#64748B]">{u.email}</td>
                      <td className="px-4 py-4 text-[#64748B]">{u.title || '-'}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-1 max-w-xs">
                          {userBadges.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">Nenhuma</span>
                          ) : (
                            userBadges.map(bId => (
                              <BadgePill key={bId} badgeId={bId} size="xs" />
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                            u.role === 'admin' ? 'bg-[#EFF6FF] text-[#1D4ED8]' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.email !== 'andradeseripa2@gmail.com' && (
                          <div className="flex items-center justify-end gap-2">
                            <select
                              defaultValue=""
                              onChange={e => {
                                const badgeId = e.target.value;
                                if (badgeId) {
                                  grantBadgeToUser(u.id, badgeId);
                                  e.target.value = '';
                                }
                              }}
                              className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 cursor-pointer"
                            >
                              <option value="" disabled>+ Conceder Badge</option>
                              {AVAILABLE_BADGES.map(b => (
                                <option key={b.id} value={b.id} disabled={userBadges.includes(b.id)}>
                                  {b.name} {userBadges.includes(b.id) ? '(Já possui)' : ''}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => toggleUserRole(u.id)}
                              className="text-xs text-[#1D4ED8] hover:underline whitespace-nowrap"
                            >
                              Tornar {u.role === 'admin' ? 'Leitor' : 'Admin'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="p-1 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Usuário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CATEGORIAS */}
      {activeTab === 'categories' && <CategoryManager />}

      {/* TAB 6: ADSENSE MONETIZAÇÃO */}
      {activeTab === 'ads' && (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
            <div>
              <h2 className="text-xl font-bold text-[#0A192F] font-['Outfit']">Espaços do Google AdSense</h2>
              <p className="text-xs text-[#64748B]">
                Controle a ativação, posições e monetização de todos os blocos de anúncio no blog. Sincronização em tempo real.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full border ${
                  adConfig.enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {adConfig.enabled ? 'AdSense Ativado' : 'AdSense Desativado'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Global Master Switch */}
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                adConfig.enabled
                  ? 'bg-blue-50/50 border-[#1D4ED8]/30 shadow-xs'
                  : 'bg-[#F8FAFC] border-[#CBD5E1]'
              }`}
            >
              <input
                type="checkbox"
                checked={adConfig.enabled}
                onChange={e => updateAdConfig({ enabled: e.target.checked })}
                className="w-5 h-5 text-[#1D4ED8] rounded-sm focus:ring-[#1D4ED8]"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm text-[#0A192F]">Habilitar Anúncios Globalmente</span>
                  <span className="text-[10px] font-mono font-bold text-[#1D4ED8] bg-white px-2 py-0.5 rounded border border-blue-200">
                    Master Switch
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Ativa ou pausa a exibição de todos os banners no portal instantaneamente.
                </p>
              </div>
            </label>

            {/* Individual Placement Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* 1. Header Banner */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  adConfig.showInHeader && adConfig.enabled
                    ? 'bg-white border-[#1D4ED8]/40 shadow-xs ring-1 ring-blue-500/10'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={adConfig.showInHeader}
                  onChange={e => updateAdConfig({ showInHeader: e.target.checked })}
                  className="w-4 h-4 mt-0.5 text-[#1D4ED8] rounded-sm"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0A192F]">Banner Topo (Leaderboard 728x90)</span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Topo</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Exibido no topo da página inicial e da página de índice do blog.
                  </p>
                </div>
              </label>

              {/* 2. Sidebar Banner */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  adConfig.showInSidebar && adConfig.enabled
                    ? 'bg-white border-[#1D4ED8]/40 shadow-xs ring-1 ring-blue-500/10'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={adConfig.showInSidebar}
                  onChange={e => updateAdConfig({ showInSidebar: e.target.checked })}
                  className="w-4 h-4 mt-0.5 text-[#1D4ED8] rounded-sm"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0A192F]">Banner Lateral (300x250 & Skyscraper)</span>
                    <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Sidebar</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Exibido na barra lateral direita ao ler artigos técnicos e na navegação de categorias.
                  </p>
                </div>
              </label>

              {/* 3. In-Content Banner */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  adConfig.showInContent && adConfig.enabled
                    ? 'bg-white border-[#1D4ED8]/40 shadow-xs ring-1 ring-blue-500/10'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={adConfig.showInContent}
                  onChange={e => updateAdConfig({ showInContent: e.target.checked })}
                  className="w-4 h-4 mt-0.5 text-[#1D4ED8] rounded-sm"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0A192F]">Banner Entre Conteúdos (Responsive)</span>
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">In-Article</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Exibido entre parágrafos dos artigos técnicos e na página inicial entre as áreas de estudo.
                  </p>
                </div>
              </label>

              {/* 4. Footer Banner */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  adConfig.showInFooter && adConfig.enabled
                    ? 'bg-white border-[#1D4ED8]/40 shadow-xs ring-1 ring-blue-500/10'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={adConfig.showInFooter}
                  onChange={e => updateAdConfig({ showInFooter: e.target.checked })}
                  className="w-4 h-4 mt-0.5 text-[#1D4ED8] rounded-sm"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0A192F]">Banner Rodapé (Leaderboard 970x90)</span>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">Rodapé</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Exibido acima do rodapé em todas as páginas públicas do portal (Home, Artigos, Categorias, etc.).
                  </p>
                </div>
              </label>
            </div>

            {/* Publisher ID configuration */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-[#334155] uppercase mb-1 font-['Outfit']">
                ID do Cliente AdSense (Publisher ID)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={adConfig.clientSlotId || ''}
                  onChange={e => updateAdConfig({ clientSlotId: e.target.value })}
                  placeholder="ca-pub-1234567890123456"
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-mono focus:ring-2 focus:ring-[#0E2954]"
                />
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-1">
                Insira o seu ID fornecido pelo Google AdSense para vincular aos slots de monetização.
              </p>
            </div>

            {/* AdSense Approval Checklist & Guide */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm font-['Outfit']">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Guia para Aprovação: "Anúncios em telas sem conteúdo do editor"</span>
              </div>
              <p className="text-xs text-amber-950/80 leading-relaxed">
                O Google AdSense exige que anúncios sejam exibidos exclusivamente em páginas com artigos e textos originais substanciais. Todas as proteções técnicas recomendadas foram implementadas no portal:
              </p>
              <ul className="text-xs text-amber-900 space-y-1.5 list-disc pl-4">
                <li><strong>Páginas de Política de Privacidade e Termos de Uso</strong> completas (com cláusula LGPD e cookies do AdSense) adicionadas ao rodapé.</li>
                <li><strong>Supressão Automática:</strong> Telas administrativas, telas de login, perfil e contato nunca executam blocos de anúncios.</li>
                <li><strong>Schema.org & Metadados Estruturados:</strong> Indexação semântica no código-fonte para reconhecimento imediato pelos robôs do Google.</li>
              </ul>
              <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-900">
                <span>Passo no AdSense: Acesse <strong>Sites &gt; aaaviation.com.br</strong> e clique em <strong>"Solicitar revisão"</strong>.</span>
              </div>
            </div>

            {/* Schematic Preview of an ad slot */}
            <div className="pt-4 border-t border-[#F1F5F9]">
              <span className="text-xs font-bold text-[#334155] uppercase tracking-wider block mb-2 font-['Outfit']">
                Esquema do Bloco de Anúncios no Site:
              </span>
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center">
                <p className="text-xs font-semibold text-slate-700 font-['Outfit']">Espaço Publicitário • Top Leaderboard (728x90 / Responsivo)</p>
                <p className="text-[11px] text-slate-500 font-mono mt-1">Publisher ID: {adConfig.clientSlotId || 'ca-pub-6609396265350793'}</p>
                <span className="inline-block mt-2 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                  {adConfig.enabled ? 'Ativo no Blog e Artigos' : 'Desativado'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: EDITAR PÁGINA SOBRE O AUTOR */}
      {activeTab === 'about' && <EditAboutSection />}

      {/* TAB 8.2: EDITAR RADAR TÉCNICO & TELEJORNAL */}
      {activeTab === 'radar' && <EditRadarSection />}

      {/* TAB 8.5: EDITAR CONTATO E REDES SOCIAIS */}
      {activeTab === 'contact' && <EditContactSection />}

      {/* TAB 7: MENSAGENS DE CONTATO */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[#F1F5F9]">
            <h2 className="text-lg font-bold text-[#0A192F] font-['Outfit']">Caixa de Entrada de Contatos</h2>
            <p className="text-xs text-[#64748B]">Mensagens enviadas através do formulário do portal.</p>
          </div>

          <div className="p-6 space-y-4">
            {contactMessages.length === 0 ? (
              <p className="text-xs text-[#64748B] text-center py-6">Nenhuma mensagem recebida ainda.</p>
            ) : (
              contactMessages.map(m => (
                <div
                  key={m.id}
                  className={`p-5 rounded-2xl border ${
                    m.status === 'unread' ? 'bg-[#EFF6FF] border-[#BFDBFE]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  } space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#0A192F] text-sm">{m.name}</h4>
                      <p className="text-xs text-[#64748B]">{m.email} • <strong>{m.subject}</strong></p>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.status === 'unread' && (
                        <button
                          onClick={() => markContactRead(m.id)}
                          className="text-xs text-[#1D4ED8] hover:underline font-bold"
                        >
                          Marcar como lida
                        </button>
                      )}
                      <button
                        onClick={() => deleteContactMessage(m.id)}
                        className="p-1 text-[#64748B] hover:text-rose-600"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-[#334155] leading-relaxed pt-1">
                    {m.message}
                  </p>
                  <span className="text-[10px] text-[#94A3B8] font-mono">
                    Recebida em: {new Date(m.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB BRIEFING: WEEKLY BRIEFING MANAGER */}
      {activeTab === 'briefing' && (
        <WeeklyBriefingManager />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE ARTIGO */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#E2E8F0] shadow-2xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl shrink-0 border border-rose-100">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-mono font-bold uppercase">
                  Área Administrativa • Exclusão Definitiva
                </div>
                <h3 className="text-xl font-extrabold text-[#0A192F] font-['Outfit']">
                  Confirmar Exclusão de Publicação
                </h3>
              </div>
            </div>

            <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
              <p className="text-xs text-[#64748B] uppercase font-mono font-bold">Artigo a ser removido:</p>
              <h4 className="text-sm font-bold text-[#0A192F] leading-snug">
                « {postToDelete.title} »
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] pt-1">
                <span className="px-2 py-0.5 rounded-sm bg-white border font-mono">
                  {postToDelete.category}
                </span>
                <span>•</span>
                <span>{postToDelete.viewsCount || 0} visualizações</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Aviso importante ao Administrador:
              </p>
              <p className="text-amber-800/90 text-[11px]">
                Esta ação excluirá permanentemente o artigo do banco de dados (Firestore), dos feeds públicos e removerá todos os comentários e avaliações associados. Esta operação não pode ser desfeita.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#F1F5F9]">
              <button
                type="button"
                disabled={isDeletingPost}
                onClick={() => setPostToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-[#CBD5E1] text-[#64748B] text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingPost}
                onClick={handleConfirmDeletePost}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingPost ? 'Excluindo Artigo...' : 'Sim, Excluir Definitivamente'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE USUÁRIO */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E2E8F0] shadow-2xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl shrink-0 border border-rose-100">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-mono font-bold uppercase">
                  Gestão de Membros
                </div>
                <h3 className="text-xl font-extrabold text-[#0A192F] font-['Outfit']">
                  Excluir Conta de Usuário
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
              Tem certeza que deseja remover o usuário <strong className="text-[#0A192F] font-bold">"{userToDelete.name || userToDelete.email}"</strong> ({userToDelete.email}) do banco de dados?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#F1F5F9]">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => setUserToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-[#CBD5E1] text-[#64748B] text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={handleConfirmDeleteUser}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingUser ? 'Excluindo...' : 'Sim, Excluir Usuário'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
