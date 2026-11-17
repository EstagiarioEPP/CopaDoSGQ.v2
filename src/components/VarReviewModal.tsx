import React, { useState, useRef } from 'react';
import { Tv, Send, AlertCircle, Scale } from 'lucide-react';
import { sounds } from '../sound';
import { storageService } from '../services/storageService';

interface VarReviewModalProps {
  playerName: string;
  questionText?: string;
  onConfirmVar: (varText: string) => void;
}

export const VarReviewModal: React.FC<VarReviewModalProps> = ({
  playerName,
  questionText,
  onConfirmVar,
}) => {
  const [varText, setVarText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeQuestion =
    questionText && questionText.trim().length > 0
      ? questionText.trim()
      : storageService.getVarQuestion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = varText.trim();
    if (!cleaned) {
      sounds.playBuzzer();
      setErrorMsg('Esta resposta é obrigatória para o critério de desempate. Escreva sua resposta antes de confirmar.');
      textareaRef.current?.focus();
      return;
    }

    setErrorMsg('');
    sounds.playCoachWhistle();
    onConfirmVar(cleaned);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900/95 border-4 border-cyan-400/70 rounded-3xl p-6 sm:p-8 shadow-[0_0_45px_rgba(34,211,238,0.2)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center mb-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-950/80 border-2 border-cyan-400/60 mb-3 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
          <Tv className="w-8 h-8 text-cyan-300" />
        </div>

        <h2 className="font-['Press_Start_2P'] text-base sm:text-xl text-cyan-300 tracking-wide mb-2 leading-relaxed">
          CHAMADA DO VAR — DESEMPATE!
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 font-mono">
          {playerName || 'Jogador'} · Pergunta Final Obrigatória da Rodada 18/11
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 sm:p-5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
            <Scale className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Critério Oficial de Desempate</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
            {activeQuestion}
          </p>
        </div>

        <div>
          <label
            htmlFor="var-practical-example"
            className="block text-xs font-semibold text-slate-300 mb-1.5"
          >
            Sua resposta de desempate <span className="text-rose-400">*</span>
          </label>
          <textarea
            ref={textareaRef}
            id="var-practical-example"
            rows={4}
            required
            value={varText}
            onChange={(e) => {
              setVarText(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="Escreva aqui sua análise completa e objetiva para a banca..."
            className="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden transition-colors leading-relaxed"
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

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
