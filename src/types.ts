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

export interface GameAnswerRecord {
  questionId: string;
  pergunta: string;
  userChoice: Corner;
  userText: string;
  correctChoice: Corner;
  correctText: string;
  isCorrect: boolean;
}

export type GamePhase = 'START' | 'COUNTDOWN' | 'AIMING' | 'SHOOTING' | 'RESULT_REVEAL' | 'GAME_OVER';

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
