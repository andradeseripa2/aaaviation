import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Post,
  CategoryInfo,
  Comment,
  CommentReply,
  NewsletterSubscriber,
  BriefingCampaign,
  ContactMessage,
  AdBannerConfig,
  AboutPageData,
  ContactInfoData,
  TechnicalRadarConfig,
  CategorySlug,
  SortOption,
  ThemeMode,
  FontSizeScale,
  User,
  UserNotification,
  AIAgentPersona,
  AIModerationConfig,
  SuggestedAIReply
} from '../types';
import {
  INITIAL_POSTS,
  INITIAL_CATEGORIES,
  INITIAL_COMMENTS,
  INITIAL_ABOUT_PAGE_DATA,
  INITIAL_CONTACT_INFO
} from '../data/seedData';
import {
  DEFAULT_AI_AGENTS,
  INITIAL_AI_MODERATION_CONFIG
} from '../data/aiAgentsData';
import { useAuth } from './AuthContext';
import { generateBriefingHtml } from '../lib/emailTemplate';
import {
  safeGetItem,
  safeGetJSON,
  safeSetItem,
  safeSetJSON,
  safeRemoveItem
} from '../lib/safeStorage';
import {
  resolveCategoryName,
  resolveCategorySlug,
  postMatchesCategory,
  getCategoryVisual
} from '../lib/categoryUtils';
import {
  resolveImageUrl,
  getAviationFallbackImage,
  getMediaDataUrl,
  sanitizeMarkdownImages,
  saveToLocalMediaCache,
  persistPostMedia
} from '../services/mediaService';

export type AppView =
  | 'home'
  | 'about'
  | 'blog'
  | 'category'
  | 'post'
  | 'contact'
  | 'login'
  | 'profile'
  | 'admin'
  | 'bookmarks'
  | 'privacy'
  | 'terms';

interface NavigationOptions {
  postSlug?: string;
  categorySlug?: CategorySlug;
  search?: string;
  sort?: SortOption;
}

interface BlogContextType {
  posts: Post[];
  isLoadingPosts: boolean;
  categories: CategoryInfo[];
  comments: Comment[];
  newsletterSubscribers: NewsletterSubscriber[];
  contactMessages: ContactMessage[];
  adConfig: AdBannerConfig;
  currentView: AppView;
  selectedPostSlug: string | null;
  selectedCategorySlug: CategorySlug | null;
  searchQuery: string;
  activePost: Post | null;
  sortOption: SortOption;
  theme: ThemeMode;
  fontSize: FontSizeScale;
  bookmarks: string[];

  // Navigation & Filters
  navigate: (view: AppView, options?: NavigationOptions) => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (sort: SortOption) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setFontSize: (size: FontSizeScale) => void;

  // Bookmarks & Favorites
  isBookmarked: (postId: string) => boolean;
  toggleBookmark: (postId: string) => void;

  // Category Helpers
  getCategoryName: (slugOrName: string | undefined | null) => string;
  getCategoryVisual: (slugOrName: string | undefined | null, className?: string) => React.ReactNode;
  postMatchesCategoryFilter: (postCategory: string | undefined | null, selectedCategory: string | undefined | null) => boolean;

  // Post Actions
  createPost: (post: Omit<Post, 'id' | 'viewsCount' | 'likesCount'>) => Promise<string>;
  updatePost: (id: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  togglePublishPost: (id: string) => Promise<void>;
  setFeaturedPost: (id: string) => Promise<void>;
  incrementViews: (postId: string) => Promise<void>;
  isPostLiked: (postId: string) => boolean;
  toggleLikePost: (postId: string) => Promise<void>;
  ratePost: (postId: string, score: number) => Promise<{ success: boolean; error?: string }>;
  getPostRatingInfo: (postId: string) => { average: number; count: number; userRating: number | null };

  // Comment Actions
  addComment: (postId: string, content: string) => Promise<{ success: boolean; error?: string }>;
  addCommentReply: (commentId: string, content: string) => Promise<{ success: boolean; error?: string }>;
  approveComment: (commentId: string) => Promise<void>;
  rejectComment: (commentId: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  deleteCommentReply: (commentId: string, replyId: string) => Promise<void>;
  editMyComment: (commentId: string, newContent: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  likeCommentReply: (commentId: string, replyId: string) => Promise<void>;
  isCommentLiked: (commentId: string) => boolean;
  isReplyLiked: (commentId: string, replyId: string) => boolean;

  // Newsletter, Briefing & Contact
  subscribeNewsletter: (email: string, categoryInterest?: string) => Promise<{ success: boolean; message: string }>;
  removeNewsletterSubscriber: (emailOrId: string) => Promise<void>;
  addManualSubscriber: (email: string) => Promise<{ success: boolean; message: string }>;
  briefingCampaigns: BriefingCampaign[];
  saveBriefingCampaign: (campaign: BriefingCampaign) => Promise<void>;
  deleteBriefingCampaign: (id: string) => Promise<void>;
  sendContactMessage: (name: string, email: string, subject: string, message: string) => Promise<{ success: boolean; message: string }>;
  markContactRead: (id: string) => Promise<void>;
  deleteContactMessage: (id: string) => Promise<void>;

  // Category & Ads
  addCategory: (cat: CategoryInfo) => Promise<void>;
  updateCategory: (id: string, updates: Partial<CategoryInfo>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateAdConfig: (updates: Partial<AdBannerConfig>) => Promise<void>;
  radarConfig: TechnicalRadarConfig;
  updateRadarConfig: (updates: Partial<TechnicalRadarConfig>) => Promise<void>;
  aboutData: AboutPageData;
  updateAboutData: (updates: Partial<AboutPageData>) => Promise<void>;
  resetAboutData: () => Promise<void>;
  contactInfo: ContactInfoData;
  updateContactInfo: (updates: Partial<ContactInfoData>) => Promise<void>;
  resetContactInfo: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  syncUserProfileToContent: (updatedUser: User) => Promise<void>;

  // Notifications
  notifications: UserNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  checkAndUnlockBadges: () => Promise<void>;

  // AI Moderation & Expert Personas
  aiAgents: AIAgentPersona[];
  aiModerationConfig: AIModerationConfig;
  updateAIModerationConfig: (updates: Partial<AIModerationConfig>) => Promise<void>;
  saveAIAgent: (agent: AIAgentPersona) => Promise<void>;
  deleteAIAgent: (agentId: string) => Promise<void>;
  resetAIAgentsToDefault: () => Promise<void>;
  generateAIReplyForComment: (commentId: string, specificAgentId?: string) => Promise<{ success: boolean; replyText?: string; agent?: AIAgentPersona; error?: string }>;
  approveSuggestedAIReply: (commentId: string) => Promise<void>;
  dismissSuggestedAIReply: (commentId: string) => Promise<void>;
  testGenerateAIReply: (commentText: string, targetAgentId?: string, postTitle?: string, postCategory?: string, postContent?: string) => Promise<{ success: boolean; replyText?: string; agent?: AIAgentPersona; error?: string }>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

const STORAGE_KEY_POSTS = 'aaa_posts_v2';
const STORAGE_KEY_CATEGORIES = 'aaa_categories_v2';
const STORAGE_KEY_COMMENTS = 'aaa_comments_v2';
const STORAGE_KEY_RATINGS = 'aaa_ratings_v2';
const STORAGE_KEY_SUBS = 'aaa_newsletter_v2';
const STORAGE_KEY_BRIEFINGS = 'aaa_briefings_v2';
const STORAGE_KEY_CONTACTS = 'aaa_contacts_v2';
const STORAGE_KEY_ADS = 'aaa_ads_config_v2';
const STORAGE_KEY_RADAR = 'aaa_radar_config_v2';
const STORAGE_KEY_ABOUT = 'aaa_about_page_data_v2';
const STORAGE_KEY_CONTACT_INFO = 'aaa_contact_info_v2';
const STORAGE_KEY_AI_AGENTS = 'aaa_ai_agents_v2';
const STORAGE_KEY_AI_CONFIG = 'aaa_ai_moderation_config_v2';
const STORAGE_KEY_LIKES = 'aaa_liked_posts_v2';
const STORAGE_KEY_COMMENT_LIKES = 'aaa_liked_comments_v2';
const STORAGE_KEY_BOOKMARKS = 'aaa_bookmarks_v2';
const STORAGE_KEY_THEME = 'aaa_theme_mode_v2';
const STORAGE_KEY_FONT_SIZE = 'aaa_font_size_v2';

const INITIAL_RADAR_CONFIG: TechnicalRadarConfig = {
  enabled: true,
  messages: [],
  customMessage: '',
  customBadgeText: 'COMUNICADO',
  customLink: '',
  showLatestPosts: true,
  speedSeconds: 55
};

export const getPostTime = (p: Post): number => {
  if (p.createdAt) {
    const t = new Date(p.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (p.updatedAt) {
    const t = new Date(p.updatedAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (p.date) {
    const direct = new Date(p.date).getTime();
    if (!isNaN(direct) && direct > 0) return direct;

    const monthMap: Record<string, string> = {
      jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
      jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12'
    };
    const match = p.date.match(/(\d{1,2})\s+([A-Za-zçÇ]+)[,\s]+(\d{4})/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const monKey = match[2].toLowerCase().slice(0, 3);
      const month = monthMap[monKey] || '01';
      const year = match[3];
      const parsed = new Date(`${year}-${month}-${day}T12:00:00Z`).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  return 0;
};

export const getCommentTime = (c: Comment): number => {
  if (c.createdAt) {
    const t = new Date(c.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  return 0;
};

/**
 * Deeply sanitizes objects before sending to Firestore.
 * Removes any undefined values at any nesting depth to prevent Firestore SDK write rejections.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === undefined) return undefined as any;
  if (obj === null) return null as any;
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => (typeof item === 'object' && item !== null ? sanitizeForFirestore(item) : item)) as any;
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = typeof value === 'object' && value !== null ? sanitizeForFirestore(value) : value;
      }
    }
    return clean as T;
  }
  return obj;
}

const LEGACY_MOCK_POST_IDS = new Set([
  'post-sipaer',
  'post-linha-base',
  'post-fab-experiencia',
  'post-cht-anac',
  'post-sobre-fab',
  'post-motores-frio',
  'post-check-diario',
  'post-certificacoes-tecnico'
]);

const isLegacyMockPost = (p: Post | { id?: string }): boolean => {
  if (!p || !p.id) return false;
  return LEGACY_MOCK_POST_IDS.has(p.id);
};

const LEGACY_MOCK_COMMENT_IDS = new Set([
  'comm-1',
  'comm-2',
  'comm-3',
  'comm-4',
  'comm-5',
  'comm-6',
  'comment-seed-1',
  'comment-seed-2',
  'comment-seed-3'
]);

const isLegacyMockComment = (c: Comment | { id?: string }): boolean => {
  if (!c || !c.id) return false;
  return LEGACY_MOCK_COMMENT_IDS.has(c.id);
};

const DEFAULT_RATINGS: Record<string, Record<string, number>> = {};

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Helper to parse route from browser URL
  const parseLocationRoute = (): { view: AppView; postSlug?: string; categorySlug?: CategorySlug } => {
    try {
      const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
      const hash = window.location.hash.replace(/^#\/?/, '');
      const searchParams = new URLSearchParams(window.location.search);

      // 1. Check query parameters first (?post=..., ?artigo=..., ?p=..., ?category=..., ?categoria=..., ?view=...)
      const queryPost = searchParams.get('post') || searchParams.get('artigo') || searchParams.get('p') || searchParams.get('slug');
      if (queryPost) {
        return { view: 'post', postSlug: decodeURIComponent(queryPost) };
      }

      const queryCat = searchParams.get('categoria') || searchParams.get('category');
      if (queryCat) {
        return { view: 'category', categorySlug: queryCat as CategorySlug };
      }

      const queryView = searchParams.get('view') as AppView;
      if (queryView) {
        return { view: queryView };
      }

      // 2. Check pathname (for direct URLs like /post/slug, /artigo/slug, /categoria/manutencao)
      if (pathname.startsWith('/post/')) {
        const slug = pathname.replace('/post/', '');
        if (slug) return { view: 'post', postSlug: decodeURIComponent(slug) };
      }
      if (pathname.startsWith('/artigo/')) {
        const slug = pathname.replace('/artigo/', '');
        if (slug) return { view: 'post', postSlug: decodeURIComponent(slug) };
      }
      if (pathname.startsWith('/categoria/')) {
        const cat = pathname.replace('/categoria/', '') as CategorySlug;
        if (cat) return { view: 'category', categorySlug: cat };
      }
      if (pathname === '/blog') return { view: 'blog' };
      if (pathname === '/sobre') return { view: 'about' };
      if (pathname === '/contato') return { view: 'contact' };
      if (pathname === '/favoritos') return { view: 'bookmarks' };
      if (pathname === '/login') return { view: 'login' };
      if (pathname === '/perfil') return { view: 'profile' };
      if (pathname === '/admin') return { view: 'admin' };
      if (pathname === '/privacidade') return { view: 'privacy' };
      if (pathname === '/termos') return { view: 'terms' };

      // 3. Support hash-based routing (#post/slug or #/post/slug or #category/manutencao) as fallback
      const cleanHash = hash.replace(/^\//, '');
      if (cleanHash.startsWith('post/')) {
        const slug = cleanHash.replace('post/', '');
        if (slug) return { view: 'post', postSlug: decodeURIComponent(slug) };
      }
      if (cleanHash.startsWith('artigo/')) {
        const slug = cleanHash.replace('artigo/', '');
        if (slug) return { view: 'post', postSlug: decodeURIComponent(slug) };
      }
      if (cleanHash.startsWith('categoria/')) {
        const cat = cleanHash.replace('categoria/', '') as CategorySlug;
        if (cat) return { view: 'category', categorySlug: cat };
      }
      if (cleanHash === 'blog') return { view: 'blog' };
      if (cleanHash === 'sobre') return { view: 'about' };
      if (cleanHash === 'contato') return { view: 'contact' };
      if (cleanHash === 'favoritos') return { view: 'bookmarks' };
      if (cleanHash === 'login') return { view: 'login' };
      if (cleanHash === 'perfil') return { view: 'profile' };
      if (cleanHash === 'admin') return { view: 'admin' };
      if (cleanHash === 'privacidade') return { view: 'privacy' };
      if (cleanHash === 'termos') return { view: 'terms' };

      return { view: 'home' };
    } catch {
      return { view: 'home' };
    }
  };

  const initialRoute = parseLocationRoute();

  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>(initialRoute.view);
  const [selectedPostSlug, setSelectedPostSlug] = useState<string | null>(initialRoute.postSlug || null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<CategorySlug | null>(initialRoute.categorySlug || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  // Handle browser forward/back buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseLocationRoute();
      setCurrentView(route.view);
      setSelectedPostSlug(route.postSlug || null);
      setSelectedCategorySlug(route.categorySlug || null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Reader Preferences & Bookmarks
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = safeGetItem(STORAGE_KEY_THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [fontSize, setFontSizeState] = useState<FontSizeScale>(() => {
    try {
      const saved = safeGetItem(STORAGE_KEY_FONT_SIZE);
      if (saved === 'sm' || saved === 'md' || saved === 'lg' || saved === 'xl') return saved;
      return 'md';
    } catch {
      return 'md';
    }
  });

  // Helper function to get user-scoped storage key
  const getUserBookmarksKey = (userId?: string) => {
    return userId ? `${STORAGE_KEY_BOOKMARKS}_${userId}` : `${STORAGE_KEY_BOOKMARKS}_guest`;
  };

  const getUserLikesKey = (userId?: string) => {
    return userId ? `${STORAGE_KEY_LIKES}_${userId}` : `${STORAGE_KEY_LIKES}_guest`;
  };

  const getUserCommentLikesKey = (userId?: string) => {
    return userId ? `${STORAGE_KEY_COMMENT_LIKES}_${userId}` : `${STORAGE_KEY_COMMENT_LIKES}_guest`;
  };

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const key = getUserBookmarksKey(user?.id);
    return safeGetJSON<string[]>(key, []);
  });

  const [likedComments, setLikedComments] = useState<string[]>(() => {
    const key = getUserCommentLikesKey(user?.id);
    return safeGetJSON<string[]>(key, []);
  });

  // When active user changes, reload bookmarks and comment likes
  useEffect(() => {
    const bKey = getUserBookmarksKey(user?.id);
    setBookmarks(safeGetJSON<string[]>(bKey, []));

    const cKey = getUserCommentLikesKey(user?.id);
    setLikedComments(safeGetJSON<string[]>(cKey, []));
  }, [user?.id]);

  // Apply dark mode class to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    safeSetItem(STORAGE_KEY_THEME, theme);
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setFontSize = (size: FontSizeScale) => {
    setFontSizeState(size);
    safeSetItem(STORAGE_KEY_FONT_SIZE, size);
  };

  const isBookmarked = (postId: string): boolean => {
    return bookmarks.includes(postId);
  };

  const toggleBookmark = (postId: string) => {
    setBookmarks(prev => {
      const isSaved = prev.includes(postId);
      const next = isSaved ? prev.filter(id => id !== postId) : [...prev, postId];
      const key = getUserBookmarksKey(user?.id);
      safeSetJSON(key, next);
      return next;
    });
  };

  // Data States
  const [posts, setPosts] = useState<Post[]>(() => {
    const raw = safeGetJSON<Post[]>(STORAGE_KEY_POSTS, []);
    return Array.isArray(raw)
      ? raw
          .filter(p => !isLegacyMockPost(p))
          .map(p => {
            const isGuest = p.author?.name && !p.author.name.toLowerCase().includes('alexandre');
            return {
              ...p,
              author: {
                name: isGuest ? p.author!.name : 'Alexandre Andrade',
                role: p.author?.role || 'Especialista em Manutenção & Investigador SIPAER',
                avatar: isGuest && p.author?.avatar && !p.author.avatar.includes('dicebear') && !p.author.avatar.includes('googleusercontent')
                  ? p.author.avatar
                  : '/author.webp'
              }
            };
          })
      : [];
  });
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(() => {
    const raw = safeGetJSON<Post[]>(STORAGE_KEY_POSTS, []);
    return !Array.isArray(raw) || raw.length === 0;
  });

  const [categories, setCategories] = useState<CategoryInfo[]>(() => {
    return safeGetJSON<CategoryInfo[]>(STORAGE_KEY_CATEGORIES, INITIAL_CATEGORIES);
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const raw = safeGetJSON<Comment[]>(STORAGE_KEY_COMMENTS, []);
    return Array.isArray(raw) ? raw.filter(c => !isLegacyMockComment(c)) : [];
  });

  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>(() => {
    return safeGetJSON<Record<string, Record<string, number>>>(STORAGE_KEY_RATINGS, {});
  });

  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>(() => {
    return safeGetJSON<NewsletterSubscriber[]>(STORAGE_KEY_SUBS, []);
  });

  const [briefingCampaigns, setBriefingCampaigns] = useState<BriefingCampaign[]>(() => {
    return safeGetJSON<BriefingCampaign[]>(STORAGE_KEY_BRIEFINGS, []);
  });

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() => {
    return safeGetJSON<ContactMessage[]>(STORAGE_KEY_CONTACTS, []);
  });

  const [adConfig, setAdConfig] = useState<AdBannerConfig>(() => {
    return safeGetJSON<AdBannerConfig>(STORAGE_KEY_ADS, {
      enabled: true,
      showInHeader: true,
      showInSidebar: true,
      showInContent: true,
      showInFooter: true,
      clientSlotId: 'ca-pub-6609396265350793'
    });
  });

  const [radarConfig, setRadarConfig] = useState<TechnicalRadarConfig>(() => {
    return safeGetJSON<TechnicalRadarConfig>(STORAGE_KEY_RADAR, INITIAL_RADAR_CONFIG);
  });

  const [aboutData, setAboutData] = useState<AboutPageData>(() => {
    return safeGetJSON<AboutPageData>(STORAGE_KEY_ABOUT, INITIAL_ABOUT_PAGE_DATA);
  });

  const [contactInfo, setContactInfo] = useState<ContactInfoData>(() => {
    return safeGetJSON<ContactInfoData>(STORAGE_KEY_CONTACT_INFO, INITIAL_CONTACT_INFO);
  });

  const [aiAgents, setAiAgents] = useState<AIAgentPersona[]>(() => {
    return safeGetJSON<AIAgentPersona[]>(STORAGE_KEY_AI_AGENTS, DEFAULT_AI_AGENTS);
  });

  const [aiModerationConfig, setAiModerationConfig] = useState<AIModerationConfig>(() => {
    return safeGetJSON<AIModerationConfig>(STORAGE_KEY_AI_CONFIG, INITIAL_AI_MODERATION_CONFIG);
  });

  // 1. Sync Posts from Firestore (with automatic purge of legacy mock posts)
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'posts'),
        snapshot => {
          if (!snapshot.empty) {
            const mapById = new Map<string, Post>();
            snapshot.forEach(docSnap => {
              const data = docSnap.data() as Post;
              const postId = data?.id || docSnap.id;
              if (postId) {
                // If it's a legacy mock post, purge from Firestore
                if (isLegacyMockPost(data) || isLegacyMockPost({ id: docSnap.id }) || isLegacyMockPost({ id: postId })) {
                  deleteDoc(doc(db, 'posts', docSnap.id)).catch(() => {});
                } else {
                  const rawCover = data.coverImage && data.coverImage.trim() ? data.coverImage.trim() : '';
                  const initialCover = rawCover || getAviationFallbackImage(data.category);

                  const isGuestAuthor = data.author?.name && !data.author.name.toLowerCase().includes('alexandre');
                  const authorName = isGuestAuthor ? data.author!.name.trim() : 'Alexandre Andrade';
                  const authorRole = data.author?.role?.trim() || 'Especialista em Manutenção & Investigador SIPAER';
                  const authorAvatar =
                    isGuestAuthor &&
                    data.author?.avatar &&
                    !data.author.avatar.includes('dicebear') &&
                    !data.author.avatar.includes('googleusercontent')
                      ? data.author.avatar.trim()
                      : '/author.webp';

                  mapById.set(postId, {
                    ...data,
                    id: postId,
                    slug: data.slug || postId,
                    title: data.title || 'Artigo sem título',
                    coverImage: initialCover,
                    published: typeof data.published === 'boolean' ? data.published : true,
                    author: {
                      name: authorName,
                      role: authorRole,
                      avatar: authorAvatar
                    }
                  });

                  // If cover is a stored media token (/api/media/... or media:...), prefetch asynchronously from Firestore
                  if (rawCover && (rawCover.startsWith('/api/media/') || rawCover.startsWith('media:'))) {
                    getMediaDataUrl(rawCover).then(dataUrl => {
                      if (dataUrl) {
                        setPosts(currentList =>
                          currentList.map(p => {
                            if (p.id === postId && p.coverImage !== dataUrl) {
                              return { ...p, coverImage: dataUrl };
                            }
                            return p;
                          })
                        );
                      }
                    }).catch(() => {});
                  }
                }
              }
            });

            const list = Array.from(mapById.values());

            // Deterministic sort: newest first, stable tie-break by ID
            list.sort((a, b) => {
              const timeA = getPostTime(a);
              const timeB = getPostTime(b);
              if (timeB !== timeA) return timeB - timeA;
              return a.id.localeCompare(b.id);
            });

            setPosts(list);
            safeSetJSON(STORAGE_KEY_POSTS, list);
            setIsLoadingPosts(false);
          } else {
            setPosts([]);
            safeSetJSON(STORAGE_KEY_POSTS, []);
            setIsLoadingPosts(false);
          }
        },
        err => {
          console.warn('Firestore posts listener note:', err);
          setIsLoadingPosts(false);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Posts listener error:', e);
      setIsLoadingPosts(false);
    }
  }, []);

  // 2. Sync Comments from Firestore (with automatic purge of legacy mock comments)
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'comments'),
        snapshot => {
          const mapById = new Map<string, Comment>();

          if (!snapshot.empty) {
            snapshot.forEach(docSnap => {
              const data = docSnap.data() as Comment;
              const commentId = data?.id || docSnap.id;
              if (commentId) {
                // If legacy mock comment, delete from Firestore
                if (isLegacyMockComment({ id: commentId })) {
                  deleteDoc(doc(db, 'comments', docSnap.id)).catch(() => {});
                } else {
                  mapById.set(commentId, {
                    ...data,
                    id: commentId,
                    status: data.status || 'approved',
                    likes: typeof data.likes === 'number' ? data.likes : 0,
                    replies: Array.isArray(data.replies) ? data.replies : []
                  });
                }
              }
            });

            const list = Array.from(mapById.values());

            // Deterministic sort: newest first, stable tie-break by ID
            list.sort((a, b) => {
              const timeA = getCommentTime(a);
              const timeB = getCommentTime(b);
              if (timeB !== timeA) return timeB - timeA;
              return a.id.localeCompare(b.id);
            });

            setComments(list);
            safeSetJSON(STORAGE_KEY_COMMENTS, list);
          } else {
            setComments([]);
            safeSetJSON(STORAGE_KEY_COMMENTS, []);
          }
        },
        err => {
          console.warn('Firestore comments listener note:', err);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Comments listener error:', e);
    }
  }, []);

  // 3. Sync Ratings from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'ratings'),
        snapshot => {
          if (!snapshot.empty) {
            const newRatings: Record<string, Record<string, number>> = {};
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              if (!LEGACY_MOCK_POST_IDS.has(docSnap.id)) {
                newRatings[docSnap.id] = data.ratings || {};
              } else {
                deleteDoc(doc(db, 'ratings', docSnap.id)).catch(() => {});
              }
            });
            setRatings(newRatings);
            safeSetJSON(STORAGE_KEY_RATINGS, newRatings);
          } else {
            setRatings({});
            safeSetJSON(STORAGE_KEY_RATINGS, {});
          }
        },
        err => console.warn('Firestore ratings listener note:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('Ratings listener error:', e);
    }
  }, []);

  // 4. Sync Newsletter Subscribers
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'newsletter'),
        snapshot => {
          if (!snapshot.empty) {
            const list: NewsletterSubscriber[] = [];
            snapshot.forEach(docSnap => {
              list.push(docSnap.data() as NewsletterSubscriber);
            });
            setNewsletterSubscribers(list);
            safeSetJSON(STORAGE_KEY_SUBS, list);
          }
        },
        err => console.warn('Newsletter listener note:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('Newsletter listener error:', e);
    }
  }, []);

  // 5. Sync Contacts
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'contacts'),
        snapshot => {
          if (!snapshot.empty) {
            const list: ContactMessage[] = [];
            snapshot.forEach(docSnap => {
              list.push(docSnap.data() as ContactMessage);
            });
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setContactMessages(list);
            safeSetJSON(STORAGE_KEY_CONTACTS, list);
          }
        },
        err => console.warn('Contacts listener note:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('Contacts listener error:', e);
    }
  }, []);

  // 5b. Sync Briefings & Campaigns
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'briefings'),
        snapshot => {
          if (!snapshot.empty) {
            const list: BriefingCampaign[] = [];
            snapshot.forEach(docSnap => {
              list.push(docSnap.data() as BriefingCampaign);
            });
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setBriefingCampaigns(list);
            safeSetJSON(STORAGE_KEY_BRIEFINGS, list);
          }
        },
        err => console.warn('Briefings listener note:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('Briefings listener error:', e);
    }
  }, []);

  // 5b2. Automation Runner: Scheduled Posts & Scheduled Briefings Dispatcher
  useEffect(() => {
    const checkSchedules = async () => {
      const now = new Date();
      const nowTime = now.getTime();

      // 1) Auto-publish scheduled posts whose time has arrived
      const duePosts = posts.filter(p => {
        if (p.published) return false;
        if (!p.scheduledAt) return false;
        const schedTime = new Date(p.scheduledAt).getTime();
        return !isNaN(schedTime) && schedTime <= nowTime;
      });

      for (const duePost of duePosts) {
        try {
          const updatedPost: Post = {
            ...duePost,
            published: true,
            updatedAt: now.toISOString()
          };

          setPosts(prev => {
            const next = prev.map(p => (p.id === duePost.id ? updatedPost : p));
            safeSetJSON(STORAGE_KEY_POSTS, next);
            return next;
          });

          await setDoc(doc(db, 'posts', duePost.id), { published: true, updatedAt: now.toISOString() }, { merge: true });

          // If author flagged to notify newsletter subscribers upon publication
          if (duePost.notifyNewsletterOnPublish && newsletterSubscribers.length > 0) {
            const autoBriefingHtml = generateBriefingHtml({
              subject: `Novo Artigo Publicado: ${duePost.title}`,
              preheader: duePost.excerpt || duePost.subtitle || 'Nova análise técnica disponível no portal.',
              editorGreeting: 'Prezados aviadores e especialistas em manutenção aeronáutica,',
              customMessage: `Acabamos de lançar uma nova publicação técnica de destaque em nosso portal: **${duePost.title}**.\n\nConfira os detalhes operacionais, referências regulatórias e procedimentos práticos no link abaixo.`,
              posts: [updatedPost],
              appUrl: window.location.origin || 'https://aaaviation.com.br',
              editionNumber: `Lançamento Técnico Especial`
            });

            fetch('/api/briefing/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipients: newsletterSubscribers.map(s => ({ email: s.email, id: s.id })),
                subject: `[Novo Artigo] ${duePost.title}`,
                htmlContent: autoBriefingHtml,
                testMode: false
              })
            }).catch(err => console.warn('Auto newsletter notify error:', err));
          }
        } catch (e) {
          console.warn('Error auto-publishing scheduled post:', e);
        }
      }

      // 2) Auto-dispatch scheduled newsletter campaigns
      const dueCampaigns = briefingCampaigns.filter(c => {
        if (c.status !== 'scheduled') return false;
        if (!c.scheduledFor) return false;
        const schedTime = new Date(c.scheduledFor).getTime();
        return !isNaN(schedTime) && schedTime <= nowTime;
      });

      for (const campaign of dueCampaigns) {
        try {
          // Mark status as sending
          await setDoc(doc(db, 'briefings', campaign.id), { status: 'sending' }, { merge: true });

          const featuredPostsList = posts.filter(p => campaign.featuredPostIds?.includes(p.id));
          const campaignHtml = generateBriefingHtml({
            subject: campaign.subject,
            preheader: campaign.preheader,
            editorGreeting: campaign.editorGreeting,
            customMessage: campaign.customMessage,
            posts: featuredPostsList,
            appUrl: window.location.origin || 'https://aaaviation.com.br',
            editionNumber: campaign.editionNumber || 'Edição Semanal',
            dateStr: campaign.dateStr
          });

          const resp = await fetch('/api/briefing/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipients: newsletterSubscribers.map(s => ({ email: s.email, id: s.id })),
              subject: campaign.subject,
              htmlContent: campaignHtml,
              testMode: false
            })
          });

          const data = await resp.json();
          const finalStatus: BriefingCampaign = {
            ...campaign,
            status: data.success ? 'sent' : 'failed',
            sentAt: new Date().toISOString(),
            successCount: data.successCount || 0,
            errorLog: data.errors ? data.errors.join('\n') : undefined
          };

          setBriefingCampaigns(prev => prev.map(c => (c.id === campaign.id ? finalStatus : c)));
          await setDoc(doc(db, 'briefings', campaign.id), finalStatus, { merge: true });
        } catch (err) {
          console.warn('Error auto-dispatching scheduled briefing campaign:', err);
          await setDoc(doc(db, 'briefings', campaign.id), { status: 'failed', errorLog: String(err) }, { merge: true });
        }
      }
    };

    // Run immediately and every 30 seconds
    checkSchedules();
    const interval = setInterval(checkSchedules, 30000);
    return () => clearInterval(interval);
  }, [posts, briefingCampaigns, newsletterSubscribers]);

  // 5b. Delayed AI Auto-Reply Processor (2min queue)
  useEffect(() => {
    if (!aiModerationConfig.enabled || aiModerationConfig.autoReplyMode !== 'auto_delay_2min') {
      return;
    }

    const processScheduledAIReplies = async () => {
      const now = new Date().toISOString();
      const scheduledComments = comments.filter(
        c => c.aiAutoReplyScheduledAt && c.aiAutoReplyScheduledAt <= now && (!c.replies || !c.replies.some(r => r.isAIReply))
      );

      for (const comm of scheduledComments) {
        try {
          await generateAIReplyForComment(comm.id);
        } catch (e) {
          console.warn('Delayed AI reply error for comment:', comm.id, e);
        }
      }
    };

    const interval = setInterval(processScheduledAIReplies, 15000);
    processScheduledAIReplies();
    return () => clearInterval(interval);
  }, [comments, aiModerationConfig, aiAgents]);

  // 5c. Sync In-App Notifications for Current User
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.id)
      );

      const unsub = onSnapshot(
        q,
        snapshot => {
          const list: UserNotification[] = [];
          snapshot.forEach(docSnap => {
            list.push({ ...docSnap.data() as UserNotification, id: docSnap.id });
          });
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setNotifications(list);
        },
        err => console.warn('Notifications listener note:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('Notifications listener error:', e);
    }
  }, [user?.id]);

  // 6. Sync Ads Config & Global Settings
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'settings', 'ads_config'),
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as AdBannerConfig;
            if (data && typeof data.enabled === 'boolean') {
              setAdConfig(data);
              safeSetJSON(STORAGE_KEY_ADS, data);
            }
          } else {
            // Seed initial ads config only if missing
            const initialConfig: AdBannerConfig = {
              enabled: true,
              showInHeader: true,
              showInSidebar: true,
              showInContent: true,
              showInFooter: true,
              clientSlotId: 'ca-pub-6609396265350793'
            };
            setDoc(doc(db, 'settings', 'ads_config'), initialConfig).catch(() => {});
          }
        },
        err => console.warn('Ads config listener note:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('Ads config listener error:', e);
    }
  }, []);

  // 6.5. Sync Radar Técnico Config from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'settings', 'radar_config'),
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as TechnicalRadarConfig;
            if (data && typeof data.enabled === 'boolean') {
              setRadarConfig(data);
              safeSetJSON(STORAGE_KEY_RADAR, data);
            }
          } else {
            setDoc(doc(db, 'settings', 'radar_config'), INITIAL_RADAR_CONFIG).catch(() => {});
          }
        },
        err => console.warn('Radar config listener note:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('Radar config listener error:', e);
    }
  }, []);

  // 7. Sync About Page Data from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'settings', 'about_page'),
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as AboutPageData;
            if (data && data.authorName) {
              setAboutData(data);
              safeSetJSON(STORAGE_KEY_ABOUT, data);
            }
          } else {
            // Seed initial about page data if missing
            setDoc(doc(db, 'settings', 'about_page'), INITIAL_ABOUT_PAGE_DATA).catch(() => {});
          }
        },
        err => console.warn('About page listener note:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('About page listener error:', e);
    }
  }, []);

  // 7.5. Sync Contact Info from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'settings', 'contact_info'),
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as ContactInfoData;
            if (data && (data.email || data.phoneWhatsapp || data.linkedinUrl)) {
              setContactInfo(data);
              safeSetJSON(STORAGE_KEY_CONTACT_INFO, data);
            }
          } else {
            // Seed initial contact info if missing
            setDoc(doc(db, 'settings', 'contact_info'), INITIAL_CONTACT_INFO).catch(() => {});
          }
        },
        err => console.warn('Contact info listener note:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('Contact info listener error:', e);
    }
  }, []);

  // 7.6. Sync AI Moderation Config & Personas from Firestore and Server Disk Backup
  useEffect(() => {
    // Secondary Server Disk Sync (prevents data loss if localStorage is cleared or on new devices)
    fetch('/api/settings/ai-agents')
      .then(res => res.json())
      .then(data => {
        if (data?.success && Array.isArray(data.list) && data.list.length > 0) {
          setAiAgents(prev => {
            const isPrevDefault = JSON.stringify(prev) === JSON.stringify(DEFAULT_AI_AGENTS);
            if (isPrevDefault && data.list.length > 0) {
              safeSetJSON(STORAGE_KEY_AI_AGENTS, data.list);
              return data.list;
            }
            return prev;
          });
        }
      })
      .catch(() => {});

    fetch('/api/settings/ai-config')
      .then(res => res.json())
      .then(data => {
        if (data?.success && data.config) {
          setAiModerationConfig(prev => {
            if (!prev || JSON.stringify(prev) === JSON.stringify(INITIAL_AI_MODERATION_CONFIG)) {
              safeSetJSON(STORAGE_KEY_AI_CONFIG, data.config);
              return data.config;
            }
            return prev;
          });
        }
      })
      .catch(() => {});

    try {
      const unsubConfig = onSnapshot(
        doc(db, 'settings', 'ai_moderation_config'),
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as AIModerationConfig;
            if (data && typeof data.enabled === 'boolean') {
              setAiModerationConfig(data);
              safeSetJSON(STORAGE_KEY_AI_CONFIG, data);
              // Also backup to disk
              fetch('/api/settings/ai-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              }).catch(() => {});
            }
          } else {
            const currentSavedConfig = safeGetJSON<AIModerationConfig>(STORAGE_KEY_AI_CONFIG, INITIAL_AI_MODERATION_CONFIG);
            setDoc(doc(db, 'settings', 'ai_moderation_config'), currentSavedConfig).catch(() => {});
          }
        },
        err => console.warn('AI moderation config listener note:', err)
      );

      const unsubAgents = onSnapshot(
        doc(db, 'settings', 'ai_agents'),
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && Array.isArray(data.list) && data.list.length > 0) {
              setAiAgents(data.list);
              safeSetJSON(STORAGE_KEY_AI_AGENTS, data.list);
              // Also backup to disk
              fetch('/api/settings/ai-agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ list: data.list })
              }).catch(() => {});
            }
          } else {
            // Seed Firestore with the user's current saved agents instead of resetting to defaults!
            const currentSavedAgents = safeGetJSON<AIAgentPersona[]>(STORAGE_KEY_AI_AGENTS, DEFAULT_AI_AGENTS);
            setDoc(doc(db, 'settings', 'ai_agents'), { list: currentSavedAgents }).catch(() => {});
          }
        },
        err => console.warn('AI agents listener note:', err)
      );

      return () => {
        unsubConfig();
        unsubAgents();
      };
    } catch (e) {
      console.warn('AI config/agents listener error:', e);
    }
  }, []);

  // 8. Sync Categories from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'categories'),
        snapshot => {
          if (!snapshot.empty) {
            const mapById = new Map<string, CategoryInfo>();
            // Keep default initial categories as baseline so defaults aren't wiped
            INITIAL_CATEGORIES.forEach(ic => mapById.set(ic.id, ic));
            snapshot.forEach(docSnap => {
              const data = docSnap.data() as CategoryInfo;
              const catId = data?.id || docSnap.id;
              if (catId) {
                mapById.set(catId, { ...data, id: catId });
              }
            });
            const list = Array.from(mapById.values());
            setCategories(list);
            safeSetJSON(STORAGE_KEY_CATEGORIES, list);
          } else {
            // Seed initial categories with their emojis into Firestore
            try {
              const batch = writeBatch(db);
              INITIAL_CATEGORIES.forEach(c => {
                const ref = doc(db, 'categories', c.id);
                batch.set(ref, c);
              });
              batch.commit().catch(err => console.warn('Categories seeding note:', err));
            } catch (e) {
              console.warn('Categories batch seeding note:', e);
            }
          }
        },
        err => console.warn('Categories listener note:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('Categories listener error:', e);
    }
  }, []);

  // Sync to storage safely
  useEffect(() => {
    safeSetJSON(STORAGE_KEY_POSTS, posts);
  }, [posts]);

  useEffect(() => {
    safeSetJSON(STORAGE_KEY_CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    safeSetJSON(STORAGE_KEY_COMMENTS, comments);
  }, [comments]);

  useEffect(() => {
    safeSetJSON(STORAGE_KEY_SUBS, newsletterSubscribers);
  }, [newsletterSubscribers]);

  useEffect(() => {
    safeSetJSON(STORAGE_KEY_CONTACTS, contactMessages);
  }, [contactMessages]);

  useEffect(() => {
    safeSetJSON(STORAGE_KEY_ADS, adConfig);
  }, [adConfig]);

  useEffect(() => {
    safeSetJSON(STORAGE_KEY_ABOUT, aboutData);
  }, [aboutData]);

  useEffect(() => {
    safeSetJSON(STORAGE_KEY_RATINGS, ratings);
  }, [ratings]);

  // Derived category counts
  const categoriesWithCounts = categories.map(cat => {
    const count = posts.filter(p => postMatchesCategory(p.category, cat.slug, categories) && p.published).length;
    return { ...cat, count };
  });

  const getCategoryName = (slugOrName: string | undefined | null): string => {
    return resolveCategoryName(slugOrName, categories);
  };

  const getCategoryVisualNode = (slugOrName: string | undefined | null, className?: string): React.ReactNode => {
    return getCategoryVisual(slugOrName, categories, className);
  };

  const postMatchesCategoryFilter = (postCategory: string | undefined | null, selectedCategory: string | undefined | null): boolean => {
    return postMatchesCategory(postCategory, selectedCategory, categories);
  };

  const activePost = posts.find(p => p.slug === selectedPostSlug) || null;

  const navigate = (view: AppView, options?: NavigationOptions) => {
    setCurrentView(view);
    if (options?.postSlug) setSelectedPostSlug(options.postSlug);
    if (options?.categorySlug) setSelectedCategorySlug(options.categorySlug);
    if (options?.search !== undefined) setSearchQuery(options.search);
    if (options?.sort !== undefined) setSortOption(options.sort);

    // Update browser URL bar so sharing, bookmarks and reload link directly to the specific page/post
    try {
      let targetPath = '/';
      if (view === 'post' && options?.postSlug) {
        targetPath = `/post/${options.postSlug}`;
      } else if (view === 'category' && options?.categorySlug) {
        targetPath = `/categoria/${options.categorySlug}`;
      } else if (view === 'blog') {
        targetPath = '/blog';
      } else if (view === 'about') {
        targetPath = '/sobre';
      } else if (view === 'contact') {
        targetPath = '/contato';
      } else if (view === 'bookmarks') {
        targetPath = '/favoritos';
      } else if (view === 'login') {
        targetPath = '/login';
      } else if (view === 'profile') {
        targetPath = '/perfil';
      } else if (view === 'admin') {
        targetPath = '/admin';
      }

      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view, ...options }, '', targetPath);
      }
    } catch {
      // Ignore in environments where pushState is restricted
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createPost = async (newPostData: Omit<Post, 'id' | 'viewsCount' | 'likesCount'>): Promise<string> => {
    const id = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const slug =
      newPostData.slug ||
      newPostData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    // Synchronize and persist all media (cover image and content figures) to Firestore Cloud
    let sanitizedContent = newPostData.content || '';
    let resolvedCover = newPostData.coverImage || '';
    try {
      const mediaResult = await persistPostMedia(
        newPostData.content || '',
        newPostData.coverImage || '',
        newPostData.title
      );
      sanitizedContent = mediaResult.sanitizedContent;
      resolvedCover = mediaResult.resolvedCover;
    } catch (mediaErr) {
      console.warn('persistPostMedia warning during createPost:', mediaErr);
    }

    const newPost: Post = {
      ...newPostData,
      content: sanitizedContent,
      coverImage: resolvedCover || newPostData.coverImage || 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
      id,
      slug: slug || id,
      viewsCount: 1,
      likesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Deeply clean any undefined values so Firestore never throws unsupported field error
    const cleanPost = sanitizeForFirestore(newPost);

    // 1. Immediately update in-memory state & local storage cache
    setPosts(prev => {
      let next: Post[];
      if (cleanPost.featured) {
        next = [cleanPost, ...prev.map(p => ({ ...p, featured: false }))];
      } else {
        next = [cleanPost, ...prev];
      }
      safeSetJSON(STORAGE_KEY_POSTS, next);
      return next;
    });

    // 2. Persist to Firestore
    try {
      if (cleanPost.featured) {
        const batch = writeBatch(db);
        batch.set(doc(db, 'posts', id), cleanPost);
        posts.forEach(p => {
          if (p.featured && p.id !== id) {
            batch.update(doc(db, 'posts', p.id), { featured: false });
          }
        });
        await batch.commit();
      } else {
        await setDoc(doc(db, 'posts', id), cleanPost);
      }
    } catch (e) {
      console.error('Firestore createPost error:', e);
      throw e;
    }

    return id;
  };

  const updatePost = async (id: string, updates: Partial<Post>) => {
    const sanitizedUpdates = { ...updates };
    
    // If content or coverImage are updated, synchronize and persist all media to Firestore Cloud
    if (sanitizedUpdates.content !== undefined || sanitizedUpdates.coverImage !== undefined) {
      try {
        const existing = posts.find(p => p.id === id);
        const contentToSync = sanitizedUpdates.content !== undefined ? sanitizedUpdates.content : (existing?.content || '');
        const coverToSync = sanitizedUpdates.coverImage !== undefined ? sanitizedUpdates.coverImage : (existing?.coverImage || '');
        const titleToSync = sanitizedUpdates.title || existing?.title || 'Artigo';

        const { sanitizedContent, resolvedCover } = await persistPostMedia(
          contentToSync,
          coverToSync,
          titleToSync
        );

        if (sanitizedUpdates.content !== undefined) {
          sanitizedUpdates.content = sanitizedContent;
        }
        if (sanitizedUpdates.coverImage !== undefined) {
          sanitizedUpdates.coverImage = resolvedCover;
        }
      } catch (mediaErr) {
        console.warn('persistPostMedia warning during updatePost:', mediaErr);
      }
    }

    const updatedFields = { ...sanitizedUpdates, updatedAt: new Date().toISOString() };
    const cleanUpdates = sanitizeForFirestore(updatedFields);
    
    setPosts(prev => {
      const next = prev.map(p => {
        if (p.id === id) {
          return { ...p, ...cleanUpdates };
        }
        if (updates.featured === true) {
          return { ...p, featured: false };
        }
        return p;
      });
      safeSetJSON(STORAGE_KEY_POSTS, next);
      return next;
    });

    try {
      if (updates.featured === true) {
        const batch = writeBatch(db);
        batch.set(doc(db, 'posts', id), cleanUpdates, { merge: true });
        posts.forEach(p => {
          if (p.id !== id && p.featured) {
            batch.update(doc(db, 'posts', p.id), { featured: false });
          }
        });
        await batch.commit();
      } else {
        await setDoc(doc(db, 'posts', id), cleanUpdates, { merge: true });
      }
    } catch (e) {
      console.error('Firestore updatePost error:', e);
      throw e;
    }
  };

  const setFeaturedPost = async (id: string) => {
    setPosts(prev =>
      prev.map(p => ({
        ...p,
        featured: p.id === id
      }))
    );

    try {
      const batch = writeBatch(db);
      posts.forEach(p => {
        batch.update(doc(db, 'posts', p.id), {
          featured: p.id === id,
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();
    } catch (e) {
      console.warn('Firestore setFeaturedPost note:', e);
      try {
        await updateDoc(doc(db, 'posts', id), { featured: true });
      } catch (err) {
        console.warn('Firestore setFeaturedPost single fallback note:', err);
      }
    }
  };

  const deletePost = async (id: string) => {
    // 1. Remove from local state immediately
    setPosts(prev => prev.filter(p => p.id !== id && p.slug !== id));
    setComments(prev => prev.filter(c => c.postId !== id));

    // 2. Remove primary document from Firestore
    try {
      await deleteDoc(doc(db, 'posts', id));
    } catch (e) {
      console.warn('Firestore primary deletePost note:', e);
    }

    // 3. Delete any document with matching id or slug
    try {
      const postsRef = collection(db, 'posts');
      const qSnap = await getDocs(query(postsRef, where('id', '==', id)));
      qSnap.forEach(d => {
        if (d.id !== id) {
          deleteDoc(doc(db, 'posts', d.id)).catch(() => {});
        }
      });
    } catch (qErr) {
      // Ignored
    }

    // 4. Delete associated ratings doc
    try {
      await deleteDoc(doc(db, 'ratings', id));
    } catch (rErr) {}

    // 5. Update local cache
    try {
      const cached = safeGetJSON<Post[]>(STORAGE_KEY_POSTS, []);
      const filtered = cached.filter(p => p.id !== id && p.slug !== id);
      safeSetJSON(STORAGE_KEY_POSTS, filtered);
    } catch (cErr) {}

    if (selectedPostSlug && activePost?.id === id) {
      navigate('blog');
    }
  };

  const togglePublishPost = async (id: string) => {
    const target = posts.find(p => p.id === id);
    if (!target) return;
    const newStatus = !target.published;

    setPosts(prev => prev.map(p => (p.id === id ? { ...p, published: newStatus } : p)));

    try {
      await updateDoc(doc(db, 'posts', id), { published: newStatus });
    } catch (e) {
      console.warn('Firestore togglePublishPost note:', e);
    }
  };

  const incrementViews = async (postId: string) => {
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, viewsCount: (p.viewsCount || 0) + 1 } : p))
    );

    try {
      const target = posts.find(p => p.id === postId);
      if (target) {
        await updateDoc(doc(db, 'posts', postId), { viewsCount: (target.viewsCount || 0) + 1 });
      }
    } catch (e) {
      console.warn('Increment views note:', e);
    }
  };

  const [likedPosts, setLikedPosts] = useState<string[]>(() => {
    const key = getUserLikesKey(user?.id);
    return safeGetJSON<string[]>(key, []);
  });

  // When active user changes, reload likedPosts
  useEffect(() => {
    const key = getUserLikesKey(user?.id);
    setLikedPosts(safeGetJSON<string[]>(key, []));
  }, [user?.id]);

  const isPostLiked = (postId: string): boolean => {
    return likedPosts.includes(postId);
  };

  const toggleLikePost = async (postId: string) => {
    const isLiked = likedPosts.includes(postId);
    const nextLiked = !isLiked;

    const updatedLikedPosts = nextLiked
      ? [...likedPosts, postId]
      : likedPosts.filter(id => id !== postId);

    setLikedPosts(updatedLikedPosts);
    const key = getUserLikesKey(user?.id);
    safeSetJSON(key, updatedLikedPosts);

    const target = posts.find(p => p.id === postId);
    const currentCount = target?.likesCount || 0;
    const newLikes = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    setPosts(prev => prev.map(p => (p.id === postId ? { ...p, likesCount: newLikes } : p)));

    try {
      await updateDoc(doc(db, 'posts', postId), { likesCount: newLikes });
    } catch (e) {
      console.warn('Toggle like post note:', e);
    }
  };

  const ratePost = async (postId: string, score: number): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Você precisa estar logado para avaliar.' };
    }
    const cleanScore = Math.min(5, Math.max(1, Math.round(score)));

    const currentPostRatings = ratings[postId] ? { ...ratings[postId] } : {};
    currentPostRatings[user.id] = cleanScore;

    setRatings(prev => ({
      ...prev,
      [postId]: currentPostRatings
    }));

    try {
      await setDoc(doc(db, 'ratings', postId), {
        postId,
        ratings: currentPostRatings,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore ratePost note:', e);
    }

    return { success: true };
  };

  const getPostRatingInfo = (postId: string): { average: number; count: number; userRating: number | null } => {
    const postRatings = ratings[postId] || {};
    const values = Object.values(postRatings);
    const count = values.length;
    const average = count > 0 ? values.reduce((sum, v) => sum + v, 0) / count : 5.0;
    const userRating = user && postRatings[user.id] ? postRatings[user.id] : null;

    return {
      average: Number(average.toFixed(1)),
      count,
      userRating
    };
  };

  const addComment = async (postId: string, content: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Você precisa estar logado para comentar.' };
    }
    if (!content.trim()) {
      return { success: false, error: 'O comentário não pode estar vazio.' };
    }

    const targetPost = posts.find(p => p.id === postId || p.slug === postId);
    const canonicalPostId = targetPost?.id || postId;
    const postTitle = targetPost?.title || 'Artigo';

    const willAutoReplyWithDelay = aiModerationConfig.enabled && aiModerationConfig.autoReplyMode === 'auto_delay_2min';
    const scheduledTime = willAutoReplyWithDelay
      ? new Date(Date.now() + (aiModerationConfig.delayMinutes || 2) * 60000).toISOString()
      : undefined;

    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      postId: canonicalPostId,
      postTitle,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userTitle: user.title,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      status: 'approved',
      likes: 0,
      replies: [],
      aiAutoReplyScheduledAt: scheduledTime
    };

    setComments(prev => {
      const map = new Map<string, Comment>();
      map.set(newComment.id, newComment);
      prev.forEach(c => map.set(c.id, c));
      const list = Array.from(map.values());
      list.sort((a, b) => {
        const timeA = getCommentTime(a);
        const timeB = getCommentTime(b);
        if (timeB !== timeA) return timeB - timeA;
        return a.id.localeCompare(b.id);
      });
      safeSetJSON(STORAGE_KEY_COMMENTS, list);
      return list;
    });

    try {
      await setDoc(doc(db, 'comments', newComment.id), newComment);

      // If instant reply is enabled, trigger immediately in background
      if (aiModerationConfig.enabled && aiModerationConfig.autoReplyMode === 'auto_instant') {
        setTimeout(() => {
          generateAIReplyForComment(newComment.id).catch(err => {
            console.warn('Auto instant AI reply note:', err);
          });
        }, 1500);
      } else if (aiModerationConfig.enabled && aiModerationConfig.autoReplyMode === 'manual_approval') {
        // Generate suggestion in background for admin review
        setTimeout(() => {
          generateAIReplyForComment(newComment.id).catch(err => {
            console.warn('AI suggestion generation note:', err);
          });
        }, 800);
      }
    } catch (e) {
      console.warn('Firestore addComment note:', e);
    }

    return { success: true };
  };

  const addCommentReply = async (commentId: string, content: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Você precisa estar logado para responder.' };
    }
    if (!content.trim()) {
      return { success: false, error: 'A resposta não pode estar vazia.' };
    }

    const newReply: CommentReply = {
      id: `reply-${Date.now()}`,
      commentId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userTitle: user.title,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: 0
    };

    let updatedComment: Comment | null = null;

    setComments(prev => {
      const next = prev.map(c => {
        if (c.id === commentId) {
          const currentReplies = Array.isArray(c.replies) ? c.replies : [];
          const repliesMap = new Map<string, CommentReply>();
          currentReplies.forEach(r => repliesMap.set(r.id, r));
          repliesMap.set(newReply.id, newReply);
          const updatedReplies = Array.from(repliesMap.values());
          updatedComment = { ...c, replies: updatedReplies };
          return updatedComment;
        }
        return c;
      });
      safeSetJSON(STORAGE_KEY_COMMENTS, next);
      return next;
    });

    try {
      if (updatedComment) {
        await setDoc(doc(db, 'comments', commentId), updatedComment, { merge: true });

        // Notify parent comment author if it's someone else
        const parentComment = comments.find(c => c.id === commentId);
        if (parentComment && parentComment.userId && parentComment.userId !== user.id) {
          const notifId = `notif-${Date.now()}`;
          const targetPost = posts.find(p => p.id === parentComment.postId || p.slug === parentComment.postId);
          const postSlug = targetPost?.slug || parentComment.postId;

          await setDoc(doc(db, 'notifications', notifId), {
            id: notifId,
            userId: parentComment.userId,
            type: 'comment_reply',
            title: 'Nova Resposta ao seu Comentário 💬',
            message: `${user.name} respondeu ao seu comentário no artigo "${parentComment.postTitle || targetPost?.title || 'Artigo'}": "${content.slice(0, 80)}${content.length > 80 ? '...' : ''}"`,
            linkUrl: postSlug,
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn('Firestore addCommentReply note:', e);
    }

    return { success: true };
  };

  const deleteCommentReply = async (commentId: string, replyId: string) => {
    let updatedComment: Comment | null = null;
    setComments(prev => {
      const next = prev.map(c => {
        if (c.id === commentId) {
          const currentReplies = Array.isArray(c.replies) ? c.replies : [];
          const updatedReplies = currentReplies.filter(r => r.id !== replyId);
          updatedComment = { ...c, replies: updatedReplies };
          return updatedComment;
        }
        return c;
      });
      safeSetJSON(STORAGE_KEY_COMMENTS, next);
      return next;
    });

    try {
      if (updatedComment) {
        await setDoc(doc(db, 'comments', commentId), updatedComment, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore deleteCommentReply note:', e);
    }
  };

  const isCommentLiked = (commentId: string): boolean => {
    return likedComments.includes(commentId);
  };

  const isReplyLiked = (commentId: string, replyId: string): boolean => {
    const key = `${commentId}:${replyId}`;
    return likedComments.includes(key);
  };

  const likeCommentReply = async (commentId: string, replyId: string) => {
    const replyKey = `${commentId}:${replyId}`;
    const isLiked = likedComments.includes(replyKey);
    const nextLiked = !isLiked;

    const nextLikedList = nextLiked
      ? [...likedComments, replyKey]
      : likedComments.filter(id => id !== replyKey);

    setLikedComments(nextLikedList);
    const storageKey = getUserCommentLikesKey(user?.id);
    safeSetJSON(storageKey, nextLikedList);

    let updatedComment: Comment | null = null;
    setComments(prev => {
      const next = prev.map(c => {
        if (c.id === commentId) {
          const currentReplies = Array.isArray(c.replies) ? c.replies : [];
          const updatedReplies = currentReplies.map(r => {
            if (r.id === replyId) {
              const currentLikes = r.likes || 0;
              const newLikes = nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
              return { ...r, likes: newLikes };
            }
            return r;
          });
          updatedComment = { ...c, replies: updatedReplies };
          return updatedComment;
        }
        return c;
      });
      safeSetJSON(STORAGE_KEY_COMMENTS, next);
      return next;
    });

    try {
      if (updatedComment) {
        await setDoc(doc(db, 'comments', commentId), updatedComment, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore likeCommentReply note:', e);
    }
  };

  const approveComment = async (commentId: string) => {
    setComments(prev => {
      const next = prev.map(c => (c.id === commentId ? { ...c, status: 'approved' as const } : c));
      safeSetJSON(STORAGE_KEY_COMMENTS, next);
      return next;
    });
    try {
      await updateDoc(doc(db, 'comments', commentId), { status: 'approved' });
    } catch (e) {
      console.warn('Firestore approveComment note:', e);
    }
  };

  const rejectComment = async (commentId: string) => {
    setComments(prev => {
      const next = prev.map(c => (c.id === commentId ? { ...c, status: 'rejected' as const } : c));
      safeSetJSON(STORAGE_KEY_COMMENTS, next);
      return next;
    });
    try {
      await updateDoc(doc(db, 'comments', commentId), { status: 'rejected' });
    } catch (e) {
      console.warn('Firestore rejectComment note:', e);
    }
  };

  const deleteComment = async (commentId: string) => {
    setComments(prev => {
      const next = prev.filter(c => c.id !== commentId);
      safeSetJSON(STORAGE_KEY_COMMENTS, next);
      return next;
    });
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (e) {
      console.warn('Firestore deleteComment note:', e);
    }
  };

  const editMyComment = async (commentId: string, newContent: string) => {
    setComments(prev => {
      const next = prev.map(c => (c.id === commentId ? { ...c, content: newContent.trim() } : c));
      safeSetJSON(STORAGE_KEY_COMMENTS, next);
      return next;
    });
    try {
      await updateDoc(doc(db, 'comments', commentId), { content: newContent.trim() });
    } catch (e) {
      console.warn('Firestore editMyComment note:', e);
    }
  };

  const likeComment = async (commentId: string) => {
    const isLiked = likedComments.includes(commentId);
    const nextLiked = !isLiked;

    const nextLikedList = nextLiked
      ? [...likedComments, commentId]
      : likedComments.filter(id => id !== commentId);

    setLikedComments(nextLikedList);
    const storageKey = getUserCommentLikesKey(user?.id);
    safeSetJSON(storageKey, nextLikedList);

    let updatedLikes = 0;
    setComments(prev => {
      const next = prev.map(c => {
        if (c.id === commentId) {
          const currentLikes = c.likes || 0;
          updatedLikes = nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
          return { ...c, likes: updatedLikes };
        }
        return c;
      });
      safeSetJSON(STORAGE_KEY_COMMENTS, next);
      return next;
    });
    try {
      await updateDoc(doc(db, 'comments', commentId), { likes: updatedLikes });
    } catch (e) {
      console.warn('Firestore likeComment note:', e);
    }
  };

  // AI Moderation & Personas Methods
  const updateAIModerationConfig = async (updates: Partial<AIModerationConfig>) => {
    const next: AIModerationConfig = { ...aiModerationConfig, ...updates, updatedAt: new Date().toISOString() };
    setAiModerationConfig(next);
    safeSetJSON(STORAGE_KEY_AI_CONFIG, next);
    // Sync to disk
    fetch('/api/settings/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    }).catch(() => {});
    try {
      await setDoc(doc(db, 'settings', 'ai_moderation_config'), next, { merge: true });
    } catch (e) {
      console.warn('Firestore updateAIModerationConfig note:', e);
    }
  };

  const saveAIAgent = async (agent: AIAgentPersona) => {
    let updated: AIAgentPersona[] = [];
    const exists = aiAgents.some(a => a.id === agent.id);
    if (exists) {
      updated = aiAgents.map(a => (a.id === agent.id ? agent : a));
    } else {
      updated = [...aiAgents, agent];
    }
    setAiAgents(updated);
    safeSetJSON(STORAGE_KEY_AI_AGENTS, updated);

    // Sync to disk permanently
    fetch('/api/settings/ai-agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list: updated })
    }).catch(() => {});

    try {
      await setDoc(doc(db, 'settings', 'ai_agents'), { list: updated });
    } catch (e) {
      console.warn('Firestore saveAIAgent note:', e);
    }

    // Synchronize past comments/replies authored by this agent
    try {
      let modifiedAnyComment = false;
      const syncedComments = comments.map(c => {
        let changed = false;
        const newReplies = c.replies?.map(r => {
          const isThisAgent = r.userId === `ai-agent-${agent.id}` || r.agentId === agent.id;
          if (isThisAgent) {
            if (r.userName !== agent.name || r.userAvatar !== agent.avatar || r.userTitle !== agent.role || r.agentBadge !== agent.badge) {
              changed = true;
              return {
                ...r,
                userName: agent.name,
                userAvatar: agent.avatar,
                userTitle: agent.role,
                agentBadge: agent.badge
              };
            }
          }
          return r;
        });

        if (changed) {
          modifiedAnyComment = true;
          // Update in Firestore async
          updateDoc(doc(db, 'comments', c.id), { replies: newReplies }).catch(() => {});
          return { ...c, replies: newReplies };
        }
        return c;
      });

      if (modifiedAnyComment) {
        setComments(syncedComments);
        safeSetJSON(STORAGE_KEY_COMMENTS, syncedComments);
      }
    } catch (err) {
      console.warn('Comment persona sync note:', err);
    }
  };

  const deleteAIAgent = async (agentId: string) => {
    const updated = aiAgents.filter(a => a.id !== agentId);
    setAiAgents(updated);
    safeSetJSON(STORAGE_KEY_AI_AGENTS, updated);

    // Sync to disk
    fetch('/api/settings/ai-agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list: updated })
    }).catch(() => {});

    try {
      await setDoc(doc(db, 'settings', 'ai_agents'), { list: updated });
    } catch (e) {
      console.warn('Firestore deleteAIAgent note:', e);
    }
  };

  const resetAIAgentsToDefault = async () => {
    setAiAgents(DEFAULT_AI_AGENTS);
    safeSetJSON(STORAGE_KEY_AI_AGENTS, DEFAULT_AI_AGENTS);
    setAiModerationConfig(INITIAL_AI_MODERATION_CONFIG);
    safeSetJSON(STORAGE_KEY_AI_CONFIG, INITIAL_AI_MODERATION_CONFIG);

    fetch('/api/settings/ai-agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list: DEFAULT_AI_AGENTS })
    }).catch(() => {});

    fetch('/api/settings/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(INITIAL_AI_MODERATION_CONFIG)
    }).catch(() => {});

    try {
      await setDoc(doc(db, 'settings', 'ai_agents'), { list: DEFAULT_AI_AGENTS });
      await setDoc(doc(db, 'settings', 'ai_moderation_config'), INITIAL_AI_MODERATION_CONFIG);
    } catch (e) {
      console.warn('Firestore resetAIAgentsToDefault note:', e);
    }
  };

  const generateAIReplyForComment = async (
    commentId: string,
    specificAgentId?: string
  ): Promise<{ success: boolean; replyText?: string; agent?: AIAgentPersona; error?: string }> => {
    const targetComment = comments.find(c => c.id === commentId);
    if (!targetComment) {
      return { success: false, error: 'Comentário não encontrado.' };
    }

    const targetPost = posts.find(p => p.id === targetComment.postId || p.slug === targetComment.postId);
    const chosenFallbackAgent = aiAgents.find(a => a.id === specificAgentId) || aiAgents[0] || DEFAULT_AI_AGENTS[0];

    try {
      let data: any = null;
      try {
        const res = await fetch('/api/ai/comments/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commentText: targetComment.content,
            commentAuthor: targetComment.userName,
            postTitle: targetPost?.title || targetComment.postTitle || 'Artigo de Aviação',
            postCategory: targetPost?.category || 'Geral',
            postExcerpt: targetPost?.excerpt || '',
            postContent: targetPost?.content || '',
            agents: aiAgents,
            targetAgentId: specificAgentId,
            smartRoute: !specificAgentId && aiModerationConfig.smartRoutingEnabled
          })
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await res.json().catch(() => null);
        }
      } catch (networkErr) {
        console.warn('Backend /api route not reachable, using client-side fallback engine:', networkErr);
      }

      const selectedAgent: AIAgentPersona = (data && data.selectedAgent) ? data.selectedAgent : chosenFallbackAgent;
      const replyText = (data && data.replyText)
        ? data.replyText
        : `Prezado(a) ${targetComment.userName || 'Colega'},\n\nExcelente observação referente ao artigo "${targetPost?.title || targetComment.postTitle || 'técnico'}". A discussão sobre as boas práticas e conformidade na aviação fortalece a segurança de voo e a qualidade técnica dos serviços de hangar.\n\nObrigado por enriquecer o debate com sua participação!`;
      const reasoning = data?.reasoning || `Resposta gerada por ${selectedAgent.name}`;

      // If auto-reply mode is active (instant or delayed 2min auto), publish directly
      if (aiModerationConfig.autoReplyMode === 'auto_delay_2min' || aiModerationConfig.autoReplyMode === 'auto_instant') {
        const newReply: CommentReply = {
          id: `reply-ai-${Date.now()}`,
          commentId,
          userId: `ai-agent-${selectedAgent.id}`,
          userName: selectedAgent.name,
          userAvatar: selectedAgent.avatar,
          userTitle: selectedAgent.role,
          content: replyText,
          createdAt: new Date().toISOString(),
          likes: 0,
          isAIReply: true,
          agentId: selectedAgent.id,
          agentBadge: selectedAgent.badge
        };

        setComments(prev => {
          const next = prev.map(c => {
            if (c.id === commentId) {
              const currentReplies = Array.isArray(c.replies) ? c.replies : [];
              return {
                ...c,
                aiAutoReplyScheduledAt: undefined,
                suggestedAIReply: undefined,
                replies: [...currentReplies, newReply]
              };
            }
            return c;
          });
          safeSetJSON(STORAGE_KEY_COMMENTS, next);
          return next;
        });

        const commentRef = doc(db, 'comments', commentId);
        const currentComment = comments.find(c => c.id === commentId);
        const updatedReplies = [...(currentComment?.replies || []), newReply];
        await updateDoc(commentRef, {
          replies: updatedReplies,
          aiAutoReplyScheduledAt: null,
          suggestedAIReply: null
        });

        // Notify comment author
        if (targetComment.userId && targetComment.userId !== user?.id) {
          const notifId = `notif-${Date.now()}`;
          await setDoc(doc(db, 'notifications', notifId), {
            id: notifId,
            userId: targetComment.userId,
            type: 'comment_reply',
            title: `Resposta de ${selectedAgent.name} 🤖`,
            message: `${selectedAgent.name} (${selectedAgent.badge}) respondeu seu comentário no artigo "${targetPost?.title || targetComment.postTitle}".`,
            linkUrl: targetPost?.slug ? `/post/${targetPost.slug}` : undefined,
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        // In manual approval mode, store as suggestedAIReply for admin dashboard
        const suggested: SuggestedAIReply = {
          id: `sugg-${Date.now()}`,
          commentId,
          agentId: selectedAgent.id,
          agentName: selectedAgent.name,
          agentAvatar: selectedAgent.avatar,
          agentBadge: selectedAgent.badge,
          agentRole: selectedAgent.role,
          text: replyText,
          reasoning,
          generatedAt: new Date().toISOString(),
          status: 'pending'
        };

        setComments(prev => {
          const next = prev.map(c => (c.id === commentId ? { ...c, suggestedAIReply: suggested } : c));
          safeSetJSON(STORAGE_KEY_COMMENTS, next);
          return next;
        });

        await updateDoc(doc(db, 'comments', commentId), {
          suggestedAIReply: suggested
        });
      }

      return { success: true, replyText, agent: selectedAgent };
    } catch (err: any) {
      console.warn('generateAIReplyForComment error:', err);
      return { success: false, error: err?.message || 'Erro ao gerar resposta com IA.' };
    }
  };

  const approveSuggestedAIReply = async (commentId: string) => {
    const targetComment = comments.find(c => c.id === commentId);
    if (!targetComment || !targetComment.suggestedAIReply) return;

    const suggested = targetComment.suggestedAIReply;
    const newReply: CommentReply = {
      id: `reply-ai-${Date.now()}`,
      commentId,
      userId: `ai-agent-${suggested.agentId}`,
      userName: suggested.agentName,
      userAvatar: suggested.agentAvatar,
      userTitle: suggested.agentRole,
      content: suggested.text,
      createdAt: new Date().toISOString(),
      likes: 0,
      isAIReply: true,
      agentId: suggested.agentId,
      agentBadge: suggested.agentBadge
    };

    const targetPost = posts.find(p => p.id === targetComment.postId || p.slug === targetComment.postId);

    setComments(prev => {
      const next = prev.map(c => {
        if (c.id === commentId) {
          const currentReplies = Array.isArray(c.replies) ? c.replies : [];
          return {
            ...c,
            suggestedAIReply: undefined,
            replies: [...currentReplies, newReply]
          };
        }
        return c;
      });
      safeSetJSON(STORAGE_KEY_COMMENTS, next);
      return next;
    });

    try {
      const commentRef = doc(db, 'comments', commentId);
      const updatedReplies = [...(targetComment.replies || []), newReply];
      await updateDoc(commentRef, {
        replies: updatedReplies,
        suggestedAIReply: null
      });

      if (targetComment.userId) {
        const notifId = `notif-${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          userId: targetComment.userId,
          type: 'comment_reply',
          title: `Resposta de ${suggested.agentName} 🤖`,
          message: `${suggested.agentName} (${suggested.agentBadge}) respondeu ao seu comentário.`,
          linkUrl: targetPost?.slug ? `/post/${targetPost.slug}` : undefined,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Firestore approveSuggestedAIReply note:', e);
    }
  };

  const dismissSuggestedAIReply = async (commentId: string) => {
    setComments(prev => {
      const next = prev.map(c => (c.id === commentId ? { ...c, suggestedAIReply: undefined } : c));
      safeSetJSON(STORAGE_KEY_COMMENTS, next);
      return next;
    });

    try {
      await updateDoc(doc(db, 'comments', commentId), {
        suggestedAIReply: null
      });
    } catch (e) {
      console.warn('Firestore dismissSuggestedAIReply note:', e);
    }
  };

  const testGenerateAIReply = async (
    commentText: string,
    targetAgentId?: string,
    postTitle?: string,
    postCategory?: string,
    postContent?: string
  ): Promise<{ success: boolean; replyText?: string; agent?: AIAgentPersona; error?: string }> => {
    const chosenFallbackAgent = aiAgents.find(a => a.id === targetAgentId) || aiAgents[0] || DEFAULT_AI_AGENTS[0];
    const articleTitle = postTitle || 'Inspeção Boroscópica e Fadiga em Motores Aeronáuticos';
    const articleCategory = postCategory || 'Manutenção';

    try {
      let data: any = null;
      try {
        const res = await fetch('/api/ai/comments/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commentText,
            commentAuthor: 'Leitor em Dúvida',
            postTitle: articleTitle,
            postCategory: articleCategory,
            postContent: postContent || '',
            agents: aiAgents,
            targetAgentId,
            smartRoute: !targetAgentId && aiModerationConfig.smartRoutingEnabled
          })
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await res.json().catch(() => null);
        }
      } catch (fetchErr) {
        console.warn('Fetch /api/ai/comments/respond note:', fetchErr);
      }

      if (data && data.success && data.replyText) {
        return {
          success: true,
          replyText: data.replyText,
          agent: data.selectedAgent || chosenFallbackAgent
        };
      }

      // Safe contextual fallback (for static hosting or offline environments)
      const contextualReplies: Record<string, string> = {
        'inspetor-brandao': `Prezado Colega,\n\nExcelente colocação a respeito do artigo "${articleTitle}". Do ponto de vista de conformidade e aeronavegabilidade continuada (conforme os RBACs pertinentes), o cumprimento dos manuais de manutenção (AMM) e o registro fidedigno de cada intervenção são as bases que garantem a segurança operacional e a liberação de voo.\n\nSua pergunta destaca um aspecto crítico do tema tratado no artigo.`,
        'mestre-valter': `Fala, colega de hangar!\n\nMuito bem observado em relação a "${articleTitle}"! No dia a dia da oficina, a prática confirma o que está exposto no artigo: atenção redobrada no torque das ferramentas, limpeza para evitar F.O.D. e inspeção visual minuciosa evitam retrabalho e salvam vidas.\n\nValeu pela contribuição aqui no debate!`,
        'eng-marcos': `Olá leitor(a)!\n\nMuito pertinente o seu questionamento. Analisando a engenharia de sistemas abordada em "${articleTitle}", os barramentos digitais e a redundância dos sensores aviônicos foram projetados justamente para absorver transientes e manter a confiabilidade operacional descrita na publicação.\n\nÓtimo ponto levantado!`,
        'cmte-helena': `Saudações, colega.\n\nSua dúvida vai direto ao ponto central tratado no artigo "${articleTitle}". A coordenação de cabine, a comunicação assertiva (CRM) e a tomada de decisão estruturada são as ferramentas mais poderosas para transformar os dados técnicos do artigo em segurança prática de voo.\n\nExcelente reflexão técnica!`
      };

      const selected = chosenFallbackAgent;
      const fallbackText = contextualReplies[selected.id] || contextualReplies['inspetor-brandao'];

      return {
        success: true,
        replyText: fallbackText,
        agent: selected
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao processar resposta com IA.' };
    }
  };

  const subscribeNewsletter = async (
    email: string,
    categoryInterest?: string
  ): Promise<{ success: boolean; message: string }> => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      return { success: false, message: 'Por favor, insira um e-mail válido.' };
    }

    if (newsletterSubscribers.some(s => s.email.toLowerCase() === trimmed)) {
      return { success: true, message: 'Você já está inscrito em nosso Briefing Semanal!' };
    }

    const sub: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email: trimmed,
      subscribedAt: new Date().toISOString(),
      categoryInterest
    };

    setNewsletterSubscribers(prev => [sub, ...prev]);

    try {
      await setDoc(doc(db, 'newsletter', sub.id), sub);
    } catch (e) {
      console.warn('Firestore subscribeNewsletter note:', e);
    }

    return {
      success: true,
      message: 'Inscrição realizada com sucesso! Bem-vindo a bordo do Briefing Técnico.'
    };
  };

  const removeNewsletterSubscriber = async (emailOrId: string): Promise<void> => {
    const target = emailOrId.toLowerCase().trim();
    const targetSub = newsletterSubscribers.find(
      s => s.id === emailOrId || s.email.toLowerCase() === target
    );
    const updated = newsletterSubscribers.filter(
      s => s.id !== emailOrId && s.email.toLowerCase() !== target
    );
    setNewsletterSubscribers(updated);
    safeSetJSON(STORAGE_KEY_SUBS, updated);

    if (targetSub) {
      try {
        await deleteDoc(doc(db, 'newsletter', targetSub.id));
      } catch (e) {
        console.warn('Firestore removeSubscriber note:', e);
      }
    }
  };

  const addManualSubscriber = async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      return { success: false, message: 'Por favor, insira um e-mail válido.' };
    }
    if (newsletterSubscribers.some(s => s.email.toLowerCase() === trimmed)) {
      return { success: false, message: 'Este e-mail já está na lista de assinantes.' };
    }

    const sub: NewsletterSubscriber = {
      id: `sub-manual-${Date.now()}`,
      email: trimmed,
      subscribedAt: new Date().toISOString(),
      categoryInterest: 'Geral (Adicionado pelo Administrador)'
    };

    setNewsletterSubscribers(prev => [sub, ...prev]);
    safeSetJSON(STORAGE_KEY_SUBS, [sub, ...newsletterSubscribers]);

    try {
      await setDoc(doc(db, 'newsletter', sub.id), sub);
    } catch (e) {
      console.warn('Firestore addManualSubscriber note:', e);
    }

    return { success: true, message: `Assinante ${trimmed} adicionado com sucesso!` };
  };

  const saveBriefingCampaign = async (campaign: BriefingCampaign): Promise<void> => {
    setBriefingCampaigns(prev => {
      const idx = prev.findIndex(c => c.id === campaign.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = campaign;
        return copy;
      }
      return [campaign, ...prev];
    });

    try {
      safeSetJSON(STORAGE_KEY_BRIEFINGS, [campaign, ...briefingCampaigns.filter(c => c.id !== campaign.id)]);
      await setDoc(doc(db, 'briefings', campaign.id), campaign, { merge: true });
    } catch (e) {
      console.warn('Firestore saveBriefingCampaign note:', e);
    }
  };

  const deleteBriefingCampaign = async (id: string): Promise<void> => {
    setBriefingCampaigns(prev => prev.filter(c => c.id !== id));
    try {
      safeSetJSON(STORAGE_KEY_BRIEFINGS, briefingCampaigns.filter(c => c.id !== id));
      await deleteDoc(doc(db, 'briefings', id));
    } catch (e) {
      console.warn('Firestore deleteBriefingCampaign note:', e);
    }
  };

  const sendContactMessage = async (
    name: string,
    email: string,
    subject: string,
    message: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!name || !email || !message) {
      return { success: false, message: 'Por favor, preencha todos os campos obrigatórios.' };
    }

    const newContact: ContactMessage = {
      id: `msg-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      subject: subject || 'Contato Geral',
      message: message.trim(),
      createdAt: new Date().toISOString(),
      status: 'unread'
    };

    setContactMessages(prev => [newContact, ...prev]);

    try {
      await setDoc(doc(db, 'contacts', newContact.id), newContact);
    } catch (e) {
      console.warn('Firestore sendContactMessage note:', e);
    }

    return {
      success: true,
      message: 'Mensagem enviada com sucesso! Alexandre Andrade responderá em breve.'
    };
  };

  const markContactRead = async (id: string) => {
    setContactMessages(prev => prev.map(m => (m.id === id ? { ...m, status: 'read' } : m)));
    try {
      await updateDoc(doc(db, 'contacts', id), { status: 'read' });
    } catch (e) {
      console.warn('Firestore markContactRead note:', e);
    }
  };

  const deleteContactMessage = async (id: string) => {
    setContactMessages(prev => prev.filter(m => m.id !== id));
    try {
      await deleteDoc(doc(db, 'contacts', id));
    } catch (e) {
      console.warn('Firestore deleteContactMessage note:', e);
    }
  };

  const addCategory = async (cat: CategoryInfo) => {
    setCategories(prev => {
      const existingIdx = prev.findIndex(c => c.id === cat.id || c.slug === cat.slug);
      let next: CategoryInfo[];
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = { ...next[existingIdx], ...cat };
      } else {
        next = [...prev, cat];
      }
      safeSetJSON(STORAGE_KEY_CATEGORIES, next);
      return next;
    });
    try {
      await setDoc(doc(db, 'categories', cat.id), cat);
    } catch (e) {
      console.warn('Firestore addCategory note:', e);
    }
  };

  const updateCategory = async (id: string, updates: Partial<CategoryInfo>) => {
    setCategories(prev => {
      const next = prev.map(c => (c.id === id ? { ...c, ...updates } : c));
      safeSetJSON(STORAGE_KEY_CATEGORIES, next);
      return next;
    });
    try {
      await setDoc(doc(db, 'categories', id), updates, { merge: true });
    } catch (e) {
      console.warn('Firestore updateCategory note:', e);
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories(prev => {
      const next = prev.filter(c => c.id !== id);
      safeSetJSON(STORAGE_KEY_CATEGORIES, next);
      return next;
    });
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (e) {
      console.warn('Firestore deleteCategory note:', e);
    }
  };

  const updateAdConfig = async (updates: Partial<AdBannerConfig>) => {
    let nextConfig: AdBannerConfig = { ...adConfig, ...updates };
    setAdConfig(prev => {
      nextConfig = { ...prev, ...updates };
      safeSetJSON(STORAGE_KEY_ADS, nextConfig);
      return nextConfig;
    });

    try {
      await setDoc(doc(db, 'settings', 'ads_config'), nextConfig, { merge: true });
    } catch (e) {
      console.warn('Firestore updateAdConfig note:', e);
    }
  };

  const updateRadarConfig = async (updates: Partial<TechnicalRadarConfig>) => {
    let nextConfig: TechnicalRadarConfig = { ...radarConfig, ...updates, updatedAt: new Date().toISOString() };
    setRadarConfig(prev => {
      nextConfig = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      safeSetJSON(STORAGE_KEY_RADAR, nextConfig);
      return nextConfig;
    });

    try {
      await setDoc(doc(db, 'settings', 'radar_config'), nextConfig, { merge: true });
    } catch (e) {
      console.warn('Firestore updateRadarConfig note:', e);
    }
  };

  const updateAboutData = async (updates: Partial<AboutPageData>) => {
    const nextData: AboutPageData = {
      ...aboutData,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setAboutData(nextData);
    safeSetJSON(STORAGE_KEY_ABOUT, nextData);

    try {
      await setDoc(doc(db, 'settings', 'about_page'), nextData, { merge: true });
    } catch (e) {
      console.warn('Firestore updateAboutData note:', e);
    }
  };

  const resetAboutData = async () => {
    setAboutData(INITIAL_ABOUT_PAGE_DATA);
    safeSetJSON(STORAGE_KEY_ABOUT, INITIAL_ABOUT_PAGE_DATA);
    try {
      await setDoc(doc(db, 'settings', 'about_page'), INITIAL_ABOUT_PAGE_DATA);
    } catch (e) {
      console.warn('Firestore resetAboutData note:', e);
    }
  };

  const updateContactInfo = async (updates: Partial<ContactInfoData>) => {
    const nextData: ContactInfoData = {
      ...contactInfo,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setContactInfo(nextData);
    safeSetJSON(STORAGE_KEY_CONTACT_INFO, nextData);

    try {
      await setDoc(doc(db, 'settings', 'contact_info'), nextData, { merge: true });
    } catch (e) {
      console.warn('Firestore updateContactInfo note:', e);
    }
  };

  const resetContactInfo = async () => {
    setContactInfo(INITIAL_CONTACT_INFO);
    safeSetJSON(STORAGE_KEY_CONTACT_INFO, INITIAL_CONTACT_INFO);
    try {
      await setDoc(doc(db, 'settings', 'contact_info'), INITIAL_CONTACT_INFO);
    } catch (e) {
      console.warn('Firestore resetContactInfo note:', e);
    }
  };

  const resetToDefaults = async () => {
    setPosts([]);
    setCategories(INITIAL_CATEGORIES);
    setComments([]);
  };

  // Synchronize user avatar, name, and title across all authored posts, comments, and replies
  const syncUserProfileToContent = async (targetUser: User) => {
    if (!targetUser || !targetUser.id) return;
    const isAlexandre =
      targetUser.role === 'admin' ||
      targetUser.email.toLowerCase().includes('alexandre') ||
      targetUser.email.toLowerCase() === 'andradeseripa2@gmail.com' ||
      targetUser.name.toLowerCase().includes('alexandre') ||
      targetUser.id === 'usr-admin-alexandre';

    // 1. Sync comments and their nested replies
    let hasCommentChanges = false;
    const updatedComments = comments.map(c => {
      let commentModified = false;
      let newComment = { ...c };

      const isMyComment =
        c.userId === targetUser.id || (isAlexandre && c.userId === 'usr-admin-alexandre');
      if (isMyComment) {
        if (
          newComment.userAvatar !== targetUser.avatar ||
          newComment.userName !== targetUser.name ||
          (targetUser.title && newComment.userTitle !== targetUser.title)
        ) {
          newComment.userAvatar = targetUser.avatar;
          newComment.userName = targetUser.name;
          if (targetUser.title) newComment.userTitle = targetUser.title;
          commentModified = true;
        }
      }

      if (Array.isArray(newComment.replies) && newComment.replies.length > 0) {
        let repliesModified = false;
        const newReplies = newComment.replies.map(r => {
          const isMyReply =
            r.userId === targetUser.id || (isAlexandre && r.userId === 'usr-admin-alexandre');
          if (isMyReply) {
            if (
              r.userAvatar !== targetUser.avatar ||
              r.userName !== targetUser.name ||
              (targetUser.title && r.userTitle !== targetUser.title)
            ) {
              repliesModified = true;
              return {
                ...r,
                userAvatar: targetUser.avatar,
                userName: targetUser.name,
                userTitle: targetUser.title || r.userTitle
              };
            }
          }
          return r;
        });

        if (repliesModified) {
          newComment.replies = newReplies;
          commentModified = true;
        }
      }

      if (commentModified) {
        hasCommentChanges = true;
      }
      return newComment;
    });

    if (hasCommentChanges) {
      setComments(updatedComments);
      try {
        safeSetJSON(STORAGE_KEY_COMMENTS, updatedComments);
        const batch = writeBatch(db);
        let commentOps = 0;
        updatedComments.forEach(c => {
          const isMyComment =
            c.userId === targetUser.id ||
            (isAlexandre && c.userId === 'usr-admin-alexandre') ||
            (c.replies &&
              c.replies.some(
                r => r.userId === targetUser.id || (isAlexandre && r.userId === 'usr-admin-alexandre')
              ));
          if (isMyComment) {
            batch.set(doc(db, 'comments', c.id), c, { merge: true });
            commentOps++;
          }
        });
        if (commentOps > 0) {
          await batch.commit();
        }
      } catch (err) {
        console.warn('Firestore comments batch sync note:', err);
      }
    }
  };

  // Notification Management Functions
  const markNotificationAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.warn('Mark notification read note:', e);
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (e) {
      console.warn('Mark all notifications read note:', e);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.warn('Delete notification note:', e);
    }
  };

  // Automatic badge calculation & unlocking
  const checkAndUnlockBadges = async () => {
    if (!user) return;

    // Collect both direct comments and nested replies posted by this user
    const directComments = comments.filter(c => c.userId === user.id);
    const userReplies: { commentId: string; postId?: string; postTitle?: string }[] = [];
    
    comments.forEach(c => {
      if (Array.isArray(c.replies)) {
        c.replies.forEach(r => {
          if (r.userId === user.id) {
            userReplies.push({
              commentId: c.id,
              postId: c.postId,
              postTitle: c.postTitle
            });
          }
        });
      }
    });

    const myCommentCount = directComments.length + userReplies.length;
    const myBookmarksCount = bookmarks.length;
    const currentBadges = Array.isArray(user.badges) ? user.badges : [];
    const newBadgesToGrant: string[] = [];

    // 1. "first-flight": 1+ comment or reply
    if (myCommentCount >= 1 && !currentBadges.includes('first-flight')) {
      newBadgesToGrant.push('first-flight');
    }
    // 2. "hangar-debater": 5+ comments or replies
    if (myCommentCount >= 5 && !currentBadges.includes('hangar-debater')) {
      newBadgesToGrant.push('hangar-debater');
    }
    // 3. "aviation-specialist": 10+ comments or replies
    if (myCommentCount >= 10 && !currentBadges.includes('aviation-specialist')) {
      newBadgesToGrant.push('aviation-specialist');
    }
    // 4. "avid-reader": 3+ bookmarks
    if (myBookmarksCount >= 3 && !currentBadges.includes('avid-reader')) {
      newBadgesToGrant.push('avid-reader');
    }
    // 5. "safety-guardian": Comment or reply in safety/sipaer post
    const commentedInSafety = directComments.some(c => {
      const targetPost = posts.find(p => p.id === c.postId || p.slug === c.postId);
      return targetPost?.isSafetyPost || targetPost?.category === 'safety';
    }) || userReplies.some(r => {
      const targetPost = posts.find(p => p.id === r.postId || p.slug === r.postId);
      return targetPost?.isSafetyPost || targetPost?.category === 'safety';
    });
    if (commentedInSafety && !currentBadges.includes('safety-guardian')) {
      newBadgesToGrant.push('safety-guardian');
    }

    if (newBadgesToGrant.length > 0) {
      const updatedBadges = [...currentBadges, ...newBadgesToGrant];
      // Do NOT overwrite user's selected equippedBadges automatically if user has configured equipped badges
      const currentEquipped = Array.isArray(user.equippedBadges) ? user.equippedBadges : [];
      const updatedEquipped = currentEquipped;

      const badgeNames: Record<string, string> = {
        'first-flight': 'Primeiro Voo 🛫',
        'hangar-debater': 'Debatedor de Hangar 💬',
        'aviation-specialist': 'Especialista em Diálogo 🏅',
        'avid-reader': 'Leitor Assíduo 📚',
        'safety-guardian': 'Guardião do SIPAER 🛡️'
      };

      try {
        await updateDoc(doc(db, 'users', user.id), {
          badges: updatedBadges,
          equippedBadges: updatedEquipped
        });

        // Add notifications for each unlocked badge
        for (const badgeId of newBadgesToGrant) {
          const notifId = `notif-${Date.now()}-${badgeId}`;
          await setDoc(doc(db, 'notifications', notifId), {
            id: notifId,
            userId: user.id,
            type: 'badge_unlocked',
            title: `Nova Conquista Desbloqueada! ${badgeNames[badgeId] || '🏆'}`,
            message: `Parabéns! Você alcançou novos marcos técnicos e conquistou a badge "${badgeNames[badgeId] || badgeId}". Equipe-a em seu perfil!`,
            badgeId,
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.warn('Auto badge unlock error:', e);
      }
    }
  };

  // Run badge evaluation when user or activities change
  useEffect(() => {
    if (user?.id) {
      checkAndUnlockBadges();
    }
  }, [user?.id, comments.length, bookmarks.length]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Safe background profile content sync
  useEffect(() => {
    if (user && user.avatar && user.id) {
      try {
        syncUserProfileToContent(user).catch(err => {
          console.warn('Auto user profile content sync note:', err);
        });
      } catch (e) {
        console.warn('Sync profile hook caught:', e);
      }
    }
  }, [user?.id, user?.avatar, user?.name, user?.title]);

  return (
    <BlogContext.Provider
      value={{
        posts,
        isLoadingPosts,
        categories: categoriesWithCounts,
        comments,
        newsletterSubscribers,
        contactMessages,
        adConfig,
        aboutData,
        currentView,
        selectedPostSlug,
        selectedCategorySlug,
        searchQuery,
        activePost,
        sortOption,
        theme,
        fontSize,
        bookmarks,
        navigate,
        setSearchQuery,
        setSortOption,
        setTheme,
        toggleTheme,
        setFontSize,
        isBookmarked,
        toggleBookmark,
        getCategoryName,
        getCategoryVisual: getCategoryVisualNode,
        postMatchesCategoryFilter,
        createPost,
        updatePost,
        deletePost,
        togglePublishPost,
        setFeaturedPost,
        incrementViews,
        isPostLiked,
        toggleLikePost,
        ratePost,
        getPostRatingInfo,
        addComment,
        addCommentReply,
        approveComment,
        rejectComment,
        deleteComment,
        deleteCommentReply,
        editMyComment,
        likeComment,
        likeCommentReply,
        isCommentLiked,
        isReplyLiked,
        subscribeNewsletter,
        removeNewsletterSubscriber,
        addManualSubscriber,
        briefingCampaigns,
        saveBriefingCampaign,
        deleteBriefingCampaign,
        sendContactMessage,
        markContactRead,
        deleteContactMessage,
        addCategory,
        updateCategory,
        deleteCategory,
        updateAdConfig,
        radarConfig,
        updateRadarConfig,
        updateAboutData,
        resetAboutData,
        contactInfo,
        updateContactInfo,
        resetContactInfo,
        resetToDefaults,
        syncUserProfileToContent,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        checkAndUnlockBadges,
        aiAgents,
        aiModerationConfig,
        updateAIModerationConfig,
        saveAIAgent,
        deleteAIAgent,
        resetAIAgentsToDefault,
        generateAIReplyForComment,
        approveSuggestedAIReply,
        dismissSuggestedAIReply,
        testGenerateAIReply
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (!context) {
    console.warn('useBlog was called outside BlogProvider');
    return {} as BlogContextType;
  }
  return context;
};
