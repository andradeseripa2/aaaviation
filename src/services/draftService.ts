// Draft management service for storing and restoring unpublished articles safely
export interface PostDraft {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  subcategory?: string;
  technicalBadge?: string;
  coverImage?: string;
  coverImageCaption?: string;
  content: string;
  tags: string;
  readTimeMinutes?: number;
  isSafetyPost?: boolean;
  featured?: boolean;
  scheduledAt?: string;
  notifyNewsletter?: boolean;
  editingPostId?: string | null;
  savedAt: number;
  wordCount: number;
}

const CURRENT_DRAFT_KEY = 'aaa_current_working_draft';
const DRAFTS_HISTORY_KEY = 'aaa_saved_drafts_archive';

export const draftService = {
  // Save or update active working draft
  saveCurrentDraft(data: Omit<PostDraft, 'id' | 'savedAt' | 'wordCount'> & { id?: string }): PostDraft {
    const wordCount = (data.content || '').trim() ? (data.content || '').trim().split(/\s+/).length : 0;
    const draft: PostDraft = {
      ...data,
      id: data.id || (data.editingPostId ? `edit_${data.editingPostId}` : 'current_active_draft'),
      savedAt: Date.now(),
      wordCount
    };

    try {
      localStorage.setItem(CURRENT_DRAFT_KEY, JSON.stringify(draft));
      
      // Also maintain in drafts archive list (up to 10 recent drafts)
      const archive = this.getAllDrafts();
      const existingIndex = archive.findIndex(d => d.id === draft.id || (d.editingPostId && d.editingPostId === draft.editingPostId));
      if (existingIndex >= 0) {
        archive[existingIndex] = draft;
      } else {
        archive.unshift(draft);
      }
      localStorage.setItem(DRAFTS_HISTORY_KEY, JSON.stringify(archive.slice(0, 10)));
    } catch (e) {
      console.warn('Draft save storage note:', e);
    }

    return draft;
  },

  // Retrieve current active draft
  getCurrentDraft(): PostDraft | null {
    try {
      const raw = localStorage.getItem(CURRENT_DRAFT_KEY);
      if (!raw) return null;
      const draft = JSON.parse(raw) as PostDraft;
      // Only consider non-empty drafts
      if (!draft.title?.trim() && !draft.content?.trim()) {
        return null;
      }
      return draft;
    } catch {
      return null;
    }
  },

  // Clear current active draft (e.g. after publishing or explicit discard)
  clearCurrentDraft(draftId?: string) {
    try {
      localStorage.removeItem(CURRENT_DRAFT_KEY);
      if (draftId) {
        const archive = this.getAllDrafts().filter(d => d.id !== draftId);
        localStorage.setItem(DRAFTS_HISTORY_KEY, JSON.stringify(archive));
      }
    } catch {
      // safe fallback
    }
  },

  // Get all saved drafts list
  getAllDrafts(): PostDraft[] {
    try {
      const raw = localStorage.getItem(DRAFTS_HISTORY_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as PostDraft[];
    } catch {
      return [];
    }
  },

  // Delete a specific draft from archive
  deleteDraft(id: string) {
    try {
      const current = this.getCurrentDraft();
      if (current && current.id === id) {
        localStorage.removeItem(CURRENT_DRAFT_KEY);
      }
      const archive = this.getAllDrafts().filter(d => d.id !== id);
      localStorage.setItem(DRAFTS_HISTORY_KEY, JSON.stringify(archive));
    } catch {
      // safe fallback
    }
  }
};
