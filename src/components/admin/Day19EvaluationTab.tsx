import React, { useState, useEffect } from 'react';
import {
  AttemptRecord,
  GoldenKickAnswer,
  GoldenKickEvaluation,
  GoldenKickScenario,
  RemoteCompetitionConfig,
} from '../../types';
import { DEFAULT_EVALUATION_CRITERIA } from '../../services/storageService';
import { sheetsSyncService, OFFICIAL_SPREADSHEET_ID } from '../../services/sheetsSyncService';
import {
  calculateCompetitionMatrix,
  AUTHORIZED_PARTICIPANTS,
} from '../../competition/competitionEngine';
import { sounds } from '../../sound';
import {
  Star,
  Trophy,
  RefreshCw,
  ExternalLink,
  Crown,
  CheckCircle2,
  Clock,
  Lock,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Check,
  SlidersHorizontal,
} from 'lucide-react';

interface Day19EvaluationTabProps {
  webhookUrl: string;
  attempts: AttemptRecord[];
  scenarios: GoldenKickScenario[];
  evaluations: GoldenKickEvaluation[];
  remoteConfig: RemoteCompetitionConfig;
  onEvaluationsChange: (next: GoldenKickEvaluation[]) => void;
  onConfigChange: (next: RemoteCompetitionConfig) => void;
  onRefreshAll: () => Promise<void>;
  onOpenChampionPreview: () => void;
}

interface ParsedScenarioBlock {
  scenarioId: string;
  scenarioTitle: string;
  elapsedTenths?: number;
  fields: { label: string; value: string }[];
}

function parseAttemptScenarios(
  attempt: AttemptRecord,
  configuredScenarios: GoldenKickScenario[]
): ParsedScenarioBlock[] {
  if (Array.isArray(attempt.goldenKickAnswers) && attempt.goldenKickAnswers.length > 0) {
    return attempt.goldenKickAnswers.map((ans: GoldenKickAnswer, idx: number) => {
      const fields =
        Array.isArray(ans.fieldResponses) && ans.fieldResponses.length > 0
          ? ans.fieldResponses.map((fr) => ({ label: fr.label, value: fr.value }))
          : [
              ...(ans.diagnostico ? [{ label: '1. Diagnóstico', value: ans.diagnostico }] : []),
              ...(ans.contencao
                ? [{ label: '2. Contenção SIG Sistem / ACIM', value: ans.contencao }]
                : []),
              ...(ans.acaoPreventiva
                ? [{ label: '3. Ação Preventiva', value: ans.acaoPreventiva }]
                : []),
            ];

      return {
        scenarioId: ans.scenarioId || configuredScenarios[idx]?.id || `FINAL-0${idx + 1}`,
        scenarioTitle: ans.scenarioTitle || configuredScenarios[idx]?.title || `Cenário ${idx + 1}`,
        elapsedTenths: ans.elapsedTenths,
        fields,
      };
    });
  }

  if (attempt.goldenKickSummary && attempt.goldenKickSummary !== '-') {
    const blocks = attempt.goldenKickSummary.split(' || ').filter(Boolean);
    return blocks.map((raw, idx) => {
      const headerMatch = raw.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
      const header = headerMatch ? headerMatch[1] : `FINAL-0${idx + 1}`;
      const body = headerMatch ? headerMatch[2] : raw;
      const idMatch = header.match(/(FINAL-\d+)/i);
      const scenarioId = idMatch
        ? idMatch[1].toUpperCase()
        : configuredScenarios[idx]?.id || `FINAL-0${idx + 1}`;
      const segments = body.split(' | ').map((seg) => {
        const sepIdx = seg.indexOf(':');
        if (sepIdx > 0) {
          return {
            label: seg.slice(0, sepIdx).trim(),
            value: seg.slice(sepIdx + 1).trim(),
          };
        }
        return { label: 'Resposta', value: seg.trim() };
      });

      return {
        scenarioId,
        scenarioTitle: header,
        fields: segments,
      };
    });
  }

  return [];
}

function getEvaluationAverage(ev?: GoldenKickEvaluation): number | null {
  if (!ev) return null;
  if (Array.isArray(ev.criteriaStars) && ev.criteriaStars.length === 3) {
    const rated = ev.criteriaStars.filter((v) => v > 0);
    if (rated.length === 0) return null;
    return Math.round((rated.reduce((acc, v) => acc + v, 0) / rated.length) * 10) / 10;
  }
  return ev.stars > 0 ? Math.round(ev.stars * 10) / 10 : null;
}

export const Day19EvaluationTab: React.FC<Day19EvaluationTabProps> = ({
  webhookUrl,
  attempts,
  scenarios,
  evaluations,
  remoteConfig,
  onEvaluationsChange,
  onConfigChange,
  onRefreshAll,
  onOpenChampionPreview,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [crowningEmail, setCrowningEmail] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'qualified' | 'all'>('qualified');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // Nomes editáveis dos 3 critérios
  const [criteriaDraft, setCriteriaDraft] = useState<[string, string, string]>(
    remoteConfig.evaluationCriteria || DEFAULT_EVALUATION_CRITERIA
  );
  const [isSavingCriteria, setIsSavingCriteria] = useState(false);
  const [criteriaSavedNotice, setCriteriaSavedNotice] = useState(false);

  useEffect(() => {
    if (remoteConfig.evaluationCriteria && remoteConfig.evaluationCriteria.length === 3) {
      setCriteriaDraft(remoteConfig.evaluationCriteria);
    }
  }, [remoteConfig.evaluationCriteria]);

  useEffect(() => {
    let cancelled = false;
    const syncInitial = async () => {
      const [evals, cfg] = await Promise.all([
        sheetsSyncService.fetchEvaluations19(webhookUrl),
        sheetsSyncService.fetchRemoteConfig(webhookUrl),
      ]);
      if (!cancelled) {
        onEvaluationsChange(evals);
        onConfigChange(cfg);
      }
    };
    syncInitial();
    return () => {
      cancelled = true;
    };
  }, [webhookUrl, onEvaluationsChange, onConfigChange]);

  const handleRefresh = async () => {
    sounds.playBlip();
    setIsRefreshing(true);
    try {
      await onRefreshAll();
      const [evals, cfg] = await Promise.all([
        sheetsSyncService.fetchEvaluations19(webhookUrl),
        sheetsSyncService.fetchRemoteConfig(webhookUrl),
      ]);
      onEvaluationsChange(evals);
      onConfigChange(cfg);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveCriteria = async () => {
    sounds.playWhistle();
    setIsSavingCriteria(true);
    setCriteriaSavedNotice(false);
    try {
      const nextCfg = await sheetsSyncService.saveEvaluationCriteria(webhookUrl, criteriaDraft);
      onConfigChange(nextCfg);
      setCriteriaSavedNotice(true);
      setTimeout(() => setCriteriaSavedNotice(false), 2500);
    } finally {
      setIsSavingCriteria(false);
    }
  };

  const toggleExpand = (key: string) => {
    sounds.playBlip();
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRateCriterion = async (
    email: string,
    scenarioId: string,
    dayDate: string,
    criterionIndex: 0 | 1 | 2,
    starValue: number
  ) => {
    sounds.playBlip();
    const cleanEmail = email.trim().toLowerCase();
    const key = `${cleanEmail}__${scenarioId}`;
    setSavingKey(key);

    const existing = evaluations.find(
      (ev) => ev.email.toLowerCase() === cleanEmail && ev.scenarioId === scenarioId
    );
    const currentCriteria: [number, number, number] = existing?.criteriaStars
      ? [...existing.criteriaStars] as [number, number, number]
      : [0, 0, 0];

    currentCriteria[criterionIndex] = starValue;

    const rated = currentCriteria.filter((v) => v > 0);
    const avg =
      rated.length > 0
        ? Math.round((rated.reduce((acc, v) => acc + v, 0) / rated.length) * 10) / 10
        : starValue;

    try {
      const next = await sheetsSyncService.saveEvaluation19(webhookUrl, {
        email: cleanEmail,
        scenarioId,
        dayDate,
        stars: avg,
        criteriaStars: currentCriteria,
      });
      onEvaluationsChange(next);
    } finally {
      setSavingKey(null);
    }
  };

  const handleCrownChampion = async (email: string, name: string) => {
    sounds.playChampionFanfare();
    setCrowningEmail(email);
    try {
      const nextCfg = await sheetsSyncService.crownChampion(webhookUrl, email, name);
      onConfigChange(nextCfg);
    } finally {
      setCrowningEmail(null);
    }
  };

  const handleUncrownChampion = async () => {
    sounds.playBlip();
    setCrowningEmail('uncrown');
    try {
      const nextCfg = await sheetsSyncService.uncrownChampion(webhookUrl);
      onConfigChange(nextCfg);
    } finally {
      setCrowningEmail(null);
    }
  };

  const matrix = calculateCompetitionMatrix(attempts, remoteConfig);

  const playerSummaries = matrix.map((row) => {
    const email = row.email.toLowerCase();
    const day18Attempt = attempts.find(
      (a) => a.email.toLowerCase() === email && a.date === '2026-11-18'
    );
    const day19Attempt = attempts.find(
      (a) =>
        a.email.toLowerCase() === email &&
        (a.date === '2026-11-19' ||
          Boolean(a.goldenKickAnswers && a.goldenKickAnswers.length > 0) ||
          Boolean(a.goldenKickSummary && a.goldenKickSummary !== '-'))
    );

    const day19Blocks = day19Attempt ? parseAttemptScenarios(day19Attempt, scenarios) : [];

    // Nota VAR Dia 18/11
    const eval18 = evaluations.find(
      (ev) => ev.email.toLowerCase() === email && ev.scenarioId === 'VAR-18'
    );
    const avg18 = getEvaluationAverage(eval18);

    // Notas Cenários Dia 19/11
    const scenarioIds19 =
      day19Blocks.length > 0
        ? day19Blocks.map((b) => b.scenarioId)
        : scenarios.map((s) => s.id);

    const avgs19 = scenarioIds19
      .map((scId) =>
        getEvaluationAverage(
          evaluations.find((ev) => ev.email.toLowerCase() === email && ev.scenarioId === scId)
        )
      )
      .filter((v): v is number => v !== null);

    const avg19 =
      avgs19.length > 0
        ? Math.round((avgs19.reduce((acc, v) => acc + v, 0) / avgs19.length) * 10) / 10
        : null;

    // Média geral consolidada das respostas avaliadas (18 e 19/11)
    const allResponseAvgs = [
      ...(avg18 !== null ? [avg18] : []),
      ...avgs19,
    ];
    const overallAvg =
      allResponseAvgs.length > 0
        ? Math.round(
            (allResponseAvgs.reduce((acc, v) => acc + v, 0) / allResponseAvgs.length) * 10
          ) / 10
        : null;

    return {
      row,
      email,
      day18Attempt,
      day19Attempt,
      day19Blocks,
      eval18,
      avg18,
      avg19,
      overallAvg,
      isQualified: row.status !== 'Eliminado',
    };
  });

  const qualifiedCount = playerSummaries.filter((p) => p.isQualified).length;
  const visiblePlayers =
    filterMode === 'qualified'
      ? playerSummaries.filter((p) => p.isQualified)
      : playerSummaries;

  // Ordena maior média geral primeiro
  const sortedVisiblePlayers = [...visiblePlayers].sort((a, b) => {
    const scoreA = a.overallAvg ?? -1;
    const scoreB = b.overallAvg ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.row.total - a.row.total;
  });

  const renderExpandableEvaluationBlock = (params: {
    email: string;
    scenarioId: string;
    dayDate: string;
    title: string;
    subtitle?: string;
    contentNode: React.ReactNode;
    hasSubmittedContent: boolean;
  }) => {
    const {
      email,
      scenarioId,
      dayDate,
      title,
      subtitle,
      contentNode,
      hasSubmittedContent,
    } = params;
    const key = `${email}__${scenarioId}`;
    const isExpanded = Boolean(expandedKeys[key]);
    const isSaving = savingKey === key;

    const currentEval = evaluations.find(
      (ev) => ev.email.toLowerCase() === email && ev.scenarioId === scenarioId
    );
    const avg = getEvaluationAverage(currentEval);
    const criteriaStars: [number, number, number] = currentEval?.criteriaStars
      ? currentEval.criteriaStars
      : [0, 0, 0];
    const ratedCount = criteriaStars.filter((v) => v > 0).length;

    return (
      <div
        key={scenarioId}
        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
      >
        {/* Linha superior: Título + Média da Resposta + Botão Abrir Critérios */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-amber-300 block">{title}</span>
            {subtitle && (
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {subtitle}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Média da resposta */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <Star
                className={`w-3.5 h-3.5 ${
                  avg !== null ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                }`}
              />
              <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                {avg !== null ? `${avg.toFixed(1)} / 5.0` : 'Sem nota'}
              </span>
              {ratedCount > 0 && (
                <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                  ({ratedCount}/3 critérios)
                </span>
              )}
            </div>

            {hasSubmittedContent && (
              <button
                type="button"
                onClick={() => toggleExpand(key)}
                aria-expanded={isExpanded}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  isExpanded
                    ? 'bg-amber-400 text-slate-950 border-amber-400'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                <span>{isExpanded ? 'Fechar 3 Critérios' : 'Abrir 3 Critérios'}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo da resposta */}
        {contentNode}

        {/* Gaveta expansível com os 3 critérios de 1 a 5 estrelas separados */}
        {isExpanded && hasSubmittedContent && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-400/30 space-y-2.5">
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
              <span className="text-[11px] font-semibold text-amber-300">
                Avaliação detalhada nos 3 critérios (1 a 5 estrelas)
              </span>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {isSaving
                  ? 'Salvando na planilha...'
                  : avg !== null
                  ? `Média desta resposta: ${avg.toFixed(1)} ★`
                  : 'Clique nas estrelas para avaliar'}
              </span>
            </div>

            {!currentEval?.criteriaStars && currentEval && currentEval.stars > 0 && (
              <p className="text-[11px] text-slate-400">
                Nota anterior registrada ({currentEval.stars.toFixed(1)} ★). Selecione as estrelas abaixo para registrar os 3 critérios separadamente.
              </p>
            )}

            <div className="space-y-2">
              {([0, 1, 2] as const).map((cIdx) => {
                const criterionScore = criteriaStars[cIdx] || 0;
                const criterionLabel = criteriaDraft[cIdx] || DEFAULT_EVALUATION_CRITERIA[cIdx];
                return (
                  <div
                    key={cIdx}
                    className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80"
                  >
                    <span className="text-xs text-slate-200 font-medium min-w-0 flex-1">
                      {criterionLabel}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((starNum) => {
                          const filled = starNum <= criterionScore;
                          return (
                            <button
                              key={starNum}
                              type="button"
                              onClick={() =>
                                handleRateCriterion(email, scenarioId, dayDate, cIdx, starNum)
                              }
                              aria-label={`${criterionLabel}: ${starNum} estrela(s)`}
                              className="p-1 rounded hover:bg-slate-800 transition-transform hover:scale-110 cursor-pointer"
                              title={`${starNum} estrela(s)`}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  filled ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-300 tabular-nums min-w-[2.25rem] text-right">
                        {criterionScore > 0 ? `${criterionScore}/5` : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Avaliação das Respostas Abertas (18/11 e 19/11) — Exclusivo Gestão</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Avalie o VAR de 18/11 e os cenários de 19/11 nos 3 critérios editáveis (1 a 5 estrelas). As médias por resposta e por dia ficam ocultas aos jogadores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-slate-950 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Respostas'}</span>
          </button>

          <a
            href={`https://docs.google.com/spreadsheets/d/${OFFICIAL_SPREADSHEET_ID}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir Planilha</span>
          </a>
        </div>
      </div>

      {/* Editor dos 3 Critérios */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span>Nomes dos 3 Critérios de Avaliação (1 a 5 Estrelas)</span>
          </div>

          <button
            type="button"
            onClick={handleSaveCriteria}
            disabled={isSavingCriteria}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-bold text-xs rounded-lg cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            {criteriaSavedNotice ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Critérios Salvos!</span>
              </>
            ) : (
              <span>{isSavingCriteria ? 'Salvando...' : 'Salvar Critérios'}</span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {([0, 1, 2] as const).map((idx) => (
            <div key={idx}>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Critério {idx + 1}
              </label>
              <input
                type="text"
                value={criteriaDraft[idx]}
                onChange={(e) => {
                  const next = [...criteriaDraft] as [string, string, string];
                  next[idx] = e.target.value;
                  setCriteriaDraft(next);
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                placeholder={DEFAULT_EVALUATION_CRITERIA[idx]}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Status da Coroação Global (Aba Config) */}
      <div className="p-4 rounded-xl border border-amber-400/40 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {remoteConfig.isChampionReleased && remoteConfig.championEmail ? (
            <div className="w-9 h-9 rounded-lg bg-amber-400/20 border border-amber-400/50 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
          )}
          <div>
            <div className="text-xs font-bold text-white">
              {remoteConfig.isChampionReleased && remoteConfig.championEmail
                ? `Campeão Coroado na Planilha: ${remoteConfig.championName || remoteConfig.championEmail}`
                : 'Grande Campeão ainda oculto dos jogadores'}
            </div>
            <div className="text-[11px] text-slate-400">
              {remoteConfig.isChampionReleased && remoteConfig.championEmail
                ? `Ao fazer login com ${remoteConfig.championEmail}, o colaborador verá a tela de celebração.`
                : 'Compare as médias dos dias 18 e 19/11 abaixo antes de coroar o vencedor.'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {remoteConfig.isChampionReleased && remoteConfig.championEmail && (
            <>
              <button
                type="button"
                onClick={onOpenChampionPreview}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Abrir Cerimônia</span>
              </button>
              <button
                type="button"
                onClick={handleUncrownChampion}
                disabled={crowningEmail === 'uncrown'}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Revogar Coroação</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filtro: Classificados (Nicolas e Tayla) vs Todos */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              sounds.playBlip();
              setFilterMode('qualified');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              filterMode === 'qualified'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Classificados ao Dia 19 ({qualifiedCount})
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playBlip();
              setFilterMode('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              filterMode === 'all'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos os Participantes ({AUTHORIZED_PARTICIPANTS.length})
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          Clique em &ldquo;Abrir 3 Critérios&rdquo; em cada resposta para pontuar de 1 a 5 estrelas
        </span>
      </div>

      {/* Cards de Avaliação por Colaborador */}
      <div className="space-y-6">
        {sortedVisiblePlayers.map(
          ({
            row,
            email,
            day18Attempt,
            day19Attempt,
            day19Blocks,
            avg18,
            avg19,
            overallAvg,
          }) => {
            const isCrowned =
              remoteConfig.isChampionReleased &&
              remoteConfig.championEmail.toLowerCase() === email;

            return (
              <div
                key={email}
                className={`rounded-2xl border p-5 space-y-5 ${
                  isCrowned
                    ? 'bg-amber-950/20 border-amber-400/70'
                    : 'bg-slate-950/90 border-slate-800'
                }`}
              >
                {/* Cabeçalho do Finalista + Médias por Dia e Geral */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-white">{row.name}</h3>
                      {isCrowned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-bold">
                          <Crown className="w-3 h-3" />
                          <span>Campeão Coroado</span>
                        </span>
                      )}
                      {row.status === 'Eliminado' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-semibold">
                          {row.eliminatedDate ? `Eliminado (${row.eliminatedDate})` : 'Eliminado'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                      <span>{email}</span>
                      <span>·</span>
                      <span>Fechadas 18/11: {row.dias['2026-11-18'] ?? '—'}/5</span>
                    </div>
                  </div>

                  {/* Médias por Dia + Média Geral + Coroação */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[100px]">
                      <span className="text-[10px] font-mono text-cyan-300 block uppercase">
                        Média Dia 18
                      </span>
                      <span className="text-sm font-bold text-white font-mono tabular-nums">
                        {avg18 !== null ? `${avg18.toFixed(1)} ★` : '—'}
                      </span>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[100px]">
                      <span className="text-[10px] font-mono text-amber-300 block uppercase">
                        Média Dia 19
                      </span>
                      <span className="text-sm font-bold text-white font-mono tabular-nums">
                        {avg19 !== null ? `${avg19.toFixed(1)} ★` : '—'}
                      </span>
                    </div>

                    <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-amber-400/40 text-center min-w-[110px]">
                      <span className="text-[10px] font-mono text-amber-400 block uppercase">
                        Média Geral
                      </span>
                      <span className="text-sm font-bold text-amber-300 font-mono tabular-nums">
                        {overallAvg !== null ? `${overallAvg.toFixed(1)} ★` : '—'}
                      </span>
                    </div>

                    {isCrowned ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold whitespace-nowrap shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Campeão Oficial</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={crowningEmail === email || row.status === 'Eliminado'}
                        onClick={() => handleCrownChampion(email, row.name)}
                        className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <Crown className="w-4 h-4" />
                        <span>
                          {crowningEmail === email ? 'Coroando...' : 'Coroar Campeão'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* BLOCO DIA 18/11: RESPOSTA ABERTA DO VAR */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-300 uppercase tracking-wider font-mono">
                      Rodada 18/11 · Pergunta Aberta de Desempate (VAR)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {avg18 !== null ? `Média do dia: ${avg18.toFixed(1)} ★` : 'Aguardando avaliação'}
                    </span>
                  </div>

                  {renderExpandableEvaluationBlock({
                    email,
                    scenarioId: 'VAR-18',
                    dayDate: '2026-11-18',
                    title: 'Resposta Aberta do VAR (18/11)',
                    subtitle: day18Attempt
                      ? `Enviado em ${day18Attempt.timestamp} · Placar fechado: ${day18Attempt.score}/${day18Attempt.totalQuestions}`
                      : undefined,
                    hasSubmittedContent: Boolean(
                      day18Attempt?.varResponse && day18Attempt.varResponse !== '-'
                    ),
                    contentNode:
                      day18Attempt?.varResponse && day18Attempt.varResponse !== '-' ? (
                        <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800/90">
                          <p className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                            {day18Attempt.varResponse}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/70 text-xs text-slate-400">
                          Nenhuma resposta aberta registrada no VAR de 18/11 para este participante.
                        </div>
                      ),
                  })}
                </div>

                {/* BLOCO DIA 19/11: 3 CENÁRIOS DO CHUTE DE OURO */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300 uppercase tracking-wider font-mono">
                      Rodada 19/11 · Grande Final — Chute de Ouro ({scenarios.length} Cenários)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {avg19 !== null
                        ? `Média do dia: ${avg19.toFixed(1)} ★`
                        : day19Attempt
                        ? 'Aguardando avaliação'
                        : 'Aguardando envio no dia 19/11'}
                    </span>
                  </div>

                  {day19Blocks.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>
                        Este colaborador ainda não enviou as respostas dos {scenarios.length} cenários de 19/11/2026. Assim que enviar, cada resposta aparecerá aqui com abertura para os 3 critérios.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {day19Blocks.map((block) =>
                        renderExpandableEvaluationBlock({
                          email,
                          scenarioId: block.scenarioId,
                          dayDate: '2026-11-19',
                          title: block.scenarioTitle,
                          subtitle:
                            block.elapsedTenths !== undefined
                              ? `ID: ${block.scenarioId} · Tempo no cenário: ${block.elapsedTenths.toFixed(1)}s`
                              : `ID: ${block.scenarioId}`,
                          hasSubmittedContent: true,
                          contentNode: (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                              {block.fields.map((field, fieldIdx) => (
                                <div
                                  key={fieldIdx}
                                  className="p-3 rounded-lg bg-slate-950/90 border border-slate-800/90 space-y-1"
                                >
                                  <span className="text-[11px] font-semibold text-cyan-300 block">
                                    {field.label}
                                  </span>
                                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                                    {field.value || '—'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ),
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};
