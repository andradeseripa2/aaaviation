export type CategorySlug = 'manutencao' | 'carreira' | 'safety' | 'curiosidades' | string;

export type SortOption = 'recent' | 'popular' | 'rating' | 'time' | 'bookmarks';
export type ThemeMode = 'light' | 'dark';
export type FontSizeScale = 'sm' | 'md' | 'lg' | 'xl';

export interface TableOfContentItem {
  id: string;
  text: string;
  level: number; // 2 for h2, 3 for h3
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: CategorySlug;
  description: string;
  iconName?: string;
  emoji?: string;
  count?: number;
}

export interface PostRating {
  userId: string;
  rating: number;
  createdAt: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  category: CategorySlug;
  subcategory?: string;
  technicalBadge?: string; // e.g., "CONCEITOS", "INSPEÇÕES", "INVESTIGAÇÃO", "CARREIRA", "NOTAS TÉCNICAS"
  coverImage: string;
  coverImageCaption?: string;
  date: string;
  readTimeMinutes: number;
  featured?: boolean;
  published: boolean;
  scheduledAt?: string; // ISO Date String e.g. "2026-08-25T09:00:00"
  notifyNewsletterOnPublish?: boolean; // When published/unlocked, send email briefing
  isSafetyPost: boolean; // Mandates institutional disclaimer
  tags: string[];
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  createdAt?: string;
  updatedAt?: string;
  viewsCount?: number;
  likesCount?: number;
  ratingsCount?: number;
  averageRating?: number;
  ratings?: PostRating[];
  diagramData?: {
    title: string;
    items: { title: string; desc: string; iconName?: string }[];
    callout?: string;
  };
  regulatoryComparison?: {
    title: string;
    description: string;
    items: { entity: string; description: string }[];
  };
}

export interface CommentReply {
  id: string;
  commentId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userTitle?: string;
  content: string;
  createdAt: string;
  likes: number;
  isAIReply?: boolean;
  agentId?: string;
  agentBadge?: string;
}

export interface SuggestedAIReply {
  id: string;
  commentId: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  agentBadge?: string;
  agentRole?: string;
  text: string;
  reasoning?: string;
  generatedAt: string;
  status: 'pending' | 'approved' | 'dismissed';
}

export interface Comment {
  id: string;
  postId: string;
  postTitle?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userTitle?: string; // e.g. "Mecânico CHT Célula" / "Piloto Comercial"
  content: string;
  createdAt: string;
  status: 'approved' | 'pending' | 'rejected';
  likes: number;
  replies?: CommentReply[];
  suggestedAIReply?: SuggestedAIReply;
  aiAutoReplyScheduledAt?: string; // For 2-minute delay queue
}

export interface AIAgentPersona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  badge: string;
  tone: string;
  specialties: string[];
  systemPrompt: string;
  enabled: boolean;
  isDefault?: boolean;
  greetingStyle?: string;
}

export interface AIModerationConfig {
  enabled: boolean;
  autoReplyMode: 'manual_approval' | 'auto_delay_2min' | 'auto_instant';
  delayMinutes: number; // default 2
  dailyReplyLimit: number; // default 30
  smartRoutingEnabled: boolean; // Route dynamically to best suited persona
  defaultAgentId: string;
  antiSpamEnabled: boolean;
  notifyAdminOnGeneration: boolean;
  updatedAt?: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'badge_unlocked' | 'comment_reply' | 'system';
  title: string;
  message: string;
  linkUrl?: string;
  badgeId?: string;
  read: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'reader';
  avatar: string;
  title?: string;
  bio?: string;
  badges?: string[];          // IDs of unlocked badges
  equippedBadges?: string[];  // IDs of badges displayed publicly
  createdAt: string;
  updatedAt?: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  categoryInterest?: string;
}

export interface BriefingCampaign {
  id: string;
  subject: string;
  preheader: string;
  editorGreeting: string;
  customMessage: string;
  featuredPostIds: string[];
  editionNumber?: string; // e.g. "Edição #1"
  dateStr?: string; // e.g. "19 de agosto de 2026"
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledFor?: string; // ISO String for scheduled send date e.g. "2026-08-25T09:00:00"
  sentAt?: string;
  recipientCount: number;
  successCount: number;
  errorLog?: string;
  createdAt: string;
  createdBy?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read';
}

export interface ContactInfoData {
  email: string;
  phoneWhatsapp: string;
  linkedinUrl: string;
  instagramUrl: string;
  location: string;
  responseTime: string;
  updatedAt?: string;
}

export interface AdBannerConfig {
  enabled: boolean;
  showInHeader: boolean;
  showInSidebar: boolean;
  showInContent: boolean;
  showInFooter: boolean;
  showInSkyscraper?: boolean;
  clientSlotId?: string;
}

export interface AircraftExperience {
  id: string;
  model: string;
  role: string;
  details: string;
  imageUrl?: string;
}

export interface AboutPageData {
  heroBadge: string;
  authorName: string;
  heroHighlight: string;
  bioParagraphs: string[];
  photoUrl: string;
  photoBadge: string;
  photoSubtitle: string;

  // Homepage Authority Card specific customization
  homeAuthorityTag?: string;       // e.g. "Autor & Editor"
  homeAuthorityTitle?: string;     // e.g. "Alexandre Andrade"
  homeAuthorityRole?: string;      // e.g. "Especialista em Manutenção Aeronáutica & Investigação SIPAER"
  homeAuthorityBio?: string;       // Custom descriptive text
  homeAuthorityBadgeText?: string; // e.g. "Doutrina Técnica & Hangar"
  homeAuthorityButtonText?: string;// e.g. "Ver Trajetória Completa"

  // Technical Pillars (2 Cards)
  pillar1Title: string;
  pillar1Description: string;
  pillar1FooterLeft: string;
  pillar1FooterRight: string;

  pillar2Title: string;
  pillar2Description: string;
  pillar2FooterLeft: string;
  pillar2FooterRight: string;

  // Aircraft Section
  aircraftSectionTitle: string;
  aircraftSectionSubtitle: string;
  aircraftList: AircraftExperience[];

  // Credentials Section
  credentialsSectionTitle: string;
  credentialsList: string[];

  // CTA Section
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;

  updatedAt?: string;
}

export interface RadarMessageItem {
  id: string;
  badge: string;
  message: string;
  link?: string;
  active?: boolean;
  createdAt?: string;
}

export interface TechnicalRadarConfig {
  enabled: boolean;
  messages?: RadarMessageItem[];
  customMessage?: string;
  customBadgeText?: string;
  customLink?: string;
  showLatestPosts: boolean;
  speedSeconds?: number;
  updatedAt?: string;
}

