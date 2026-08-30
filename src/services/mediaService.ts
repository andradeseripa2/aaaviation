// Service for uploading, compressing, storing, resolving, and sanitizing article images
// Uses RAM Cache + IndexedDB + Firestore + Server-side persistent storage to eliminate giant base64 pollution

import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface UploadedMediaResult {
  url: string;
  dataUrl?: string;
  mediaId: string;
  name: string;
  width?: number;
  height?: number;
}

export interface AviationImagePreset {
  id: string;
  title: string;
  category: string;
  url: string;
  caption: string;
  tags: string[];
}

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'manutencao': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
  'carreira-formacao': 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1200&q=80',
  'safety': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
  'curiosidades': 'https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&w=1200&q=80',
  'informacao': 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80',
  'default': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80'
};

export function getAviationFallbackImage(category?: string | null): string {
  if (!category) return CATEGORY_FALLBACK_IMAGES.default;
  const normalized = category.toLowerCase().trim();
  return CATEGORY_FALLBACK_IMAGES[normalized] || CATEGORY_FALLBACK_IMAGES.default;
}

// Curated technical aviation images for 1-click insertion without requiring external uploads or links
export const AVIATION_PRESET_IMAGES: AviationImagePreset[] = [
  {
    id: 'cfm56-turbine',
    title: 'Inspeção de Palhetas CFM56',
    category: 'Motores & Turbinas',
    url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
    caption: 'Figura: Pás do rotor de alta pressão em inspeção visual e boroscópica.',
    tags: ['motor', 'turbina', 'boroscopia', 'palhetas']
  },
  {
    id: 'hangar-maintenance',
    title: 'Hangar de Manutenção Pesada',
    category: 'Manutenção & Hangar',
    url: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1200&q=80',
    caption: 'Figura: Aeronave em check estrutural no hangar de manutenção.',
    tags: ['hangar', 'check', 'manutencao', 'estrutura']
  },
  {
    id: 'glass-cockpit',
    title: 'Painel Aviônico & Glass Cockpit',
    category: 'Aviônica & Sistemas',
    url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80',
    caption: 'Figura: Painel aviônico digital com instrumentos integrados EFIS e FMS.',
    tags: ['avionica', 'cockpit', 'painel', 'instrumentos']
  },
  {
    id: 'landing-gear',
    title: 'Conjunto do Trem de Pouso & Freios',
    category: 'Sistemas Hidráulicos & Trem',
    url: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1200&q=80',
    caption: 'Figura: Conjunto de atuadores hidráulicos, amortecedor telescópico e freios.',
    tags: ['trem de pouso', 'hidraulica', 'freios', 'pneus']
  },
  {
    id: 'wing-structure',
    title: 'Estrutura Alar & Flaps',
    category: 'Célula & Aerodinâmica',
    url: 'https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&w=1200&q=80',
    caption: 'Figura: Extensão de superfícies hipersustentadoras (flaps e slats) na asa.',
    tags: ['asa', 'aerodinamica', 'flaps', 'celula']
  },
  {
    id: 'flight-deck-night',
    title: 'Operação Noturna & Instrumentação',
    category: 'Segurança & Operações',
    url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
    caption: 'Figura: Cockpit em operação IFR noturna e monitoramento de sistemas.',
    tags: ['seguranca', 'ifr', 'noite', 'operacao']
  },
  {
    id: 'turbofan-cutaway',
    title: 'Corte Técnico de Motor a Reação',
    category: 'Motores & Propulsão',
    url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
    caption: 'Figura: Detalhe mecânico das seções do compressor e câmara de combustão.',
    tags: ['motor', 'propulsao', 'mecanica', 'compressor']
  }
];

// In-browser memory cache for instantaneous zero-latency preview
const localMediaCache = new Map<string, string>();

// IndexedDB persistence configuration
const DB_NAME = 'AviationMediaDB_v2';
const DB_STORE = 'media_files';

function openIndexedDB(): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

// Store media in IndexedDB
async function setIndexedDBMedia(id: string, dataUrl: string) {
  try {
    const db = await openIndexedDB();
    if (!db) return;
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.put({ id, dataUrl, createdAt: Date.now() });
  } catch (e) {
    console.warn('IndexedDB write note:', e);
  }
}

// Load all saved IndexedDB media into memory on startup
if (typeof window !== 'undefined') {
  openIndexedDB().then(db => {
    if (!db) return;
    try {
      const tx = db.transaction(DB_STORE, 'readonly');
      const store = tx.objectStore(DB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        for (const item of items) {
          if (item && item.id && item.dataUrl) {
            localMediaCache.set(item.id, item.dataUrl);
            if (!item.id.startsWith('/api/media/')) {
              localMediaCache.set(`/api/media/${item.id}`, item.dataUrl);
            }
          }
        }
      };
    } catch {
      // safe fallback
    }
  });

  // Also load small localStorage fallback keys
  try {
    const cachedKeys = Object.keys(localStorage).filter(k => k.startsWith('aaa_media_'));
    for (const k of cachedKeys) {
      const rawUrl = k.replace('aaa_media_', '');
      const val = localStorage.getItem(k);
      if (val) {
        localMediaCache.set(rawUrl, val);
        if (!rawUrl.startsWith('/api/media/')) {
          localMediaCache.set(`/api/media/${rawUrl}`, val);
        }
      }
    }
  } catch {
    // Storage fallback
  }
}

export function saveToLocalMediaCache(key: string, dataUrl: string, name?: string): Promise<void> {
  if (!key || !dataUrl) return Promise.resolve();
  const cleanId = key.replace(/^\/api\/media\//, '').replace(/^media:/, '').trim();
  
  localMediaCache.set(cleanId, dataUrl);
  localMediaCache.set(key, dataUrl);
  localMediaCache.set(`/api/media/${cleanId}`, dataUrl);
  localMediaCache.set(`media:${cleanId}`, dataUrl);
  
  // 1. Persist to IndexedDB (safe for high-resolution images in browser)
  setIndexedDBMedia(cleanId, dataUrl);

  // 2. Persist to Firestore media collection for cross-device & cloud synchronization
  let firestorePromise = Promise.resolve();
  try {
    if (db && cleanId) {
      firestorePromise = setDoc(
        doc(db, 'media', cleanId),
        {
          id: cleanId,
          dataUrl,
          name: name || cleanId,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      ).catch(err => {
        console.warn('Firestore setDoc media note:', err);
      });
    }
  } catch (err) {
    console.warn('Firestore media save note:', err);
  }

  // 3. Send to Express backend /api/media/upload
  try {
    fetch('/api/media/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: dataUrl,
        name: name || cleanId,
        mediaId: cleanId,
        mimeType: 'image/webp'
      })
    }).catch(() => {});
  } catch {
    // silent
  }

  // 4. Sync to localStorage if small
  try {
    if (dataUrl.length < 80000) {
      localStorage.setItem(`aaa_media_${cleanId}`, dataUrl);
    }
  } catch {
    // quota safe
  }

  return firestorePromise;
}

/**
 * Asynchronously retrieves image dataUrl from Memory -> IndexedDB -> Firestore -> Server
 */
export async function getMediaDataUrl(urlOrId: string): Promise<string | null> {
  if (!urlOrId) return null;
  const cleanId = urlOrId.replace(/^\/api\/media\//, '').replace(/^media:/, '').trim();

  // 1. Memory cache
  if (localMediaCache.has(cleanId)) {
    return localMediaCache.get(cleanId)!;
  }
  if (localMediaCache.has(urlOrId)) {
    return localMediaCache.get(urlOrId)!;
  }

  // 2. IndexedDB
  try {
    const dbInstance = await openIndexedDB();
    if (dbInstance) {
      const tx = dbInstance.transaction(DB_STORE, 'readonly');
      const store = tx.objectStore(DB_STORE);
      const req = store.get(cleanId);
      const result = await new Promise<{ dataUrl: string } | null>(resolve => {
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (result && result.dataUrl) {
        saveToLocalMediaCache(cleanId, result.dataUrl);
        return result.dataUrl;
      }
    }
  } catch {
    // IndexedDB error fallback
  }

  // 3. Firestore Cloud Database
  try {
    if (db && cleanId) {
      const snap = await getDoc(doc(db, 'media', cleanId));
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.dataUrl) {
          localMediaCache.set(cleanId, data.dataUrl);
          localMediaCache.set(`/api/media/${cleanId}`, data.dataUrl);
          setIndexedDBMedia(cleanId, data.dataUrl);
          return data.dataUrl;
        }
      }
    }
  } catch (err) {
    console.warn('Firestore media fetch note:', err);
  }

  // 4. Server API /api/media/ fallback
  try {
    const response = await fetch(`/api/media/${encodeURIComponent(cleanId)}`);
    if (response.ok) {
      const blob = await response.blob();
      const reader = new FileReader();
      const dataUrl = await new Promise<string | null>(resolve => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      if (dataUrl) {
        saveToLocalMediaCache(cleanId, dataUrl);
        return dataUrl;
      }
    }
  } catch {}

  return null;
}

/**
 * React Hook that seamlessly resolves an image URL or /api/media token
 * Starts with synchronous resolveImageUrl and fetches from Firestore / IndexedDB asynchronously
 */
export function useResolvedImageUrl(
  urlOrId: string | null | undefined,
  categoryOrFallback?: string | null
): string {
  const initial = resolveImageUrl(urlOrId, categoryOrFallback);
  const [resolvedUrl, setResolvedUrl] = useState<string>(initial);

  useEffect(() => {
    let isMounted = true;
    const currentResolved = resolveImageUrl(urlOrId, categoryOrFallback);
    setResolvedUrl(currentResolved);

    if (
      urlOrId &&
      (urlOrId.startsWith('/api/media/') || urlOrId.startsWith('media:')) &&
      !currentResolved.startsWith('data:')
    ) {
      getMediaDataUrl(urlOrId).then(dataUrl => {
        if (isMounted && dataUrl) {
          setResolvedUrl(dataUrl);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [urlOrId, categoryOrFallback]);

  return resolvedUrl;
}

/**
 * Compresses an image File or Blob using HTML5 Canvas
 * Reduces resolution to max 1280px and converts to WebP/JPEG
 */
export async function compressImage(
  file: File | Blob,
  maxDimension = 1280,
  quality = 0.82
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler arquivo da imagem'));
    reader.onload = e => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem inválido'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({ dataUrl: e.target?.result as string, width, height });
        }

        // Clean high quality anti-aliasing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve({ dataUrl, width, height });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image, compressing it to ultra-efficient WebP
 * Returns self-contained portable image URL so it displays anywhere (Cloud Run, shared URLs, offline)
 */
export async function uploadImageMedia(
  file: File | Blob,
  customName = 'figura_artigo'
): Promise<UploadedMediaResult> {
  const { dataUrl, width, height } = await compressImage(file, 1280, 0.82);
  const cleanName = (customName || 'figura')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 25);

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const mediaId = `img_${timestamp}_${randomSuffix}_${cleanName}.webp`;
  const cleanUrl = `/api/media/${mediaId}`;

  // 1. Immediately store in local memory cache & IndexedDB
  saveToLocalMediaCache(mediaId, dataUrl);
  saveToLocalMediaCache(cleanUrl, dataUrl);

  // 2. Also send to Express backend /api/media/upload for server-side disk caching
  try {
    fetch('/api/media/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: dataUrl,
        name: cleanName,
        mimeType: 'image/webp'
      })
    }).catch(() => {});
  } catch {
    // silent
  }

  // Return clean URL for concise markdown syntax and dataUrl for offline/direct usage
  return {
    url: cleanUrl,
    dataUrl,
    mediaId,
    name: customName,
    width,
    height
  };
}

/**
 * Resolves an image URL or local media token for rendering
 * If broken or missing, falls back to a curated aviation image
 */
export function resolveImageUrl(url: string | undefined | null, categoryOrFallback?: string | null): string {
  if (!url || !url.trim()) {
    return getAviationFallbackImage(categoryOrFallback);
  }
  const trimmed = url.trim();

  // If already a valid web URL or data URI, return directly
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('//')) {
    return trimmed;
  }

  // If in local memory cache
  if (localMediaCache.has(trimmed)) {
    return localMediaCache.get(trimmed)!;
  }

  // If it's a media endpoint like /api/media/img_...
  if (trimmed.startsWith('/api/media/')) {
    const key = trimmed.replace('/api/media/', '');
    if (localMediaCache.has(key)) {
      return localMediaCache.get(key)!;
    }
    // Return relative URL for server to handle, but caller's onError will catch if missing
    return trimmed;
  }

  // If it's a media token media:img_...
  if (trimmed.startsWith('media:')) {
    const key = trimmed.replace('media:', '');
    if (localMediaCache.has(key)) {
      return localMediaCache.get(key)!;
    }
    if (localMediaCache.has(`/api/media/${key}`)) {
      return localMediaCache.get(`/api/media/${key}`)!;
    }
    return getAviationFallbackImage(categoryOrFallback);
  }

  return trimmed || getAviationFallbackImage(categoryOrFallback);
}

/**
 * Sanitizes markdown content:
 * Detects any giant inline base64 images `![alt](data:image/...;base64,...)` or raw `(data:image/...)`
 * Automatically extracts the base64, saves to persistent media cache,
 * and replaces the giant base64 text with a clean short URL `/api/media/figura_salva_xxx.webp`!
 */
export function sanitizeMarkdownImages(content: string): { sanitized: string; cleanedCount: number } {
  if (!content || !content.includes('data:image/')) {
    return { sanitized: content, cleanedCount: 0 };
  }

  let cleanedCount = 0;
  // Match ![alt](data:image/...;base64,...) or ![](data:image/...) across potential line breaks
  const base64ImgRegex = /!\[(.*?)\]\(\s*(data:image\/[a-zA-Z0-9.+_-]+;base64,[A-Za-z0-9+/=\s]+?)\s*\)/g;

  const sanitized = content.replace(base64ImgRegex, (match, alt, base64Url) => {
    cleanedCount++;
    const cleanBase64 = base64Url.replace(/\s+/g, ''); // remove any rogue whitespace/newlines
    const cleanAlt = (alt || 'Figura Técnica').trim();
    const shortHash = Math.abs(cleanBase64.slice(0, 100).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(36);
    const mediaId = `figura_${shortHash}_${Date.now().toString(36)}.webp`;
    const cleanUrl = `/api/media/${mediaId}`;

    // Save to persistent storage
    saveToLocalMediaCache(mediaId, cleanBase64);
    saveToLocalMediaCache(cleanUrl, cleanBase64);

    return `![${cleanAlt}](${cleanUrl})`;
  });

  return { sanitized, cleanedCount };
}

/**
 * Ensures all media (content images and cover image) in a post are synchronized to Firestore
 */
export async function persistPostMedia(
  content: string,
  coverImage?: string,
  postTitle = 'Artigo'
): Promise<{ sanitizedContent: string; resolvedCover: string }> {
  // 1. Sanitize content and extract any inline base64
  let { sanitized: sanitizedContent } = sanitizeMarkdownImages(content || '');

  // 2. Scan all /api/media/ references in content to ensure cloud sync
  const mediaRefs = sanitizedContent.match(/\/api\/media\/[a-zA-Z0-9._-]+/g) || [];
  const syncPromises: Promise<any>[] = [];

  for (const ref of mediaRefs) {
    const cleanId = ref.replace('/api/media/', '').trim();
    if (cleanId) {
      const dataUrl = localMediaCache.get(cleanId) || localMediaCache.get(ref);
      if (dataUrl) {
        syncPromises.push(saveToLocalMediaCache(cleanId, dataUrl, `Figura ${postTitle}`));
      }
    }
  }

  // 3. Process Cover Image - ensure cloud persistence for cross-device sync
  let resolvedCover = (coverImage || '').trim();
  if (resolvedCover) {
    if (resolvedCover.startsWith('data:image/')) {
      const shortHash = Math.abs(resolvedCover.slice(0, 100).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(36);
      const mediaId = `cover_${shortHash}_${Date.now().toString(36)}.webp`;
      syncPromises.push(saveToLocalMediaCache(mediaId, resolvedCover, `Capa ${postTitle}`));
      syncPromises.push(saveToLocalMediaCache(`/api/media/${mediaId}`, resolvedCover, `Capa ${postTitle}`));
      resolvedCover = `/api/media/${mediaId}`;
    } else if (resolvedCover.startsWith('/api/media/') || resolvedCover.startsWith('media:')) {
      const cleanId = resolvedCover.replace(/^\/api\/media\//, '').replace(/^media:/, '').trim();
      const cachedData = localMediaCache.get(cleanId) || localMediaCache.get(resolvedCover);
      if (cachedData) {
        syncPromises.push(saveToLocalMediaCache(cleanId, cachedData, `Capa ${postTitle}`));
      }
    }
  }

  if (syncPromises.length > 0) {
    try {
      await Promise.allSettled(syncPromises);
    } catch {}
  }

  return { sanitizedContent, resolvedCover };
}
