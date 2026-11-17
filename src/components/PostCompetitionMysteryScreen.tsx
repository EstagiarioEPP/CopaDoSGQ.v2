import React, { useEffect, useState } from 'react';
import { Trophy, Clock, ArrowLeft } from 'lucide-react';
import { sounds } from '../sound';

interface PostCompetitionMysteryScreenProps {
  onExitPreview?: () => void;
  exitLabel?: string;
}

interface LaneState {
  phase: 'idle' | 'shooting' | 'goal';
  corner: 'left' | 'right';
  goals: number;
}

const SilhouetteStriker: React.FC<{ kicking: boolean; flip?: boolean }> = ({ kicking, flip }) => (
  <svg
    width="56"
    height="64"
    viewBox="0 0 16 18"
    className={`drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)] transition-transform duration-200 ${
      kicking ? 'scale-110 -translate-y-1' : ''
    }`}
    style={{
      imageRendering: 'pixelated',
      transform: flip ? 'scaleX(-1)' : undefined,
    }}
    aria-hidden="true"
  >
    {/* Cabeça em silhueta preta com contorno sutil */}
    <rect x="6" y="1" width="4" height="4" fill="#020617" stroke="#64748b" strokeWidth="0.4" />
    {/* Tronco */}
    <rect x="5" y="5" width="6" height="6" fill="#020617" stroke="#64748b" strokeWidth="0.4" />
    {/* Braços abertos */}
    <rect x="3" y="6" width="2" height="4" fill="#020617" stroke="#64748b" strokeWidth="0.35" />
    <rect x="11" y="6" width="2" height="4" fill="#020617" stroke="#64748b" strokeWidth="0.35" />
    {/* Perna de apoio */}
    <rect x="5" y="11" width="2.5" height="6" fill="#020617" stroke="#64748b" strokeWidth="0.35" />
    {/* Perna do chute */}
    <rect
      x={kicking ? '9.5' : '8.5'}
      y={kicking ? '10' : '11'}
      width={kicking ? '4' : '2.5'}
      height={kicking ? '2.5' : '6'}
      fill="#020617"
      stroke="#64748b"
      strokeWidth="0.35"
    />
  </svg>
);

const PixelBall: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
    <polygon points="12,6 16,9 14.5,13.5 9.5,13.5 8,9" fill="#0f172a" />
    <polygon points="12,1.5 14,3.5 10,3.5" fill="#0f172a" />
    <polygon points="21,9 22.5,12 19.5,14 18,11" fill="#0f172a" />
    <polygon points="3,9 6,11 4.5,14 1.5,12" fill="#0f172a" />
  </svg>
);

export const PostCompetitionMysteryScreen: React.FC<PostCompetitionMysteryScreenProps> = ({
  onExitPreview,
  exitLabel = 'Voltar ao Painel',
}) => {
  const [laneA, setLaneA] = useState<LaneState>({ phase: 'idle', corner: 'right', goals: 1 });
  const [laneB, setLaneB] = useState<LaneState>({ phase: 'idle', corner: 'left', goals: 1 });

  useEffect(() => {
    let timerA1: number;
    let timerA2: number;
    let timerB1: number;
    let timerB2: number;

    const triggerKickA = () => {
      const corner: 'left' | 'right' = Math.random() > 0.5 ? 'right' : 'left';
      setLaneA((prev) => ({ ...prev, phase: 'shooting', corner }));
      timerA1 = window.setTimeout(() => {
        setLaneA((prev) => ({ ...prev, phase: 'goal', goals: prev.goals + 1 }));
        timerA2 = window.setTimeout(() => {
          setLaneA((prev) => ({ ...prev, phase: 'idle' }));
        }, 900);
      }, 520);
    };

    const triggerKickB = () => {
      const corner: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
      setLaneB((prev) => ({ ...prev, phase: 'shooting', corner }));
      timerB1 = window.setTimeout(() => {
        setLaneB((prev) => ({ ...prev, phase: 'goal', goals: prev.goals + 1 }));
        timerB2 = window.setTimeout(() => {
          setLaneB((prev) => ({ ...prev, phase: 'idle' }));
        }, 900);
      }, 520);
    };

    // Inicia sequências alternadas de gols para ambos os finalistas misteriosos
    const startDelayA = window.setTimeout(triggerKickA, 350);
    const startDelayB = window.setTimeout(triggerKickB, 1150);

    const intervalA = window.setInterval(triggerKickA, 2300);
    const intervalB = window.setInterval(triggerKickB, 2300);

    return () => {
      window.clearTimeout(startDelayA);
      window.clearTimeout(startDelayB);
      window.clearTimeout(timerA1);
      window.clearTimeout(timerA2);
      window.clearTimeout(timerB1);
      window.clearTimeout(timerB2);
      window.clearInterval(intervalA);
      window.clearInterval(intervalB);
    };
  }, []);

  const renderMysteryPitch = (lane: LaneState, sideLabel: string, flipStriker: boolean) => {
    const ballTransform =
      lane.phase === 'idle'
        ? 'translate(-50%, 0px) scale(1) rotate(0deg)'
        : lane.corner === 'right'
        ? 'translate(calc(-50% + 52px), -102px) scale(0.62) rotate(540deg)'
        : 'translate(calc(-50% - 52px), -102px) scale(0.62) rotate(-540deg)';

    return (
      <div className="relative rounded-2xl border-2 border-slate-700/80 bg-gradient-to-b from-slate-900 via-indigo-950/60 to-emerald-900 overflow-hidden h-64 sm:h-72 flex flex-col justify-between shadow-inner">
        {/* Torcida em silhueta */}
        <div className="px-4 pt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400 z-20">
          <span className="uppercase tracking-wider text-slate-300 font-bold">{sideLabel}</span>
          <span className="font-bold text-amber-300 tabular-nums">
            ⚽ {lane.goals} gols
          </span>
        </div>

        {/* Trave e Rede */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[180px] sm:w-[210px] h-[92px] z-10">
          <div
            className={`absolute inset-x-2 top-2 bottom-0 transition-colors duration-200 ${
              lane.phase === 'goal' ? 'bg-amber-400/20' : 'bg-slate-950/50'
            }`}
            style={{
              backgroundImage: `
                linear-gradient(45deg, rgba(248, 250, 252, 0.2) 1px, transparent 1px),
                linear-gradient(-45deg, rgba(248, 250, 252, 0.2) 1px, transparent 1px)
              `,
              backgroundSize: '10px 10px',
            }}
          />
          <div className="absolute top-0 inset-x-0 h-2.5 bg-slate-100 rounded-xs shadow" />
          <div className="absolute top-0 left-0 w-2.5 bottom-0 bg-slate-100" />
          <div className="absolute top-0 right-0 w-2.5 bottom-0 bg-slate-100" />
        </div>

        {/* Selo de GOOOOOL! ao estufar a rede */}
        {lane.phase === 'goal' && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in zoom-in-90 duration-150">
            <span className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-['Press_Start_2P'] text-[10px] shadow-[0_0_20px_rgba(250,204,21,0.7)] whitespace-nowrap">
              GOOOOL!
            </span>
          </div>
        )}

        {/* Faixas do gramado */}
        <div
          className="absolute inset-x-0 bottom-0 h-32 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(16,185,129,0.22) 0px, rgba(16,185,129,0.22) 16px, rgba(6,78,59,0.25) 16px, rgba(6,78,59,0.25) 32px)',
          }}
        />

        {/* Bola + Jogador em Silhueta Preta */}
        <div className="relative h-32 w-full z-20">
          <div
            className="absolute bottom-14 left-1/2 pointer-events-none motion-reduce:transition-none"
            style={{
              transform: ballTransform,
              transition: 'transform 0.5s cubic-bezier(0.2, 0.85, 0.3, 1)',
              willChange: 'transform',
            }}
          >
            <PixelBall className={lane.phase === 'goal' ? 'drop-shadow-[0_0_12px_#facc15]' : ''} />
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <SilhouetteStriker kicking={lane.phase === 'shooting'} flip={flipStriker} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900/95 border-4 border-amber-400/60 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-400/40 shadow-[0_0_25px_rgba(250,204,21,0.2)]">
          <Trophy className="w-7 h-7 text-amber-400" />
        </div>

        <h1 className="font-['Press_Start_2P'] text-base sm:text-xl text-amber-400 tracking-wide leading-relaxed text-balance">
          Aguarde a divulgação no próximo Momento ACIM
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          As cobranças da Copa do SGQ ACIM 2026 foram encerradas! Os lances decisivos dos finalistas estão sendo apurados pela banca para a grande revelação presencial.
        </p>

        <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-300">
          <Clock className="w-4 h-4 shrink-0" />
          <span>Quem levantará a taça? Mistério no estádio até o Momento ACIM!</span>
        </div>
      </div>

      {/* Arena dos 2 Jogadores Misteriosos em Silhueta Preta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderMysteryPitch(laneA, 'Finalista Misterioso 1', false)}
        {renderMysteryPitch(laneB, 'Finalista Misterioso 2', true)}
      </div>

      {onExitPreview && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => {
              sounds.playBlip();
              onExitPreview();
            }}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{exitLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
};
