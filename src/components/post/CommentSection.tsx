import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { useAuth } from '../../context/AuthContext';
import { Post, Comment, CommentReply } from '../../types';
import { AuthModal } from '../auth/AuthModal';
import { UserProfileModal, ProfileCardData } from '../common/UserProfileModal';
import { BadgePill } from '../common/BadgePill';
import { resolveImageUrl } from '../../services/mediaService';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  Trash2,
  Edit2,
  Check,
  X,
  User as UserIcon,
  Shield,
  Reply,
  CornerDownRight,
  Info,
  Bot,
  Sparkles
} from 'lucide-react';

interface CommentSectionProps {
  post: Post;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ post }) => {
  const {
    comments,
    aiAgents,
    addComment,
    addCommentReply,
    deleteComment,
    deleteCommentReply,
    editMyComment,
    likeComment,
    likeCommentReply,
    isCommentLiked,
    isReplyLiked
  } = useBlog();
  const { user, usersList, isAdmin } = useAuth();
  const { navigate } = useBlog();

  const getCommenterAvatar = (userId: string, fallbackAvatar: string) => {
    if (userId?.startsWith('ai-agent-')) {
      const agentId = userId.replace('ai-agent-', '');
      const agent = aiAgents.find(a => a.id === agentId);
      if (agent?.avatar) return resolveImageUrl(agent.avatar);
    }
    if (user && user.id === userId) {
      return resolveImageUrl(user.avatar || fallbackAvatar);
    }
    const matched = usersList?.find(u => u.id === userId);
    return resolveImageUrl(matched?.avatar || fallbackAvatar);
  };

  const getCommenterName = (userId: string, fallbackName: string) => {
    if (userId?.startsWith('ai-agent-')) {
      const agentId = userId.replace('ai-agent-', '');
      const agent = aiAgents.find(a => a.id === agentId);
      if (agent?.name) return agent.name;
    }
    if (user && user.id === userId) {
      return user.name || fallbackName;
    }
    const matched = usersList?.find(u => u.id === userId);
    return matched?.name || fallbackName;
  };

  const getCommenterTitle = (userId: string, fallbackTitle?: string) => {
    if (userId?.startsWith('ai-agent-')) {
      const agentId = userId.replace('ai-agent-', '');
      const agent = aiAgents.find(a => a.id === agentId);
      if (agent?.role) return agent.role;
    }
    if (user && user.id === userId) {
      return user.title || fallbackTitle;
    }
    const matched = usersList?.find(u => u.id === userId);
    return matched?.title || fallbackTitle;
  };

  const getCommenterBadges = (userId: string): string[] => {
    if (user && user.id === userId) {
      return Array.isArray(user.equippedBadges) && user.equippedBadges.length > 0
        ? user.equippedBadges
        : Array.isArray(user.badges)
        ? user.badges.slice(0, 2)
        : [];
    }
    const matched = usersList?.find(u => u.id === userId);
    if (matched) {
      return Array.isArray(matched.equippedBadges) && matched.equippedBadges.length > 0
        ? matched.equippedBadges
        : Array.isArray(matched.badges)
        ? matched.badges.slice(0, 2)
        : [];
    }
    return [];
  };

  const isCommenterAuthor = (userId: string, userName?: string) => {
    if (user && user.id === userId) {
      return user.role === 'admin' || user.email === 'andradeseripa2@gmail.com';
    }
    const matched = usersList?.find(u => u.id === userId);
    if (matched) {
      return matched.role === 'admin' || matched.email === 'andradeseripa2@gmail.com';
    }
    return userId === 'usr-admin-alexandre';
  };

  const [newCommentText, setNewCommentText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalAction, setAuthModalAction] = useState<'comment' | 'reply'>('comment');
  const [pendingReplyCommentId, setPendingReplyCommentId] = useState<string | null>(null);

  // Profile modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<ProfileCardData | null>(null);

  const openUserProfile = (userData: ProfileCardData) => {
    setSelectedUserProfile(userData);
    setProfileModalOpen(true);
  };

  // Filter comments for this post
  const postComments = comments.filter(
    c => c.postId === post.id && (c.status === 'approved' || isAdmin || c.userId === user?.id)
  );

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModalAction('comment');
      setAuthModalOpen(true);
      return;
    }

    if (!newCommentText.trim()) return;

    const res = await addComment(post.id, newCommentText);
    if (res.success) {
      setNewCommentText('');
      setErrorMsg(null);
    } else {
      setErrorMsg(res.error || 'Erro ao enviar comentário.');
    }
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editText.trim()) return;
    editMyComment(commentId, editText);
    setEditingId(null);
  };

  const handleOpenReply = (commentId: string) => {
    if (!user) {
      setPendingReplyCommentId(commentId);
      setAuthModalAction('reply');
      setAuthModalOpen(true);
      return;
    }
    setReplyingToId(replyingToId === commentId ? null : commentId);
    setReplyText('');
    setReplyError(null);
  };

  const handleSendReply = async (commentId: string) => {
    if (!user) {
      setPendingReplyCommentId(commentId);
      setAuthModalAction('reply');
      setAuthModalOpen(true);
      return;
    }

    if (!replyText.trim()) return;

    const res = await addCommentReply(commentId, replyText);
    if (res.success) {
      setReplyText('');
      setReplyingToId(null);
      setReplyError(null);
    } else {
      setReplyError(res.error || 'Erro ao enviar resposta.');
    }
  };

  const handleAuthSuccess = () => {
    if (authModalAction === 'reply' && pendingReplyCommentId) {
      setReplyingToId(pendingReplyCommentId);
      setPendingReplyCommentId(null);
    }
  };

  return (
    <>
      <section id="comments-section" className="mt-12 pt-8 border-t border-[#E2E8F0]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-extrabold text-[#0A192F] font-['Outfit'] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#1D4ED8]" />
            Comentários & Respostas Técnicas ({postComments.length})
          </h3>
          <span className="text-xs text-[#64748B] hidden sm:inline">
            Clique no nome ou foto de um autor para ver seu perfil completo
          </span>
        </div>

        {/* Post comment input box */}
        {user ? (
          <form
            onSubmit={handleAddComment}
            className="mb-8 p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs"
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() =>
                  openUserProfile({
                    userId: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    title: user.title,
                    bio: user.bio,
                    role: user.role,
                    createdAt: user.createdAt
                  })
                }
                className="group relative cursor-pointer"
                title="Ver meu perfil"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#CBD5E1] shrink-0 group-hover:ring-2 group-hover:ring-[#1D4ED8] transition-all"
                  onError={e => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      user.name
                    )}`;
                  }}
                />
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      openUserProfile({
                        userId: user.id,
                        name: user.name,
                        avatar: user.avatar,
                        title: user.title,
                        bio: user.bio,
                        role: user.role,
                        createdAt: user.createdAt
                      })
                    }
                    className="text-xs font-bold text-[#0F172A] hover:text-[#1D4ED8] transition-colors cursor-pointer text-left"
                  >
                    {user.name}
                  </button>
                  <span className="text-[11px] text-[#64748B]">
                    {user.title || 'Membro da Comunidade'}
                  </span>
                </div>
                <textarea
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  placeholder="Compartilhe sua experiência de voo, manutenção ou tire uma dúvida técnica..."
                  rows={3}
                  required
                  className="w-full p-3 text-xs md:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954] resize-none"
                />
                <div className="mt-2 flex items-center justify-between">
                  {errorMsg ? (
                    <span className="text-xs text-rose-600 font-medium">{errorMsg}</span>
                  ) : (
                    <span className="text-[11px] text-[#94A3B8]">Pressione enviar para publicar</span>
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A192F] hover:bg-[#0E2954] text-white text-xs font-bold rounded-lg transition-colors font-['Outfit'] cursor-pointer"
                  >
                    <span>Publicar Comentário</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-6 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white text-[#1D4ED8] rounded-xl shadow-xs">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E3A8A]">Faça login para participar da discussão</h4>
                <p className="text-xs text-[#3B82F6]">
                  Comente, responda a outros profissionais e troque experiências de hangar.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setAuthModalAction('comment');
                setAuthModalOpen(true);
              }}
              className="px-5 py-2.5 bg-[#0A192F] hover:bg-[#0E2954] text-white text-xs font-bold rounded-xl transition-colors font-['Outfit'] shrink-0 cursor-pointer"
            >
              Entrar / Cadastrar-se
            </button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-5">
          {postComments.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E2E8F0] text-[#64748B] text-xs sm:text-sm">
              Seja o primeiro a deixar um comentário técnico sobre este artigo!
            </div>
          ) : (
            postComments.map(comment => {
              const isAuthor = user?.id === comment.userId;
              const canManage = isAuthor || isAdmin;
              const isEditing = editingId === comment.id;
              const isReplying = replyingToId === comment.id;
              const repliesList = comment.replies || [];

              const currentCommenterAvatar = getCommenterAvatar(comment.userId, comment.userAvatar);
              const currentCommenterName = getCommenterName(comment.userId, comment.userName);
              const currentCommenterTitle = getCommenterTitle(comment.userId, comment.userTitle);

              return (
                <div
                  key={comment.id}
                  className="p-4 sm:p-6 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4"
                >
                  {/* Top Comment Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          openUserProfile({
                            userId: comment.userId,
                            name: currentCommenterName,
                            avatar: currentCommenterAvatar,
                            title: currentCommenterTitle,
                            createdAt: comment.createdAt
                          })
                        }
                        className="group relative cursor-pointer"
                        title={`Ver perfil de ${currentCommenterName}`}
                      >
                        <img
                          src={currentCommenterAvatar}
                          alt={currentCommenterName}
                          className="w-10 h-10 rounded-full object-cover border border-[#CBD5E1] group-hover:ring-2 group-hover:ring-[#1D4ED8] transition-all"
                          onError={e => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              currentCommenterName
                            )}`;
                          }}
                        />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openUserProfile({
                                userId: comment.userId,
                                name: currentCommenterName,
                                avatar: currentCommenterAvatar,
                                title: currentCommenterTitle,
                                createdAt: comment.createdAt
                              })
                            }
                            className="text-xs sm:text-sm font-bold text-[#0F172A] hover:text-[#1D4ED8] transition-colors cursor-pointer text-left flex items-center gap-1.5"
                            title={`Ver perfil de ${currentCommenterName}`}
                          >
                            <span>{currentCommenterName}</span>
                          </button>
                          {isCommenterAuthor(comment.userId, currentCommenterName) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1D4ED8] text-[10px] font-bold">
                              <Shield className="w-3 h-3" /> Autor
                            </span>
                          )}
                          {/* Equipped Badges */}
                          {getCommenterBadges(comment.userId).map(bId => (
                            <BadgePill key={bId} badgeId={bId} size="xs" />
                          ))}
                        </div>
                        <span className="text-[11px] text-[#64748B]">
                          {currentCommenterTitle || 'Leitor do Portal'} •{' '}
                          {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {canManage && !isEditing && (
                      <div className="flex items-center gap-1">
                        {isAuthor && (
                          <button
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditText(comment.content);
                            }}
                            className="p-1.5 text-[#64748B] hover:text-[#1D4ED8] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Comment Content */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        rows={3}
                        className="w-full p-3 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-xs border rounded-lg text-[#64748B] hover:bg-slate-50 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(comment.id)}
                          className="px-4 py-1.5 text-xs bg-[#0A192F] text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                      {comment.content}
                    </p>
                  )}

                  {/* Action Bar (Like & Reply buttons) */}
                  <div className="pt-2 flex items-center gap-4 border-t border-[#F8FAFC] text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          setAuthModalAction('comment');
                          setAuthModalOpen(true);
                          return;
                        }
                        likeComment(comment.id);
                      }}
                      className={`inline-flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                        isCommentLiked(comment.id)
                          ? 'text-[#1D4ED8] dark:text-blue-400'
                          : 'text-[#64748B] hover:text-[#1D4ED8] dark:hover:text-blue-400'
                      }`}
                      title={isCommentLiked(comment.id) ? 'Remover curtida' : 'Curtir comentário'}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isCommentLiked(comment.id) ? 'fill-current' : ''}`} />
                      <span>{comment.likes > 0 ? `${comment.likes} Útil` : 'Útil'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenReply(comment.id)}
                      className={`inline-flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                        isReplying ? 'text-[#1D4ED8]' : 'text-[#64748B] hover:text-[#1D4ED8]'
                      }`}
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Responder</span>
                    </button>

                    {repliesList.length > 0 && (
                      <span className="text-[11px] text-[#94A3B8] ml-auto font-mono">
                        {repliesList.length} {repliesList.length === 1 ? 'resposta' : 'respostas'}
                      </span>
                    )}
                  </div>

                  {/* Inline Reply Form */}
                  {isReplying && (
                    <div className="mt-3 p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0A192F]">
                        <CornerDownRight className="w-4 h-4 text-[#1D4ED8]" />
                        <span>Respondendo a {currentCommenterName}:</span>
                      </div>
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Escreva sua resposta técnica..."
                        rows={2}
                        className="w-full p-2.5 text-xs bg-white border border-[#CBD5E1] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954] resize-none"
                      />
                      {replyError && (
                        <p className="text-xs text-rose-600 font-medium">{replyError}</p>
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyingToId(null)}
                          className="px-3 py-1.5 text-xs text-[#64748B] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendReply(comment.id)}
                          className="px-4 py-1.5 bg-[#0A192F] hover:bg-[#0E2954] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer font-['Outfit']"
                        >
                          <Send className="w-3 h-3" />
                          <span>Publicar Resposta</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Threaded / Nested Replies List */}
                  {repliesList.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#F1F5F9] pl-3 sm:pl-6 border-l-2 border-l-[#BFDBFE] space-y-3">
                      {repliesList.map(reply => {
                        const isAI = reply.isAIReply || reply.userId?.startsWith('ai-agent-');
                        const canDeleteReply = user?.id === reply.userId || isAdmin;
                        const replyAvatar = getCommenterAvatar(reply.userId, reply.userAvatar);
                        const replyName = getCommenterName(reply.userId, reply.userName);
                        const replyTitle = getCommenterTitle(reply.userId, reply.userTitle);

                        return (
                          <div
                            key={reply.id}
                            className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                              isAI
                                ? 'bg-gradient-to-r from-blue-50/70 to-indigo-50/40 border-blue-200/80 shadow-xs'
                                : 'bg-[#F8FAFC] border-[#E2E8F0]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openUserProfile({
                                      userId: reply.userId,
                                      name: replyName,
                                      avatar: replyAvatar,
                                      title: replyTitle,
                                      createdAt: reply.createdAt
                                    })
                                  }
                                  className="group relative cursor-pointer"
                                  title={`Ver perfil de ${replyName}`}
                                >
                                  <img
                                    src={replyAvatar}
                                    alt={replyName}
                                    className={`w-7 h-7 rounded-full object-cover border transition-all ${
                                      isAI
                                        ? 'border-blue-400 ring-2 ring-blue-200 shadow-xs'
                                        : 'border-[#CBD5E1] group-hover:ring-2 group-hover:ring-[#1D4ED8]'
                                    }`}
                                    onError={e => {
                                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                        replyName
                                      )}`;
                                    }}
                                  />
                                </button>
                                <div>
                                  <div className="flex items-center flex-wrap gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openUserProfile({
                                          userId: reply.userId,
                                          name: replyName,
                                          avatar: replyAvatar,
                                          title: replyTitle,
                                          createdAt: reply.createdAt
                                        })
                                      }
                                      className="text-xs font-bold text-[#0F172A] hover:text-[#1D4ED8] transition-colors cursor-pointer text-left flex items-center gap-1"
                                      title={`Ver perfil de ${replyName}`}
                                    >
                                      <span>{replyName}</span>
                                    </button>

                                    {isAI && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-black tracking-wide uppercase shadow-xs">
                                        <Bot className="w-2.5 h-2.5" />
                                        <span>{reply.agentBadge || 'ESPECIALISTA IA'}</span>
                                      </span>
                                    )}

                                    {!isAI && isCommenterAuthor(reply.userId, replyName) && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-sm bg-[#EFF6FF] text-[#1D4ED8] text-[9px] font-bold">
                                        <Shield className="w-2.5 h-2.5" /> Autor
                                      </span>
                                    )}
                                    {getCommenterBadges(reply.userId).map(bId => (
                                      <BadgePill key={bId} badgeId={bId} size="xs" />
                                    ))}
                                  </div>
                                  <span className="text-[10px] text-[#64748B]">
                                    {replyTitle || 'Membro da Comunidade'} •{' '}
                                    {new Date(reply.createdAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>

                              {canDeleteReply && (
                                <button
                                  onClick={() => deleteCommentReply(comment.id, reply.id)}
                                  className="p-1 text-[#94A3B8] hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Excluir Resposta"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            <p className="text-xs text-[#334155] leading-relaxed pl-1 whitespace-pre-line">
                              {reply.content}
                            </p>

                            <div className="pt-1 flex items-center justify-between text-[11px] text-[#94A3B8]">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!user) {
                                    setAuthModalAction('reply');
                                    setAuthModalOpen(true);
                                    return;
                                  }
                                  likeCommentReply(comment.id, reply.id);
                                }}
                                className={`inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                  isReplyLiked(comment.id, reply.id)
                                    ? 'text-[#1D4ED8] dark:text-blue-400 font-semibold'
                                    : 'text-[#64748B] hover:text-[#1D4ED8] dark:hover:text-blue-400'
                                }`}
                                title={isReplyLiked(comment.id, reply.id) ? 'Remover curtida' : 'Curtir resposta'}
                              >
                                <ThumbsUp className={`w-3 h-3 ${isReplyLiked(comment.id, reply.id) ? 'fill-current' : ''}`} />
                                <span>{reply.likes > 0 ? reply.likes : 'Útil'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* User Profile Mini-Card Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        targetUser={selectedUserProfile}
      />

      {/* Auth Modal for Unauthenticated Users */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        actionType={authModalAction}
        title={
          authModalAction === 'reply'
            ? 'Faça login para responder'
            : 'Faça login para comentar'
        }
        subtitle={
          authModalAction === 'reply'
            ? 'Para responder comentários e trocar experiências técnicas com outros leitores, faça login ou cadastre-se.'
            : 'Para publicar comentários técnicos neste artigo, faça login ou crie sua conta no portal.'
        }
      />
    </>
  );
};

