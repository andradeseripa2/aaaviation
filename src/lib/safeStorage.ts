/**
 * Safe local storage utility with QuotaExceededError protection.
 * Prevents application crashes when localStorage is full or disabled.
 */

export const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Error reading key "${key}":`, err);
    return null;
  }
};

export const safeGetJSON = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[SafeStorage] Error parsing JSON for key "${key}":`, err);
    return fallback;
  }
};

export const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[SafeStorage] Quota or storage error setting key "${key}":`, err?.message || err);
    
    // If quota exceeded, try cleaning up non-essential keys first
    try {
      // Clean temporary or less critical caches
      const nonCriticalKeys = [
        'aaa_posts_v2',
        'aaa_comments_v2',
        'aaa_seed_applied_v2',
        'aaa_ratings_v1'
      ];
      
      // If we are setting something else or trying to free space
      if (key !== 'aaa_posts_v2') {
        localStorage.removeItem('aaa_posts_v2');
      }
      
      // Retry once after clearing cache
      localStorage.setItem(key, value);
      return true;
    } catch {
      // Gracefully fail silently so the app remains fully functional with Firestore / React state
      return false;
    }
  }
};

export const safeSetJSON = <T>(key: string, value: T): boolean => {
  try {
    const serialized = JSON.stringify(value);
    return safeSetItem(key, serialized);
  } catch (err) {
    console.warn(`[SafeStorage] Error serializing JSON for key "${key}":`, err);
    return false;
  }
};

export const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Error removing key "${key}":`, err);
  }
};
