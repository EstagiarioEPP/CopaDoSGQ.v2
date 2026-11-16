import { AttemptRecord } from '../types';
import { storageService } from './storageService';

export const OFFICIAL_SPREADSHEET_ID = '1gZ6lMxCUw3GUGgHkhsifDZ_IwGolb9tXOFty3l4OTZA';

export type SyncStatus = 'idle' | 'loading' | 'synced' | 'gviz_fallback' | 'outdated_script' | 'error';

export interface SyncResult {
  status: SyncStatus;
  attempts: AttemptRecord[];
  remoteCount: number;
  localCount: number;
  message: string;
}

/**
 * Normaliza qualquer formato de data vindo da planilha (YYYY-MM-DD, DD/MM/YYYY, Date(Y,M,D) ou ISO) para YYYY-MM-DD.
 */
function normalizeSheetDate(raw: unknown): string {
  if (!raw) return '';
  const str = String(raw).trim();

  // Já está no formato YYYY-MM-DD
  const isoDateMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    return `${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}`;
  }

  // Formato DD/MM/YYYY
  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }

  // Formato gviz: Date(2026,10,16) (mês 0-indexado!)
  const gvizMatch = str.match(/^Date\((\d+),(\d+),(\d+)/);
  if (gvizMatch) {
    const year = Number(gvizMatch[1]);
    const month = Number(gvizMatch[2]) + 1;
    const day = Number(gvizMatch[3]);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Última tentativa via Date.parse
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return str;
}

/**
 * Normaliza o carimbo de data/hora da planilha para exibição legível.
 */
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

/**
 * Mescla tentativas da planilha oficial com o cache local do navegador,
 * priorizando os registros da planilha sem duplicar por [email + data].
 */
function mergeAttempts(remote: AttemptRecord[], local: AttemptRecord[]): AttemptRecord[] {
  const byKey = new Map<string, AttemptRecord>();

  // Primeiro adiciona cache local
  local.forEach((att) => {
    if (!att.email) return;
    const key = `${att.email.trim().toLowerCase()}__${att.date}`;
    byKey.set(key, { ...att, source: 'local' });
  });

  // Sobrescreve / adiciona com registros oficiais da planilha
  remote.forEach((att) => {
    if (!att.email) return;
    const key = `${att.email.trim().toLowerCase()}__${att.date}`;
    byKey.set(key, { ...att, source: 'sheet' });
  });

  // Ordena da mais recente para a mais antiga por data da rodada e timestamp
  return Array.from(byKey.values()).sort((a, b) => {
    const dateCmp = (b.date || '').localeCompare(a.date || '');
    if (dateCmp !== 0) return dateCmp;
    return (b.timestamp || '').localeCompare(a.timestamp || '');
  });
}

/**
 * Tenta leitura direta da planilha via endpoint gviz (contingência caso o Apps Script ainda não tenha doGet atualizado).
 */
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
      const score = Number(cells[4]?.v ?? 0);
      const totalQuestions = Number(cells[5]?.v ?? 5) || 5;
      const answersSummary = cells[7]?.v ? String(cells[7].v) : undefined;
      const tempoVal = cells[8]?.v ? String(cells[8].v).trim() : undefined;

      parsed.push({
        timestamp: normalizeTimestamp(cells[0]?.v, cells[0]?.f),
        name: String(cells[1]?.v || email.split('@')[0]).trim(),
        email,
        date,
        score: Number.isNaN(score) ? 0 : score,
        totalQuestions,
        answersSummary,
        tempoResposta: tempoVal && tempoVal !== '-' ? tempoVal : undefined,
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
      const sep = cleanUrl.includes('?') ? '&' : '?';
      const response = await fetch(`${cleanUrl}${sep}action=history&_t=${Date.now()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data.attempts)) {
        const remoteAttempts: AttemptRecord[] = data.attempts
          .filter((item: any) => item && item.email)
          .map((item: any) => {
            const tempoStr = item.tempoResposta ? String(item.tempoResposta).trim() : '';
            return {
              timestamp: String(item.timestamp || '—'),
              name: String(item.name || item.nome || 'Jogador').trim(),
              email: String(item.email).trim().toLowerCase(),
              date: normalizeSheetDate(item.date),
              score: Number(item.score ?? 0) || 0,
              totalQuestions: Number(item.totalQuestions ?? 5) || 5,
              answersSummary: item.answers ? String(item.answers) : undefined,
              tempoResposta: tempoStr && tempoStr !== '-' ? tempoStr : undefined,
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
        };
      }

      // Apps Script respondeu online, porém ainda sem o array "attempts" (implantação antiga)
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
        message: 'O Apps Script publicado ainda não possui a leitura de histórico (doGet). Copie o script na aba Google Sheets e publique uma nova versão.',
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
};
