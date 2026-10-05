import React from 'react';
import { GameAnswerRecord, GameTheme } from '../types';
import { Volume2, VolumeX, RotateCcw, HelpCircle } from 'lucide-react';
import { sounds } from '../sound';

interface ScoreBoardProps {
  currentIndex: number;
  totalQuestions: number;
  score: number;
  records: GameAnswerRecord[];
  playerName: string;
  theme: GameTheme;
  isMuted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  onOpenGuide: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  currentIndex,
  totalQuestions,
  score,
  records,
  playerName,
  isMuted,
  onToggleMute,
  onRestart,
  onOpenGuide,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto mb-3 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border-2 border-slate-800 rounded-xl backdrop-blur-md shadow-md text-slate-200">
      {/* Player badge & Question Counter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold text-slate-100 max-w-[140px] truncate">
            {playerName || 'Jogador'}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-700" />
        <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm text-slate-300">
          <span className="text-slate-400">Pênalti</span>
          <span className="font-bold text-amber-400">{currentIndex + 1}</span>
          <span className="text-slate-500">/</span>
          <span>{totalQuestions}</span>
        </div>
      </div>

      {/* Penalty Shootout Icons tracker (like a real penalty shootout: ⚽ / ❌ / ⚪) */}
      <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const rec = records[idx];
          if (rec) {
            return (
              <span
                key={idx}
                title={`Pênalti ${idx + 1}: ${rec.isCorrect ? 'Gol' : 'Defendido'}`}
                className="text-sm"
              >
                {rec.isCorrect ? '⚽' : '❌'}
              </span>
            );
          }
          if (idx === currentIndex) {
            return (
              <span
                key={idx}
                title={`Pênalti ${idx + 1}: Em andamento`}
                className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 bg-amber-400/30 animate-ping inline-block"
              />
            );
          }
          return (
            <span
              key={idx}
              title={`Pênalti ${idx + 1}: Aguardando`}
              className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"
            />
          );
        })}
      </div>

      {/* Score and Controls */}
      <div className="flex items-center gap-3">
        {/* Score count */}
        <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/40 px-3 py-1 rounded-lg">
          <span className="text-xs text-emerald-400 font-mono">GOLS:</span>
          <span className="font-['Press_Start_2P'] text-xs text-emerald-300 font-bold">
            {score}
          </span>
        </div>

        {/* Audio Mute button */}
        <button
          onClick={() => {
            onToggleMute();
            sounds.playBlip();
          }}
          title={isMuted ? 'Ativar Sons do Arcade' : 'Mutar Sons'}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Instructions/Help Guide */}
        <button
          onClick={onOpenGuide}
          title="Guia Google Sites & Instruções"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Restart button */}
        <button
          onClick={onRestart}
          title="Reiniciar Partida"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
