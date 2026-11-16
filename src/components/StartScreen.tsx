import React, { useState, useEffect } from 'react';
import { GameTheme, PlayerInfo, TestModeConfig } from '../types';
import { Trophy, Play, AlertCircle, Clock, FlaskConical } from 'lucide-react';
import { sounds } from '../sound';
import { CompetitionStatusBanner } from './CompetitionStatusBanner';
import {
  canParticipantPlayToday,
  getSaoPauloDateString,
  getSaoPauloTimeInfo,
} from '../competition/competitionEngine';
import { storageService } from '../services/storageService';

interface StartScreenProps {
  theme: GameTheme;
  playerInfo: PlayerInfo;
  onUpdatePlayer: (info: PlayerInfo) => void;
  onStartGame: () => void;
  onEliminated?: (info: { name: string; email: string; eliminatedDate?: string }) => void;
  totalQuestions: number;
  testMode?: TestModeConfig | null;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  theme,
  playerInfo,
  onUpdatePlayer,
  onStartGame,
  onEliminated,
  totalQuestions,
  testMode,
}) => {
  const isTestMode = Boolean(testMode?.active);
  const effectiveDate =
    isTestMode && testMode?.simulatedDate ? testMode.simulatedDate : getSaoPauloDateString();
  const timeInfo = getSaoPauloTimeInfo();
  const isOutsideHours = !isTestMode && !timeInfo.isWithinHours;

  const [name, setName] = useState(
    playerInfo.name || (isTestMode ? 'Teste Gestão SGQ' : '')
  );
  const [email, setEmail] = useState(
    playerInfo.email || (isTestMode ? 'teste.gestao@acim.com.br' : '')
  );
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isTestMode) {
      if (!name) setName('Teste Gestão SGQ');
      if (!email) setEmail('teste.gestao@acim.com.br');
    }
  }, [isTestMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isOutsideHours) {
      sounds.playBuzzer();
      setErrorMsg(
        `Fora do horário oficial de cobranças (agora são ${timeInfo.formattedTime}). O jogo fica liberado das 08:00 às 18:00 (horário de Brasília).`
      );
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Por favor, informe seu nome para entrar em campo.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Por favor, informe seu e-mail corporativo.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validação oficial: horário 08h-18h + autorizados + eliminados + tentativa única por data (liberado em Modo Teste)
    const attempts = storageService.getAttempts();
    const check = canParticipantPlayToday(cleanEmail, effectiveDate, attempts, {
      isTestMode,
    });

    if (!check.allowed) {
      sounds.playBuzzer();
      if (check.isEliminated && onEliminated) {
        onUpdatePlayer({ name: name.trim(), email: cleanEmail });
        onEliminated({
          name: name.trim(),
          email: cleanEmail,
          eliminatedDate: check.eliminatedDate,
        });
        return;
      }
      setErrorMsg(check.reason || 'Participação não autorizada.');
      return;
    }

    setErrorMsg('');
    onUpdatePlayer({ name: name.trim(), email: cleanEmail });
    sounds.playWhistle();
    onStartGame();
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900/95 border-4 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Banner de status do calendário e horário da competição oficial */}
      <CompetitionStatusBanner simulatedDate={effectiveDate} isTestMode={isTestMode} />

      {isTestMode && (
        <div className="w-full max-w-xl mx-auto p-3.5 bg-amber-950/50 border border-amber-400/50 rounded-2xl mb-4 flex items-start gap-2.5 text-xs text-amber-200">
          <FlaskConical className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-amber-300 block">Modo Teste Administrativo Ativo</strong>
            Simulando a rodada de <span className="font-mono font-bold">{effectiveDate.split('-').reverse().join('/')}</span> sem trava de horário, sem limite de tentativas e sem gravar na planilha oficial.
          </div>
        </div>
      )}

      {/* Retro Arcade Header Banner com Identidade ACIM */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-2.5">
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

        {/* Aviso de tentativa única diária e janela oficial */}
        <div className="mt-3 inline-block bg-rose-500/15 border border-rose-500/50 text-rose-300 font-bold text-xs uppercase px-3.5 py-1.5 rounded-lg tracking-wide">
          ⚠️ 1 tentativa por dia · Aberto das 08:00 às 18:00 (Brasília)
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
            disabled={isOutsideHours}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrorMsg('');
            }}
            placeholder="Digite seu nome completo"
            className="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors text-sm sm:text-base font-medium disabled:opacity-50"
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
            disabled={isOutsideHours}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMsg('');
            }}
            placeholder="seu.email@acim.com.br"
            className="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors text-sm sm:text-base font-medium disabled:opacity-50"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Utilizado para validação de tentativa única do dia e apuração dos resultados.
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
          disabled={isOutsideHours}
          className={`w-full py-4 px-6 font-['Press_Start_2P'] text-xs sm:text-sm rounded-xl font-bold tracking-wider shadow-lg transition-all flex items-center justify-center gap-3 mt-2 ${
            isOutsideHours
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 hover:shadow-amber-400/25 transform hover:-translate-y-0.5 cursor-pointer'
          }`}
        >
          {isOutsideHours ? (
            <>
              <Clock className="w-4 h-4" />
              <span>FORA DO HORÁRIO (08:00 ÀS 18:00)</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950" />
              <span>
                {isTestMode
                  ? `INICIAR TESTE (${totalQuestions} CHUTES)`
                  : `ENTRAR EM CAMPO (${totalQuestions} CHUTES)`}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
