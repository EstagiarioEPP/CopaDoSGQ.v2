import React, { useState, useEffect } from 'react';
import { GameTheme, PlayerInfo, TestModeConfig, Day17RankingEntry } from '../types';
import { Trophy, Play, AlertCircle, Clock, FlaskConical, Timer, Medal, Sparkles } from 'lucide-react';
import { sounds } from '../sound';
import { CompetitionStatusBanner } from './CompetitionStatusBanner';
import {
  canParticipantPlayToday,
  getSaoPauloDateString,
  getSaoPauloTimeInfo,
  buildDay17SpeedRanking,
  isGoldenKickDay,
  getEffectiveChampionConfig,
} from '../competition/competitionEngine';
import { storageService } from '../services/storageService';
import { sheetsSyncService } from '../services/sheetsSyncService';

interface StartScreenProps {
  theme: GameTheme;
  playerInfo: PlayerInfo;
  onUpdatePlayer: (info: PlayerInfo) => void;
  onStartGame: () => void;
  onEliminated?: (info: { name: string; email: string; eliminatedDate?: string }) => void;
  onOpenChampionScreen?: () => void;
  totalQuestions: number;
  testMode?: TestModeConfig | null;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  theme,
  playerInfo,
  onUpdatePlayer,
  onStartGame,
  onEliminated,
  onOpenChampionScreen,
  totalQuestions,
  testMode,
}) => {
  const isTestMode = Boolean(testMode?.active);
  const effectiveDate =
    isTestMode && testMode?.simulatedDate ? testMode.simulatedDate : getSaoPauloDateString();
  const isFinalGoldenKick = isGoldenKickDay(effectiveDate);
  const timeInfo = getSaoPauloTimeInfo();
  const isOutsideHours = !isTestMode && !timeInfo.isWithinHours;

  const [name, setName] = useState(
    playerInfo.name || (isTestMode ? 'Teste Gestão SGQ' : '')
  );
  const [email, setEmail] = useState(
    playerInfo.email || (isTestMode ? 'teste.gestao@acim.com.br' : '')
  );
  const [errorMsg, setErrorMsg] = useState('');

  // Ranking de tempo de resposta da rodada de 17/11
  const [day17Ranking, setDay17Ranking] = useState<Day17RankingEntry[]>(() =>
    buildDay17SpeedRanking(storageService.getAttempts())
  );
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [championConfig, setChampionConfig] = useState(() => getEffectiveChampionConfig());

  useEffect(() => {
    return storageService.subscribe(() => {
      setChampionConfig(getEffectiveChampionConfig());
    });
  }, []);

  useEffect(() => {
    if (isTestMode) {
      if (!name) setName('Teste Gestão SGQ');
      if (!email) setEmail('teste.gestao@acim.com.br');
    }
  }, [isTestMode, name, email]);

  useEffect(() => {
    let cancelled = false;
    const loadRanking = async () => {
      setLoadingRanking(true);
      try {
        const result = await sheetsSyncService.fetchAllAttempts(storageService.getWebhookUrl());
        if (!cancelled) {
          setDay17Ranking(buildDay17SpeedRanking(result.attempts));
        }
      } catch {
        if (!cancelled) {
          setDay17Ranking(buildDay17SpeedRanking(storageService.getAttempts()));
        }
      } finally {
        if (!cancelled) {
          setLoadingRanking(false);
        }
      }
    };
    loadRanking();
    return () => {
      cancelled = true;
    };
  }, []);

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
      {/* Banner de status do calendário e horário */}
      <CompetitionStatusBanner simulatedDate={effectiveDate} isTestMode={isTestMode} />

      {isTestMode && (
        <div className="w-full max-w-xl mx-auto p-3.5 bg-amber-950/50 border border-amber-400/50 rounded-2xl mb-4 flex items-start gap-2.5 text-xs text-amber-200">
          <FlaskConical className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-amber-300 block">Modo Teste Ativo</strong>
            Simulando a rodada de <span className="font-mono font-bold">{effectiveDate.split('-').reverse().join('/')}</span> sem trava de horário e sem gravar na planilha oficial.
          </div>
        </div>
      )}

      {/* Botão do Campeão Oficial (visível somente após liberação manual no Painel de Gestão) */}
      {championConfig.isReleased && onOpenChampionScreen && (
        <div className="w-full max-w-xl mx-auto mb-5">
          <button
            type="button"
            onClick={() => {
              sounds.playBlip();
              onOpenChampionScreen();
            }}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border-2 border-amber-400 hover:border-amber-300 text-center transition-all cursor-pointer shadow-[0_0_25px_rgba(250,204,21,0.2)]"
          >
            <div className="flex items-center justify-center gap-2 font-['Press_Start_2P'] text-[10px] sm:text-xs text-amber-300 mb-1">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>VER GRANDE CAMPEÃO 2026</span>
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            </div>
            <span className="text-xs text-emerald-300 font-semibold">
              Cerimônia oficial liberada — clique para celebrar!
            </span>
          </button>
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

        <div className="mt-3 inline-block bg-rose-500/15 border border-rose-500/50 text-rose-300 font-bold text-xs uppercase px-3.5 py-1.5 rounded-lg tracking-wide">
          ⚠️ 1 tentativa por dia · Aberto das 08:00 às 18:00 (Brasília)
        </div>

        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
          {isFinalGoldenKick
            ? 'Grande Final da Copa do SGQ ACIM! Resolva os 3 cenários decisivos com visão prática na ACIM e no SIG Sistem.'
            : 'Mostre sua pontaria nas cobranças de pênaltis dos 4 cantos do gol!'}
        </p>
      </div>

      {/* Rules / How it works box */}
      {isFinalGoldenKick ? (
        <div className="bg-slate-950/80 border-2 border-amber-500/40 rounded-2xl p-4 mb-6">
          <h3 className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>🏆 REGRAS DA GRANDE FINAL — CHUTE DE OURO</span>
          </h3>
          <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">1.</span>
              <span>Você enfrentará <strong>3 cenários práticos</strong> cruzando os temas do SGQ e a rotina no <strong>SIG Sistem</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">2.</span>
              <span>Em cada cobrança, preencha o diagnóstico, a contenção imediata e a ação preventiva.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">3.</span>
              <span>Seus lances serão enviados diretamente para análise da banca do SGQ.</span>
            </li>
          </ul>
        </div>
      ) : (
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
      )}

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
            Informe seu e-mail corporativo @acim.com.br para entrar em campo.
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
                {isFinalGoldenKick
                  ? isTestMode
                    ? 'INICIAR TESTE (3 CENÁRIOS)'
                    : 'ENTRAR NA FINAL (3 CENÁRIOS)'
                  : isTestMode
                  ? `INICIAR TESTE (${totalQuestions} CHUTES)`
                  : `ENTRAR EM CAMPO (${totalQuestions} CHUTES)`}
              </span>
            </>
          )}
        </button>
      </form>

      {/* Ranking de Tempo de Resposta — Rodada 17/11 */}
      <div className="mt-7 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-amber-400 shrink-0" />
            <h2 className="font-['Press_Start_2P'] text-[10px] sm:text-xs text-amber-400 tracking-wide">
              RANKING DE TEMPO · RODADA 17/11
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Gols e Tempo (0.1s)
          </span>
        </div>

        {loadingRanking && day17Ranking.length === 0 ? (
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-center text-xs text-slate-400 font-mono">
            Carregando placar da rodada de 17/11...
          </div>
        ) : day17Ranking.length === 0 ? (
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
            Nenhuma cobrança registrada para a rodada de 17/11 até o momento.
          </div>
        ) : (
          <div className="bg-slate-950/90 border-2 border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/70">
            {day17Ranking.map((entry) => {
              const rankBadgeStyle =
                entry.rank === 1
                  ? 'bg-amber-400 text-slate-950'
                  : entry.rank === 2
                  ? 'bg-slate-300 text-slate-950'
                  : entry.rank === 3
                  ? 'bg-amber-700 text-amber-100'
                  : 'bg-slate-800 text-slate-300';

              return (
                <div
                  key={entry.email}
                  className="px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg font-['Press_Start_2P'] text-[10px] flex items-center justify-center shrink-0 ${rankBadgeStyle}`}
                    >
                      {entry.rank}º
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate flex items-center gap-1.5">
                        {entry.rank === 1 && <Medal className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        <span className="truncate">{entry.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 font-mono tabular-nums">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                      ⚽ {entry.score}/{entry.totalQuestions}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300 font-bold text-xs min-w-[64px] text-center">
                      ⏱ {entry.tempoResposta}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
