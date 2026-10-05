import React, { useState } from 'react';
import { GameTheme, PlayerInfo } from '../types';
import { Trophy, Play, Settings, FileCode2, HelpCircle, AlertCircle } from 'lucide-react';
import { sounds } from '../sound';

interface StartScreenProps {
  theme: GameTheme;
  playerInfo: PlayerInfo;
  onUpdatePlayer: (info: PlayerInfo) => void;
  onStartGame: () => void;
  totalQuestions: number;
  onOpenEditor?: () => void;
  onOpenGuide?: () => void;
  onExportStandalone?: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  theme,
  playerInfo,
  onUpdatePlayer,
  onStartGame,
  totalQuestions,
  onOpenEditor,
  onOpenGuide,
  onExportStandalone,
}) => {
  const [name, setName] = useState(playerInfo.name);
  const [email, setEmail] = useState(playerInfo.email);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Por favor, informe seu nome para entrar em campo.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail) {
      // Bloquear se o e-mail já tiver realizado a tentativa da rodada
      try {
        const playedEmails: string[] = JSON.parse(localStorage.getItem('copa_sgq_played_emails') || '[]');
        if (Array.isArray(playedEmails) && playedEmails.includes(cleanEmail)) {
          setErrorMsg('⚠️ Este e-mail já participou desta rodada! É permitida apenas 1 tentativa por colaborador. Fique ligado nos próximos dias!');
          sounds.playBuzzer();
          return;
        }
      } catch (err) {}
    }

    setErrorMsg('');
    onUpdatePlayer({ name: name.trim(), email: email.trim() });
    sounds.playWhistle();
    onStartGame();
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900/95 border-4 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Retro Arcade Header Banner com Identidade ACIM */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-['Press_Start_2P'] text-[9px] text-emerald-400">ESTÁDIO ACIM</span>
        </div>

        <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 border-2 border-amber-400/40 rounded-2xl mb-3 shadow-[0_0_20px_rgba(234,179,8,0.2)] block mx-auto w-16 h-16">
          <Trophy className="w-9 h-9 text-amber-400 animate-bounce" />
        </div>

        <h1 className="font-['Press_Start_2P'] text-xl sm:text-2xl text-amber-400 tracking-wider mb-2 leading-relaxed">
          {theme.title}
        </h1>

        <p className="text-emerald-400 font-bold text-sm sm:text-base">
          {theme.subtitle}
        </p>

        {/* Aviso de tentativa única */}
        <div className="mt-3 inline-block bg-rose-500/15 border border-rose-500/50 text-rose-300 font-bold text-xs uppercase px-3.5 py-1.5 rounded-lg tracking-wide">
          ⚠️ Atenção: Tentativa única por colaborador!
        </div>

        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
          Minijogo oficial ACIM de perguntas e respostas. Mostre sua pontaria na cobrança de pênaltis dos 4 cantos do gol!
        </p>
      </div>

      {/* Rules / How it works box */}
      <div className="bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-4 mb-6">
        <h3 className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>⚽ REGRAS DA COBRANÇA (4 CANTOS)</span>
        </h3>
        <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">1.</span>
            <span>Cada pênalti possui <strong>4 opções (A, B, C e D)</strong> correspondendo aos 4 cantos do gol.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">2.</span>
            <span><strong>A</strong>: Sup. Esquerdo · <strong>B</strong>: Sup. Direito · <strong>C</strong>: Inf. Esquerdo · <strong>D</strong>: Inf. Direito.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">3.</span>
            <span>Se acertar a opção correta: o goleiro pula para outro canto e é <strong>GOOOOOOOL!</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">4.</span>
            <span>Se errar: o goleiro pula no mesmo canto escolhido e faz a <strong>DEFESA!</strong></span>
          </li>
        </ul>
      </div>

      {/* Form: Name & Email */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="player-name" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Nome do Colaborador <span className="text-rose-400">*</span>
          </label>
          <input
            id="player-name"
            type="text"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrorMsg('');
            }}
            placeholder="Digite seu nome completo"
            className="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors text-sm sm:text-base font-medium"
          />
        </div>

        <div>
          <label htmlFor="player-email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            E-mail Corporativo <span className="text-rose-400">*</span>
          </label>
          <input
            id="player-email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMsg('');
            }}
            placeholder="seu.email@empresa.com.br"
            className="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors text-sm sm:text-base font-medium"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Utilizado para validação de tentativa única da rodada e registro na planilha.
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-['Press_Start_2P'] text-xs sm:text-sm rounded-xl font-bold tracking-wider shadow-lg hover:shadow-amber-400/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-3 mt-2"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>ENTRAR EM CAMPO ({totalQuestions} CHUTES)</span>
        </button>
      </form>

      {/* Footer Utility Actions para o gestor (exibido apenas se habilitado) */}
      {(onOpenEditor || onOpenGuide || onExportStandalone) && (
        <div className="mt-8 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {onOpenEditor && (
              <button
                type="button"
                onClick={onOpenEditor}
                className="inline-flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-pointer py-1 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span>Editar Perguntas & Tema</span>
              </button>
            )}

            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="inline-flex items-center gap-1.5 hover:text-emerald-300 transition-colors cursor-pointer py-1 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Guia Google Sites</span>
              </button>
            )}
          </div>

          {onExportStandalone && (
            <button
              type="button"
              onClick={onExportStandalone}
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 hover:bg-indigo-900/60"
              title="Baixar jogo em um único arquivo HTML para os colaboradores"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Baixar .HTML</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
