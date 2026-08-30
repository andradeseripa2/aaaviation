import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBlog } from '../../context/BlogContext';
import {
  User as UserIcon,
  Camera,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  ShieldCheck,
  Award,
  Bell,
  CheckCheck,
  ExternalLink,
  Sparkles,
  Loader2,
  Clock,
  ChevronRight,
  ThumbsUp,
  Info
} from 'lucide-react';
import { compressAvatar } from '../../lib/imageUtils';
import { AVAILABLE_BADGES, getBadgeById } from '../../data/badgesData';
import { BadgePill, BadgeIcon } from '../common/BadgePill';

export const ProfilePage: React.FC = () => {
  const { user, isAdmin, updateProfile, changePassword, toggleEquippedBadge } = useAuth();
  const {
    comments,
    deleteComment,
    deleteCommentReply,
    editMyComment,
    navigate,
    syncUserProfileToContent,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    checkAndUnlockBadges
  } = useBlog();

  // Active Tab: 'edit-profile' (first) | 'overview' | 'notifications' | 'comments' | 'security'
  const [activeTab, setActiveTab] = useState<'edit-profile' | 'overview' | 'badges' | 'notifications' | 'comments' | 'security'>('edit-profile');

  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);

  // Track user ID for form synchronization
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (user && user.id !== prevUserIdRef.current) {
      prevUserIdRef.current = user.id;
      setName(user.name || '');
      setTitle(user.title || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatar || '');
    }
  }, [user?.id]);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Comment edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentEditText, setCommentEditText] = useState('');

  // Feedback states
  const [profileMsg, setProfileMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [badgeMsg, setBadgeMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-[#0B1528] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 text-center space-y-4 shadow-sm">
        <UserIcon className="w-12 h-12 text-[#64748B] dark:text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-[#0A192F] dark:text-white font-['Outfit']">Acesso Restrito</h2>
        <p className="text-xs text-[#64748B] dark:text-slate-400">Você precisa estar autenticado para acessar seu perfil e badges.</p>
        <button
          type="button"
          onClick={() => navigate('login')}
          className="px-6 py-2.5 bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
        >
          Fazer Login
        </button>
      </div>
    );
  }

  // Filter user's comments and replies accurately by userId or user email
  interface UserContribution {
    id: string;
    postId: string;
    postTitle?: string;
    content: string;
    createdAt: string;
    likes: number;
    isReply: boolean;
    parentCommentId?: string;
  }

  const myContributions: UserContribution[] = (() => {
    const list: UserContribution[] = [];
    comments.forEach(c => {
      if (c.userId === user.id || (user.email && c.userId === user.email)) {
        list.push({
          id: c.id,
          postId: c.postId,
          postTitle: c.postTitle,
          content: c.content,
          createdAt: c.createdAt,
          likes: c.likes || 0,
          isReply: false
        });
      }
      if (Array.isArray(c.replies)) {
        c.replies.forEach(r => {
          if (r.userId === user.id || (user.email && r.userId === user.email)) {
            list.push({
              id: r.id,
              postId: c.postId,
              postTitle: c.postTitle,
              content: r.content,
              createdAt: r.createdAt,
              likes: r.likes || 0,
              isReply: true,
              parentCommentId: c.id
            });
          }
        });
      }
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  })();

  const myComments = myContributions;

  // Admin account has all badges unlocked
  const unlockedBadges = isAdmin
    ? AVAILABLE_BADGES.map(b => b.id)
    : (Array.isArray(user.badges) ? user.badges : []);
  const equippedBadges = Array.isArray(user.equippedBadges) ? user.equippedBadges : [];

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingAvatar(true);
    try {
      const compressed = await compressAvatar(file, 320, 320, 0.85);
      setAvatarUrl(compressed);
      setProfileMsg({ success: true, text: 'Nova foto carregada! Clique em "Salvar Alterações" para confirmar.' });
      setTimeout(() => setProfileMsg(null), 3500);
    } catch (err) {
      console.error('Error compressing avatar:', err);
      setProfileMsg({ success: false, text: 'Erro ao processar imagem. Tente uma foto menor ou em formato JPG/PNG.' });
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMsg({ success: false, text: 'O nome não pode ficar em branco.' });
      return;
    }

    setSavingProfile(true);
    setProfileMsg(null);

    const updates = {
      name: name.trim(),
      title: title.trim(),
      bio: bio.trim(),
      avatar: avatarUrl
    };

    try {
      const res = await updateProfile(updates);

      if (res.success) {
        setProfileMsg({ success: true, text: 'Perfil atualizado e sincronizado com sucesso!' });
        setTimeout(() => setProfileMsg(null), 4000);
        if (user) {
          syncUserProfileToContent({ ...user, ...updates }).catch(err => {
            console.warn('Background content sync note:', err);
          });
        }
      } else {
        setProfileMsg({ success: false, text: res.error || 'Erro ao atualizar perfil.' });
      }
    } catch (err: any) {
      setProfileMsg({ success: false, text: err?.message || 'Falha ao salvar perfil.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!oldPassword) {
      setPasswordMsg({ success: false, text: 'Por favor, informe sua senha anterior.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ success: false, text: 'A nova senha deve possuir pelo menos 6 dígitos.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ success: false, text: 'A confirmação de senha não coincide com a nova senha digitada.' });
      return;
    }

    setSavingPassword(true);
    const res = await changePassword(oldPassword, newPassword);
    setSavingPassword(false);

    if (res.success) {
      setPasswordMsg({
        success: true,
        text: 'Senha alterada com sucesso! Suas credenciais foram atualizadas.'
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 4000);
    } else {
      setPasswordMsg({ success: false, text: res.error || 'Erro ao mudar senha.' });
    }
  };

  const handleToggleBadge = async (badgeId: string) => {
    setBadgeMsg(null);
    const res = await toggleEquippedBadge(badgeId);
    if (!res.success && res.error) {
      setBadgeMsg({ success: false, text: res.error });
      setTimeout(() => setBadgeMsg(null), 3500);
    } else {
      setBadgeMsg({ success: true, text: 'Badges em exibição atualizadas com sucesso!' });
      setTimeout(() => setBadgeMsg(null), 2500);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-300 space-y-8">
      {/* Top Profile Header Card */}
      <div className="p-6 sm:p-8 bg-white dark:bg-[#0B1528] border border-[#E2E8F0] dark:border-slate-800 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group shrink-0">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-[#CBD5E1] dark:border-slate-700 shadow-xs bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <img
                src={avatarUrl || user.avatar}
                alt={user.name}
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  isProcessingAvatar ? 'opacity-40' : 'opacity-100'
                }`}
                onError={e => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    user.name
                  )}`;
                }}
              />
              {isProcessingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <label
              className="absolute -bottom-2 -right-2 p-2 bg-[#0A192F] dark:bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-[#0E2954] dark:hover:bg-blue-500 transition-colors shadow-md border-2 border-white dark:border-[#0B1528]"
              title="Trocar foto de perfil"
            >
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isProcessingAvatar || savingProfile}
                onChange={handleAvatarFileUpload}
              />
            </label>
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A192F] dark:text-white font-['Outfit'] truncate">
                {user.name}
              </h1>
              {user.role === 'admin' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-300 text-xs font-bold uppercase font-mono border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-blue-300" />
                  ADMINISTRADOR
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase font-mono">
                  LEITOR MEMBRO
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm font-semibold text-[#1D4ED8] dark:text-blue-400 mt-1">
              {user.title || 'Membro da Comunidade de Aviação'}
            </p>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">{user.email}</p>

            {user.bio && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 italic max-w-2xl">
                "{user.bio}"
              </p>
            )}

            {/* Equipped Badges Preview Header */}
            <div className="mt-4 pt-3 border-t border-[#F1F5F9] dark:border-slate-800/80 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-mono flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" /> Badges em exibição ({equippedBadges.length}/3):
              </span>
              {equippedBadges.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Nenhuma badge equipada ainda</span>
              ) : (
                equippedBadges.map(badgeId => (
                  <BadgePill key={badgeId} badgeId={badgeId} size="sm" />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-[#F1F5F9] dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('edit-profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-['Outfit'] transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'edit-profile'
                ? 'bg-[#0A192F] dark:bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Editar Dados</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-['Outfit'] transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#0A192F] dark:bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Visão Geral & Badges</span>
            {unlockedBadges.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 text-[10px] font-mono">
                {unlockedBadges.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-['Outfit'] transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-[#0A192F] dark:bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4 text-sky-400" />
            <span>Notificações</span>
            {unreadNotificationsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-['Outfit'] transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'comments'
                ? 'bg-[#0A192F] dark:bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Meus Comentários ({myComments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-['Outfit'] transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#0A192F] dark:bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Segurança & Senha</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & BADGES */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {badgeMsg && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium border ${
                badgeMsg.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}
            >
              {badgeMsg.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{badgeMsg.text}</span>
            </div>
          )}

          {/* Badges Hub */}
          <div className="p-6 sm:p-8 bg-white dark:bg-[#0B1528] border border-[#E2E8F0] dark:border-slate-800 rounded-3xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Galeria de Conquistas & Badges Aeronáuticas
                </h2>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                  Desbloqueie insígnias participando dos artigos ou recebendo prêmios e homenagens de moderadores.
                </p>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold font-mono">
                {unlockedBadges.length} de {AVAILABLE_BADGES.length} Conquistadas
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-3">
              <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold font-['Outfit'] text-sky-900 dark:text-sky-200">
                  Como equipar suas badges no perfil público:
                </p>
                <p className="mt-0.5 leading-relaxed text-[11px] text-sky-700 dark:text-sky-300">
                  Clique no botão <strong>"Equipar / Remover"</strong> nas badges desbloqueadas abaixo. Você pode selecionar até <strong>4 badges simultâneas</strong> para aparecerem ao lado do seu nome nos comentários e no seu card de perfil.
                </p>
              </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AVAILABLE_BADGES.map(badge => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                const isEquipped = equippedBadges.includes(badge.id);

                return (
                  <div
                    key={badge.id}
                    className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                      isUnlocked
                        ? `${badge.bgLight} ${badge.borderLight} shadow-xs`
                        : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-2.5 rounded-xl border ${
                              isUnlocked
                                ? `${badge.bgLight} ${badge.borderLight} ${badge.color}`
                                : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                            }`}
                          >
                            <BadgeIcon iconName={badge.iconName} className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                              {badge.name}
                            </h3>
                            <span className="text-[10px] font-bold uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">
                              {badge.category === 'honorary' ? '🎖️ Honorária / Concedida' : '⚡ Automática por Atividade'}
                            </span>
                          </div>
                        </div>

                        {isUnlocked ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold font-mono">
                            Desbloqueada
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold font-mono">
                            Bloqueada
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {badge.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <div className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
                        {isEquipped && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Exibindo no Perfil
                          </span>
                        )}
                      </div>

                      {isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => handleToggleBadge(badge.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] transition-colors cursor-pointer ${
                            isEquipped
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-[#0A192F] hover:bg-[#0E2954] dark:bg-blue-600 dark:hover:bg-blue-500 text-white'
                          }`}
                        >
                          {isEquipped ? 'Ocultar do Card' : 'Equipar no Perfil'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {badge.category === 'honorary' ? 'Concedida por um administrador' : 'Atinja o requisito para desbloquear'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NOTIFICAÇÕES */}
      {activeTab === 'notifications' && (
        <div className="p-6 sm:p-8 bg-white dark:bg-[#0B1528] border border-[#E2E8F0] dark:border-slate-800 rounded-3xl shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
                <Bell className="w-5 h-5 text-sky-500" />
                Central de Notificações
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Avisos de badges desbloqueadas, conquistas e respostas aos seus comentários.
              </p>
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-blue-500" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-3">
              <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Você não possui notificações pendentes.</p>
              <p className="text-slate-500">Quando alguém responder a um comentário seu ou você desbloquear uma badge técnica, avisaremos você aqui!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9] dark:divide-slate-800/80">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`py-4 px-3 sm:px-4 rounded-2xl transition-colors flex items-start justify-between gap-4 ${
                    notif.read ? 'bg-transparent' : 'bg-sky-50/50 dark:bg-sky-950/20'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        notif.type === 'badge_unlocked'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {notif.type === 'badge_unlocked' ? (
                        <Award className="w-4 h-4" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#0A192F] dark:text-white">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.createdAt).toLocaleDateString('pt-BR')} às {new Date(notif.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {notif.linkUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              navigate('post', { postSlug: notif.linkUrl });
                            }}
                            className="text-[#1D4ED8] dark:text-blue-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Ver Comentário</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Marcar como lida"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                      title="Excluir notificação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MEUS COMENTÁRIOS */}
      {activeTab === 'comments' && (
        <div className="p-6 sm:p-8 bg-white dark:bg-[#0B1528] border border-[#E2E8F0] dark:border-slate-800 rounded-3xl shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#1D4ED8] dark:text-blue-400" />
                Histórico de Comentários Técnicos ({myComments.length})
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Todos os comentários e contribuições postados em matérias do portal.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('blog')}
              className="px-4 py-2 bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer font-['Outfit']"
            >
              Explorar Artigos
            </button>
          </div>

          {myComments.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#64748B] dark:text-slate-400 space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Você ainda não possui comentários registrados.</p>
              <p>Comente em matérias sobre manutenção, aviação e segurança de voo para desbloquear badges!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myComments.map(c => {
                const isEditing = editingCommentId === c.id;

                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0A192F] dark:text-white truncate max-w-md">
                          {c.postTitle || 'Artigo de Aviação'}
                        </span>
                        {c.isReply && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold">
                            Resposta
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
                          Aprovado
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {!c.isReply && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(c.id);
                              setCommentEditText(c.content);
                            }}
                            className="p-1.5 text-[#64748B] hover:text-[#1D4ED8] dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Editar comentário"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (c.isReply && c.parentCommentId) {
                              deleteCommentReply(c.parentCommentId, c.id);
                            } else {
                              deleteComment(c.id);
                            }
                          }}
                          className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={commentEditText}
                          onChange={e => setCommentEditText(e.target.value)}
                          rows={3}
                          className="w-full p-3 text-xs bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 rounded-xl text-[#0A192F] dark:text-white focus:ring-2 focus:ring-[#1D4ED8]"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingCommentId(null)}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              editMyComment(c.id, commentEditText);
                              setEditingCommentId(null);
                            }}
                            className="px-4 py-1.5 bg-[#0A192F] dark:bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer font-['Outfit']"
                          >
                            Salvar Alteração
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#334155] dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        "{c.content}"
                      </p>
                    )}

                    <div className="text-[10px] text-[#94A3B8] dark:text-slate-500 flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-slate-800">
                      <span>Publicado em {new Date(c.createdAt).toLocaleDateString('pt-BR')} às {new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <ThumbsUp className="w-3 h-3 text-blue-500" /> {c.likes || 0} {c.likes === 1 ? 'curtida' : 'curtidas'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EDITAR DADOS */}
      {activeTab === 'edit-profile' && (
        <div className="p-6 sm:p-8 bg-white dark:bg-[#0B1528] border border-[#E2E8F0] dark:border-slate-800 rounded-3xl shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <FileText className="w-5 h-5 text-[#1D4ED8]" />
            <div>
              <h2 className="text-xl font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                Dados Pessoais & Assinatura Profissional
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Informações visíveis em seus comentários e no card de perfil de autor/membro.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1 font-['Outfit']">
                Nome de Exibição *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Alexandre Andrade"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954] text-[#0A192F] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1 font-['Outfit']">
                Assinatura / Título Profissional
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Mecânico CHT Célula / Inspetor Aeronáutico / Piloto"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954] text-[#0A192F] dark:text-white"
              />
              <p className="text-[10px] text-[#94A3B8] dark:text-slate-500 mt-1">
                Aparece ao lado do seu nome nos comentários para conferir autoridade técnica.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1 font-['Outfit']">
                Mini Biografia / Experiência
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder="Conte um pouco sobre sua trajetória aeronáutica, especialidades ou interesses..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954] text-[#0A192F] dark:text-white"
              />
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
                  profileMsg.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                {profileMsg.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={savingProfile || isProcessingAvatar}
              className="px-6 py-2.5 bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors font-['Outfit'] cursor-pointer disabled:opacity-50"
            >
              {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: SEGURANÇA & SENHA */}
      {activeTab === 'security' && (
        <div className="p-6 sm:p-8 bg-white dark:bg-[#0B1528] border border-[#E2E8F0] dark:border-slate-800 rounded-3xl shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-xl font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                Segurança da Conta & Troca de Senha
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Altere sua senha de acesso protegida por Firebase Authentication.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1 font-['Outfit']">
                Senha Atual *
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="Informe sua senha atual"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954] text-[#0A192F] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-2.5 p-1 text-[#94A3B8] hover:text-[#0A192F] dark:hover:text-white cursor-pointer"
                  title={showOldPassword ? 'Ocultar' : 'Exibir'}
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1 font-['Outfit']">
                  Nova Senha *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 dígitos"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954] text-[#0A192F] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 p-1 text-[#94A3B8] hover:text-[#0A192F] dark:hover:text-white cursor-pointer"
                    title={showNewPassword ? 'Ocultar' : 'Exibir'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1 font-['Outfit']">
                  Confirmar Nova Senha *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954] text-[#0A192F] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 p-1 text-[#94A3B8] hover:text-[#0A192F] dark:hover:text-white cursor-pointer"
                    title={showConfirmPassword ? 'Ocultar' : 'Exibir'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
                  passwordMsg.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                {passwordMsg.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="px-6 py-2.5 bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors font-['Outfit'] cursor-pointer disabled:opacity-50"
            >
              {savingPassword ? 'Atualizando...' : 'Atualizar Minha Senha'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
