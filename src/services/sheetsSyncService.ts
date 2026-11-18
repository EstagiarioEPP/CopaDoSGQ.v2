import {
  AttemptRecord,
  RemoteCompetitionConfig,
  GoldenKickScenario,
  GoldenKickEvaluation,
  GoldenKickAnswer,
} from '../types';
import { storageService } from './storageService';

export const OFFICIAL_SPREADSHEET_ID = '1gZ6lMxCUw3GUGgHkhsifDZ_IwGolb9tXOFty3l4OTZA';

export type SyncStatus = 'idle' | 'loading' | 'synced' | 'gviz_fallback' | 'outdated_script' | 'error';

export interface SyncResult {
  status: SyncStatus;
  attempts: AttemptRecord[];
  remoteCount: number;
  localCount: number;
  message: string;
  config?: RemoteCompetitionConfig;
}

/**
 * Normaliza qualquer formato de data vindo da planilha (YYYY-MM-DD, DD/MM/YYYY, Date(Y,M,D) ou ISO) para YYYY-MM-DD.
 */
function normalizeSheetDate(raw: unknown): string {
  if (!raw) return '';
  const str = String(raw).trim();

  const isoDateMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    return `${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}`;
  }

  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }

  const gvizMatch = str.match(/^Date\((\d+),(\d+),(\d+)/);
  if (gvizMatch) {
    const year = Number(gvizMatch[1]);
    const month = Number(gvizMatch[2]) + 1;
    const day = Number(gvizMatch[3]);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return str;
}

function normalizeTimestamp(raw: unknown, fallbackFormatted?: unknown): string {
  if (fallbackFormatted && String(fallbackFormatted).trim()) {
    return String(fallbackFormatted).trim();
  }
  if (!raw) return '—';
  const str = String(raw).trim();
  const gvizDateTime = str.match(/^Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
  if (gvizDateTime) {
    const [, y, m, d, hh, mm, ss] = gvizDateTime;
    return `${String(d).padStart(2, '0')}/${String(Number(m) + 1).padStart(2, '0')}/${y} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }
  return str;
}

function buildActionUrl(baseUrl: string, action: string): string {
  const cleanUrl = (baseUrl || '').trim();
  const sep = cleanUrl.includes('?') ? '&' : '?';
  return `${cleanUrl}${sep}action=${encodeURIComponent(action)}&_t=${Date.now()}`;
}

async function postAction(
  webhookUrl: string,
  action: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; data?: any }> {
  const cleanUrl = (webhookUrl || '').trim();
  if (!cleanUrl || !cleanUrl.startsWith('http')) {
    return { ok: false };
  }
  const url = buildActionUrl(cleanUrl, action);
  const body = JSON.stringify({ action, ...payload });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    });
    if (res.ok) {
      try {
        const json = await res.json();
        return { ok: Boolean(json?.success ?? true), data: json };
      } catch {
        return { ok: true };
      }
    }
  } catch {
    // Contingência no-cors quando o redirecionamento do Apps Script bloqueia leitura CORS
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
      });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }
  return { ok: false };
}

function mergeAttempts(remote: AttemptRecord[], local: AttemptRecord[]): AttemptRecord[] {
  const byKey = new Map<string, AttemptRecord>();

  local.forEach((att) => {
    if (!att.email) return;
    const key = `${att.email.trim().toLowerCase()}__${att.date}`;
    byKey.set(key, { ...att, source: 'local' });
  });

  remote.forEach((att) => {
    if (!att.email) return;
    const key = `${att.email.trim().toLowerCase()}__${att.date}`;
    const existingLocal = byKey.get(key);
    byKey.set(key, {
      ...att,
      goldenKickAnswers: att.goldenKickAnswers || existingLocal?.goldenKickAnswers,
      source: 'sheet',
    });
  });

  return Array.from(byKey.values()).sort((a, b) => {
    const dateCmp = (b.date || '').localeCompare(a.date || '');
    if (dateCmp !== 0) return dateCmp;
    return (b.timestamp || '').localeCompare(a.timestamp || '');
  });
}

function parseGoldenKickAnswers(rawJson: unknown): GoldenKickAnswer[] | undefined {
  if (!rawJson) return undefined;
  if (Array.isArray(rawJson)) return rawJson as GoldenKickAnswer[];
  if (typeof rawJson === 'string') {
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed)) return parsed as GoldenKickAnswer[];
    } catch {}
  }
  return undefined;
}

async function fetchViaGvizFallback(): Promise<AttemptRecord[] | null> {
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${OFFICIAL_SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=0`;
    const res = await fetch(gvizUrl, { method: 'GET' });
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?$/);
    if (!match) return null;

    const json = JSON.parse(match[1]);
    const rows = json?.table?.rows;
    if (!Array.isArray(rows)) return null;

    const parsed: AttemptRecord[] = [];
    for (const row of rows) {
      const cells = row?.c || [];
      const email = String(cells[2]?.v || '').trim().toLowerCase();
      if (!email || !email.includes('@')) continue;

      const date = normalizeSheetDate(cells[3]?.f || cells[3]?.v);
      const rawScore = cells[4]?.v;
      const isManual =
        date === '2026-11-19' ||
        String(rawScore || '').toLowerCase().includes('análise');
      const numericScore = Number(rawScore ?? 0);
      const totalQuestions = Number(cells[5]?.v ?? 5) || 5;
      const answersSummary = cells[7]?.v ? String(cells[7].v) : undefined;
      const tempoVal = cells[8]?.v ? String(cells[8].v).trim() : undefined;
      const varVal = cells[9]?.v ? String(cells[9].v).trim() : undefined;
      const goldenVal = cells[10]?.v ? String(cells[10].v).trim() : undefined;
      const goldenAnswers = parseGoldenKickAnswers(cells[11]?.v);

      parsed.push({
        timestamp: normalizeTimestamp(cells[0]?.v, cells[0]?.f),
        name: String(cells[1]?.v || email.split('@')[0]).trim(),
        email,
        date,
        score: isManual || Number.isNaN(numericScore) ? 0 : numericScore,
        totalQuestions,
        answersSummary,
        tempoResposta: tempoVal && tempoVal !== '-' ? tempoVal : undefined,
        varResponse: varVal && varVal !== '-' ? varVal : undefined,
        goldenKickSummary: goldenVal && goldenVal !== '-' ? goldenVal : undefined,
        goldenKickAnswers: goldenAnswers,
        isPendingManualReview: isManual,
        source: 'sheet',
      });
    }

    return parsed;
  } catch {
    return null;
  }
}

export const sheetsSyncService = {
  async fetchAllAttempts(webhookUrl: string): Promise<SyncResult> {
    const localAttempts = storageService.getAttempts();
    const cleanUrl = (webhookUrl || '').trim();

    if (!cleanUrl || !cleanUrl.startsWith('http')) {
      const gvizRows = await fetchViaGvizFallback();
      if (gvizRows) {
        const merged = mergeAttempts(gvizRows, localAttempts);
        return {
          status: 'gviz_fallback',
          attempts: merged,
          remoteCount: gvizRows.length,
          localCount: localAttempts.length,
          message: `Sincronizado diretamente com a planilha (${gvizRows.length} registro(s)).`,
        };
      }
      return {
        status: 'error',
        attempts: mergeAttempts([], localAttempts),
        remoteCount: 0,
        localCount: localAttempts.length,
        message: 'URL do Google Apps Script não configurada.',
      };
    }

    try {
      const response = await fetch(buildActionUrl(cleanUrl, 'history'), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data?.config && Array.isArray(data.config.eliminatedEmails)) {
        const remoteCfg: RemoteCompetitionConfig = {
          eliminatedEmails: data.config.eliminatedEmails.map((e: string) => String(e).trim().toLowerCase()),
          championEmail: String(data.config.championEmail || '').trim().toLowerCase(),
          championName: String(data.config.championName || '').trim(),
          isChampionReleased: Boolean(data.config.isChampionReleased),
          crownedAt: data.config.crownedAt ? String(data.config.crownedAt) : undefined,
        };
        storageService.saveRemoteConfig(remoteCfg);
      }

      if (data && Array.isArray(data.attempts)) {
        const remoteAttempts: AttemptRecord[] = data.attempts
          .filter((item: any) => item && item.email)
          .map((item: any) => {
            const tempoStr = item.tempoResposta ? String(item.tempoResposta).trim() : '';
            const varStr = item.varResponse ? String(item.varResponse).trim() : '';
            const goldenStr = item.goldenKickSummary ? String(item.goldenKickSummary).trim() : '';
            const normalizedDate = normalizeSheetDate(item.date);
            const isManual =
              Boolean(item.isPendingManualReview) ||
              normalizedDate === '2026-11-19' ||
              String(item.score ?? '').toLowerCase().includes('análise');
            const numericScore = Number(item.score ?? 0);

            return {
              timestamp: String(item.timestamp || '—'),
              name: String(item.name || item.nome || 'Jogador').trim(),
              email: String(item.email).trim().toLowerCase(),
              date: normalizedDate,
              score: isManual || Number.isNaN(numericScore) ? 0 : numericScore,
              totalQuestions: Number(item.totalQuestions ?? 5) || 5,
              answersSummary: item.answers ? String(item.answers) : undefined,
              tempoResposta: tempoStr && tempoStr !== '-' ? tempoStr : undefined,
              varResponse: varStr && varStr !== '-' ? varStr : undefined,
              goldenKickSummary: goldenStr && goldenStr !== '-' ? goldenStr : undefined,
              goldenKickAnswers: parseGoldenKickAnswers(item.goldenKickAnswers),
              isPendingManualReview: isManual,
              source: 'sheet' as const,
            };
          });

        const merged = mergeAttempts(remoteAttempts, localAttempts);
        return {
          status: 'synced',
          attempts: merged,
          remoteCount: remoteAttempts.length,
          localCount: localAttempts.length,
          message: `Sincronizado com a planilha oficial (${remoteAttempts.length} registro(s) na nuvem).`,
          config: data?.config,
        };
      }

      const gvizRows = await fetchViaGvizFallback();
      if (gvizRows) {
        const merged = mergeAttempts(gvizRows, localAttempts);
        return {
          status: 'gviz_fallback',
          attempts: merged,
          remoteCount: gvizRows.length,
          localCount: localAttempts.length,
          message: `Histórico carregado da planilha (${gvizRows.length} registro(s)). Atualize o Apps Script para leitura nativa via doGet.`,
        };
      }

      return {
        status: 'outdated_script',
        attempts: mergeAttempts([], localAttempts),
        remoteCount: 0,
        localCount: localAttempts.length,
        message: 'O Apps Script publicado ainda não possui as rotas atualizadas. Copie o script na aba Google Sheets e publique uma nova versão.',
      };
    } catch {
      const gvizRows = await fetchViaGvizFallback();
      if (gvizRows) {
        const merged = mergeAttempts(gvizRows, localAttempts);
        return {
          status: 'gviz_fallback',
          attempts: merged,
          remoteCount: gvizRows.length,
          localCount: localAttempts.length,
          message: `Histórico carregado da planilha (${gvizRows.length} registro(s)).`,
        };
      }

      return {
        status: 'error',
        attempts: mergeAttempts([], localAttempts),
        remoteCount: 0,
        localCount: localAttempts.length,
        message: 'Não foi possível ler a planilha agora. Exibindo registros locais em cache.',
      };
    }
  },

  async fetchRemoteConfig(webhookUrl: string): Promise<RemoteCompetitionConfig> {
    const cleanUrl = (webhookUrl || '').trim();
    const cached = storageService.getRemoteConfig();
    if (!cleanUrl || !cleanUrl.startsWith('http')) return cached;

    try {
      const res = await fetch(buildActionUrl(cleanUrl, 'getConfig'), { method: 'GET' });
      if (!res.ok) return cached;
      const data = await res.json();
      if (data?.config && Array.isArray(data.config.eliminatedEmails)) {
        const cfg: RemoteCompetitionConfig = {
          eliminatedEmails: data.config.eliminatedEmails.map((e: string) => String(e).trim().toLowerCase()),
          championEmail: String(data.config.championEmail || '').trim().toLowerCase(),
          championName: String(data.config.championName || '').trim(),
          isChampionReleased: Boolean(data.config.isChampionReleased),
          crownedAt: data.config.crownedAt ? String(data.config.crownedAt) : undefined,
        };
        storageService.saveRemoteConfig(cfg);
        return cfg;
      }
    } catch {}
    return cached;
  },

  async eliminatePlayer(webhookUrl: string, email: string): Promise<RemoteCompetitionConfig> {
    const cleanEmail = email.trim().toLowerCase();
    const current = storageService.getRemoteConfig();
    const nextEliminated = current.eliminatedEmails.includes(cleanEmail)
      ? current.eliminatedEmails
      : [...current.eliminatedEmails, cleanEmail];
    const optimistic: RemoteCompetitionConfig = { ...current, eliminatedEmails: nextEliminated };
    storageService.saveRemoteConfig(optimistic);

    const res = await postAction(webhookUrl, 'eliminatePlayer', { email: cleanEmail });
    if (res.data?.config) {
      storageService.saveRemoteConfig(res.data.config);
      return res.data.config;
    }
    return optimistic;
  },

  async restorePlayer(webhookUrl: string, email: string): Promise<RemoteCompetitionConfig> {
    const cleanEmail = email.trim().toLowerCase();
    const current = storageService.getRemoteConfig();
    const optimistic: RemoteCompetitionConfig = {
      ...current,
      eliminatedEmails: current.eliminatedEmails.filter((e) => e !== cleanEmail),
    };
    storageService.saveRemoteConfig(optimistic);

    const res = await postAction(webhookUrl, 'restorePlayer', { email: cleanEmail });
    if (res.data?.config) {
      storageService.saveRemoteConfig(res.data.config);
      return res.data.config;
    }
    return optimistic;
  },

  async fetchQuestions19(webhookUrl: string): Promise<{ scenarios: GoldenKickScenario[]; fromSheet: boolean }> {
    const cleanUrl = (webhookUrl || '').trim();
    const fallback = storageService.getDay19Questions();
    if (!cleanUrl || !cleanUrl.startsWith('http')) {
      return { scenarios: fallback, fromSheet: false };
    }

    try {
      const res = await fetch(buildActionUrl(cleanUrl, 'getQuestions19'), { method: 'GET' });
      if (!res.ok) return { scenarios: fallback, fromSheet: false };
      const data = await res.json();
      if (data && Array.isArray(data.questions19) && data.questions19.length > 0) {
        storageService.saveDay19Questions(data.questions19);
        return { scenarios: data.questions19, fromSheet: true };
      }
    } catch {}
    return { scenarios: fallback, fromSheet: false };
  },

  async saveQuestions19(webhookUrl: string, scenarios: GoldenKickScenario[]): Promise<boolean> {
    storageService.saveDay19Questions(scenarios);
    const res = await postAction(webhookUrl, 'saveQuestions19', { questions19: scenarios });
    return res.ok;
  },

  async fetchEvaluations19(webhookUrl: string): Promise<GoldenKickEvaluation[]> {
    const cleanUrl = (webhookUrl || '').trim();
    const cached = storageService.getDay19Evaluations();
    if (!cleanUrl || !cleanUrl.startsWith('http')) return cached;

    try {
      const res = await fetch(buildActionUrl(cleanUrl, 'getEvaluations'), { method: 'GET' });
      if (!res.ok) return cached;
      const data = await res.json();
      if (data && Array.isArray(data.evaluations)) {
        storageService.saveDay19Evaluations(data.evaluations);
        return data.evaluations;
      }
    } catch {}
    return cached;
  },

  async saveEvaluation19(webhookUrl: string, evaluation: GoldenKickEvaluation): Promise<GoldenKickEvaluation[]> {
    const updated = storageService.upsertDay19Evaluation(evaluation);
    const res = await postAction(webhookUrl, 'saveEvaluation', {
      email: evaluation.email.trim().toLowerCase(),
      scenarioId: evaluation.scenarioId,
      stars: evaluation.stars,
    });
    if (res.data && Array.isArray(res.data.evaluations)) {
      storageService.saveDay19Evaluations(res.data.evaluations);
      return res.data.evaluations;
    }
    return updated;
  },

  async crownChampion(webhookUrl: string, email: string, name: string): Promise<RemoteCompetitionConfig> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const current = storageService.getRemoteConfig();
    const optimistic: RemoteCompetitionConfig = {
      ...current,
      championEmail: cleanEmail,
      championName: cleanName,
      isChampionReleased: true,
      crownedAt: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    };
    storageService.saveRemoteConfig(optimistic);
    storageService.saveChampionRelease({
      isReleased: true,
      championEmail: cleanEmail,
      championName: cleanName,
      championTitle: 'GRANDE CAMPEÃO DA COPA DO SGQ ACIM 2026',
    });

    const res = await postAction(webhookUrl, 'crownChampion', { email: cleanEmail, name: cleanName });
    if (res.data?.config) {
      storageService.saveRemoteConfig(res.data.config);
      return res.data.config;
    }
    return optimistic;
  },

  async uncrownChampion(webhookUrl: string): Promise<RemoteCompetitionConfig> {
    const current = storageService.getRemoteConfig();
    const optimistic: RemoteCompetitionConfig = {
      ...current,
      championEmail: '',
      championName: '',
      isChampionReleased: false,
      crownedAt: '',
    };
    storageService.saveRemoteConfig(optimistic);
    storageService.clearChampionRelease();

    const res = await postAction(webhookUrl, 'uncrownChampion', {});
    if (res.data?.config) {
      storageService.saveRemoteConfig(res.data.config);
      return res.data.config;
    }
    return optimistic;
  },
};

