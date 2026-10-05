import { Question, GameTheme } from '../types';
import { DEFAULT_QUESTIONS, PRESET_THEMES } from '../defaultQuestions';

const STORAGE_KEYS = {
  QUESTIONS: 'copa_sgq_questions_v3',
  THEME: 'copa_sgq_theme_v4',
  WEBHOOK: 'copa_sgq_webhook',
  PLAYED_EMAILS: 'copa_sgq_played_emails',
};

const DATA_UPDATED_EVENT = 'copa_sgq_data_updated';

export const storageService = {
  getQuestions(): Question[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].respostas) {
          // Normalize ativo field (defaults to true)
          return parsed.map((q) => ({
            ...q,
            ativo: q.ativo !== false,
          }));
        }
      }
    } catch (e) {
      console.error('Error loading questions from localStorage:', e);
    }
    return DEFAULT_QUESTIONS.map((q) => ({ ...q, ativo: true }));
  },

  getActiveQuestions(): Question[] {
    const all = this.getQuestions();
    const active = all.filter((q) => q.ativo !== false);
    // Safety check: if no questions are active, return all
    return active.length > 0 ? active : all;
  },

  saveQuestions(questions: Question[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
      this.notifyUpdate();
    } catch (e) {
      console.error('Error saving questions to localStorage:', e);
    }
  },

  getTheme(): GameTheme {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.error('Error loading theme from localStorage:', e);
    }
    return PRESET_THEMES[0];
  },

  saveTheme(theme: GameTheme): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(theme));
      this.notifyUpdate();
    } catch (e) {
      console.error('Error saving theme to localStorage:', e);
    }
  },

  getWebhookUrl(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.WEBHOOK) || '';
    } catch {
      return '';
    }
  },

  saveWebhookUrl(url: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WEBHOOK, url.trim());
      this.notifyUpdate();
    } catch (e) {
      console.error('Error saving webhook to localStorage:', e);
    }
  },

  getPlayedEmails(): string[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYED_EMAILS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },

  recordPlayedEmail(email: string): void {
    if (!email || !email.trim()) return;
    const cleanEmail = email.trim().toLowerCase();
    try {
      const list = this.getPlayedEmails();
      if (!list.includes(cleanEmail)) {
        list.push(cleanEmail);
        localStorage.setItem(STORAGE_KEYS.PLAYED_EMAILS, JSON.stringify(list));
      }
    } catch (e) {
      console.error('Error recording played email:', e);
    }
  },

  clearPlayedEmails(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PLAYED_EMAILS);
      this.notifyUpdate();
    } catch (e) {
      console.error('Error clearing played emails:', e);
    }
  },

  notifyUpdate(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(DATA_UPDATED_EVENT));
    }
  },

  subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(DATA_UPDATED_EVENT, callback);
    window.addEventListener('storage', callback);
    return () => {
      window.removeEventListener(DATA_UPDATED_EVENT, callback);
      window.removeEventListener('storage', callback);
    };
  },
};
