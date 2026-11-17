import React, { useState, useEffect, useMemo } from 'react';
import { PlayerInfo, GameAnswerRecord, GameTheme, GoldenKickAnswer } from '../types';
import { Share2, Check, FlaskConical, ArrowLeft, Sparkles, Tv } from 'lucide-react';
import { sounds } from '../sound';
import { storageService } from '../services/storageService';

interface EndScreenProps {
  score: number;
  totalQuestions: number;
  records: GameAnswerRecord[];
  playerInfo: PlayerInfo;
  theme: GameTheme;
  webhookUrl: string;
  isTimedRound?: boolean;
  isTestMode?: boolean;
  effectiveDate?: string;
  varResponse?: string;
  isGoldenKick?: boolean;
  goldenKickAnswers?: GoldenKickAnswer[];
  silentTimeTenths?: number;
  onExitTestMode?: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({
  score,
  totalQuestions,
  records,
  playerInfo,
  theme,
  webhookUrl,
  isTimedRound = false,
  isTestMode = false,
  effectiveDate,
  varResponse,
  isGoldenKick = false,
  goldenKickAnswers = [],
  silentTimeTenths,
  onExitTestMode,
}) => {
  const [copied, setCopied] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const safeTotal = isGoldenKick ? goldenKickAnswers.length || 3 : totalQuestions || 5;
  const percentage = Math.round((score / safeTotal) * 100);

  const tempoRespostaStr = useMemo(() => {
    if (isGoldenKick && silentTimeTenths !== undefined) {
      const rounded = Math.round(silentTimeTenths * 10) / 10;
      return `${rounded.toFixed(1)}s`;
    }
    if (isTimedRound) {
      const totalTimeTenths = records.reduce((acc, r) => acc + (r.responseTimeTenths || 0), 0);
      const roundedTotalTime = Math.round(totalTimeTenths * 10) / 10;
      return `${roundedTotalTime.toFixed(1)}s`;
    }
    return '';
  }, [isGoldenKick, silentTimeTenths, isTimedRound, records]);

  const formattedGoldenKickSummary = useMemo(() => {
    if (!isGoldenKick || goldenKickAnswers.length === 0) return '';
    return goldenKickAnswers
      .map(
        (ans, idx) =>
          `[${ans.scenarioId} · Cenário ${idx + 1} (${ans.elapsedTenths.toFixed(1)}s)] Diagnóstico: ${ans.diagnostico} | Contenção: ${ans.contencao} | Preventiva: ${ans.acaoPreventiva}`
      )
      .join(' || ');
  }, [isGoldenKick, goldenKickAnswers]);

  const cleanVarText = (varResponse || '').trim();

  // Medalha e mensagens personalizadas (apenas fora da Grande Final cega)
  let medalIcon: string | null = null;
  let medalTitle = '';
  let titleBadge = '';
  let message = '';

  if (!isGoldenKick) {
    if (score === 5) {
      medalIcon = '🥇';
      medalTitle = 'MEDALHA DE OURO';
      titleBadge = '🥇 MEDALHA DE OURO - ARTILHEIRO MÁXIMO!';
      message = 'Desempenho perfeito! 5 gols em 5 cobranças na Copa do SGQ!';
    } else if (score === 4) {
      medalIcon = '🥈';
      medalTitle = 'MEDALHA DE PRATA';
      titleBadge = '🥈 MEDALHA DE PRATA - EXCELENTE PONTARIA!';
      message = 'Excelente aproveitamento! 4 gols marcados com categoria!';
    } else if (score === 3) {
      medalIcon = '🥉';
      medalTitle = 'MEDALHA DE BRONZE';
      titleBadge = '🥉 MEDALHA DE BRONZE - BOM DESEMPENHO!';
      message = 'Bom jogo! 3 gols marcados nas cobranças!';
    } else {
      medalIcon = null;
      titleBadge = 'Fique ligado nos próximos dias';
      message = 'Obrigado pela sua participação! Fique ligado nos próximos dias para as novas rodadas da Copa do SGQ!';
    }
  }

  // Registrar tentativa oficial apenas fora do Modo Teste
  useEffect(() => {
    if (isTestMode) return;
    if (playerInfo.email && playerInfo.email.trim()) {
      const cleanEmail = playerInfo.email.trim().toLowerCase();
      const today =
        effectiveDate ||
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date());

      storageService.recordAttempt({
        name: playerInfo.name || 'Jogador',
        email: cleanEmail,
        score: isGoldenKick ? 0 : score,
        totalQuestions: safeTotal,
        date: today,
        timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        tempoResposta: tempoRespostaStr || undefined,
        temposPorPergunta: isTimedRound
          ? records.map((r) => r.responseTimeTenths || 0)
          : undefined,
        varResponse: cleanVarText || undefined,
        goldenKickSummary: formattedGoldenKickSummary || undefined,
        isPendingManualReview: isGoldenKick,
      });
    }
  }, [
    isTestMode,
    effectiveDate,
    playerInfo.name,
    playerInfo.email,
    score,
    safeTotal,
    tempoRespostaStr,
    isTimedRound,
    records,
    cleanVarText,
    formattedGoldenKickSummary,
    isGoldenKick,
  ]);

  // Auto-send result to Google Sheets Webhook silently if configured (never in Test Mode)
  useEffect(() => {
    if (isTestMode || !webhookUrl || webhookUrl.trim() === '') return;

    const today =
      effectiveDate ||
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

    setWebhookStatus('sending');
    const payload = {
      timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      date: today,
      data: today,
      name: playerInfo.name,
      nome: playerInfo.name,
      email: playerInfo.email || 'N/A',
      theme: theme.title,
      score: isGoldenKick ? 0 : score,
      gols: isGoldenKick ? 0 : score,
      acertos: isGoldenKick ? 'Em análise' : `${score}/${safeTotal}`,
      totalQuestions: safeTotal,
      total: safeTotal,
      percentage: isGoldenKick ? 'Banca SGQ' : `${percentage}%`,
      aproveitamento: isGoldenKick ? 'Banca SGQ' : `${percentage}%`,
      medalha: isGoldenKick ? 'Avaliação da Banca' : medalTitle || 'Sem medalha',
      tempoResposta: tempoRespostaStr || '-',
      varResponse: cleanVarText || '-',
      goldenKickSummary: formattedGoldenKickSummary || '-',
      isGoldenKick,
      answers: isGoldenKick
        ? 'Grande Final — 3 Cenários (Avaliação Manual)'
        : records
            .map((r, i) => {
              const timeSuffix =
                r.responseTimeTenths !== undefined ? ` (${r.responseTimeTenths.toFixed(1)}s)` : '';
              return `Q${i + 1}: [${r.userChoice}] ${r.isCorrect ? 'Gol' : 'Defesa'}${timeSuffix}`;
            })
            .join(' | '),
    };

    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    })
      .then(() => {
        setWebhookStatus('success');
      })
      .catch((err) => {
        console.error('Webhook error:', err);
        setWebhookStatus('error');
      });
  }, [
    isTestMode,
    effectiveDate,
    webhookUrl,
    playerInfo,
    theme,
    score,
    safeTotal,
    percentage,
    records,
    medalTitle,
    tempoRespostaStr,
    cleanVarText,
    formattedGoldenKickSummary,
    isGoldenKick,
  ]);

  const handleCopyShare = () => {
    sounds.playBlip();
    if (isGoldenKick) {
      const text = `🏆 Grande Final — ${theme.title} (ACIM):\n👤 Finalista: ${playerInfo.name}\n⚽ 3 cenários do Chute de Ouro enviados para a banca do SGQ!`;
      navigator.clipboard.writeText(text);
    } else {
      const medalText = medalIcon ? `\n🏅 ${medalTitle}` : '';
      const timeText = tempoRespostaStr ? `\n⏱️ Tempo Total: ${tempoRespostaStr}` : '';
      const text = `🏆 Resultado na ${theme.title} (ACIM):\n👤 Colaborador: ${playerInfo.name}\n⚽ Gols: ${score}/${safeTotal} (${percentage}%)${timeText}${medalText}\nFique ligado nos próximos dias!`;
      navigator.clipboard.writeText(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // RENDERIZAÇÃO ESPECIAL DA GRANDE FINAL (19/11 — CHUTE DE OURO SEM NOTA AUTOMÁTICA)
  if (isGoldenKick) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-slate-900/95 border-4 border-amber-400/70 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(250,204,21,0.2)] backdrop-blur-md relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border-2 border-amber-400/60 mb-3 shadow-[0_0_25px_rgba(250,204,21,0.35)]">
            <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
          </div>

          <h2 className="font-['Press_Start_2P'] text-base sm:text-xl text-amber-400 tracking-wide mb-3 leading-relaxed">
            Lance enviado para a banca do SGQ!
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 max-w-lg mx-auto leading-relaxed">
            Parabéns por concluir os 3 cenários decisivos da Grande Final! Suas respostas foram registradas com segurança e serão avaliadas manualmente pela banca do SGQ.
          </p>

          <div className="mt-3 inline-block bg-slate-800/80 px-3 py-1 rounded-md text-[11px] font-mono text-slate-300 border border-slate-700">
            👤 {playerInfo.name} {playerInfo.email ? `• ${playerInfo.email}` : ''}
          </div>
        </div>

        {/* Status de envio */}
        {isTestMode ? (
          <div className="mb-6 p-3 bg-amber-950/40 rounded-xl border border-amber-500/40 flex items-center gap-2 text-xs text-amber-200">
            <FlaskConical className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Modo Teste — Simulação concluída sem gravar na planilha oficial.</span>
          </div>
        ) : (
          webhookUrl && (
            <div className="mb-6 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Envio para a banca:</span>
              {webhookStatus === 'sending' && (
                <span className="text-amber-400 flex items-center gap-1">Enviando lances...</span>
              )}
              {webhookStatus === 'success' && (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" /> Lances Registrados!
                </span>
              )}
              {webhookStatus === 'error' && (
                <span className="text-rose-400">Falha ao registrar</span>
              )}
            </div>
          )
        )}

        {/* Resumo dos 3 Cenários Enviados (sem nota e sem tempo exposto) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-6 space-y-3">
          <h3 className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">
            Lances Registrados na Grande Final ({goldenKickAnswers.length})
          </h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {goldenKickAnswers.map((ans, idx) => (
              <div
                key={ans.scenarioId}
                className="p-3.5 rounded-xl border border-amber-500/30 bg-slate-900/70 text-left space-y-1.5"
              >
                <div className="font-bold text-xs text-amber-300">
                  Chute #{idx + 1} · {ans.scenarioTitle}
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-slate-200">Diagnóstico:</strong> {ans.diagnostico}
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-slate-200">Contenção no SIG Sistem/ACIM:</strong> {ans.contencao}
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-slate-200">Ação preventiva:</strong> {ans.acaoPreventiva}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopyShare}
            className="flex-1 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Comprovante Copiado!' : 'Copiar Comprovante da Final'}</span>
          </button>

          {isTestMode && onExitTestMode && (
            <button
              type="button"
              onClick={() => {
                sounds.playBlip();
                onExitTestMode();
              }}
              className="py-3.5 px-5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Painel</span>
            </button>
          )}
        </div>

        <div className="mt-4 text-center text-xs text-slate-400">
          O resultado oficial e a revelação do Grande Campeão serão divulgados após a apuração da banca!
        </div>
      </div>
    );
  }

  // RENDERIZAÇÃO PADRÃO (RODADAS 16/11, 17/11, 18/11 COM VAR, 20/11)
  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-900/95 border-4 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center mb-6">
        {medalIcon ? (
          <div className="text-6xl mb-3 animate-bounce drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
            {medalIcon}
          </div>
        ) : (
          <div className="text-4xl mb-3">⚽</div>
        )}

        <h2 className="font-['Press_Start_2P'] text-xl sm:text-2xl text-amber-400 tracking-wider mb-2">
          Fim da Rodada!
        </h2>

        <div className={`inline-block px-4 py-1.5 rounded-full font-bold text-sm sm:text-base ${
          medalIcon
            ? 'bg-amber-500/10 border border-amber-400/40 text-amber-300'
            : 'bg-emerald-500/10 border border-emerald-400/40 text-emerald-300'
        }`}>
          {titleBadge}
        </div>

        <p className="text-xs sm:text-sm text-slate-300 mt-2.5 max-w-lg mx-auto leading-relaxed">
          {message}
        </p>

        <div className="mt-3 inline-block bg-slate-800/80 px-3 py-1 rounded-md text-[11px] font-mono text-slate-400 border border-slate-700">
          👤 {playerInfo.name} {playerInfo.email ? `• ${playerInfo.email}` : ''}
        </div>
      </div>

      {/* Big Score Cards */}
      <div className={`grid gap-3 mb-6 text-center ${isTimedRound ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
        <div className="p-3 sm:p-4 bg-slate-950/80 border-2 border-slate-800 rounded-2xl">
          <span className="text-[11px] sm:text-xs text-slate-400 font-mono block">GOLS MARCADOS</span>
          <span className="font-['Press_Start_2P'] text-lg sm:text-2xl text-emerald-400 font-bold mt-1 block">
            {score}
          </span>
        </div>

        <div className="p-3 sm:p-4 bg-slate-950/80 border-2 border-slate-800 rounded-2xl">
          <span className="text-[11px] sm:text-xs text-slate-400 font-mono block">TOTAL COBRANÇAS</span>
          <span className="font-['Press_Start_2P'] text-lg sm:text-2xl text-white font-bold mt-1 block">
            {safeTotal}
          </span>
        </div>

        <div className="p-3 sm:p-4 bg-slate-950/80 border-2 border-slate-800 rounded-2xl">
          <span className="text-[11px] sm:text-xs text-slate-400 font-mono block">APROVEITAMENTO</span>
          <span className="font-['Press_Start_2P'] text-lg sm:text-2xl text-amber-400 font-bold mt-1 block">
            {percentage}%
          </span>
        </div>

        {isTimedRound && (
          <div className="p-3 sm:p-4 bg-slate-950/80 border-2 border-amber-500/40 rounded-2xl">
            <span className="text-[11px] sm:text-xs text-amber-300 font-mono block">TEMPO TOTAL</span>
            <span className="font-['Press_Start_2P'] text-base sm:text-xl text-amber-400 font-bold mt-1 block tabular-nums">
              {tempoRespostaStr}
            </span>
          </div>
        )}
      </div>

      {/* Webhook Status Notification or Test Mode Notice */}
      {isTestMode ? (
        <div className="mb-6 p-3 bg-amber-950/40 rounded-xl border border-amber-500/40 flex items-center gap-2 text-xs text-amber-200">
          <FlaskConical className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Modo Teste — Simulação concluída sem gravar na planilha oficial.</span>
        </div>
      ) : (
        webhookUrl && (
          <div className="mb-6 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Registro da rodada:</span>
            {webhookStatus === 'sending' && (
              <span className="text-amber-400 flex items-center gap-1">Registrando pontuação...</span>
            )}
            {webhookStatus === 'success' && (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5" /> Placar Registrado!
              </span>
            )}
            {webhookStatus === 'error' && (
              <span className="text-rose-400">Falha ao registrar</span>
            )}
          </div>
        )
      )}

      {/* Comentário do VAR (18/11) quando preenchido */}
      {cleanVarText && (
        <div className="bg-cyan-950/30 border border-cyan-500/40 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 font-mono uppercase mb-1.5">
            <Tv className="w-4 h-4" />
            <span>Exemplo Prático Registrado no VAR</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{cleanVarText}</p>
        </div>
      )}

      {/* Cobranças detalhadas */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-6">
        <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-3">
          Resumo dos Chutes
        </h3>
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {records.map((rec, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-left transition-colors ${
                rec.isCorrect
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="font-bold text-xs text-white">
                  Pênalti #{idx + 1}
                  {rec.responseTimeTenths !== undefined && (
                    <span className="ml-2 font-mono text-[11px] text-amber-300 tabular-nums">
                      ({rec.responseTimeTenths.toFixed(1)}s)
                    </span>
                  )}
                </span>
                <span
                  className={`text-[10px] font-['Press_Start_2P'] px-2 py-0.5 rounded ${
                    rec.isCorrect
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {rec.isCorrect ? 'GOL ⚽' : 'DEFESA 🧤'}
                </span>
              </div>
              <div className="text-xs text-slate-300">
                Seu chute no canto <strong>[{rec.userChoice}]</strong>: <span className="text-slate-100">{rec.userText}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleCopyShare}
          className="flex-1 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
        >
          {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? 'Resultado Copiado!' : 'Copiar Meu Resultado'}</span>
        </button>

        {isTestMode && onExitTestMode && (
          <button
            type="button"
            onClick={() => {
              sounds.playBlip();
              onExitTestMode();
            }}
            className="py-3.5 px-5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel</span>
          </button>
        )}
      </div>

      <div className="mt-4 text-center text-xs text-slate-500">
        {isTestMode
          ? 'Teste encerrado. Nenhum histórico oficial foi alterado.'
          : 'Esta rodada foi registrada. Fique ligado nos próximos dias para novas baterias da Copa do SGQ!'}
      </div>
    </div>
  );
};
