import React, { useState } from 'react';
import { Tv, Send, CheckCircle2 } from 'lucide-react';
import { sounds } from '../sound';

interface VarReviewModalProps {
  playerName: string;
  onConfirmVar: (varText: string) => void;
}

export const VarReviewModal: React.FC<VarReviewModalProps> = ({
  playerName,
  onConfirmVar,
}) => {
  const [varText, setVarText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playCoachWhistle();
    onConfirmVar(varText.trim());
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900/95 border-4 border-cyan-400/70 rounded-3xl p-6 sm:p-8 shadow-[0_0_45px_rgba(34,211,238,0.2)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center mb-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-950/80 border-2 border-cyan-400/60 mb-3 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
          <Tv className="w-8 h-8 text-cyan-300 animate-pulse" />
        </div>

        <h2 className="font-['Press_Start_2P'] text-base sm:text-xl text-cyan-300 tracking-wide mb-2 leading-relaxed">
          CHAMADA DO VAR!
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 font-mono">
          {playerName || 'Jogador'} · Checagem Extra da Rodada 18/11
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 sm:p-5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Lance Prático na ACIM / SIG Sistem</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Os 5 pênaltis da rodada foram concluídos! Antes de fechar a súmula, compartilhe um <strong>exemplo prático</strong> de como você aplica na sua rotina da <strong>ACIM</strong> ou no sistema <strong>SIG Sistem</strong> os temas de hoje (Gestão de Riscos, Missão/Visão/Valores ou Política da Qualidade).
          </p>
        </div>

        <div>
          <label
            htmlFor="var-practical-example"
            className="block text-xs font-semibold text-slate-300 mb-1.5"
          >
            Seu exemplo prático (opcional — não impede o encerramento da rodada):
          </label>
          <textarea
            id="var-practical-example"
            rows={4}
            value={varText}
            onChange={(e) => setVarText(e.target.value)}
            placeholder="Ex: No SIG Sistem, acompanho os riscos de dependência de processos e registro as melhorias junto à equipe..."
            className="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden transition-colors leading-relaxed"
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 px-6 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-['Press_Start_2P'] text-xs sm:text-sm rounded-xl font-bold tracking-wider shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2.5"
        >
          <Send className="w-4 h-4" />
          <span>CONFIRMAR AO VAR</span>
        </button>
      </form>
    </div>
  );
};
