import React from 'react';
import {
  getCompetitionTimeline,
  getSaoPauloTimeInfo,
  SAO_PAULO_TIMEZONE,
} from '../competition/competitionEngine';
import { Calendar, Clock, Trophy, AlertCircle } from 'lucide-react';

interface CompetitionStatusBannerProps {
  simulatedDate?: string;
  isTestMode?: boolean;
}

export const CompetitionStatusBanner: React.FC<CompetitionStatusBannerProps> = ({
  simulatedDate,
  isTestMode = false,
}) => {
  const timeline = getCompetitionTimeline(simulatedDate);
  const timeInfo = getSaoPauloTimeInfo();

  if (timeline.isBeforeStart) {
    return (
      <div className="w-full max-w-xl mx-auto p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-2 mb-4">
        <div className="inline-flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
          <Calendar className="w-4 h-4" />
          <span>Competição SGQ Novembro 2026</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          A temporada oficial da Copa do SGQ começa em <strong>16 de novembro de 2026</strong>, das 08:00 às 18:00 ({SAO_PAULO_TIMEZONE}).
        </p>
        <div className="text-[11px] font-mono text-emerald-300">
          Período Oficial: 16/11 a 19/11/2026 · Horário: 08:00 às 18:00
        </div>
      </div>
    );
  }

  if (timeline.isEnded) {
    return (
      <div className="w-full max-w-xl mx-auto p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl text-center space-y-2 mb-4">
        <div className="inline-flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <Trophy className="w-4 h-4" />
          <span>Rodadas Encerradas — Grande Final Concluída</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          As 4 rodadas da Copa do SGQ foram finalizadas em 19 de novembro de 2026. Aguarde a divulgação no próximo Momento ACIM!
        </p>
      </div>
    );
  }

  if (timeline.dayInfo) {
    const isClosedNow = !isTestMode && !timeInfo.isWithinHours;
    const isFinalDay = timeline.dayInfo.date === '2026-11-19';
    return (
      <div className="w-full max-w-xl mx-auto space-y-2 mb-4">
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 px-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-white">Rodada {timeline.dayInfo.label}</span>
            <span className="text-slate-500">·</span>
            <span className="text-emerald-400 font-mono">Bateria {timeline.dayInfo.dayIndex} de 4</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono tabular-nums">
            08:00–18:00 (Brasília) · {isFinalDay ? '3 Cenários Finais' : '5 Pênaltis'}
          </span>
        </div>

        {isClosedNow && (
          <div className="p-3.5 bg-rose-950/50 border border-rose-500/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white block">Fora do horário oficial de cobranças</strong>
              Agora são <span className="font-mono tabular-nums">{timeInfo.formattedTime}</span> (horário de Brasília). As cobranças ficam liberadas entre <strong>08:00 e 18:00</strong>.
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
