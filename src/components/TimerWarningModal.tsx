import React from 'react';
import { Timer, Play, AlertTriangle } from 'lucide-react';

interface TimerWarningModalProps {
  playerName: string;
  totalQuestions: number;
  onConfirmStart: () => void;
}

export const TimerWarningModal: React.FC<TimerWarningModalProps> = ({
  playerName,
  totalQuestions,
  onConfirmStart,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900/95 border-4 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border-2 border-amber-400/50 mb-4 shadow-[0_0_25px_rgba(251,191,36,0.25)]">
        <Timer className="w-8 h-8 text-amber-400 animate-pulse" />
      </div>

      <h2 className="font-['Press_Start_2P'] text-base sm:text-xl text-amber-400 tracking-wide mb-3 leading-relaxed">
        ATENÇÃO: RODADA DE DESEMPATE!
      </h2>

      <p className="text-xs sm:text-sm text-slate-400 font-mono mb-4">
        Colaborador em campo: <strong className="text-white">{playerName}</strong> · {totalQuestions} cobranças
      </p>

      <div className="p-4 sm:p-5 bg-slate-950/90 border-2 border-amber-500/40 rounded-2xl text-left space-y-3 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
            Prepare-se! Esta rodada é cronometrada. Em caso de empate nos acertos, o tempo (em décimos de segundo) definirá quem será eliminado!
          </p>
        </div>

        <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5 pl-8 leading-relaxed list-disc">
          <li>
            O relógio mede cada pergunta em <strong>décimos de segundo (0.1s)</strong> enquanto você escolhe o canto do gol.
          </li>
          <li>
            Durante as animações de chute, defesa e leitura da explicação, o cronômetro é <strong>pausado automaticamente</strong>.
          </li>
          <li>
            Regra do Mata-Mata: se todos acertarem a pontuação máxima, o participante com o <strong>maior tempo total</strong> será eliminado.
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={onConfirmStart}
        className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-['Press_Start_2P'] text-xs sm:text-sm rounded-xl font-bold tracking-wider shadow-lg hover:shadow-amber-400/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-3"
      >
        <Play className="w-4 h-4 fill-slate-950" />
        <span>ESTOU PRONTO — INICIAR COBRANÇAS</span>
      </button>
    </div>
  );
};
