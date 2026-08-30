import React from 'react';
import {
  Award,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Sparkles,
  PlaneTakeoff,
  MessageSquareText,
  MessagesSquare,
  BookMarked,
  Cpu,
  Shield
} from 'lucide-react';
import { AviationBadge, getBadgeById } from '../../data/badgesData';

interface BadgeIconProps {
  iconName: string;
  className?: string;
}

export const BadgeIcon: React.FC<BadgeIconProps> = ({ iconName, className = 'w-4 h-4' }) => {
  switch (iconName) {
    case 'PlaneTakeoff':
      return <PlaneTakeoff className={className} />;
    case 'MessageSquareText':
      return <MessageSquareText className={className} />;
    case 'MessagesSquare':
      return <MessagesSquare className={className} />;
    case 'ShieldAlert':
      return <ShieldAlert className={className} />;
    case 'BookMarked':
      return <BookMarked className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Cpu':
      return <Cpu className={className} />;
    default:
      return <Shield className={className} />;
  }
};

interface BadgePillProps {
  badgeId: string;
  showTooltip?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const BadgePill: React.FC<BadgePillProps> = ({
  badgeId,
  showTooltip = true,
  size = 'sm',
  onClick
}) => {
  const badge = getBadgeById(badgeId);
  if (!badge) return null;

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-1',
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-xs sm:text-sm gap-2 shadow-2xs font-semibold'
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <span
      onClick={onClick}
      title={showTooltip ? `${badge.name}: ${badge.description}` : undefined}
      className={`inline-flex items-center font-bold font-['Outfit'] rounded-lg border ${badge.bgLight} ${badge.borderLight} ${badge.color} ${sizeClasses[size]} ${
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      }`}
    >
      <BadgeIcon iconName={badge.iconName} className={iconSizes[size]} />
      <span className={size === 'lg' ? 'truncate max-w-[180px]' : 'truncate max-w-[120px]'}>{badge.name}</span>
    </span>
  );
};
