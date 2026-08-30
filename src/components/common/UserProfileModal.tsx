import React from 'react';
import { User, Comment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useBlog } from '../../context/BlogContext';
import {
  X,
  ShieldCheck,
  User as UserIcon,
  Briefcase,
  Calendar,
  MessageSquare,
  Sparkles,
  Award,
  Edit3
} from 'lucide-react';
import { BadgePill } from './BadgePill';

export interface ProfileCardData {
  userId: string;
  name: string;
  avatar: string;
  title?: string;
  bio?: string;
  role?: string;
  createdAt?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: ProfileCardData | null;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  targetUser
}) => {
  const { user: currentUser, usersList, isAdmin } = useAuth();
  const { comments, navigate } = useBlog();

  if (!isOpen || !targetUser) return null;

  // Resolve best user data from usersList if available strictly by userId
  const isCurrentUser = currentUser && currentUser.id === targetUser.userId;

  const fullUser = isCurrentUser
    ? currentUser
    : usersList?.find(u => u.id === targetUser.userId);

  const name = fullUser?.name || targetUser.name;
  const avatar = fullUser?.avatar || targetUser.avatar;
  const title = fullUser?.title || targetUser.title;
  const bio = fullUser?.bio || targetUser.bio;
  const role = fullUser?.role || targetUser.role;
  const createdAt = fullUser?.createdAt || targetUser.createdAt;

  const isAuthorAdmin =
    role === 'admin' ||
    targetUser.userId === 'usr-admin-alexandre' ||
    (fullUser?.email === 'andradeseripa2@gmail.com') ||
    isAdmin;

  // Resolve badges that the user chose to display/equip (or default preview for admin)
  const displayBadges: string[] = (() => {
    // 1. If equippedBadges is an array (even if empty or has items), use it strictly
    if (Array.isArray(fullUser?.equippedBadges)) {
      if (fullUser.equippedBadges.length > 0) {
        return fullUser.equippedBadges;
      }
      // If equippedBadges is explicitly empty [], respect that user unequipped all badges
      return [];
    }
    // 2. Fallback if equippedBadges was never initialized: use user.badges (if any)
    if (Array.isArray(fullUser?.badges) && fullUser.badges.length > 0) {
      return fullUser.badges;
    }
    // 3. Fallback for unconfigured Admin profile
    if (isAuthorAdmin) {
      return ['fab-mechanic', 'certified-inspector'];
    }
    return [];
  })();

  const userCommentsCount = (() => {
    let count = 0;
    comments.forEach(c => {
      if (c.userId === targetUser.userId) count++;
      if (Array.isArray(c.replies)) {
        c.replies.forEach(r => {
          if (r.userId === targetUser.userId) count++;
        });
      }
    });
    return count;
  })();

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : 'Membro Ativo';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#070F1E] rounded-3xl shadow-2xl border border-[#E2E8F0] dark:border-slate-800 z-10 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Top Decorative Banner with integrated Avatar */}
        <div className="h-28 bg-gradient-to-r from-[#0A192F] via-[#0E2954] to-[#1D4ED8] relative shrink-0 rounded-t-3xl px-6 flex items-end justify-between">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors cursor-pointer z-30 shadow-xs"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Avatar floating above banner boundary */}
          <div className="relative translate-y-8 z-30 shrink-0">
            <img
              src={avatar}
              alt={name}
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border-4 border-white dark:border-[#070F1E] shadow-xl bg-slate-100 dark:bg-slate-800"
              onError={e => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  name
                )}`;
              }}
            />
            {isAuthorAdmin && (
              <div
                className="absolute -bottom-1 -right-1 p-1 bg-[#1D4ED8] text-white rounded-lg shadow-sm border-2 border-white dark:border-[#070F1E]"
                title="Autor / Administrador Verificado"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6 pt-3 space-y-4 overflow-y-auto rounded-b-3xl">
          {/* Header Badges Row (2 on top, 2 on bottom in a 2-column grid) */}
          <div className="flex items-start justify-end min-h-[60px] pl-24">
            <div className="flex-1 flex justify-end">
              {displayBadges.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-w-[320px] w-full justify-items-end">
                  {displayBadges.slice(0, 4).map(bId => (
                    <div key={bId} className="w-full flex justify-end">
                      <BadgePill badgeId={bId} size="md" />
                    </div>
                  ))}
                </div>
              ) : isAuthorAdmin ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 text-xs font-bold font-['Outfit'] uppercase tracking-wider border border-blue-200 dark:border-blue-800 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-[#1D4ED8] dark:text-blue-400" />
                  Administrador & Autor
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-['Outfit'] border border-slate-200 dark:border-slate-700">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  Membro
                </span>
              )}
            </div>
          </div>

          {/* Name & Title */}
          <div>
            <h3 className="text-xl font-bold text-[#0A192F] dark:text-white font-['Outfit']">
              {name}
            </h3>
            <p className="text-xs font-semibold text-[#1D4ED8] dark:text-blue-400 flex items-center gap-1.5 mt-0.5">
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span>{title || 'Membro da Comunidade de Aviação'}</span>
            </p>
          </div>

          {/* Mini Bio */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#1D4ED8]" />
              Trajetória & Mini Bio
            </div>
            <p className="italic">
              {bio && bio.trim().length > 0
                ? bio
                : isAuthorAdmin
                ? 'Mais de uma década de experiência técnica e inspeção aeronáutica na Força Aérea Brasileira (FAB) e investigação SIPAER.'
                : 'Membro participante das discussões técnicas e debates sobre aviação e segurança de voo.'}
            </p>
          </div>

          {/* User Stats / Metadata */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <div className="min-w-0">
                <span className="block text-[10px] text-slate-400 font-mono uppercase">Desde</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate block text-[11px]">
                  {formattedDate}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <div className="min-w-0">
                <span className="block text-[10px] text-slate-400 font-mono uppercase">Interações</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate block text-[11px]">
                  {userCommentsCount} {userCommentsCount === 1 ? 'comentário' : 'comentários'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            {isCurrentUser ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('profile');
                }}
                className="w-full py-2.5 px-4 bg-[#0A192F] hover:bg-[#0E2954] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors font-['Outfit'] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Gerenciar Minhas Badges & Perfil</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors font-['Outfit'] cursor-pointer"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
