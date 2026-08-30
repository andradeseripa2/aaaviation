import React from 'react';
import { CategoryInfo, CategorySlug } from '../types';
import {
  Wrench,
  ShieldAlert,
  GraduationCap,
  Compass,
  Plane,
  Layers,
  BookOpen,
  Sparkles
} from 'lucide-react';

/**
 * Resolves the display name of a category given its slug, id, or name.
 * Respects custom categories created/renamed by the user.
 */
export function resolveCategoryName(
  slugOrName: string | undefined | null,
  categories: CategoryInfo[] = []
): string {
  if (!slugOrName) return 'Geral';

  const clean = slugOrName.trim();

  // 1. Direct match with slug or id
  const foundBySlug = categories.find(
    c => c.slug === clean || c.id === clean || c.id === `cat-${clean}`
  );
  if (foundBySlug?.name) return foundBySlug.name;

  // 2. Match with name (case-insensitive)
  const foundByName = categories.find(
    c => c.name.toLowerCase() === clean.toLowerCase()
  );
  if (foundByName?.name) return foundByName.name;

  // 3. Fallback standard known slugs
  switch (clean.toLowerCase()) {
    case 'manutencao':
    case 'manutenção':
      return 'Manutenção';
    case 'safety':
    case 'seguranca':
    case 'segurança':
    case 'sipaer':
      return 'Safety';
    case 'carreira':
    case 'formacao':
    case 'formação':
      return 'Carreira & Formação';
    case 'curiosidades':
    case 'curiosidade':
      return 'Curiosidades';
    default:
      // If it's a kebab-case slug like 'regulamentacao-anac', format nicely
      if (clean.includes('-')) {
        return clean
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
      return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
}

/**
 * Resolves the canonical slug of a category.
 */
export function resolveCategorySlug(
  slugOrName: string | undefined | null,
  categories: CategoryInfo[] = []
): CategorySlug {
  if (!slugOrName) return 'all';
  const clean = slugOrName.trim();

  const found = categories.find(
    c => c.slug === clean || c.id === clean || c.name.toLowerCase() === clean.toLowerCase()
  );
  if (found) return found.slug;
  return clean as CategorySlug;
}

/**
 * Determines whether a post's category matches the currently selected filter.
 */
export function postMatchesCategory(
  postCategory: string | undefined | null,
  selectedCategory: string | undefined | null,
  categories: CategoryInfo[] = []
): boolean {
  if (!selectedCategory || selectedCategory === 'all') return true;
  if (!postCategory) return false;

  const postSlug = resolveCategorySlug(postCategory, categories);
  const filterSlug = resolveCategorySlug(selectedCategory, categories);

  if (postSlug === filterSlug) return true;
  if (postCategory === selectedCategory) return true;

  const postName = resolveCategoryName(postCategory, categories).toLowerCase();
  const filterName = resolveCategoryName(selectedCategory, categories).toLowerCase();
  return postName === filterName;
}

/**
 * Returns a suitable icon or emoji component for a category.
 */
export function getCategoryVisual(
  slugOrName: string | undefined | null,
  categories: CategoryInfo[] = [],
  className: string = 'w-3.5 h-3.5'
): React.ReactNode {
  if (!slugOrName) {
    return <Plane className={className} />;
  }

  const clean = slugOrName.trim();
  const cat = categories.find(
    c => c.slug === clean || c.id === clean || c.name.toLowerCase() === clean.toLowerCase()
  );

  if (cat?.emoji) {
    return <span className="inline-block leading-none text-xs">{cat.emoji}</span>;
  }

  const slug = (cat?.slug || clean).toLowerCase();

  switch (slug) {
    case 'manutencao':
    case 'manutenção':
      return <Wrench className={`${className} text-[#1D4ED8] dark:text-blue-400`} />;
    case 'safety':
    case 'seguranca':
    case 'segurança':
      return <ShieldAlert className={`${className} text-emerald-600 dark:text-emerald-400`} />;
    case 'carreira':
      return <GraduationCap className={`${className} text-sky-600 dark:text-sky-400`} />;
    case 'curiosidades':
      return <Compass className={`${className} text-amber-600 dark:text-amber-400`} />;
    default:
      return <BookOpen className={`${className} text-blue-600 dark:text-blue-400`} />;
  }
}
