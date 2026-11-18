import {
  Question,
  GameTheme,
  AttemptRecord,
  ChampionConfig,
  RemoteCompetitionConfig,
  GoldenKickScenario,
  GoldenKickEvaluation,
} from '../types';
import { DEFAULT_QUESTIONS, PRESET_THEMES } from '../defaultQuestions';

const STORAGE_KEYS = {
  QUESTIONS: 'copa_sgq_questions_2026_official',
  THEME: 'copa_sgq_theme_v4',
  WEBHOOK: 'copa_sgq_webhook',
  PLAYED_EMAILS: 'copa_sgq_played_emails',
  ATTEMPTS: 'copa_sgq_attempts_v1',
  VAR_QUESTION: 'copa_sgq_var_question_18_v1',
  CHAMPION_RELEASE: 'copa_sgq_champion_release_v1',
  REMOTE_CONFIG: 'copa_sgq_remote_config_v1',
  DAY19_QUESTIONS: 'copa_sgq_day19_questions_v1',
  DAY19_EVALUATIONS: 'copa_sgq_day19_evaluations_v1',
};

export const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxqrWZt9-0r3TvJzI8yTTzkiULnTcxIulZsUTH6oB0tFlf_lkAc0K0SbXcosq6Cnqc/exec';

export const DEFAULT_VAR_QUESTION_TEXT =
  'CENÁRIO DE DESEMPATE (VAR): Um processo essencial do seu setor depende de apenas um colaborador, que sairá de férias na próxima semana, enquanto um associado aguarda atendimento dentro do prazo previsto na Política da Qualidade. Descreva 3 ações práticas que você executaria hoje — incluindo o que registraria no SIG Sistem — para tratar esse risco, garantir a continuidade do processo e cumprir os Valores e a Política da Qualidade da ACIM.';

export const DEFAULT_DAY19_SCENARIOS: GoldenKickScenario[] = [
  {
    id: 'FINAL-01',
    title: 'Cenário 1 — Desorganização, Dados Perdidos & Ocorrência no SIG Sistem',
    themesCrossed: ['5S & Gestão da Informação', 'Não Conformidades', 'Atendimento', 'SIG Sistem'],
    context:
      'Durante o atendimento a um associado, um colaborador percebe que documentos importantes ficaram espalhados na mesa sem arquivamento padrão, uma versão desatualizada de formulário foi utilizada e uma reclamação anterior do mesmo associado não havia sido registrada nem tratada no SIG Sistem.',
    customFields: [
      { id: 'diagnostico', label: '1. Diagnóstico e temas do SGQ violados', placeholder: 'Identifique os pontos críticos e os pilares do SGQ envolvidos...' },
      { id: 'contencao', label: '2. Contenção imediata no SIG Sistem / ACIM', placeholder: 'O que fazer imediatamente na rotina e dentro do SIG Sistem...' },
      { id: 'acaoPreventiva', label: '3. Ação preventiva e melhoria sistêmica', placeholder: 'Como evitar que o problema se repita entre os setores...' },
    ],
    fields: {
      diagnosticoLabel: '1. Diagnóstico e temas do SGQ violados',
      contencaoLabel: '2. Contenção imediata no SIG Sistem / ACIM',
      acaoPreventivaLabel: '3. Ação preventiva e melhoria sistêmica',
    },
  },
  {
    id: 'FINAL-02',
    title: 'Cenário 2 — Meta Abaixo do Esperado, Dependência de Pessoa & Propósito',
    themesCrossed: ['Objetivos e Indicadores', 'Gestão de Riscos', 'Missão, Visão, Valores & Política', 'SIG Sistem'],
    context:
      'Um indicador estratégico do setor fechou 3 meses seguidos abaixo da meta. Ao investigar, a equipe descobriu que apenas uma pessoa sabia gerar os dados no SIG Sistem, saiu de férias sem deixar manual atualizado, e ninguém havia registrado esse risco ou revisado os compromissos da Política da Qualidade.',
    customFields: [
      { id: 'diagnostico', label: '1. Diagnóstico e temas do SGQ violados', placeholder: 'Identifique os pontos críticos e os pilares do SGQ envolvidos...' },
      { id: 'contencao', label: '2. Contenção imediata no SIG Sistem / ACIM', placeholder: 'O que fazer imediatamente na rotina e dentro do SIG Sistem...' },
      { id: 'acaoPreventiva', label: '3. Ação preventiva e melhoria sistêmica', placeholder: 'Como evitar que o problema se repita entre os setores...' },
    ],
    fields: {
      diagnosticoLabel: '1. Diagnóstico e temas do SGQ violados',
      contencaoLabel: '2. Contenção imediata no SIG Sistem / ACIM',
      acaoPreventivaLabel: '3. Ação preventiva e melhoria sistêmica',
    },
  },
  {
    id: 'FINAL-03',
    title: 'Cenário 3 — Mudança Sem Aviso Entre Setores & Dados Pessoais (LGPD)',
    themesCrossed: ['Visão Sistêmica & Melhoria Contínua', 'Atendimento', 'LGPD', 'SIG Sistem'],
    context:
      'Um setor alterou o fluxo de encaminhamento de fichas cadastrais de associados no SIG Sistem sem avisar o departamento vizinho e passou a compartilhar uma planilha com CPF, telefone e e-mail em grupo aberto de mensagens para agilizar os retornos.',
    customFields: [
      { id: 'diagnostico', label: '1. Diagnóstico e temas do SGQ violados', placeholder: 'Identifique os pontos críticos e os pilares do SGQ envolvidos...' },
      { id: 'contencao', label: '2. Contenção imediata no SIG Sistem / ACIM', placeholder: 'O que fazer imediatamente na rotina e dentro do SIG Sistem...' },
      { id: 'acaoPreventiva', label: '3. Ação preventiva e melhoria sistêmica', placeholder: 'Como evitar que o problema se repita entre os setores...' },
    ],
    fields: {
      diagnosticoLabel: '1. Diagnóstico e temas do SGQ violados',
      contencaoLabel: '2. Contenção imediata no SIG Sistem / ACIM',
      acaoPreventivaLabel: '3. Ação preventiva e melhoria sistêmica',
    },
  },
];

const DATA_UPDATED_EVENT = 'copa_sgq_data_updated';

export const storageService = {
  getQuestions(): Question[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 25 && parsed[0].respostas) {
          return parsed.map((q) => ({
            ...q,
            ativo: q.ativo !== false,
          }));
        }
      }
    } catch (e) {
      console.error('Error loading questions from localStorage:', e);
    }
    const defaultList = DEFAULT_QUESTIONS.map((q) => ({ ...q, ativo: true }));
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(defaultList));
    } catch {}
    return defaultList;
  },

  getActiveQuestions(): Question[] {
    const all = this.getQuestions();
    const active = all.filter((q) => q.ativo !== false);
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

  getVarQuestion(): string {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VAR_QUESTION);
      if (saved && saved.trim().length > 0) {
        return saved.trim();
      }
    } catch {}
    return DEFAULT_VAR_QUESTION_TEXT;
  },

  saveVarQuestion(questionText: string): void {
    try {
      const clean = questionText.trim();
      if (clean) {
        localStorage.setItem(STORAGE_KEYS.VAR_QUESTION, clean);
      } else {
        localStorage.removeItem(STORAGE_KEYS.VAR_QUESTION);
      }
      this.notifyUpdate();
    } catch (e) {
      console.error('Error saving VAR question to localStorage:', e);
    }
  },

  resetVarQuestion(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.VAR_QUESTION);
      this.notifyUpdate();
    } catch (e) {
      console.error('Error resetting VAR question:', e);
    }
  },

  getRemoteConfig(): RemoteCompetitionConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REMOTE_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.eliminatedEmails)) {
          return {
            eliminatedEmails: parsed.eliminatedEmails.map((e: string) => String(e).trim().toLowerCase()),
            championEmail: String(parsed.championEmail || '').trim().toLowerCase(),
            championName: String(parsed.championName || '').trim(),
            isChampionReleased: Boolean(parsed.isChampionReleased),
            crownedAt: parsed.crownedAt ? String(parsed.crownedAt) : undefined,
          };
        }
      }
    } catch {}
    return {
      eliminatedEmails: [],
      championEmail: '',
      championName: '',
      isChampionReleased: false,
    };
  },

  saveRemoteConfig(config: RemoteCompetitionConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REMOTE_CONFIG, JSON.stringify(config));
      this.notifyUpdate();
    } catch (e) {
      console.error('Error saving remote config:', e);
    }
  },

  getDay19Questions(): GoldenKickScenario[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAY19_QUESTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_DAY19_SCENARIOS;
  },

  saveDay19Questions(scenarios: GoldenKickScenario[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DAY19_QUESTIONS, JSON.stringify(scenarios));
      this.notifyUpdate();
    } catch (e) {
      console.error('Error saving Day 19 scenarios:', e);
    }
  },

  resetDay19Questions(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.DAY19_QUESTIONS);
      this.notifyUpdate();
    } catch {}
  },

  getDay19Evaluations(): GoldenKickEvaluation[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAY19_EVALUATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },

  saveDay19Evaluations(evaluations: GoldenKickEvaluation[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DAY19_EVALUATIONS, JSON.stringify(evaluations));
      this.notifyUpdate();
    } catch (e) {
      console.error('Error saving Day 19 evaluations:', e);
    }
  },

  upsertDay19Evaluation(evalItem: GoldenKickEvaluation): GoldenKickEvaluation[] {
    const current = this.getDay19Evaluations();
    const cleanEmail = evalItem.email.trim().toLowerCase();
    const idx = current.findIndex(
      (e) => e.email.toLowerCase() === cleanEmail && e.scenarioId === evalItem.scenarioId
    );
    const updatedItem: GoldenKickEvaluation = {
      ...evalItem,
      email: cleanEmail,
      stars: Math.max(1, Math.min(5, Math.round(evalItem.stars))),
      updatedAt: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    };
    const next = [...current];
    if (idx >= 0) {
      next[idx] = updatedItem;
    } else {
      next.push(updatedItem);
    }
    this.saveDay19Evaluations(next);
    return next;
  },

  getChampionRelease(): ChampionConfig | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAMPION_RELEASE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.isReleased === 'boolean') {
          return parsed as ChampionConfig;
        }
      }
    } catch {}
    return null;
  },

  saveChampionRelease(config: ChampionConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAMPION_RELEASE, JSON.stringify(config));
      this.notifyUpdate();
    } catch (e) {
      console.error('Error saving champion release config:', e);
    }
  },

  clearChampionRelease(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHAMPION_RELEASE);
      this.notifyUpdate();
    } catch (e) {
      console.error('Error clearing champion release config:', e);
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
      const saved = localStorage.getItem(STORAGE_KEYS.WEBHOOK);
      if (saved && saved.trim() && saved.trim().startsWith('http')) {
        return saved.trim();
      }
    } catch {
      return DEFAULT_WEBHOOK_URL;
    }
    return DEFAULT_WEBHOOK_URL;
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
      localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
      this.notifyUpdate();
    } catch (e) {
      console.error('Error clearing played emails:', e);
    }
  },

  getAttempts(): AttemptRecord[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },

  recordAttempt(record: AttemptRecord): void {
    if (!record || !record.email) return;
    try {
      const attempts = this.getAttempts();
      const cleanEmail = record.email.trim().toLowerCase();
      const recordDate = record.date || new Date().toISOString().slice(0, 10);
      const normalizedRecord: AttemptRecord = {
        ...record,
        email: cleanEmail,
        date: recordDate,
      };

      const existingIdx = attempts.findIndex(
        (a) => a.email.trim().toLowerCase() === cleanEmail && a.date === recordDate
      );

      if (existingIdx >= 0) {
        attempts[existingIdx] = normalizedRecord;
      } else {
        attempts.push(normalizedRecord);
      }

      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
      this.clearInProgressAttempt();
      this.notifyUpdate();
    } catch (e) {
      console.error('Error recording attempt:', e);
    }
  },

  getInProgressAttempt(): {
    email: string;
    name: string;
    date: string;
    currentIndex: number;
    score: number;
    records: any[];
  } | null {
    try {
      const saved = localStorage.getItem('copa_sgq_in_progress');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  },

  saveInProgressAttempt(data: {
    email: string;
    name: string;
    date: string;
    currentIndex: number;
    score: number;
    records: any[];
  }): void {
    try {
      localStorage.setItem('copa_sgq_in_progress', JSON.stringify(data));
    } catch {}
  },

  clearInProgressAttempt(): void {
    try {
      localStorage.removeItem('copa_sgq_in_progress');
    } catch {}
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
