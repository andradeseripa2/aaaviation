import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  getDoc,
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
  AircraftExperience,
  ContactInfoData,
  TechnicalRadarConfig,
  CategorySlug,
  SortOption,
  ThemeMode,
  FontSizeScale,
  User,
  UserNotification,
  LeadMaterialConfig,
  LeadCapture
} from '../types';
import {
  INITIAL_POSTS,
  INITIAL_CATEGORIES,
  INITIAL_COMMENTS,
  INITIAL_ABOUT_PAGE_DATA,
  INITIAL_CONTACT_INFO
} from '../data/seedData';
import { INITIAL_LEAD_MATERIAL_CONFIG } from '../types';
import { isPostPublishedAndActive } from '../lib/scheduleUtils';
import { useAuth } from './AuthContext';
import { reportWriteError } from '../lib/writeErrors';
import { sanitizeForFirestore } from '../lib/sanitizeForFirestore';
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
  // Dispara um novo build do site no Netlify. É o que faz um artigo recém
  // publicado existir como página estática (com meta tags e capa) para o
  // LinkedIn e o Google — sem isso, o post só existe dentro do JavaScript.
  triggerSiteRebuild: (reason?: string) => Promise<{ triggered: boolean; message: string }>;
  // Horário do último disparo, para o painel mostrar. Null = nenhum nesta máquina.
  lastRebuildAt: string | null;
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

  // Lead Magnet / SGSO Material
  leadMaterialConfig: LeadMaterialConfig;
  capturedLeads: LeadCapture[];
  isInitialRemoteSyncDone: boolean;
  updateLeadMaterialConfig: (updates: Partial<LeadMaterialConfig>) => Promise<{ success: boolean; message: string }>;
  captureLead: (name: string, email: string, postTitle?: string) => Promise<{ success: boolean; isDraft: boolean; message: string; config: LeadMaterialConfig }>;
  deleteCapturedLead: (id: string) => Promise<void>;

  // Notifications
  notifications: UserNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  checkAndUnlockBadges: () => Promise<void>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

const STORAGE_KEY_POSTS = 'aaa_posts_v2';
const STORAGE_KEY_CATEGORIES = 'aaa_categories_v2';
const STORAGE_KEY_COMMENTS = 'aaa_comments_v2';
const STORAGE_KEY_RATINGS = 'aaa_ratings_v2';
const STORAGE_KEY_SUBS = 'aaa_newsletter_v2';
const STORAGE_KEY_BRIEFINGS = 'aaa_briefings_v2';
const STORAGE_KEY_LAST_REBUILD = 'aaa_last_rebuild_at';
const STORAGE_KEY_CONTACTS = 'aaa_contacts_v2';
const STORAGE_KEY_ADS = 'aaa_ads_config_v2';
const STORAGE_KEY_RADAR = 'aaa_radar_config_v2';
const STORAGE_KEY_ABOUT = 'aaa_about_page_data_v2';
const STORAGE_KEY_CONTACT_INFO = 'aaa_contact_info_v2';
const STORAGE_KEY_LIKES = 'aaa_liked_posts_v2';
const STORAGE_KEY_COMMENT_LIKES = 'aaa_liked_comments_v2';
const STORAGE_KEY_BOOKMARKS = 'aaa_bookmarks_v2';
const STORAGE_KEY_THEME = 'aaa_theme_mode_v2';
const STORAGE_KEY_FONT_SIZE = 'aaa_font_size_v2';
const STORAGE_KEY_LEAD_MATERIAL = 'aaa_lead_material_v2';
const STORAGE_KEY_CAPTURED_LEADS = 'aaa_captured_leads_v2';

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
  const [lastRebuildAt, setLastRebuildAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_LAST_REBUILD);
    } catch {
      return null;
    }
  });

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
    const raw = safeGetJSON<AboutPageData>(STORAGE_KEY_ABOUT, INITIAL_ABOUT_PAGE_DATA);
    return {
      ...raw,
      ctaTitle:
        !raw.ctaTitle || /consultoria|palestra|treinamento/i.test(raw.ctaTitle)
          ? 'Quer conversar sobre aviação ou segurança de voo?'
          : raw.ctaTitle,
      ctaSubtitle:
        !raw.ctaSubtitle || /consultoria|palestra|treinamento/i.test(raw.ctaSubtitle)
          ? 'Envie sua mensagem com dúvidas técnicas, sugestões de artigos ou para debater sobre segurança de voo.'
          : raw.ctaSubtitle
    };
  });

  const [contactInfo, setContactInfo] = useState<ContactInfoData>(() => {
    return safeGetJSON<ContactInfoData>(STORAGE_KEY_CONTACT_INFO, INITIAL_CONTACT_INFO);
  });

  const [isInitialRemoteSyncDone, setIsInitialRemoteSyncDone] = useState<boolean>(false);
  const [leadMaterialConfig, setLeadMaterialConfig] = useState<LeadMaterialConfig>(() => {
    return safeGetJSON<LeadMaterialConfig>(STORAGE_KEY_LEAD_MATERIAL, INITIAL_LEAD_MATERIAL_CONFIG);
  });
  const [capturedLeads, setCapturedLeads] = useState<LeadCapture[]>(() => {
    return safeGetJSON<LeadCapture[]>(STORAGE_KEY_CAPTURED_LEADS, []);
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
            setIsInitialRemoteSyncDone(true);
          } else {
            setPosts([]);
            safeSetJSON(STORAGE_KEY_POSTS, []);
            setIsLoadingPosts(false);
            setIsInitialRemoteSyncDone(true);
          }
        },
        err => {
          console.warn('Firestore posts listener note:', err);
          setIsLoadingPosts(false);
          setIsInitialRemoteSyncDone(true);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Posts listener error:', e);
      setIsLoadingPosts(false);
      setIsInitialRemoteSyncDone(true);
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
            }).catch(err => console.error('Auto newsletter notify error:', err));
          }
        } catch (e) {
          console.error('Error auto-publishing scheduled post:', e);
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
          console.error('Error auto-dispatching scheduled briefing campaign:', err);
          await setDoc(doc(db, 'briefings', campaign.id), { status: 'failed', errorLog: String(err) }, { merge: true });
        }
      }
    };

    // Run immediately and every 30 seconds
    checkSchedules();
    const interval = setInterval(checkSchedules, 30000);
    return () => clearInterval(interval);
  }, [posts, briefingCampaigns, newsletterSubscribers]);

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
              const sanitized: AboutPageData = {
                ...INITIAL_ABOUT_PAGE_DATA,
                ...data,
                aircraftList: Array.isArray(data.aircraftList) && data.aircraftList.length > 0
                  ? data.aircraftList.map((ac, idx) => ({
                      id: ac.id || `ac-${idx}`,
                      model: ac.model || '',
                      role: ac.role || '',
                      details: ac.details || '',
                      imageUrl: ac.imageUrl || ''
                    }))
                  : (data.aircraftList || INITIAL_ABOUT_PAGE_DATA.aircraftList),
                ctaTitle:
                  !data.ctaTitle || /consultoria|palestra|treinamento/i.test(data.ctaTitle)
                    ? 'Quer conversar sobre aviação ou segurança de voo?'
                    : data.ctaTitle,
                ctaSubtitle:
                  !data.ctaSubtitle || /consultoria|palestra|treinamento/i.test(data.ctaSubtitle)
                    ? 'Envie sua mensagem com dúvidas técnicas, sugestões de artigos ou para debater sobre segurança de voo.'
                    : data.ctaSubtitle
              };
              setAboutData(sanitized);
              safeSetJSON(STORAGE_KEY_ABOUT, sanitized);

              // Auto-heal Firestore document if it contained deprecated words
              if (
                data.ctaTitle !== sanitized.ctaTitle ||
                data.ctaSubtitle !== sanitized.ctaSubtitle
              ) {
                const cleanAutoHeal = sanitizeForFirestore(sanitized);
                setDoc(doc(db, 'settings', 'about_page'), cleanAutoHeal, { merge: true }).catch(() => {});
              }
            }
          } else {
            // Seed initial about page data if missing
            const cleanInit = sanitizeForFirestore(INITIAL_ABOUT_PAGE_DATA);
            setDoc(doc(db, 'settings', 'about_page'), cleanInit).catch(() => {});
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

  // 7.7. Sync SGSO Lead Material Config from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'settings', 'lead_material_sgso'),
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Partial<LeadMaterialConfig>;
            if (data && data.title) {
              setLeadMaterialConfig(prev => {
                const merged = { ...prev, ...data };
                safeSetJSON(STORAGE_KEY_LEAD_MATERIAL, merged);
                return merged;
              });
            }
          } else {
            // Seed initial config if missing
            const clean = sanitizeForFirestore(INITIAL_LEAD_MATERIAL_CONFIG);
            setDoc(doc(db, 'settings', 'lead_material_sgso'), clean).catch(() => {});
          }
        },
        err => console.warn('Lead material listener note:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('Lead material listener error:', e);
    }
  }, []);

  // 7.8. Sync Captured Leads from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'leads'),
        snapshot => {
          const map = new Map<string, LeadCapture>();
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as LeadCapture;
            const leadId = data?.id || docSnap.id;
            if (leadId && data?.email) {
              map.set(leadId, { ...data, id: leadId });
            }
          });
          const list = Array.from(map.values());
          list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setCapturedLeads(list);
          safeSetJSON(STORAGE_KEY_CAPTURED_LEADS, list);
        },
        err => console.warn('Leads listener note:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('Leads listener error:', e);
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
    const count = posts.filter(p => postMatchesCategory(p.category, cat.slug, categories) && isPostPublishedAndActive(p)).length;
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

  // ---------------------------------------------------------------------------
  // REGERAÇÃO DO SITE
  //
  // As páginas estáticas dos artigos (com título, canonical, JSON-LD e capa)
  // são geradas por scripts/generate-ssg.js, que só roda durante o build do
  // Netlify. Publicar um artigo grava no Firestore e não toca no build — por
  // isso, até aqui, todo post novo ficava invisível para LinkedIn e Google
  // até alguém dar push no repositório.
  //
  // Esta função fecha esse buraco: ao publicar, dispara um build novo.
  //
  // A URL do build hook é uma credencial e NÃO pode morar no código: este
  // painel roda no navegador, então qualquer segredo no fonte iria junto no
  // bundle público. Ela fica em admin_config/netlify, que as regras do
  // Firestore liberam só para o admin autenticado.
  // ---------------------------------------------------------------------------
  const triggerSiteRebuild = async (
    reason = 'publicação'
  ): Promise<{ triggered: boolean; message: string }> => {
    let hookUrl = '';
    try {
      const snap = await getDoc(doc(db, 'admin_config', 'netlify'));
      hookUrl = snap.exists() ? String(snap.data()?.buildHookUrl || '').trim() : '';
    } catch (err) {
      console.error('[rebuild] Não foi possível ler admin_config/netlify:', err);
      return {
        triggered: false,
        message: 'Não consegui ler a configuração de publicação. Verifique se está logado como admin.'
      };
    }

    if (!hookUrl.startsWith('https://api.netlify.com/build_hooks/')) {
      return {
        triggered: false,
        message: 'Build hook não configurado. O artigo foi salvo, mas o site não será regerado.'
      };
    }

    try {
      // O Netlify não envia cabeçalhos CORS neste endpoint, então a resposta
      // vem opaca: a requisição chega e o build começa, mas o navegador não
      // deixa ler status nem corpo. Ou seja, NÃO dá para afirmar aqui que o
      // build foi aceito — por isso a mensagem abaixo não promete sucesso, e
      // o painel oferece o link dos Deploys para conferência real.
      await fetch(hookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger_title: `Publicação pelo painel (${reason})` })
      });

      const now = new Date().toISOString();
      setLastRebuildAt(now);
      try {
        localStorage.setItem(STORAGE_KEY_LAST_REBUILD, now);
      } catch {
        /* modo privado do navegador: só perde o histórico local, o build já foi */
      }

      return {
        triggered: true,
        message: 'Regeração do site solicitada. Leva cerca de 2 minutos até o artigo aparecer para o LinkedIn e o Google.'
      };
    } catch (err) {
      console.error('[rebuild] Falha ao chamar o build hook:', err);
      return {
        triggered: false,
        message: 'Não consegui solicitar a regeração do site. O artigo está salvo; tente publicar novamente ou rode um deploy manual no Netlify.'
      };
    }
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
      reportWriteError('Imagens do artigo (a capa pode sair sem imagem no LinkedIn)', mediaErr);
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

    // Só artigos publicados viram página estática. Rascunho não precisa de build.
    if (cleanPost.published) {
      await triggerSiteRebuild(`novo artigo: ${cleanPost.title}`);
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
        reportWriteError('Imagens do artigo (a capa pode sair sem imagem no LinkedIn)', mediaErr);
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

    // Regera quando o artigo está publicado agora OU estava antes: despublicar
    // também exige build novo, senão a página estática antiga continua no ar.
    const wasPublished = posts.find(p => p.id === id)?.published === true;
    const isPublished = cleanUpdates.published !== undefined ? cleanUpdates.published : wasPublished;
    if (isPublished || wasPublished) {
      await triggerSiteRebuild(`edição: ${cleanUpdates.title || id}`);
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
        reportWriteError('Artigo em destaque', err);
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
      reportWriteError('Exclusão do artigo', e);
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

    // Sem build novo, a página estática do artigo apagado continuaria acessível.
    await triggerSiteRebuild('artigo removido');
  };

  const togglePublishPost = async (id: string) => {
    const target = posts.find(p => p.id === id);
    if (!target) return;
    const newStatus = !target.published;

    setPosts(prev => prev.map(p => (p.id === id ? { ...p, published: newStatus } : p)));

    let saved = false;
    try {
      await updateDoc(doc(db, 'posts', id), { published: newStatus });
      saved = true;
    } catch (e) {
      reportWriteError('Publicação do artigo', e);
    }

    // Publicar e despublicar exigem build novo: um cria a página estática,
    // o outro precisa removê-la do ar.
    if (saved) {
      await triggerSiteRebuild(
        `${newStatus ? 'publicado' : 'despublicado'}: ${target.title}`
      );
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
      console.error('Increment views note:', e);
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
      reportWriteError('Curtida no artigo', e);
    }
  };

  const ratePost = async (postId: string, score: number): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Você precisa estar logado para avaliar.' };
    }
    const cleanScore = Math.min(5, Math.max(1, Math.round(score)));

    const previousPostRatings = ratings[postId];
    const currentPostRatings = previousPostRatings ? { ...previousPostRatings } : {};
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
      // O componente de avaliação não exibe erro, então o aviso vem pelo canal global.
      reportWriteError('Avaliação do artigo', e);
      setRatings(prev => {
        const next = { ...prev };
        if (previousPostRatings) next[postId] = previousPostRatings;
        else delete next[postId];
        return next;
      });
      return { success: false, error: 'Não foi possível registrar sua avaliação.' };
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
      replies: []
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

    // O Firestore recusa qualquer campo undefined e lança antes mesmo de enviar.
    // Até aqui o comentário carregava `aiAutoReplyScheduledAt: undefined` (vindo
    // da resposta automática por IA, removida) e `userTitle` pode vir undefined
    // para alguns usuários — então TODO comentário era recusado, e o erro era
    // engolido com success: true. Resultado: a coleção `comments` nunca recebeu
    // um documento. A sanitização remove os campos vazios antes de gravar.
    try {
      await setDoc(doc(db, 'comments', newComment.id), sanitizeForFirestore(newComment));
    } catch (e) {
      console.error('Firestore addComment error:', e);
      // Desfaz o comentário otimista: ele não foi salvo e sumiria ao recarregar.
      setComments(prev => {
        const list = prev.filter(c => c.id !== newComment.id);
        safeSetJSON(STORAGE_KEY_COMMENTS, list);
        return list;
      });
      return { success: false, error: 'Não foi possível publicar seu comentário. Tente novamente.' };
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

    // O documento a gravar é montado a partir do estado atual, e não dentro do
    // updater do setComments: o React pode executar o updater depois, e aí a
    // variável ainda estaria vazia na hora de gravar — a resposta apareceria na
    // tela sem nunca ser enviada ao banco.
    const parentComment = comments.find(c => c.id === commentId);
    if (!parentComment) {
      return { success: false, error: 'Comentário não encontrado. Recarregue a página.' };
    }
    const currentReplies = Array.isArray(parentComment.replies) ? parentComment.replies : [];
    const updatedComment: Comment = {
      ...parentComment,
      replies: [...currentReplies.filter(r => r.id !== newReply.id), newReply]
    };

    const applyReplies = (transform: (replies: CommentReply[]) => CommentReply[]) =>
      setComments(prev => {
        const next = prev.map(c =>
          c.id === commentId ? { ...c, replies: transform(Array.isArray(c.replies) ? c.replies : []) } : c
        );
        safeSetJSON(STORAGE_KEY_COMMENTS, next);
        return next;
      });

    applyReplies(replies => [...replies.filter(r => r.id !== newReply.id), newReply]);

    // Mesmo defeito do addComment: `userTitle` pode vir undefined (ex: login
    // pelo Google), e o Firestore recusa o documento inteiro por isso.
    try {
      await setDoc(doc(db, 'comments', commentId), sanitizeForFirestore(updatedComment), { merge: true });
    } catch (e) {
      console.error('Firestore addCommentReply error:', e);
      applyReplies(replies => replies.filter(r => r.id !== newReply.id));
      return { success: false, error: 'Não foi possível publicar sua resposta. Tente novamente.' };
    }

    // A notificação ao autor do comentário é secundária: se falhar, a resposta
    // já está salva e o leitor não deve receber erro por isso.
    if (parentComment.userId && parentComment.userId !== user.id) {
      try {
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
      } catch (e) {
        console.error('Reply notification error:', e);
      }
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
        await setDoc(doc(db, 'comments', commentId), sanitizeForFirestore(updatedComment), { merge: true });
      }
    } catch (e) {
      reportWriteError('Exclusão da resposta', e);
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
        await setDoc(doc(db, 'comments', commentId), sanitizeForFirestore(updatedComment), { merge: true });
      }
    } catch (e) {
      reportWriteError('Curtida na resposta', e);
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
      reportWriteError('Aprovação do comentário', e);
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
      reportWriteError('Ocultação do comentário', e);
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
      reportWriteError('Exclusão do comentário', e);
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
      reportWriteError('Edição do comentário', e);
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
      reportWriteError('Curtida no comentário', e);
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

    // `categoryInterest` é opcional e a caixa de newsletter da home não o envia.
    // Sem a sanitização, o campo ia como undefined, o Firestore recusava o
    // documento e o visitante lia "Inscrição realizada com sucesso!" — toda
    // inscrição feita pela home desde o lançamento se perdeu assim.
    try {
      await setDoc(doc(db, 'newsletter', sub.id), sanitizeForFirestore(sub));
    } catch (e) {
      console.error('Firestore subscribeNewsletter error:', e);
      setNewsletterSubscribers(prev => prev.filter(s => s.id !== sub.id));
      return {
        success: false,
        message: 'Não foi possível concluir sua inscrição agora. Tente novamente em instantes.'
      };
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
        reportWriteError('Remoção do inscrito na newsletter', e);
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
      await setDoc(doc(db, 'newsletter', sub.id), sanitizeForFirestore(sub));
    } catch (e) {
      console.error('Firestore addManualSubscriber error:', e);
      setNewsletterSubscribers(prev => prev.filter(s => s.id !== sub.id));
      safeSetJSON(STORAGE_KEY_SUBS, newsletterSubscribers);
      return { success: false, message: `Não foi possível adicionar ${trimmed}. Tente novamente.` };
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
      await setDoc(doc(db, 'briefings', campaign.id), sanitizeForFirestore(campaign), { merge: true });
    } catch (e) {
      reportWriteError('Salvamento do briefing', e);
    }
  };

  const deleteBriefingCampaign = async (id: string): Promise<void> => {
    setBriefingCampaigns(prev => prev.filter(c => c.id !== id));
    try {
      safeSetJSON(STORAGE_KEY_BRIEFINGS, briefingCampaigns.filter(c => c.id !== id));
      await deleteDoc(doc(db, 'briefings', id));
    } catch (e) {
      reportWriteError('Exclusão do briefing', e);
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
      await setDoc(doc(db, 'contacts', newContact.id), sanitizeForFirestore(newContact));
    } catch (e) {
      console.error('Firestore sendContactMessage error:', e);
      setContactMessages(prev => prev.filter(m => m.id !== newContact.id));
      return {
        success: false,
        message: 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.'
      };
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
      reportWriteError('Marcar mensagem como lida', e);
    }
  };

  const deleteContactMessage = async (id: string) => {
    setContactMessages(prev => prev.filter(m => m.id !== id));
    try {
      await deleteDoc(doc(db, 'contacts', id));
    } catch (e) {
      reportWriteError('Exclusão da mensagem de contato', e);
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
      reportWriteError('Criação da categoria', e);
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
      reportWriteError('Edição da categoria', e);
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
      reportWriteError('Exclusão da categoria', e);
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
      reportWriteError('Configuração de anúncios', e);
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
      reportWriteError('Radar Técnico', e);
    }
  };

  const updateAboutData = async (updates: Partial<AboutPageData>) => {
    // Clean and normalize aircraft list to ensure every item has valid strings and no undefined
    const sourceAircraftList = updates.aircraftList || aboutData?.aircraftList || [];
    const normalizedAircraftList: AircraftExperience[] = sourceAircraftList.map((ac, idx) => ({
      id: ac.id || `ac-${idx}-${Date.now()}`,
      model: ac.model || '',
      role: ac.role || '',
      details: ac.details || '',
      imageUrl: (ac.imageUrl || '').trim()
    }));

    const nextData: AboutPageData = {
      ...aboutData,
      ...updates,
      aircraftList: normalizedAircraftList,
      updatedAt: new Date().toISOString()
    };

    setAboutData(nextData);
    safeSetJSON(STORAGE_KEY_ABOUT, nextData);

    const cleanDoc = sanitizeForFirestore(nextData);

    try {
      await setDoc(doc(db, 'settings', 'about_page'), cleanDoc, { merge: true });
    } catch (e) {
      console.error('Firestore updateAboutData note:', e);
      throw e;
    }
  };

  const resetAboutData = async () => {
    setAboutData(INITIAL_ABOUT_PAGE_DATA);
    safeSetJSON(STORAGE_KEY_ABOUT, INITIAL_ABOUT_PAGE_DATA);
    try {
      const cleanDoc = sanitizeForFirestore(INITIAL_ABOUT_PAGE_DATA);
      await setDoc(doc(db, 'settings', 'about_page'), cleanDoc);
    } catch (e) {
      reportWriteError('Restauração da página Sobre', e);
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
      reportWriteError('Dados de contato', e);
    }
  };

  const resetContactInfo = async () => {
    setContactInfo(INITIAL_CONTACT_INFO);
    safeSetJSON(STORAGE_KEY_CONTACT_INFO, INITIAL_CONTACT_INFO);
    try {
      await setDoc(doc(db, 'settings', 'contact_info'), INITIAL_CONTACT_INFO);
    } catch (e) {
      reportWriteError('Restauração dos dados de contato', e);
    }
  };

  // SGSO Lead Material Management
  const updateLeadMaterialConfig = async (updates: Partial<LeadMaterialConfig>): Promise<{ success: boolean; message: string }> => {
    try {
      const updated: LeadMaterialConfig = {
        ...leadMaterialConfig,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      setLeadMaterialConfig(updated);
      safeSetJSON(STORAGE_KEY_LEAD_MATERIAL, updated);

      const cleanDoc = sanitizeForFirestore(updated);
      await setDoc(doc(db, 'settings', 'lead_material_sgso'), cleanDoc, { merge: true });
      return { success: true, message: 'Configurações do Checklist SGSO salvas com sucesso!' };
    } catch (err: any) {
      console.error('Error updating lead material config:', err);
      return { success: false, message: err?.message || 'Erro ao salvar material SGSO.' };
    }
  };

  const captureLead = async (
    name: string,
    email: string,
    postTitle?: string
  ): Promise<{ success: boolean; isDraft: boolean; message: string; config: LeadMaterialConfig }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim() || 'Leitor(a)';

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return {
        success: false,
        isDraft: leadMaterialConfig.status === 'draft',
        message: 'Por favor, informe um endereço de e-mail válido.',
        config: leadMaterialConfig
      };
    }

    const leadId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const isReady = leadMaterialConfig.status === 'published' && !!leadMaterialConfig.fileUrl;
    const newLead: LeadCapture = {
      id: leadId,
      name: trimmedName,
      email: trimmedEmail,
      source: 'checklist_sgso',
      postTitle: postTitle || 'Checklist SGSO',
      createdAt: new Date().toISOString(),
      status: isReady ? 'delivered' : 'pending'
    };

    // Update local state immediately
    setCapturedLeads(prev => [newLead, ...prev.filter(l => l.email !== trimmedEmail)]);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'leads', leadId), sanitizeForFirestore(newLead));
    } catch (err) {
      console.error('Lead capture firestore error:', err);
      setCapturedLeads(prev => prev.filter(l => l.id !== leadId));
      return {
        success: false,
        isDraft: leadMaterialConfig.status === 'draft',
        message: 'Não foi possível registrar seu cadastro agora. Tente novamente em instantes.',
        config: leadMaterialConfig
      };
    }

    // A inscrição na newsletter é um bônus do cadastro: se falhar, o lead já
    // está salvo (com o e-mail), então o visitante não recebe erro por isso.
    await subscribeNewsletter(trimmedEmail, 'Segurança de Voo / SGSO');

    const isDraft = leadMaterialConfig.status === 'draft' || !leadMaterialConfig.fileUrl;
    return {
      success: true,
      isDraft,
      message: isDraft
        ? leadMaterialConfig.underConstructionMessage
        : leadMaterialConfig.publishedSuccessMessage,
      config: leadMaterialConfig
    };
  };

  const deleteCapturedLead = async (id: string): Promise<void> => {
    setCapturedLeads(prev => prev.filter(l => l.id !== id));
    try {
      await deleteDoc(doc(db, 'leads', id));
    } catch (err) {
      reportWriteError('Exclusão do lead', err);
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
        console.error('Firestore comments batch sync note:', err);
      }
    }
  };

  // Notification Management Functions
  const markNotificationAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      reportWriteError('Notificação', e);
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
      reportWriteError('Notificações', e);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      reportWriteError('Exclusão da notificação', e);
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
        console.error('Auto badge unlock error:', e);
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
        triggerSiteRebuild,
        lastRebuildAt,
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
        leadMaterialConfig,
        capturedLeads,
        isInitialRemoteSyncDone,
        updateLeadMaterialConfig,
        captureLead,
        deleteCapturedLead,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        checkAndUnlockBadges
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
