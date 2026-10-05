import React, { useState, useEffect } from 'react';
import { Question, GameTheme, Corner } from '../types';
import { PixelGoalkeeper } from './PixelGoalkeeper';

interface StadiumFieldProps {
  question: Question;
  theme: GameTheme;
  phase: 'AIMING' | 'SHOOTING' | 'RESULT_REVEAL';
  selectedCorner: Corner | null;
  onSelectCorner: (corner: Corner) => void;
  result: {
    isCorrect: boolean;
    ballCorner: Corner;
    keeperCorner: Corner;
  } | null;
}

const CROWD_CHANTS = [
  'VAI, ACIM!',
  'VAI, TORCIDA DA QUALIDADE!',
  'É COPA DO SGQ!'
];

export const StadiumField: React.FC<StadiumFieldProps> = ({
  question,
  theme,
  phase,
  selectedCorner,
  onSelectCorner,
  result,
}) => {
  const [ballState, setBallState] = useState<'spot' | Corner>('spot');
  const [keeperState, setKeeperState] = useState<'idle' | Corner>('idle');
  const [showConfetti, setShowConfetti] = useState(false);
  const [chantIndex, setChantIndex] = useState(0);

  // Cycle crowd chants smoothly during aiming phase
  useEffect(() => {
    if (phase !== 'AIMING') return;
    const interval = setInterval(() => {
      setChantIndex((prev) => (prev + 1) % CROWD_CHANTS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [phase]);

  // Synchronize ball and goalkeeper movements smoothly
  useEffect(() => {
    if (phase === 'AIMING') {
      setBallState('spot');
      setKeeperState('idle');
      setShowConfetti(false);
    } else if (phase === 'SHOOTING' && selectedCorner && result) {
      setBallState(result.ballCorner);
      setKeeperState(result.keeperCorner);

      if (result.isCorrect) {
        const timer = setTimeout(() => {
          setShowConfetti(true);
        }, 550);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, selectedCorner, result]);

  // Keyboard shortcut listener ('A', 'B', 'C', 'D' or '1', '2', '3', '4')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'AIMING') return;
      const key = e.key.toUpperCase();
      if (key === 'A' || key === '1') onSelectCorner('A');
      else if (key === 'B' || key === '2') onSelectCorner('B');
      else if (key === 'C' || key === '3') onSelectCorner('C');
      else if (key === 'D' || key === '4') onSelectCorner('D');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, onSelectCorner]);

  // Corner descriptions
  const cornerLabels: Record<Corner, string> = {
    A: 'Canto Sup. Esquerdo',
    B: 'Canto Sup. Direito',
    C: 'Canto Inf. Esquerdo',
    D: 'Canto Inf. Direito',
  };

  // Fluid ball transform: anchored at bottom penalty spot with pure GPU translate/scale/rotate interpolation
  const getBallTransform = () => {
    switch (ballState) {
      case 'A': // Top-left high corner
        return 'translate(calc(-50% - 145px), -235px) scale(0.44) rotate(-720deg)';
      case 'B': // Top-right high corner
        return 'translate(calc(-50% + 145px), -235px) scale(0.44) rotate(720deg)';
      case 'C': // Bottom-left low corner
        return 'translate(calc(-50% - 150px), -150px) scale(0.50) rotate(-540deg)';
      case 'D': // Bottom-right low corner
        return 'translate(calc(-50% + 150px), -150px) scale(0.50) rotate(540deg)';
      case 'spot':
      default:
        return 'translate(-50%, 0px) scale(1) rotate(0deg)';
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center select-none overflow-hidden rounded-2xl border-4 border-slate-900 bg-slate-950 shadow-2xl">
      {/* 1. TOP RETRO SCOREBOARD COM IDENTIDADE ACIM & PERGUNTA */}
      <div className="w-full bg-slate-900 border-b-4 border-slate-800 p-3.5 sm:p-5 text-center relative z-30">
        <div className="inline-flex items-center gap-2 mb-1.5 flex-wrap justify-center">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-['Press_Start_2P'] text-[9px] sm:text-xs text-amber-400 tracking-wider">
            ESTÁDIO ACIM — FINAL DA COPA DO SGQ · ESCOLHA O CANTO
          </span>
        </div>
        <h2 className="text-base sm:text-2xl font-bold text-white max-w-3xl mx-auto leading-snug drop-shadow-md">
          {question.pergunta}
        </h2>
      </div>

      {/* 2. THE STADIUM & GOAL ARENA VIEW */}
      <div className="relative w-full h-[520px] sm:h-[540px] bg-slate-950 overflow-hidden flex flex-col justify-between">
        {/* Sky & Stadium floodlights */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900">
          {/* Floodlight towers */}
          <div className="absolute top-2 left-6 flex gap-1 p-1 bg-slate-800 rounded border border-slate-700 shadow-lg">
            <div className="w-2.5 h-2.5 bg-yellow-200 rounded-full animate-pulse shadow-[0_0_8px_#fef08a]" />
            <div className="w-2.5 h-2.5 bg-yellow-200 rounded-full animate-pulse shadow-[0_0_8px_#fef08a]" />
            <div className="w-2.5 h-2.5 bg-yellow-200 rounded-full animate-pulse shadow-[0_0_8px_#fef08a]" />
          </div>
          <div className="absolute top-2 right-6 flex gap-1 p-1 bg-slate-800 rounded border border-slate-700 shadow-lg">
            <div className="w-2.5 h-2.5 bg-yellow-200 rounded-full animate-pulse shadow-[0_0_8px_#fef08a]" />
            <div className="w-2.5 h-2.5 bg-yellow-200 rounded-full animate-pulse shadow-[0_0_8px_#fef08a]" />
            <div className="w-2.5 h-2.5 bg-yellow-200 rounded-full animate-pulse shadow-[0_0_8px_#fef08a]" />
          </div>

          {/* Light cones */}
          <div className="absolute top-6 left-8 w-44 h-48 bg-gradient-to-br from-yellow-200/10 via-yellow-100/5 to-transparent pointer-events-none transform -rotate-12" />
          <div className="absolute top-6 right-8 w-44 h-48 bg-gradient-to-bl from-yellow-200/10 via-yellow-100/5 to-transparent pointer-events-none transform rotate-12" />
        </div>

        {/* Pixel Bleachers & Torcida com Reações Fluidas */}
        <div className="absolute top-8 inset-x-0 h-24 overflow-hidden border-b-2 border-slate-800 flex flex-col justify-end">
          {/* Balão de Grito da Torcida ACIM com transição suave */}
          <div
            className={`absolute top-1 inset-x-0 flex justify-center z-15 pointer-events-none transition-all duration-300 ${
              phase === 'AIMING' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
          >
            <span className="font-['Press_Start_2P'] text-[7px] sm:text-[8px] bg-indigo-900/90 border border-amber-400 text-amber-300 px-3 py-1 rounded-full shadow-md animate-pulse">
              📢 {CROWD_CHANTS[chantIndex]}
            </span>
          </div>

          {/* Reação da Torcida no Resultado com animação fluida */}
          <div
            className={`absolute top-1 inset-x-0 flex justify-center z-25 pointer-events-none transition-all duration-400 ${
              (phase === 'SHOOTING' || phase === 'RESULT_REVEAL') && result
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-90 translate-y-2'
            }`}
          >
            {result?.isCorrect ? (
              <div className="bg-emerald-500 text-slate-950 font-['Press_Start_2P'] text-[8px] sm:text-[10px] px-3.5 py-1.5 rounded-full shadow-lg border-2 border-white animate-bounce">
                🎉 GOOOOOOOL! A TORCIDA DA ACIM COMEMORA!
              </div>
            ) : (
              <div className="bg-rose-600 text-white font-['Press_Start_2P'] text-[8px] sm:text-[10px] px-3.5 py-1.5 rounded-full shadow-lg border-2 border-white animate-pulse">
                🧤 AAAAH! O GOLEIRO ESPALMOU!
              </div>
            )}
          </div>

          {/* Row 1 - Far crowd */}
          <div className="flex justify-around items-center opacity-85 scale-90">
            {Array.from({ length: 34 }).map((_, i) => (
              <div
                key={`c1-${i}`}
                className={`w-2 h-3 rounded-t-sm transition-transform duration-300 ${
                  showConfetti || (result?.isCorrect && phase !== 'AIMING') ? 'animate-bounce' : ''
                }`}
                style={{
                  backgroundColor: ['#eab308', '#22c55e', '#3b82f6', '#ef4444', '#f8fafc', '#a855f7'][i % 6],
                  animationDelay: `${(i % 5) * 80}ms`,
                }}
              />
            ))}
          </div>

          {/* Row 2 - Mid crowd */}
          <div className="flex justify-around items-center">
            {Array.from({ length: 42 }).map((_, i) => (
              <div
                key={`c2-${i}`}
                className={`w-2.5 h-4 rounded-t-sm transition-transform duration-300 ${
                  showConfetti || (result?.isCorrect && phase !== 'AIMING') ? 'animate-bounce' : ''
                }`}
                style={{
                  backgroundColor: ['#16a34a', '#facc15', '#2563eb', '#ffffff', '#dc2626', '#eab308'][i % 6],
                  animationDelay: `${(i % 7) * 70}ms`,
                }}
              />
            ))}
          </div>

          {/* LED Advertising Board com Identidade ACIM */}
          <div className="w-full h-5 bg-slate-900 border-y border-amber-400/40 flex items-center justify-around overflow-hidden px-2">
            <span className="font-['Press_Start_2P'] text-[7px] sm:text-[8px] text-amber-300 tracking-wider whitespace-nowrap animate-pulse">
              ★ ESTÁDIO ACIM — FINAL DA COPA DO SGQ ★ VAI, ACIM! ★ TORCIDA DA QUALIDADE ★ É COPA DO SGQ! ★
            </span>
          </div>
        </div>

        {/* Grass Pitch (Campo de Futebol com Faixas) */}
        <div className="absolute inset-x-0 bottom-0 top-32 overflow-hidden">
          <div className="w-full h-full relative bg-emerald-700">
            <div className="absolute inset-0 flex flex-col">
              <div className="h-10 bg-emerald-800 opacity-90" />
              <div className="h-12 bg-emerald-700" />
              <div className="h-14 bg-emerald-800 opacity-90" />
              <div className="h-16 bg-emerald-700" />
              <div className="h-20 bg-emerald-800 opacity-90" />
              <div className="h-24 bg-emerald-700" />
              <div className="flex-1 bg-emerald-800" />
            </div>

            {/* Pitch Lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1000 350"
              preserveAspectRatio="none"
            >
              <line x1="180" y1="80" x2="820" y2="80" stroke="#ffffff" strokeWidth="5" strokeOpacity="0.85" />
              <line x1="220" y1="80" x2="80" y2="350" stroke="#ffffff" strokeWidth="4" strokeOpacity="0.7" />
              <line x1="780" y1="80" x2="920" y2="350" stroke="#ffffff" strokeWidth="4" strokeOpacity="0.7" />
              <line x1="120" y1="310" x2="880" y2="310" stroke="#ffffff" strokeWidth="4" strokeOpacity="0.7" />
              <circle cx="500" cy="285" r="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
              <path d="M 430 310 A 80 80 0 0 1 570 310" stroke="#ffffff" strokeWidth="3" fill="none" strokeOpacity="0.6" />
            </svg>
          </div>
        </div>

        {/* 3. THE GOAL (TRAVESSÃO, TRAVES E REDE) */}
        <div className="absolute top-26 sm:top-22 left-1/2 -translate-x-1/2 w-[340px] sm:w-[480px] h-[200px] sm:h-[220px] pointer-events-none z-10">
          {/* Net Grid */}
          <div
            className={`absolute inset-x-3 top-3 bottom-0 bg-slate-900/60 transition-all ${
              showConfetti ? 'animate-pulse' : ''
            }`}
            style={{
              backgroundImage: `
                linear-gradient(45deg, rgba(255, 255, 255, 0.22) 1px, transparent 1px),
                linear-gradient(-45deg, rgba(255, 255, 255, 0.22) 1px, transparent 1px)
              `,
              backgroundSize: '12px 12px',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />
          </div>

          {/* Goal Crossbar & Posts */}
          <div className="absolute top-0 inset-x-0 h-3.5 bg-gradient-to-b from-white via-slate-100 to-slate-400 border-b border-slate-600 rounded-sm shadow-[0_4px_8px_rgba(0,0,0,0.6)]" />
          <div className="absolute top-0 left-0 w-3.5 bottom-0 bg-gradient-to-r from-white via-slate-100 to-slate-400 border-r border-slate-600 shadow-[2px_4px_8px_rgba(0,0,0,0.6)]" />
          <div className="absolute top-0 right-0 w-3.5 bottom-0 bg-gradient-to-l from-white via-slate-100 to-slate-400 border-l border-slate-600 shadow-[-2px_4px_8px_rgba(0,0,0,0.6)]" />

          {/* 4 Corner Markers (Subtle guide dots) */}
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-amber-400/20 text-[9px] font-mono text-amber-300">A</div>
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-400/20 text-[9px] font-mono text-amber-300">B</div>
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-amber-400/20 text-[9px] font-mono text-amber-300">C</div>
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-amber-400/20 text-[9px] font-mono text-amber-300">D</div>
        </div>

        {/* 4. GOALKEEPER IN CENTER COM PROVOCAÇÃO */}
        <div className="absolute top-34 sm:top-34 left-1/2 -translate-x-1/2 z-20">
          <PixelGoalkeeper state={keeperState} jerseyColor={theme.keeperJerseyColor} />
        </div>

        {/* 5. THE BALL - FLUID HARDWARE-ACCELERATED TRAJECTORY */}
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            bottom: '40px',
            left: '50%',
            transform: getBallTransform(),
            transition: 'transform 0.65s cubic-bezier(0.2, 0.85, 0.28, 1)',
            willChange: 'transform',
          }}
        >
          <div className="relative">
            <svg
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_8px_6px_rgba(0,0,0,0.6)]"
            >
              <circle cx="22" cy="22" r="20" fill="#ffffff" stroke="#18181b" strokeWidth="2" />
              <polygon points="22,12 28,16 26,23 18,23 16,16" fill="#18181b" />
              <polygon points="22,2 25,6 19,6" fill="#18181b" />
              <polygon points="38,16 41,20 37,25 33,21" fill="#18181b" />
              <polygon points="6,16 11,21 7,25 3,20" fill="#18181b" />
              <polygon points="15,36 22,32 29,36 26,42 18,42" fill="#18181b" />
              <line x1="22" y1="12" x2="22" y2="6" stroke="#18181b" strokeWidth="1.5" />
              <line x1="28" y1="16" x2="33" y2="21" stroke="#18181b" strokeWidth="1.5" />
              <line x1="26" y1="23" x2="29" y2="36" stroke="#18181b" strokeWidth="1.5" />
              <line x1="18" y1="23" x2="15" y2="36" stroke="#18181b" strokeWidth="1.5" />
              <line x1="16" y1="16" x2="11" y2="21" stroke="#18181b" strokeWidth="1.5" />
            </svg>
            {/* Impact effect for save */}
            {result && !result.isCorrect && phase !== 'AIMING' && (
              <div className="absolute -top-3 -left-3 w-16 h-16 pointer-events-none animate-ping">
                <span className="text-xl">💥</span>
              </div>
            )}
          </div>
        </div>

        {/* 6. OS 4 CANTOS DO GOL (BOTÕES DAS ALTERNATIVAS A, B, C, D) */}
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
          {/* LINHA SUPERIOR: Canto A (Esq) e Canto B (Dir) */}
          <div className="flex justify-between items-start gap-4 mt-1">
            {/* CORNER A */}
            <div className="w-[44%] max-w-[270px] pointer-events-auto">
              <button
                onClick={() => phase === 'AIMING' && onSelectCorner('A')}
                disabled={phase !== 'AIMING'}
                className={`w-full group text-left relative p-2.5 sm:p-3.5 rounded-xl font-medium transition-all duration-200 border-2 sm:border-3 ${
                  selectedCorner === 'A'
                    ? result?.isCorrect
                      ? 'bg-emerald-600 border-white text-white shadow-[0_0_20px_#10b981] scale-105'
                      : 'bg-rose-700 border-white text-white shadow-[0_0_20px_#f43f5e] scale-105'
                    : phase === 'AIMING'
                    ? 'bg-slate-900/95 hover:bg-slate-800 border-amber-400 hover:border-amber-300 text-white shadow-lg hover:scale-102 hover:-translate-y-0.5 cursor-pointer active:scale-98'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-400 text-slate-950 font-['Press_Start_2P'] text-[9px] font-bold">
                    A
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono tracking-wider">
                    {cornerLabels.A}
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-snug font-semibold text-slate-100 group-hover:text-amber-200 transition-colors line-clamp-3">
                  {question.respostas.A}
                </p>
              </button>
            </div>

            {/* CORNER B */}
            <div className="w-[44%] max-w-[270px] pointer-events-auto">
              <button
                onClick={() => phase === 'AIMING' && onSelectCorner('B')}
                disabled={phase !== 'AIMING'}
                className={`w-full group text-left relative p-2.5 sm:p-3.5 rounded-xl font-medium transition-all duration-200 border-2 sm:border-3 ${
                  selectedCorner === 'B'
                    ? result?.isCorrect
                      ? 'bg-emerald-600 border-white text-white shadow-[0_0_20px_#10b981] scale-105'
                      : 'bg-rose-700 border-white text-white shadow-[0_0_20px_#f43f5e] scale-105'
                    : phase === 'AIMING'
                    ? 'bg-slate-900/95 hover:bg-slate-800 border-amber-400 hover:border-amber-300 text-white shadow-lg hover:scale-102 hover:-translate-y-0.5 cursor-pointer active:scale-98'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-400 text-slate-950 font-['Press_Start_2P'] text-[9px] font-bold">
                    B
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono tracking-wider">
                    {cornerLabels.B}
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-snug font-semibold text-slate-100 group-hover:text-amber-200 transition-colors line-clamp-3">
                  {question.respostas.B}
                </p>
              </button>
            </div>
          </div>

          {/* LINHA INFERIOR: Canto C (Esq) e Canto D (Dir) */}
          <div className="flex justify-between items-end gap-4 mb-3">
            {/* CORNER C */}
            <div className="w-[44%] max-w-[270px] pointer-events-auto">
              <button
                onClick={() => phase === 'AIMING' && onSelectCorner('C')}
                disabled={phase !== 'AIMING'}
                className={`w-full group text-left relative p-2.5 sm:p-3.5 rounded-xl font-medium transition-all duration-200 border-2 sm:border-3 ${
                  selectedCorner === 'C'
                    ? result?.isCorrect
                      ? 'bg-emerald-600 border-white text-white shadow-[0_0_20px_#10b981] scale-105'
                      : 'bg-rose-700 border-white text-white shadow-[0_0_20px_#f43f5e] scale-105'
                    : phase === 'AIMING'
                    ? 'bg-slate-900/95 hover:bg-slate-800 border-amber-400 hover:border-amber-300 text-white shadow-lg hover:scale-102 hover:-translate-y-0.5 cursor-pointer active:scale-98'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-400 text-slate-950 font-['Press_Start_2P'] text-[9px] font-bold">
                    C
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono tracking-wider">
                    {cornerLabels.C}
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-snug font-semibold text-slate-100 group-hover:text-amber-200 transition-colors line-clamp-3">
                  {question.respostas.C}
                </p>
              </button>
            </div>

            {/* CORNER D */}
            <div className="w-[44%] max-w-[270px] pointer-events-auto">
              <button
                onClick={() => phase === 'AIMING' && onSelectCorner('D')}
                disabled={phase !== 'AIMING'}
                className={`w-full group text-left relative p-2.5 sm:p-3.5 rounded-xl font-medium transition-all duration-200 border-2 sm:border-3 ${
                  selectedCorner === 'D'
                    ? result?.isCorrect
                      ? 'bg-emerald-600 border-white text-white shadow-[0_0_20px_#10b981] scale-105'
                      : 'bg-rose-700 border-white text-white shadow-[0_0_20px_#f43f5e] scale-105'
                    : phase === 'AIMING'
                    ? 'bg-slate-900/95 hover:bg-slate-800 border-amber-400 hover:border-amber-300 text-white shadow-lg hover:scale-102 hover:-translate-y-0.5 cursor-pointer active:scale-98'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-400 text-slate-950 font-['Press_Start_2P'] text-[9px] font-bold">
                    D
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono tracking-wider">
                    {cornerLabels.D}
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-snug font-semibold text-slate-100 group-hover:text-amber-200 transition-colors line-clamp-3">
                  {question.respostas.D}
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* 7. AIMING INSTRUCTION BAR */}
        {phase === 'AIMING' && (
          <div className="absolute bottom-1.5 inset-x-0 z-30 flex justify-center">
            <div className="bg-slate-950/90 border border-amber-400/60 rounded-full px-4 py-1 text-xs text-amber-300 font-mono flex items-center gap-2 shadow-lg animate-pulse">
              <span>⚽ Escolha um dos 4 cantos [A, B, C ou D] para chutar!</span>
            </div>
          </div>
        )}

        {/* 8. RESULT REVEAL BANNER (GOOOOOOOL OU DEFESA) */}
        {/* CRITICAL RULE: Em caso de erro, NUNCA revelar a resposta correta! */}
        {phase === 'RESULT_REVEAL' && result && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-300">
            {result.isCorrect ? (
              <div className="text-center">
                <div className="inline-block p-4 sm:p-6 bg-slate-950/95 border-4 border-amber-400 rounded-2xl shadow-[0_0_40px_rgba(234,179,8,0.6)]">
                  <h3 className="font-['Press_Start_2P'] text-2xl sm:text-4xl text-amber-400 tracking-wider mb-2 animate-bounce">
                    GOOOOOOL! ⚽
                  </h3>
                  <p className="text-emerald-400 font-bold text-sm sm:text-base">
                    Chute no canto certo! O goleiro pulou para outro lado e a bola estufou a rede!
                  </p>
                  {question.explicacao && (
                    <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-700 text-xs sm:text-sm text-slate-200 max-w-md mx-auto text-left">
                      <span className="text-amber-400 font-semibold block mb-0.5">💡 Conceito SGQ:</span>
                      {question.explicacao}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-block p-4 sm:p-6 bg-slate-950/95 border-4 border-rose-500 rounded-2xl shadow-[0_0_40px_rgba(244,63,94,0.6)]">
                  <h3 className="font-['Press_Start_2P'] text-xl sm:text-3xl text-rose-500 tracking-wider mb-2">
                    DEFESA! 🧤
                  </h3>
                  <p className="text-rose-200 font-semibold text-sm sm:text-base">
                    O goleiro pegou essa!
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Ele adivinhou o seu canto e espalmou a cobrança.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confetti particles for goal */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-45 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={`confetti-${i}`}
                className="absolute w-2.5 h-2.5 rounded-xs animate-bounce"
                style={{
                  top: `${Math.random() * 80}%`,
                  left: `${Math.random() * 95}%`,
                  backgroundColor: ['#facc15', '#22c55e', '#3b82f6', '#ef4444', '#ec4899', '#ffffff'][i % 6],
                  transform: `rotate(${i * 24}deg)`,
                  animationDuration: `${0.8 + (i % 4) * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
