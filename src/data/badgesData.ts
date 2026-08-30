export interface AviationBadge {
  id: string;
  name: string;
  description: string;
  category: 'automatic' | 'honorary';
  iconName: string; // Lucide icon identifier
  color: string;    // Tailwind text and bg style token
  bgLight: string;
  borderLight: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const AVAILABLE_BADGES: AviationBadge[] = [
  // 1. Conquistas Automáticas por Atividade Técnica
  {
    id: 'first-flight',
    name: 'Primeiro Voo',
    description: 'Publicou seu primeiro comentário técnico em um artigo.',
    category: 'automatic',
    iconName: 'PlaneTakeoff',
    color: 'text-sky-600 dark:text-sky-400',
    bgLight: 'bg-sky-50 dark:bg-sky-950/60',
    borderLight: 'border-sky-200 dark:border-sky-800',
    rarity: 'common'
  },
  {
    id: 'hangar-debater',
    name: 'Debatedor de Hangar',
    description: 'Participou ativamente com 5 ou mais comentários técnicos.',
    category: 'automatic',
    iconName: 'MessageSquareText',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/60',
    borderLight: 'border-indigo-200 dark:border-indigo-800',
    rarity: 'rare'
  },
  {
    id: 'aviation-specialist',
    name: 'Especialista em Diálogo',
    description: 'Contribuiu com 10 ou mais análises e discussões no portal.',
    category: 'automatic',
    iconName: 'MessagesSquare',
    color: 'text-violet-600 dark:text-violet-400',
    bgLight: 'bg-violet-50 dark:bg-violet-950/60',
    borderLight: 'border-violet-200 dark:border-violet-800',
    rarity: 'epic'
  },
  {
    id: 'safety-guardian',
    name: 'Guardião do SIPAER',
    description: 'Leu e interagiu com artigos da doutrina de Segurança de Voo.',
    category: 'automatic',
    iconName: 'ShieldAlert',
    color: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-950/60',
    borderLight: 'border-amber-200 dark:border-amber-800',
    rarity: 'rare'
  },
  {
    id: 'avid-reader',
    name: 'Leitor Assíduo',
    description: 'Manteve 3 ou mais artigos salvos em sua biblioteca técnica.',
    category: 'automatic',
    iconName: 'BookMarked',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/60',
    borderLight: 'border-emerald-200 dark:border-emerald-800',
    rarity: 'common'
  },

  // 2. Badges Honorárias / Concedidas por Administradores
  {
    id: 'fab-mechanic',
    name: 'Mecânico FAB / Força Aérea',
    description: 'Homenagem honorária a militares e veteranos de manutenção da FAB.',
    category: 'honorary',
    iconName: 'Award',
    color: 'text-blue-700 dark:text-blue-400',
    bgLight: 'bg-blue-50 dark:bg-blue-950/60',
    borderLight: 'border-blue-300 dark:border-blue-700',
    rarity: 'legendary'
  },
  {
    id: 'certified-inspector',
    name: 'Inspetor Homologado',
    description: 'Profissional com CHT ANAC ou ILA reconhecido pela moderação.',
    category: 'honorary',
    iconName: 'ShieldCheck',
    color: 'text-teal-700 dark:text-teal-400',
    bgLight: 'bg-teal-50 dark:bg-teal-950/60',
    borderLight: 'border-teal-300 dark:border-teal-700',
    rarity: 'epic'
  },
  {
    id: 'commercial-pilot',
    name: 'Tripulante / Piloto',
    description: 'Aviador comercial ou privado contribuindo com a visão de cabine.',
    category: 'honorary',
    iconName: 'Compass',
    color: 'text-cyan-700 dark:text-cyan-400',
    bgLight: 'bg-cyan-50 dark:bg-cyan-950/60',
    borderLight: 'border-cyan-300 dark:border-cyan-700',
    rarity: 'rare'
  },
  {
    id: 'top-contributor',
    name: 'Membro Destaque',
    description: 'Reconhecimento especial da administração por alto valor técnico.',
    category: 'honorary',
    iconName: 'Sparkles',
    color: 'text-amber-700 dark:text-amber-300',
    bgLight: 'bg-amber-50 dark:bg-amber-950/60',
    borderLight: 'border-amber-300 dark:border-amber-700',
    rarity: 'legendary'
  },
  {
    id: 'avionics-master',
    name: 'Mestre em Aviônica',
    description: 'Especialista em sistemas aviônicos, radares e instrumentos.',
    category: 'honorary',
    iconName: 'Cpu',
    color: 'text-purple-700 dark:text-purple-400',
    bgLight: 'bg-purple-50 dark:bg-purple-950/60',
    borderLight: 'border-purple-300 dark:border-purple-700',
    rarity: 'epic'
  }
];

export const getBadgeById = (badgeId: string): AviationBadge | undefined => {
  return AVAILABLE_BADGES.find(b => b.id === badgeId);
};
