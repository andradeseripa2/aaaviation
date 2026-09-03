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

export interface LeadMaterialConfig {
  status: 'draft' | 'published'; // 'draft' = em construção; 'published' = liberado
  title: string;
  subtitle: string;
  badgeText: string;
  bulletPoints: string[];
  fileUrl?: string; // Link or base64 data url for download
  fileName?: string; // e.g. "Checklist_Auditoria_SGSO_AlexandreAndrade.pdf"
  fileSize?: string; // e.g. "1.8 MB PDF"
  underConstructionMessage: string; // Message shown when status is 'draft'
  publishedSuccessMessage: string; // Message shown when status is 'published'
  emailSubject: string; // Subject for the delivery email
  emailBodyMarkdown: string; // Delivery letter in markdown
  updatedAt?: string;
}

export interface LeadCapture {
  id: string;
  name: string;
  email: string;
  source: string; // 'checklist_sgso'
  postTitle?: string;
  createdAt: string;
  status: 'pending' | 'delivered';
}

export const INITIAL_LEAD_MATERIAL_CONFIG: LeadMaterialConfig = {
  status: 'draft',
  title: 'Checklist de Auditoria & Segurança SGSO',
  subtitle: 'Planilha técnica educativa e guia de verificação rápida com os pilares recomendados da ANAC/OACI para estudos de conformidade, hangaragem e padronização.',
  badgeText: 'Recurso Educacional Gratuito',
  bulletPoints: [
    'Itens críticos de pré-voo, hangaragem e rotinas técnicas',
    'Matriz de Risco Operacional com base na doutrina SIPAER',
    'Formato PDF e XLSX editável para fins educacionais'
  ],
  underConstructionMessage: 'Agradecemos seu interesse! O Checklist de Auditoria & Segurança SGSO está atualmente em fase final de elaboração e revisão técnica pelo especialista Alexandre Andrade. Seu e-mail foi cadastrado com prioridade na lista de espera. Assim que o material for homologado e liberado, você receberá a notificação com acesso imediato.',
  publishedSuccessMessage: 'Material homologado e liberado com sucesso! Você já pode realizar o download imediato do checklist através do botão abaixo.',
  emailSubject: 'Seu Checklist Técnico de Auditoria & Segurança SGSO - Alexandre Andrade Aviation',
  emailBodyMarkdown: `Olá, **{{nome}}**!

Obrigado pelo seu interesse em nossos materiais técnicos e na doutrina de **Segurança Operacional (SGSO / SIPAER)**.

Conforme solicitado no portal **Alexandre Andrade Aviation**, disponibilizamos o seu acesso ao **Checklist Técnico de Auditoria & Segurança SGSO**, estruturado com base nas melhores práticas da OACI, manuais técnicos e regulamentos aplicáveis da ANAC (RBAC).

---

### 📋 O que você encontrará neste material:
- **Rotinas Críticas de Hangar & Linha de Voo**: Verificação de sistemas mecânicos, aviônicos e integridade estrutural.
- **Matriz de Identificação de Perigos & Risco**: Metodologia proativa para avaliação de severidade e probabilidade segundo a doutrina SIPAER.
- **Fatores Humanos & Cultura Justa**: Critérios para prevenção de erros latentes e fortalecimento da comunicação na equipe de manutenção.

---

> ⚠️ **Aviso Doutrinário e Legal**: Este checklist e material técnico possuem finalidade estritamente educativa, conceitual e preventiva. Para qualquer intervenção de manutenção operacional em aeronaves reais, consulte sempre a documentação técnica vigente do fabricante (AMM/SRM/IPC) e as diretrizes regulatórias da autoridade de aviação civil (ANAC/FAA/EASA).

Bons estudos e operações seguras!

Atenciosamente,  
**Alexandre Andrade**  
*Especialista em Manutenção Aeronáutica & Investigador de Acidentes Aeronáuticos (SIPAER)*  
🌐 [aaaviation.com.br](https://aaaviation.com.br) • ✉️ andradeseripa2@gmail.com
`
};

