import React, { useState, useEffect } from 'react';
import { PlayerInfo, GameAnswerRecord, GameTheme } from '../types';
import { Share2, Check, ExternalLink } from 'lucide-react';
import { sounds } from '../sound';

interface EndScreenProps {
  score: number;
  totalQuestions: number;
  records: GameAnswerRecord[];
  playerInfo: PlayerInfo;
  theme: GameTheme;
  webhookUrl: string;
  onRestart: () => void;
  onOpenGuide: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({
  score,
  totalQuestions,
  records,
  playerInfo,
  theme,
  webhookUrl,
  onOpenGuide,
}) => {
  const [copied, setCopied] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const percentage = Math.round((score / totalQuestions) * 100);

  // Medalha e mensagens personalizadas
  let medalIcon: string | null = null;
  let medalTitle = '';
  let titleBadge = '';
  let message = '';

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
    // Para quem acertou menos de 3, NÃO aparece medalha nenhuma!
    medalIcon = null;
    titleBadge = 'Fique ligado nos próximos dias';
    message = 'Obrigado pela sua participação! Fique ligado nos próximos dias para as novas rodadas da Copa do SGQ!';
  }

  // Registrar email como já jogado para impedir repetição da rodada
  useEffect(() => {
    if (playerInfo.email && playerInfo.email.trim()) {
      const cleanEmail = playerInfo.email.trim().toLowerCase();
      try {
        const playedEmails: string[] = JSON.parse(localStorage.getItem('copa_sgq_played_emails') || '[]');
        if (!playedEmails.includes(cleanEmail)) {
          playedEmails.push(cleanEmail);
          localStorage.setItem('copa_sgq_played_emails', JSON.stringify(playedEmails));
        }
      } catch (err) {}
    }
  }, [playerInfo.email]);

  // Auto-send result to Google Sheets Webhook silently if configured
  useEffect(() => {
    if (!webhookUrl || webhookUrl.trim() === '') return;

    setWebhookStatus('sending');
    const payload = {
      timestamp: new Date().toLocaleString('pt-BR'),
      name: playerInfo.name,
      nome: playerInfo.name,
      email: playerInfo.email || 'N/A',
      theme: theme.title,
      score,
      gols: score,
      totalQuestions,
      total: totalQuestions,
      percentage: `${percentage}%`,
      aproveitamento: `${percentage}%`,
      medalha: medalTitle || 'Sem medalha',
      answers: records.map((r, i) => `Q${i + 1}: [${r.userChoice}] ${r.isCorrect ? 'Gol' : 'Defesa'}`).join(' | '),
    };

    // Google Apps Script requires simple CORS requests (text/plain) to avoid OPTIONS preflight rejection
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
  }, [webhookUrl, playerInfo, theme, score, totalQuestions, percentage, records, medalTitle]);

  const handleCopyShare = () => {
    sounds.playBlip();
    const medalText = medalIcon ? `\n🏅 ${medalTitle}` : '';
    const text = `🏆 Resultado na ${theme.title} (ACIM):\n👤 Colaborador: ${playerInfo.name}\n⚽ Gols: ${score}/${totalQuestions} (${percentage}%)${medalText}\nFique ligado nos próximos dias!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-900/95 border-4 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Header com mensagem final atualizada */}
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
      <div className="grid grid-cols-3 gap-3 mb-6 text-center">
        <div className="p-3 sm:p-4 bg-slate-950/80 border-2 border-slate-800 rounded-2xl">
          <span className="text-[11px] sm:text-xs text-slate-400 font-mono block">GOLS MARCADOS</span>
          <span className="font-['Press_Start_2P'] text-lg sm:text-2xl text-emerald-400 font-bold mt-1 block">
            {score}
          </span>
        </div>

        <div className="p-3 sm:p-4 bg-slate-950/80 border-2 border-slate-800 rounded-2xl">
          <span className="text-[11px] sm:text-xs text-slate-400 font-mono block">TOTAL COBRANÇAS</span>
          <span className="font-['Press_Start_2P'] text-lg sm:text-2xl text-white font-bold mt-1 block">
            {totalQuestions}
          </span>
        </div>

        <div className="p-3 sm:p-4 bg-slate-950/80 border-2 border-slate-800 rounded-2xl">
          <span className="text-[11px] sm:text-xs text-slate-400 font-mono block">APROVEITAMENTO</span>
          <span className="font-['Press_Start_2P'] text-lg sm:text-2xl text-amber-400 font-bold mt-1 block">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Webhook Status Notification if present */}
      {webhookUrl && (
        <div className="mb-6 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Registro no Google Sheets:</span>
          {webhookStatus === 'sending' && (
            <span className="text-amber-400 flex items-center gap-1">Enviando dados...</span>
          )}
          {webhookStatus === 'success' && (
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <Check className="w-3.5 h-3.5" /> Placar Gravado!
            </span>
          )}
          {webhookStatus === 'error' && (
            <span className="text-rose-400">Falha ao gravar</span>
          )}
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
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-white">
                  Pênalti #{idx + 1}
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

      {/* Action Buttons - Botão de jogar novamente REMOVIDO! */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleCopyShare}
          className="flex-1 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
        >
          {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? 'Resultado Copiado!' : 'Copiar Meu Resultado'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenGuide}
          className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          <span>Google Sites & Sheets</span>
        </button>
      </div>

      {/* Aviso de tentativa única final */}
      <div className="mt-4 text-center text-xs text-slate-500">
        Esta rodada foi registrada. Fique ligado nos próximos dias para novas baterias da Copa do SGQ!
      </div>
    </div>
  );
};
