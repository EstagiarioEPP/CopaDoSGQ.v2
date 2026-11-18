import React, { useState, useEffect, useRef } from 'react';
import { GoldenKickScenario, GoldenKickAnswer, GoldenKickFieldResponse, GameTheme } from '../types';
import { PixelGoalkeeper } from './PixelGoalkeeper';
import { getScenarioFields } from '../competition/competitionEngine';
import { sounds } from '../sound';
import { Sparkles, Send, AlertCircle } from 'lucide-react';

interface GoldenKickArenaProps {
  scenarios: GoldenKickScenario[];
  playerName: string;
  theme: GameTheme;
  onComplete: (answers: GoldenKickAnswer[], totalSilentTenths: number) => void;
}

export const GoldenKickArena: React.FC<GoldenKickArenaProps> = ({
  scenarios,
  playerName,
  theme,
  onComplete,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState('');
  const [isAnimatingKick, setIsAnimatingKick] = useState(false);
  const [collectedAnswers, setCollectedAnswers] = useState<GoldenKickAnswer[]>([]);

  // Cronômetro silencioso em décimos de segundo (sem exibição visual para não gerar ansiedade)
  const scenarioStartRef = useRef<number>(Date.now());
  const totalSilentTenthsRef = useRef<number>(0);

  useEffect(() => {
    if (!isAnimatingKick) {
      scenarioStartRef.current = Date.now();
    }
  }, [currentIdx, isAnimatingKick]);

  const currentScenario = scenarios[currentIdx];
  const currentFields = currentScenario ? getScenarioFields(currentScenario) : [];
  const kickAngleCorner = currentIdx % 2 === 0 ? 'B' : 'A';

  const handleSubmitScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnimatingKick || !currentScenario) return;

    const missingField = currentFields.find((f) => !(fieldValues[f.id] || '').trim());
    if (missingField) {
      sounds.playBuzzer();
      setErrorMsg('Preencha todos os campos do lance antes de bater o Chute de Ouro!');
      return;
    }

    setErrorMsg('');
    const elapsedTenths =
      Math.round(((Date.now() - scenarioStartRef.current) / 1000) * 10) / 10;
    totalSilentTenthsRef.current =
      Math.round((totalSilentTenthsRef.current + elapsedTenths) * 10) / 10;

    const fieldResponses: GoldenKickFieldResponse[] = currentFields.map((f) => ({
      fieldId: f.id,
      label: f.label,
      value: (fieldValues[f.id] || '').trim(),
    }));

    const newAnswer: GoldenKickAnswer = {
      scenarioId: currentScenario.id,
      scenarioTitle: currentScenario.title,
      diagnostico: fieldResponses[0]?.value || '',
      contencao: fieldResponses[1]?.value || '',
      acaoPreventiva: fieldResponses[2]?.value || '',
      fieldResponses,
      elapsedTenths,
    };

    const updatedAnswers = [...collectedAnswers, newAnswer];
    setCollectedAnswers(updatedAnswers);
    setIsAnimatingKick(true);
    sounds.playGoldenKick();

    window.setTimeout(() => {
      setIsAnimatingKick(false);
      if (currentIdx + 1 < scenarios.length) {
        setFieldValues({});
        setCurrentIdx((prev) => prev + 1);
      } else {
        sounds.playWhistle();
        onComplete(updatedAnswers, totalSilentTenthsRef.current);
      }
    }, 1750);
  };

  const getGoldenBallTransform = () => {
    if (!isAnimatingKick) {
      return 'translate(-50%, 0px) scale(1) rotate(0deg)';
    }
    return kickAngleCorner === 'B'
      ? 'translate(calc(-50% + 148px), -145px) scale(0.45) rotate(720deg)'
      : 'translate(calc(-50% - 148px), -145px) scale(0.45) rotate(-720deg)';
  };

  if (!currentScenario) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* HUD da Grande Final */}
      <div className="w-full px-4 py-2.5 bg-slate-900/95 border-2 border-amber-400/50 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white">{playerName || 'Finalista'}</span>
          <span className="text-slate-500">·</span>
          <span className="font-['Press_Start_2P'] text-[10px] text-amber-400">
            GRANDE FINAL
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-400">Chute de Ouro</span>
          <span className="font-bold text-amber-300 tabular-nums">
            {currentIdx + 1} / {scenarios.length}
          </span>
          <div className="flex items-center gap-1 ml-1">
            {scenarios.map((_, idx) => (
              <span
                key={idx}
                className={`w-2.5 h-2.5 rounded-full ${
                  idx < currentIdx
                    ? 'bg-amber-400'
                    : idx === currentIdx
                    ? 'bg-amber-300 ring-2 ring-amber-400/40'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Arena Visual do Chute de Ouro */}
      <div className="relative w-full overflow-hidden rounded-2xl border-4 border-amber-500/40 bg-slate-950 shadow-2xl">
        {/* Gol Compacto com Animação Dourada no Ângulo */}
        <div className="relative w-full h-56 sm:h-64 bg-gradient-to-b from-slate-900 via-indigo-950/60 to-emerald-900 overflow-hidden">
          {/* Torcida Vibrando */}
          <div className="absolute top-2 inset-x-0 flex justify-around opacity-85 px-4">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-3 rounded-t-sm ${isAnimatingKick ? 'animate-bounce' : ''}`}
                style={{
                  backgroundColor: ['#facc15', '#22c55e', '#f8fafc', '#38bdf8', '#fb923c'][i % 5],
                  animationDelay: `${(i % 5) * 70}ms`,
                }}
              />
            ))}
          </div>

          {/* Traves e Rede */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[310px] sm:w-[440px] h-[145px] pointer-events-none z-10">
            <div
              className="absolute inset-x-3 top-3 bottom-0 bg-slate-950/55"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, rgba(250, 204, 21, 0.22) 1px, transparent 1px),
                  linear-gradient(-45deg, rgba(250, 204, 21, 0.22) 1px, transparent 1px)
                `,
                backgroundSize: '12px 12px',
              }}
            />
            <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 rounded-sm shadow-lg" />
            <div className="absolute top-0 left-0 w-3 bottom-0 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600" />
            <div className="absolute top-0 right-0 w-3 bottom-0 bg-gradient-to-l from-amber-200 via-amber-400 to-amber-600" />
          </div>

          {/* Goleiro */}
          <div className="absolute top-14 left-1/2 -translate-x-1/2 scale-75 sm:scale-85 z-20">
            <PixelGoalkeeper
              state={isAnimatingKick ? (kickAngleCorner === 'B' ? 'A' : 'B') : 'idle'}
              jerseyColor={theme.keeperJerseyColor}
            />
          </div>

          {/* Bola Dourada com Rastro */}
          <div
            className="absolute z-30 pointer-events-none"
            style={{
              bottom: '16px',
              left: '50%',
              transform: getGoldenBallTransform(),
              transition: 'transform 0.7s cubic-bezier(0.18, 0.88, 0.25, 1)',
              willChange: 'transform',
            }}
          >
            <div
              className={`rounded-full p-0.5 ${
                isAnimatingKick ? 'shadow-[0_0_28px_#facc15,0_0_50px_#f59e0b]' : 'shadow-[0_0_16px_rgba(250,204,21,0.7)]'
              }`}
            >
              <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
                <circle cx="22" cy="22" r="20" fill="#facc15" stroke="#78350f" strokeWidth="2.5" />
                <polygon points="22,12 28,16 26,23 18,23 16,16" fill="#78350f" />
                <polygon points="22,2 25,6 19,6" fill="#78350f" />
                <polygon points="38,16 41,20 37,25 33,21" fill="#78350f" />
                <polygon points="6,16 11,21 7,25 3,20" fill="#78350f" />
                <polygon points="15,36 22,32 29,36 26,42 18,42" fill="#78350f" />
              </svg>
            </div>
          </div>

          {/* Banner da Animação do Chute de Ouro */}
          {isAnimatingKick && (
            <div className="absolute inset-0 z-40 bg-amber-950/35 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-slate-950/95 border-2 border-amber-400 rounded-2xl px-6 py-4 text-center shadow-[0_0_35px_rgba(250,204,21,0.65)]">
                <div className="font-['Press_Start_2P'] text-sm sm:text-xl text-amber-400 animate-bounce mb-1.5">
                  CHUTE DE OURO NO ÂNGULO!
                </div>
                <p className="text-xs sm:text-sm text-emerald-300 font-semibold">
                  {currentIdx + 1 < scenarios.length
                    ? 'Lance registrado! Preparando próximo cenário...'
                    : 'Todos os lances registrados! Enviando para a banca do SGQ...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Enunciado do Cenário e 3 Campos Discursivos */}
        <form onSubmit={handleSubmitScenario} className="p-5 sm:p-7 space-y-5 bg-slate-900/95">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-['Press_Start_2P'] text-[10px] text-amber-400">
                {currentScenario.title}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {currentScenario.themesCrossed.join(' · ')}
              </span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-sm sm:text-base text-slate-100 leading-relaxed">
              {currentScenario.context}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentFields.map((field, fIdx) => {
              const labelTone =
                fIdx % 3 === 0
                  ? 'text-amber-300'
                  : fIdx % 3 === 1
                  ? 'text-emerald-300'
                  : 'text-cyan-300';
              const borderFocus =
                fIdx % 3 === 0
                  ? 'focus:border-amber-400'
                  : fIdx % 3 === 1
                  ? 'focus:border-emerald-400'
                  : 'focus:border-cyan-400';

              return (
                <div key={field.id}>
                  <label className={`block text-xs font-semibold ${labelTone} mb-1.5`}>
                    {field.label} <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    disabled={isAnimatingKick}
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => {
                      setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }));
                      setErrorMsg('');
                    }}
                    placeholder={field.placeholder || 'Descreva sua resposta prática aplicada à ACIM e ao SIG Sistem...'}
                    className={`w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 ${borderFocus} rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden`}
                  />
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isAnimatingKick}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-60 text-slate-950 font-['Press_Start_2P'] text-xs sm:text-sm rounded-xl font-bold tracking-wider shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2.5"
          >
            <Send className="w-4 h-4" />
            <span>
              {currentIdx + 1 < scenarios.length
                ? `BATER CHUTE DE OURO (${currentIdx + 1}/${scenarios.length})`
                : `BATER ÚLTIMO CHUTE DE OURO (${scenarios.length}/${scenarios.length})`}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
