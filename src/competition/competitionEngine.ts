import { Question, AttemptRecord, ParticipantMatrixRow } from '../types';
import { OFFICIAL_25_QUESTIONS } from '../defaultQuestions';
import { storageService } from '../services/storageService';

/**
 * MOTOR OFICIAL DA COPA DO SGQ ACIM (NOVEMBRO DE 2026)
 *
 * 1. 4 Participantes exclusivos
 * 2. 5 Dias (16 a 20 de novembro de 2026)
 * 3. 5 Perguntas fixas por dia (sem sorteio)
 * 4. Fuso horário oficial: America/Sao_Paulo
 * 5. 1 tentativa por participante por dia
 * 6. Eliminação diária pelo pior desempenho (Modelo C)
 */

export const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

// PARTICIPANTES AUTORIZADOS (INCLUINDO E-MAIL DE TESTES)
export const AUTHORIZED_PARTICIPANTS: readonly string[] = [
  'consultor12@acim.com.br',
  'escoladenegocios2@acim.com.br',
  'supervisorcomercial@acim.com.br',
  'escoladenegocios6@acim.com.br',
  'estagioepp@acim.com.br',
] as const;

// 5 DIAS DA COMPETIÇÃO
export const COMPETITION_DAYS = [
  { date: '2026-11-16', label: '16/11', dayIndex: 1, questionIds: ['Q01', 'Q02', 'Q03', 'Q04', 'Q05'] },
  { date: '2026-11-17', label: '17/11', dayIndex: 2, questionIds: ['Q06', 'Q07', 'Q08', 'Q09', 'Q10'] },
  { date: '2026-11-18', label: '18/11', dayIndex: 3, questionIds: ['Q11', 'Q12', 'Q13', 'Q14', 'Q15'] },
  { date: '2026-11-19', label: '19/11', dayIndex: 4, questionIds: ['Q16', 'Q17', 'Q18', 'Q19', 'Q20'] },
  { date: '2026-11-20', label: '20/11', dayIndex: 5, questionIds: ['Q21', 'Q22', 'Q23', 'Q24', 'Q25'] },
] as const;

export const START_DATE = '2026-11-16';
export const END_DATE = '2026-11-20';

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
 * Verifica se um e-mail é de um dos 4 participantes autorizados.
 */
export function isAuthorizedParticipant(email: string | undefined | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return AUTHORIZED_PARTICIPANTS.some((p) => p.toLowerCase() === clean);
}

/**
 * Retorna as 5 perguntas correspondentes à data oficial da rodada.
 * Utiliza a mesma fonte de dados compartilhada com o painel administrativo.
 */
export function getQuestionsForDate(dateStr: string): Question[] {
  const match = COMPETITION_DAYS.find((d) => d.date === dateStr);
  const targetIds: readonly string[] = match ? match.questionIds : COMPETITION_DAYS[0].questionIds;
  const allQuestions = storageService.getQuestions();

  return allQuestions.filter((q) => targetIds.includes(q.id));
}

/**
 * Retorna a situação temporal da competição.
 */
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
      message: 'A competição foi oficialmente encerrada em 20 de novembro de 2026.',
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
    message: dayInfo ? `Rodada ${dayInfo.label} — Bateria ${dayInfo.dayIndex} de 5` : '',
  };
}

/**
 * Calcula a matriz de desempenho da competição (Modelo C de Eliminação).
 *
 * Regras:
 * - Apenas participantes autorizados.
 * - Eliminação do participante com menor pontuação no dia.
 * - Empate na menor pontuação = ninguém é eliminado no dia.
 * - Participante que não jogar em dia ativo = 0 pontos para efeito de eliminação.
 * - Campeão = único participante restante, ou maior pontuação acumulada dos sobreviventes em 20/11.
 */
export function calculateCompetitionMatrix(attempts: AttemptRecord[]): ParticipantMatrixRow[] {
  // Inicializa mapa de cada participante autorizado
  const matrix: Record<string, ParticipantMatrixRow> = {};

  AUTHORIZED_PARTICIPANTS.forEach((email) => {
    // Procura nome registrado em alguma tentativa prévia
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
        '2026-11-20': null,
      },
      total: 0,
      status: 'Ativo',
    };
  });

  // Preenche as pontuações registradas nas tentativas
  attempts.forEach((att) => {
    const cleanEmail = att.email.toLowerCase();
    const row = matrix[cleanEmail];
    if (row && att.date in row.dias) {
      row.dias[att.date] = att.score;
      if (att.name && (!row.name || row.name === cleanEmail.split('@')[0])) {
        row.name = att.name;
      }
    }
  });

  // Apuração progressiva dia a dia (Modelo C)
  let activeEmails = [...AUTHORIZED_PARTICIPANTS];

  COMPETITION_DAYS.forEach((day) => {
    // Só processa eliminação do dia se ao menos uma tentativa tiver sido realizada para essa data
    const dayHasAttempts = attempts.some((a) => a.date === day.date);
    if (!dayHasAttempts || activeEmails.length <= 1) return;

    // Coleta a pontuação de todos os participantes que ainda estavam ativos
    const scores = activeEmails.map((email) => {
      const score = matrix[email].dias[day.date];
      // Se não jogou no dia processado, pontuação é considerada 0
      return {
        email,
        score: score !== null ? score : 0,
      };
    });

    // Menor pontuação do dia entre os ativos
    const minScore = Math.min(...scores.map((s) => s.score));
    const lowestParticipants = scores.filter((s) => s.score === minScore);

    // Regra do Modelo C: se houver apenas UM participante com a menor pontuação, ele é eliminado.
    // Se houver empate no menor valor, NINGUÉM é eliminado no dia!
    if (lowestParticipants.length === 1) {
      const eliminatedEmail = lowestParticipants[0].email;
      matrix[eliminatedEmail].status = 'Eliminado';
      matrix[eliminatedEmail].eliminatedDate = day.label;
      activeEmails = activeEmails.filter((e) => e !== eliminatedEmail);
    }
  });

  // Cálculo da pontuação total acumulada
  Object.values(matrix).forEach((row) => {
    row.total = Object.values(row.dias).reduce<number>((acc, score) => acc + (score || 0), 0);
  });

  // Verificação de Campeão:
  // 1. Se restou apenas 1 participante ativo
  if (activeEmails.length === 1) {
    matrix[activeEmails[0]].status = 'Campeão';
  } else if (attempts.some((a) => a.date === '2026-11-20')) {
    // 2. No final de 20/11 com mais de um sobrevivente: maior pontuação acumulada entre os ativos
    const activeTotals = activeEmails.map((email) => ({
      email,
      total: matrix[email].total,
    }));
    const maxTotal = Math.max(...activeTotals.map((t) => t.total));
    const winners = activeTotals.filter((t) => t.total === maxTotal);

    winners.forEach((w) => {
      matrix[w.email].status = 'Campeão';
    });
  }

  return Object.values(matrix);
}

/**
 * Valida se o colaborador pode jogar na data especificada.
 */
export function canParticipantPlayToday(
  email: string,
  dateStr: string,
  attempts: AttemptRecord[]
): { allowed: boolean; reason?: string } {
  if (!email || !email.trim()) {
    return { allowed: false, reason: 'Informe seu e-mail corporativo para jogar.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Verificação se está na lista autorizada
  if (!isAuthorizedParticipant(cleanEmail)) {
    return {
      allowed: false,
      reason: '⚠️ Este e-mail não faz parte da lista de participantes autorizados para a Copa do SGQ.',
    };
  }

  // 2. Verificação se já jogou HOJE (e-mail + data)
  const alreadyPlayedToday = attempts.some(
    (a) => a.email.toLowerCase() === cleanEmail && a.date === dateStr
  );
  if (alreadyPlayedToday) {
    return {
      allowed: false,
      reason: `⚠️ Você já realizou sua tentativa oficial de hoje (${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)})! É permitida 1 tentativa por dia. Volte amanhã para a próxima rodada!`,
    };
  }

  // 3. Verificação de eliminação em dias anteriores
  const matrix = calculateCompetitionMatrix(attempts);
  const participantRow = matrix.find((r) => r.email.toLowerCase() === cleanEmail);
  if (participantRow && participantRow.status === 'Eliminado') {
    return {
      allowed: false,
      reason: `⚠️ Você foi eliminado da competição na rodada de ${participantRow.eliminatedDate || 'dias anteriores'} e não pode realizar novas cobranças.`,
    };
  }

  return { allowed: true };
}
