import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, ArrowLeft, Sparkles } from 'lucide-react';
import { sounds } from '../sound';

interface ChampionScreenProps {
  championName: string;
  championTitle?: string;
  onExit?: () => void;
  exitLabel?: string;
}

const CONFETTI_PIECES = Array.from({ length: 44 }).map((_, i) => ({
  id: i,
  left: `${(i * 23) % 98}%`,
  top: `${(i * 17) % 88}%`,
  color: ['#facc15', '#10b981', '#38bdf8', '#f43f5e', '#ffffff', '#fb923c'][i % 6],
  delay: `${(i % 8) * 140}ms`,
  duration: `${1.1 + (i % 5) * 0.25}s`,
  size: i % 3 === 0 ? 'w-3 h-3' : 'w-2 h-2',
}));

export const ChampionScreen: React.FC<ChampionScreenProps> = ({
  championName,
  championTitle = 'GRANDE CAMPEÃO DA COPA DO SGQ ACIM 2026',
  onExit,
  exitLabel = 'Voltar',
}) => {
  const [isMuted, setIsMuted] = useState(sounds.isMuted);
  const [fanfarePlayed, setFanfarePlayed] = useState(false);

  useEffect(() => {
    // Tenta disparar a fanfarra triunfal automaticamente ao abrir (caso já haja interação prévia)
    sounds.playChampionFanfare();
    setFanfarePlayed(true);
  }, []);

  const handleReplayFanfare = () => {
    if (sounds.isMuted) {
      sounds.toggleMute();
      setIsMuted(false);
    }
    sounds.playChampionFanfare();
    setFanfarePlayed(true);
  };

  const handleToggleMute = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-3xl border-4 border-amber-400 bg-slate-950 shadow-[0_0_70px_rgba(250,204,21,0.35)] animate-in fade-in zoom-in-95 duration-500">
      {/* Chuva Contínua de Confetes e Brilhos 8-bit */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden motion-reduce:hidden">
        {CONFETTI_PIECES.map((c) => (
          <div
            key={c.id}
            className={`absolute ${c.size} rounded-xs animate-bounce opacity-90`}
            style={{
              left: c.left,
              top: c.top,
              backgroundColor: c.color,
              animationDelay: c.delay,
              animationDuration: c.duration,
              transform: `rotate(${c.id * 27}deg)`,
            }}
          />
        ))}
      </div>

      {/* Estádio Iluminado + Torcida Vibrando */}
      <div className="relative bg-gradient-to-b from-indigo-950 via-slate-900 to-emerald-950 px-6 pt-8 pb-6 text-center border-b-4 border-amber-400/40">
        {/* Fogos / Brilhos de Canto */}
        <div className="flex justify-between items-center max-w-2xl mx-auto mb-3 opacity-90">
          <Sparkles className="w-7 h-7 text-amber-300 animate-pulse" />
          <span className="font-['Press_Start_2P'] text-[9px] sm:text-xs text-emerald-300 tracking-widest">
            ESTÁDIO ACIM · CERIMÔNIA OFICIAL
          </span>
          <Sparkles className="w-7 h-7 text-amber-300 animate-pulse" />
        </div>

        {/* Troféu Pixel Art Dourado Gigante */}
        <div className="relative inline-flex items-center justify-center my-3 z-30">
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl animate-pulse" />
          <svg
            width="144"
            height="144"
            viewBox="0 0 24 24"
            className="relative drop-shadow-[0_0_24px_rgba(250,204,21,0.75)] animate-bounce"
            style={{ imageRendering: 'pixelated', animationDuration: '2.2s' }}
            aria-label="Troféu Pixel Art Dourado"
          >
            {/* Alças */}
            <rect x="3" y="5" width="3" height="2" fill="#f59e0b" />
            <rect x="2" y="7" width="2" height="4" fill="#f59e0b" />
            <rect x="4" y="11" width="2" height="1" fill="#d97706" />
            <rect x="18" y="5" width="3" height="2" fill="#f59e0b" />
            <rect x="20" y="7" width="2" height="4" fill="#f59e0b" />
            <rect x="18" y="11" width="2" height="1" fill="#d97706" />

            {/* Corpo da Taça */}
            <rect x="6" y="4" width="12" height="2" fill="#fef08a" />
            <rect x="6" y="6" width="12" height="6" fill="#facc15" />
            <rect x="7" y="12" width="10" height="2" fill="#eab308" />
            <rect x="9" y="14" width="6" height="2" fill="#d97706" />

            {/* Brilho da Taça */}
            <rect x="8" y="6" width="2" height="5" fill="#fef9c3" />

            {/* Haste e Base */}
            <rect x="10" y="16" width="4" height="3" fill="#eab308" />
            <rect x="7" y="19" width="10" height="2" fill="#b45309" />
            <rect x="6" y="21" width="12" height="2" fill="#78350f" />
          </svg>
        </div>

        {/* Torcida Retrô Vibrando */}
        <div className="max-w-xl mx-auto flex justify-around items-end h-7 overflow-hidden opacity-90 mt-2">
          {Array.from({ length: 26 }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-4 rounded-t-sm animate-bounce"
              style={{
                backgroundColor: ['#facc15', '#22c55e', '#3b82f6', '#ffffff', '#ef4444'][i % 5],
                animationDelay: `${(i % 6) * 90}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Faixa Oficial do Campeão */}
      <div className="relative z-30 p-6 sm:p-10 text-center space-y-5 bg-slate-900/95">
        <div className="inline-block px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-['Press_Start_2P'] text-[10px] sm:text-xs tracking-wider shadow-lg">
          {championTitle}
        </div>

        <h1 className="font-['Press_Start_2P'] text-2xl sm:text-4xl text-white tracking-wide leading-relaxed drop-shadow-[0_4px_12px_rgba(250,204,21,0.4)] text-balance">
          {championName}
        </h1>

        <p className="text-sm sm:text-base text-emerald-300 max-w-xl mx-auto leading-relaxed font-semibold">
          Brilhou nas cobranças de pênalti, superou o mata-mata cronometrado, dominou o VAR e cravou o Chute de Ouro na Grande Final da Copa do SGQ ACIM 2026!
        </p>

        {/* Controles de Fanfarra e Retorno */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            type="button"
            onClick={handleReplayFanfare}
            className="px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-['Press_Start_2P'] text-[10px] sm:text-xs rounded-xl font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <Volume2 className="w-4 h-4" />
            <span>{fanfarePlayed ? 'TOCAR FANFARRA NOVAMENTE' : 'TOCAR FANFARRA 8-BIT'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Ativar Som' : 'Mudo'}</span>
          </button>

          {onExit && (
            <button
              type="button"
              onClick={() => {
                sounds.playBlip();
                onExit();
              }}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{exitLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
