import React from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { sounds } from '../sound';

interface EliminatedScreenProps {
  playerName: string;
  playerEmail: string;
  eliminatedDate?: string;
  onBackToStart: () => void;
}

export const EliminatedScreen: React.FC<EliminatedScreenProps> = ({
  playerName,
  playerEmail,
  eliminatedDate,
  onBackToStart,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900/95 border-4 border-rose-600/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center animate-in fade-in zoom-in-95 duration-300">
      {/* Cartão Vermelho / Apito Final Retrô */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-rose-950/80 border-2 border-rose-500/60 mb-4 shadow-[0_0_25px_rgba(244,63,94,0.3)]">
        <span className="text-4xl" role="img" aria-label="Cartão Vermelho">
          🟥
        </span>
      </div>

      <h2 className="font-['Press_Start_2P'] text-lg sm:text-xl text-rose-400 tracking-wide mb-3 leading-relaxed">
        FIM DO MATA-MATA PARA VOCÊ
      </h2>

      <p className="text-sm sm:text-base font-bold text-white mb-3">
        {playerName || 'Colaborador'}, sua participação nas cobranças foi encerrada.
      </p>

      <div className="p-4 bg-rose-950/35 border border-rose-500/40 rounded-2xl text-xs sm:text-sm text-rose-100 max-w-lg mx-auto leading-relaxed mb-5 font-medium">
        Você foi eliminado do mata-mata, mas mantenha-se conectado para ver quem será o grande campeão no Momento ACIM!
      </div>

      <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 mb-6 flex items-center justify-center gap-2 font-mono">
        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
        <span className="truncate">
          Acesso às cobranças bloqueado · {playerEmail}
          {eliminatedDate ? ` · ${eliminatedDate}` : ''}
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          sounds.playBlip();
          onBackToStart();
        }}
        className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para a Tela Inicial</span>
      </button>
    </div>
  );
};
