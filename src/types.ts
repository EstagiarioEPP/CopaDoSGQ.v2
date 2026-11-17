export type Corner = 'A' | 'B' | 'C' | 'D';

export interface QuestionAnswers {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface Question {
  id: string;
  pergunta: string;
  respostas: QuestionAnswers;
  correta: Corner;
  explicacao?: string;
  ativo?: boolean;
}

export interface PlayerInfo {
  name: string;
  email: string;
}

export interface AttemptRecord {
  name: string;
  email: string;
  score: number;
  totalQuestions: number;
  date: string; // Formato YYYY-MM-DD (ex: 2026-11-16)
  timestamp: string;
  dayIndex?: number; // 1 a 5
  tempoResposta?: string; // Tempo total da rodada em décimos de segundo (ex: "18.4s")
  temposPorPergunta?: number[]; // Tempos individuais por pergunta em décimos (ex: [4.2, 3.8, ...])
  answersSummary?: string; // Detalhes dos chutes retornados da planilha oficial
  varResponse?: string; // Coluna 10: Resposta aberta do VAR (18/11)
  goldenKickSummary?: string; // Coluna 11: Respostas dos 3 cenários da Final (19/11)
  isPendingManualReview?: boolean; // True para cobranças da Final avaliadas manualmente pela banca
  source?: 'sheet' | 'local';
}

export interface TestModeConfig {
  active: boolean;
  simulatedDate: string; // YYYY-MM-DD
  ignoreSchedule: boolean;
  previewChampion?: boolean;
}

export interface GoldenKickScenario {
  id: string;
  title: string;
  themesCrossed: string[];
  context: string;
  fields: {
    diagnosticoLabel: string;
    contencaoLabel: string;
    acaoPreventivaLabel: string;
  };
}

export interface GoldenKickAnswer {
  scenarioId: string;
  scenarioTitle: string;
  diagnostico: string;
  contencao: string;
  acaoPreventiva: string;
  elapsedTenths: number;
}

export interface ChampionConfig {
  isReleased: boolean;
  championName: string;
  championEmail: string;
  championTitle: string;
}

export interface Day17RankingEntry {
  rank: number;
  name: string;
  email: string;
  score: number;
  totalQuestions: number;
  tempoResposta: string;
  timeSeconds: number;
}

export interface ParticipantMatrixRow {
  email: string;
  name: string;
  dias: Record<string, number | null>; // Data YYYY-MM-DD -> pontuação ou null (—)
  total: number;
  status: 'Ativo' | 'Eliminado' | 'Campeão';
  eliminatedDate?: string;
}

export interface GameAnswerRecord {
  questionId: string;
  pergunta: string;
  userChoice: Corner;
  userText: string;
  correctChoice: Corner;
  correctText: string;
  isCorrect: boolean;
  responseTimeTenths?: number; // Tempo desta pergunta em décimos de segundo (ex: 4.2)
}

export type GamePhase =
  | 'START'
  | 'ELIMINATED'
  | 'TIMER_WARNING'
  | 'COUNTDOWN'
  | 'AIMING'
  | 'SHOOTING'
  | 'RESULT_REVEAL'
  // Ganchos estruturais para rodadas futuras (Dias 18 e 19):
  | 'VAR_REVIEW' // Dia 18: jogador não é impedido de jogar, mas poderá escrever texto extra
  | 'GOLDEN_KICK' // Dia 19: cenário sem múltipla escolha
  | 'GAME_OVER';

export interface GameTheme {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  primaryColor: string;
  accentColor: string;
  keeperJerseyColor: string;
  pitchGrassTone: 'classic' | 'emerald' | 'arcade';
}

// --- TIPOS DA COMPETIÇÃO DE NOVEMBRO DE 2026 ---

export interface GoogleUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

export type CompetitionDate =
  | '2026-11-16'
  | '2026-11-17'
  | '2026-11-18'
  | '2026-11-19'
  | '2026-11-20';

export type CompetitionStatus = 'BEFORE_START' | 'ACTIVE' | 'ENDED';

export type ParticipantStatus = 'ATIVO' | 'ELIMINADO' | 'CAMPEAO';

export interface Participant {
  sub: string;
  email: string;
  name: string;
  registeredAt: string;
  status: ParticipantStatus;
  eliminatedDate?: string;
}

export interface CompetitionScheduleDay {
  dayIndex: number; // 1 a 5
  date: CompetitionDate;
  dateFormatted: string; // "16/11"
  questionIds: string[];
}

