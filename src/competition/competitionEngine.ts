import { Question, AttemptRecord, ParticipantMatrixRow, GoldenKickScenario, ChampionConfig, Day17RankingEntry } from '../types';
import { storageService } from '../services/storageService';

/**
 * MOTOR OFICIAL DA COPA DO SGQ ACIM (NOVEMBRO DE 2026)
 *
 * 1. 4 Participantes exclusivos
 * 2. 4 Dias oficiais (16 a 19 de novembro de 2026 — 20/11 feriado removido)
 * 3. Fuso horário oficial: America/Sao_Paulo
 * 4. 1 tentativa por participante por dia (08:00 às 18:00)
 * 5. Eliminação diária + Rodadas Especiais (18/11 VAR obrigatório e 19/11 Chute de Ouro)
 * 6. Grande Campeão liberado exclusivamente após acionamento manual no Painel de Gestão
 */

export const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';
export const OPERATING_HOURS_START = 8; // 08:00
export const OPERATING_HOURS_END = 18; // 18:00

// ÚNICOS 4 PARTICIPANTES OFICIAIS DA COPA DO SGQ 2026
export const AUTHORIZED_PARTICIPANTS: readonly string[] = [
  'consultor12@acim.com.br',
  'escoladenegocios2@acim.com.br',
  'escoladenegocios6@acim.com.br',
  'supervisorcomercial@acim.com.br',
] as const;

// LISTA TEMPORÁRIA DE E-MAILS ELIMINADOS NO MATA-MATA
export const ELIMINATED_PARTICIPANTS: readonly string[] = [] as const;

// CONFIGURAÇÃO ESTÁTICA PADRÃO DO GRANDE CAMPEÃO (SEMPRE OCULTA ATÉ LIBERAÇÃO MANUAL)
export const CHAMPION_CONFIG: ChampionConfig = {
  isReleased: false,
  championName: 'Grande Campeão ACIM 2026',
  championEmail: '',
  championTitle: 'GRANDE CAMPEÃO DA COPA DO SGQ ACIM 2026',
};

export function getEffectiveChampionConfig(): ChampionConfig {
  const stored = storageService.getChampionRelease();
  if (stored) {
    return stored;
  }
  return CHAMPION_CONFIG;
}

// DATAS ESPECIAIS DO MATA-MATA
export const TIMED_KNOCKOUT_DATE = '2026-11-17';
export const VAR_REVIEW_DATE = '2026-11-18';
export const GOLDEN_KICK_DATE = '2026-11-19';

export function isTimedKnockoutDay(dateStr: string): boolean {
  return dateStr === TIMED_KNOCKOUT_DATE;
}

export function isVarReviewDay(dateStr: string): boolean {
  return dateStr === VAR_REVIEW_DATE;
}

export function isGoldenKickDay(dateStr: string): boolean {
  return dateStr === GOLDEN_KICK_DATE;
}

// 3 CENÁRIOS PRÁTICOS DA GRANDE FINAL (19/11 — CHUTE DE OURO / CENÁRIO CEGO)
export const GOLDEN_KICK_SCENARIOS: GoldenKickScenario[] = [
  {
    id: 'FINAL-01',
    title: 'Cenário 1 — Desorganização, Dados Perdidos & Ocorrência no SIG Sistem',
    themesCrossed: ['5S & Gestão da Informação', 'Não Conformidades', 'Atendimento', 'SIG Sistem'],
    context:
      'Durante o atendimento a um associado, um colaborador percebe que documentos importantes ficaram espalhados na mesa sem arquivamento padrão, uma versão desatualizada de formulário foi utilizada e uma reclamação anterior do mesmo associado não havia sido registrada nem tratada no SIG Sistem.',
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
    fields: {
      diagnosticoLabel: '1. Diagnóstico e temas do SGQ violados',
      contencaoLabel: '2. Contenção imediata no SIG Sistem / ACIM',
      acaoPreventivaLabel: '3. Ação preventiva e melhoria sistêmica',
    },
  },
];

export function isEliminatedParticipant(email: string | undefined | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return ELIMINATED_PARTICIPANTS.some((p) => p.toLowerCase() === clean);
}

// 4 DIAS OFICIAIS DA COMPETIÇÃO (16/11 A 19/11 — SEM DIA 20/11 FERIADO)
export const COMPETITION_DAYS = [
  { date: '2026-11-16', label: '16/11', dayIndex: 1, questionIds: ['Q01', 'Q02', 'Q03', 'Q04', 'Q05'] },
  { date: '2026-11-17', label: '17/11', dayIndex: 2, questionIds: ['Q06', 'Q07', 'Q08', 'Q09', 'Q10'] },
  { date: '2026-11-18', label: '18/11', dayIndex: 3, questionIds: ['Q11', 'Q12', 'Q13', 'Q14', 'Q15'] },
  { date: '2026-11-19', label: '19/11', dayIndex: 4, questionIds: ['Q16', 'Q17', 'Q18', 'Q19', 'Q20'] },
] as const;

export const START_DATE = '2026-11-16';
export const END_DATE = '2026-11-19';

/**
 * Obtém a data atual no formato YYYY-MM-DD estritamente no fuso America/Sao_Paulo.
 */
export function getSaoPauloDateString(baseDate: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: SAO_PAULO_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(baseDate);
  } catch {
    return baseDate.toISOString().slice(0, 10);
  }
}

/**
 * Obtém hora e minuto atuais no fuso oficial America/Sao_Paulo e valida a janela 08:00 às 18:00.
 */
export function getSaoPauloTimeInfo(baseDate: Date = new Date()): {
  hour: number;
  minute: number;
  formattedTime: string;
  isWithinHours: boolean;
} {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: SAO_PAULO_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(baseDate);

    const rawHour = Number(parts.find((p) => p.type === 'hour')?.value ?? '12');
    const hour = rawHour === 24 ? 0 : rawHour;
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
    const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const isWithinHours = hour >= OPERATING_HOURS_START && hour < OPERATING_HOURS_END;

    return { hour, minute, formattedTime, isWithinHours };
  } catch {
    const hour = baseDate.getHours();
    const minute = baseDate.getMinutes();
    const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return {
      hour,
      minute,
      formattedTime,
      isWithinHours: hour >= OPERATING_HOURS_START && hour < OPERATING_HOURS_END,
    };
  }
}

export function isAuthorizedParticipant(email: string | undefined | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return AUTHORIZED_PARTICIPANTS.some((p) => p.toLowerCase() === clean);
}

export function getQuestionsForDate(dateStr: string): Question[] {
  const match = COMPETITION_DAYS.find((d) => d.date === dateStr);
  const targetIds: readonly string[] = match ? match.questionIds : COMPETITION_DAYS[0].questionIds;
  const allQuestions = storageService.getQuestions();

  return allQuestions.filter((q) => targetIds.includes(q.id));
}

export function getCompetitionTimeline(currentDate: string = getSaoPauloDateString()) {
  if (currentDate < START_DATE) {
    return {
      status: 'BEFORE_START' as const,
      isBeforeStart: true,
      isActive: false,
      isEnded: false,
      currentDate,
      dayInfo: null,
      message: 'A Copa do SGQ começará em 16 de novembro de 2026.',
    };
  }

  if (currentDate > END_DATE) {
    return {
      status: 'ENDED' as const,
      isBeforeStart: false,
      isActive: false,
      isEnded: true,
      currentDate,
      dayInfo: null,
      message: 'As rodadas da Copa do SGQ 2026 foram concluídas em 19 de novembro de 2026.',
    };
  }

  const dayInfo = COMPETITION_DAYS.find((d) => d.date === currentDate) || null;

  return {
    status: 'ACTIVE' as const,
    isBeforeStart: false,
    isActive: true,
    isEnded: false,
    currentDate,
    dayInfo,
    message: dayInfo ? `Rodada ${dayInfo.label} — Bateria ${dayInfo.dayIndex} de 4` : '',
  };
}

/**
 * Calcula a matriz de desempenho da competição (16/11 a 19/11).
 * IMPORTANTE: Nunca promove automaticamente ninguém a 'Campeão' — a revelação depende
 * exclusivamente do acionamento manual no Painel de Gestão.
 */
export function calculateCompetitionMatrix(attempts: AttemptRecord[]): ParticipantMatrixRow[] {
  const matrix: Record<string, ParticipantMatrixRow> = {};

  AUTHORIZED_PARTICIPANTS.forEach((email) => {
    const prevAttempt = attempts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    const defaultName = prevAttempt?.name || email.split('@')[0];

    matrix[email] = {
      email,
      name: defaultName,
      dias: {
        '2026-11-16': null,
        '2026-11-17': null,
        '2026-11-18': null,
        '2026-11-19': null,
      },
      total: 0,
      status: 'Ativo',
    };
  });

  attempts.forEach((att) => {
    const cleanEmail = att.email.toLowerCase();
    const row = matrix[cleanEmail];
    if (row && att.date in row.dias) {
      row.dias[att.date] = att.isPendingManualReview ? null : att.score;
      if (att.name && (!row.name || row.name === cleanEmail.split('@')[0])) {
        row.name = att.name;
      }
    }
  });

  // Eliminação diária automática apenas nas rodadas objetivas (16/11, 17/11 e 18/11)
  // Dia 19/11 é avaliação cega manual da banca do SGQ (Chute de Ouro).
  let activeEmails = [...AUTHORIZED_PARTICIPANTS];

  COMPETITION_DAYS.forEach((day) => {
    if (day.date === GOLDEN_KICK_DATE) return;
    const dayHasAttempts = attempts.some((a) => a.date === day.date);
    if (!dayHasAttempts || activeEmails.length <= 1) return;

    const scores = activeEmails.map((email) => {
      const score = matrix[email].dias[day.date];
      return {
        email,
        score: score !== null ? score : 0,
      };
    });

    const minScore = Math.min(...scores.map((s) => s.score));
    const lowestParticipants = scores.filter((s) => s.score === minScore);

    if (lowestParticipants.length === 1) {
      const eliminatedEmail = lowestParticipants[0].email;
      matrix[eliminatedEmail].status = 'Eliminado';
      matrix[eliminatedEmail].eliminatedDate = day.label;
      activeEmails = activeEmails.filter((e) => e !== eliminatedEmail);
    }
  });

  ELIMINATED_PARTICIPANTS.forEach((elimEmail) => {
    const clean = elimEmail.trim().toLowerCase();
    if (matrix[clean] && matrix[clean].status !== 'Eliminado') {
      matrix[clean].status = 'Eliminado';
      matrix[clean].eliminatedDate = matrix[clean].eliminatedDate || 'Mata-Mata';
      activeEmails = activeEmails.filter((e) => e.toLowerCase() !== clean);
    }
  });

  Object.values(matrix).forEach((row) => {
    row.total = Object.values(row.dias).reduce<number>((acc, score) => acc + (score || 0), 0);
  });

  // Marca como 'Campeão' na matriz SOMENTE se o gestor já tiver liberado oficialmente no Painel
  const effectiveChampion = getEffectiveChampionConfig();
  if (effectiveChampion.isReleased && effectiveChampion.championEmail) {
    const champRow = matrix[effectiveChampion.championEmail.toLowerCase()];
    if (champRow) {
      champRow.status = 'Campeão';
    }
  }

  return Object.values(matrix);
}

/**
 * Sugere automaticamente o vencedor da matriz de pontuação para o botão de liberação
 * no Painel de Gestão, identificando empates para decisão manual da banca.
 */
export function getSuggestedChampionCandidates(attempts: AttemptRecord[]): {
  autoWinner: ParticipantMatrixRow | null;
  tiedCandidates: ParticipantMatrixRow[];
  activeFinalists: ParticipantMatrixRow[];
} {
  const matrix = calculateCompetitionMatrix(attempts);
  const activeFinalists = matrix.filter((r) => r.status !== 'Eliminado');

  if (activeFinalists.length === 0) {
    return { autoWinner: null, tiedCandidates: [], activeFinalists: [] };
  }

  if (activeFinalists.length === 1) {
    return {
      autoWinner: activeFinalists[0],
      tiedCandidates: [],
      activeFinalists,
    };
  }

  const maxTotal = Math.max(...activeFinalists.map((f) => f.total));
  const topCandidates = activeFinalists.filter((f) => f.total === maxTotal);

  if (topCandidates.length === 1) {
    return {
      autoWinner: topCandidates[0],
      tiedCandidates: [],
      activeFinalists,
    };
  }

  return {
    autoWinner: null,
    tiedCandidates: topCandidates,
    activeFinalists,
  };
}

export function canParticipantPlayToday(
  email: string,
  dateStr: string,
  attempts: AttemptRecord[],
  options?: { bypassTimeCheck?: boolean; isTestMode?: boolean }
): {
  allowed: boolean;
  reason?: string;
  isEliminated?: boolean;
  eliminatedDate?: string;
  isOutsideHours?: boolean;
} {
  if (options?.isTestMode) {
    return { allowed: true };
  }

  if (!options?.bypassTimeCheck) {
    const timeInfo = getSaoPauloTimeInfo();
    if (!timeInfo.isWithinHours) {
      return {
        allowed: false,
        isOutsideHours: true,
        reason: `⏰ Fora do horário oficial de cobranças (agora são ${timeInfo.formattedTime}). As rodadas ficam abertas exclusivamente das 08:00 às 18:00 (horário de Brasília).`,
      };
    }
  }

  if (!email || !email.trim()) {
    return { allowed: false, reason: 'Informe seu e-mail corporativo para jogar.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!isAuthorizedParticipant(cleanEmail)) {
    return {
      allowed: false,
      reason: '⚠️ Este e-mail não faz parte da lista de participantes autorizados para a Copa do SGQ.',
    };
  }

  if (isEliminatedParticipant(cleanEmail)) {
    return {
      allowed: false,
      isEliminated: true,
      eliminatedDate: 'Fase Anterior',
      reason: 'Você foi eliminado do mata-mata e não pode disputar esta rodada.',
    };
  }

  const matrix = calculateCompetitionMatrix(attempts);
  const participantRow = matrix.find((r) => r.email.toLowerCase() === cleanEmail);
  if (participantRow && participantRow.status === 'Eliminado') {
    return {
      allowed: false,
      isEliminated: true,
      eliminatedDate: participantRow.eliminatedDate || 'dias anteriores',
      reason: `Você foi eliminado da competição na rodada de ${participantRow.eliminatedDate || 'dias anteriores'} e não pode realizar novas cobranças.`,
    };
  }

  const alreadyPlayedToday = attempts.some(
    (a) => a.email.toLowerCase() === cleanEmail && a.date === dateStr
  );
  if (alreadyPlayedToday) {
    return {
      allowed: false,
      reason: `⚠️ Você já realizou sua tentativa oficial de hoje (${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)})! É permitida 1 tentativa por dia.`,
    };
  }

  return { allowed: true };
}

export function buildDay17SpeedRanking(attempts: AttemptRecord[]): Day17RankingEntry[] {
  const day17Attempts = attempts.filter(
    (att) => att.date === TIMED_KNOCKOUT_DATE && isAuthorizedParticipant(att.email)
  );

  const byEmail = new Map<string, AttemptRecord>();
  day17Attempts.forEach((att) => {
    const clean = att.email.trim().toLowerCase();
    if (!byEmail.has(clean)) {
      byEmail.set(clean, att);
    }
  });

  const entries = Array.from(byEmail.values()).map((att) => {
    const rawTime = (att.tempoResposta || '').replace(',', '.').replace(/[^\d.]/g, '');
    const parsedTime = rawTime ? parseFloat(rawTime) : Number.POSITIVE_INFINITY;
    const hasValidTime = !Number.isNaN(parsedTime) && Number.isFinite(parsedTime) && parsedTime > 0;

    return {
      rank: 0,
      name: att.name || att.email.split('@')[0],
      email: att.email.toLowerCase(),
      score: Number(att.score || 0),
      totalQuestions: Number(att.totalQuestions || 5) || 5,
      tempoResposta: hasValidTime ? `${parsedTime.toFixed(1)}s` : '—',
      timeSeconds: hasValidTime ? parsedTime : 999999,
    };
  });

  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeSeconds - b.timeSeconds;
  });

  return entries.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}
