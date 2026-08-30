import { Post } from '../types';

/**
 * Checks if a post is currently published and visible to regular readers.
 * - If published is false, returns false.
 * - If published is true and scheduledAt is set in the future, returns false.
 * - Otherwise, returns true.
 */
export function isPostPublishedAndActive(post: Post): boolean {
  if (!post.published) return false;
  if (post.scheduledAt) {
    const scheduledTime = new Date(post.scheduledAt).getTime();
    const now = Date.now();
    if (!isNaN(scheduledTime) && scheduledTime > now) {
      return false; // Still in schedule queue
    }
  }
  return true;
}

/**
 * Returns scheduled status info for badges and indicators.
 */
export function getPostScheduleInfo(post: Post): {
  isScheduled: boolean;
  scheduledDateFormatted?: string;
  isPastDue: boolean;
} {
  if (!post.scheduledAt) {
    return { isScheduled: false, isPastDue: false };
  }

  const scheduledTime = new Date(post.scheduledAt).getTime();
  if (isNaN(scheduledTime)) {
    return { isScheduled: false, isPastDue: false };
  }

  const now = Date.now();
  const isPastDue = scheduledTime <= now;

  try {
    const formatted = new Date(post.scheduledAt).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return {
      isScheduled: !isPastDue,
      scheduledDateFormatted: formatted,
      isPastDue
    };
  } catch {
    return { isScheduled: !isPastDue, isPastDue };
  }
}
