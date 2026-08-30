import { Post, CategoryInfo, Comment, User, AboutPageData } from '../types';

export const INITIAL_CATEGORIES: CategoryInfo[] = [
  {
    id: 'cat-manutencao',
    name: 'Manutenção',
    slug: 'manutencao',
    description: 'Rotinas, certificações, MRO e casos práticos no universo da manutenção de aeronaves.',
    iconName: 'Wrench',
    emoji: '🔧',
    count: 0
  },
  {
    id: 'cat-carreira',
    name: 'Carreira & Formação',
    slug: 'carreira',
    description: 'Trajetória profissional, certificações CHT, formação técnica e ingresso no setor aeronáutico.',
    iconName: 'GraduationCap',
    emoji: '🎓',
    count: 0
  },
  {
    id: 'cat-safety',
    name: 'Safety',
    slug: 'safety',
    description: 'Cultura de segurança, investigação de acidentes aeronáuticos, fatores humanos e SIPAER.',
    iconName: 'ShieldAlert',
    emoji: '🛡️',
    count: 0
  },
  {
    id: 'cat-curiosidades',
    name: 'Curiosidades',
    slug: 'curiosidades',
    description: 'Física do voo, engenharia aeronáutica, fatos históricos e análises técnicas fascinantes.',
    iconName: 'Compass',
    emoji: '🧭',
    count: 0
  }
];

export const AUTHOR_ALEXANDRE: User = {
  id: 'usr-admin-alexandre',
  name: 'Alexandre Andrade',
  email: 'andradeseripa2@gmail.com',
  role: 'admin',
  avatar: '/author.webp',
  title: 'Especialista em Manutenção de Aeronaves & Investigador SIPAER',
  bio: 'Mais de uma década de experiência na Força Aérea Brasileira (FAB). Atuação técnica e inspeção nos modelos C-95 Bandeirante (E110), C-97 Brasília (E120) e F-5 Tiger II. Formação de Inspetor de Aeronaves pelo ILA e Elemento Credenciado SIPAER para investigação de acidentes aeronáuticos.',
  createdAt: '2025-01-01T00:00:00Z'
};

export const INITIAL_USERS: User[] = [];

export const INITIAL_POSTS: Post[] = [];

export const INITIAL_COMMENTS: Comment[] = [];

export const INITIAL_ABOUT_PAGE_DATA: AboutPageData = {
  heroBadge: 'Perfil Técnico & Biografia',
  authorName: 'Alexandre Andrade',
  heroHighlight:
    'Profissional com sólida trajetória na Força Aérea Brasileira (FAB). Especialista em manutenção aeronáutica e mecânica de voo, com foco em excelência operacional e rigor técnico.',
  bioParagraphs: [
    'A carreira foi forjada no ambiente de alta exigência da aviação militar, onde a precisão não é apenas desejada, mas vital. A experiência abrange desde a manutenção de linha de voo até inspeções profundas de hangar e investigações complexas de segurança de voo.',
    'Atuou ativamente na gestão de operações aéreas — no planejamento minucioso de missões, controle de horas de voo e gerenciamento de disponibilidade de frota.'
  ],
  photoUrl: '/author.webp',
  photoBadge: 'INSPETOR ILA • SIPAER',
  photoSubtitle: 'Força Aérea Brasileira & Segurança de Voo',

  homeAuthorityTag: 'Autor & Editor',
  homeAuthorityTitle: 'Alexandre Andrade',
  homeAuthorityRole: 'Especialista em Manutenção Aeronáutica & Investigação SIPAER',
  homeAuthorityBio:
    'Mais de 20 anos de vivência técnica na Força Aérea Brasileira e aviação civil, dedicados à manutenção estrutural, motores, fatores humanos e segurança de voo.',
  homeAuthorityBadgeText: 'Doutrina Técnica & Hangar',
  homeAuthorityButtonText: 'Ver Trajetória Completa',

  pillar1Title: 'Certificação SIPAER',
  pillar1Description:
    'Certificado pelo Sistema de Investigação e Prevenção de Acidentes Aeronáuticos. Foco em metodologias analíticas para identificação de fatores contribuintes e mitigação de riscos sistêmicos, sob os princípios universais da Cultura Justa (Just Culture).',
  pillar1FooterLeft: 'Elemento Credenciado',
  pillar1FooterRight: 'Investigação e Prevenção',

  pillar2Title: 'Investigação & Prevenção',
  pillar2Description:
    'A autoridade em segurança de voo é construída através da análise metódica. O compromisso é com a verdade técnica, dissecando cada incidente para extrair lições estruturais que fortalecem a resiliência operacional da aviação.',
  pillar2FooterLeft: 'Prevenção Sistêmica',
  pillar2FooterRight: 'Técnica & Não-Punitiva',

  aircraftSectionTitle: 'Modelos de Aeronaves & Experiência Prática',
  aircraftSectionSubtitle:
    'Vivência técnica em vetores turboélice, transporte pressurizado e caça a jato da FAB',
  aircraftList: [
    {
      id: 'ac-c95',
      model: 'C-95 Bandeirante (EMB-110)',
      role: 'Transporte Leve & Ligação FAB',
      details:
        'Experiência em célula, motores turboélice PT6A, sistemas elétricos e inspeções de 100h/300h.',
      imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'ac-c97',
      model: 'C-97 Brasília (EMB-120)',
      role: 'Transporte Executivo & VIP FAB',
      details:
        'Aeronave pressurizada, turbinas PW118, aviônica digitalizada e gerenciamento de sistemas complexos.',
      imageUrl: 'https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'ac-f5',
      model: 'F-5 Tiger II (F-5M)',
      role: 'Caça Supersônico de Defesa Aérea',
      details:
        'Rigor militar absoluto em turbojatos GE J85, sistemas de controle de voo hidromecânicos e armas.',
      imageUrl: 'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?auto=format&fit=crop&w=800&q=80'
    }
  ],

  credentialsSectionTitle: 'Credenciais e Formação Profissional',
  credentialsList: [
    'Mais de uma década de serviço dedicado na Força Aérea Brasileira (FAB)',
    'Formação como Inspetor de Aeronaves pelo ILA (Instituto de Logística da Aeronáutica)',
    'Elemento Credenciado SIPAER (Investigação e Prevenção de Acidentes Aeronáuticos)',
    'Experiência em Gestão de Operações Aéreas, Controle de Horas e Escalas Técnicas',
    'Conhecimento aprofundado dos RBACs da ANAC, manuais AMM, CMM, SRM e filosofia MSG-3'
  ],

  ctaTitle: 'Quer conversar sobre consultoria ou segurança de voo?',
  ctaSubtitle:
    'Entre em contato para palestras, consultorias técnicas e análises especializadas.',
  ctaButtonText: 'Fale Conosco'
};

export const INITIAL_CONTACT_INFO: import('../types').ContactInfoData = {
  email: 'andradeseripa2@gmail.com',
  phoneWhatsapp: '5511999999999',
  linkedinUrl: 'https://www.linkedin.com/in/alexandre-andrade-389360144/',
  instagramUrl: 'https://www.instagram.com/alexandre.andrade',
  location: 'Brasil • Atuação Nacional',
  responseTime: 'Resposta média em até 24h úteis'
};

