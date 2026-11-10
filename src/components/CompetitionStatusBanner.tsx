import { getCompetitionTimeline, SAO_PAULO_TIMEZONE } from '../competition/competitionEngine';
import { Calendar, Clock, Trophy, AlertCircle } from 'lucide-react';

interface CompetitionStatusBannerProps {
  simulatedDate?: string;
}

export const CompetitionStatusBanner: React.FC<CompetitionStatusBannerProps> = ({
  simulatedDate,
}) => {
  const timeline = getCompetitionTimeline(simulatedDate);

  if (timeline.isBeforeStart) {
    return (
      <div className="w-full max-w-xl mx-auto p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-2 mb-4">
        <div className="inline-flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
          <Calendar className="w-4 h-4" />
          <span>Competição SGQ Novembro 2026</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          A nova temporada oficial da Copa do SGQ começará em <strong>16 de novembro de 2026</strong> às 00:00 (Fuso de Brasília / {SAO_PAULO_TIMEZONE}).
        </p>
        <div className="inline-block px-3 py-1 bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-mono">
          Período Oficial: 16/11 a 20/11/2026
        </div>
      </div>
    );
  }

  if (timeline.isEnded) {
    return (
      <div className="w-full max-w-xl mx-auto p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl text-center space-y-2 mb-4">
        <div className="inline-flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <Trophy className="w-4 h-4" />
          <span>Competição SGQ 2026 Encerrada</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          As 5 rodadas da Copa do SGQ foram finalizadas em 20 de novembro de 2026. Agradecemos a participação dos colaboradores!
        </p>
      </div>
    );
  }

  if (timeline.dayInfo) {
    return (
      <div className="w-full max-w-xl mx-auto p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-300 mb-4 px-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white">Rodada Oficial {timeline.dayInfo.label}</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-mono">Bateria {timeline.dayInfo.dayIndex} de 5</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">5 Pênaltis</span>
      </div>
    );
  }

  return null;
};
