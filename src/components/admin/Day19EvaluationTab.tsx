import React, { useState, useEffect } from 'react';
import {
  AttemptRecord,
  GoldenKickAnswer,
  GoldenKickEvaluation,
  GoldenKickScenario,
  RemoteCompetitionConfig,
} from '../../types';
import { sheetsSyncService, OFFICIAL_SPREADSHEET_ID } from '../../services/sheetsSyncService';
import { AUTHORIZED_PARTICIPANTS } from '../../competition/competitionEngine';
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
  Unlock,
  EyeOff,
  FileText,
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
  rawBlock?: string;
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
              ...(ans.contencao ? [{ label: '2. Contenção SIG Sistem / ACIM', value: ans.contencao }] : []),
              ...(ans.acaoPreventiva ? [{ label: '3. Ação Preventiva', value: ans.acaoPreventiva }] : []),
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
        rawBlock: raw,
      };
    });
  }

  return [];
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

  const handleRateScenario = async (email: string, scenarioId: string, stars: number) => {
    sounds.playBlip();
    const key = `${email.toLowerCase()}__${scenarioId}`;
    setSavingKey(key);
    try {
      const next = await sheetsSyncService.saveEvaluation19(webhookUrl, {
        email: email.toLowerCase(),
        scenarioId,
        stars,
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

  // Filtra submissões do Dia 19 (ou que possuam respostas do Chute de Ouro)
  const day19Attempts = attempts.filter(
    (a) =>
      a.date === '2026-11-19' ||
      Boolean(a.goldenKickAnswers && a.goldenKickAnswers.length > 0) ||
      Boolean(a.goldenKickSummary && a.goldenKickSummary !== '-')
  );

  // Deduplica por e-mail mantendo o registro mais recente
  const finalistsMap = new Map<string, AttemptRecord>();
  day19Attempts.forEach((att) => {
    const clean = att.email.trim().toLowerCase();
    if (!finalistsMap.has(clean)) {
      finalistsMap.set(clean, att);
    }
  });

  const finalistSubmissions = Array.from(finalistsMap.values()).map((attempt) => {
    const blocks = parseAttemptScenarios(attempt, scenarios);
    const email = attempt.email.trim().toLowerCase();
    const totalStars = blocks.reduce((acc, blk) => {
      const match = evaluations.find(
        (ev) => ev.email.toLowerCase() === email && ev.scenarioId === blk.scenarioId
      );
      return acc + (match ? match.stars : 0);
    }, 0);
    const ratedCount = blocks.filter((blk) =>
      evaluations.some((ev) => ev.email.toLowerCase() === email && ev.scenarioId === blk.scenarioId)
    ).length;
    const maxStars = Math.max(blocks.length, scenarios.length) * 5;

    return {
      attempt,
      blocks,
      totalStars,
      ratedCount,
      maxStars,
      isAuthorized: AUTHORIZED_PARTICIPANTS.some((p) => p.toLowerCase() === email),
    };
  });

  // Ordena maior pontuação em estrelas primeiro
  finalistSubmissions.sort((a, b) => b.totalStars - a.totalStars);

  const totalScenariosGraded = evaluations.length;
  const highestStars = finalistSubmissions[0]?.totalStars || 0;

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Avaliação da Grande Final (19/11) — Banca 1 a 5 Estrelas</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Leia as respostas dos finalistas por cenário, atribua notas de 1 a 5 estrelas (salvas na aba &ldquo;AvaliacoesDia19&rdquo;) e coroe o Grande Campeão.
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
                : 'Avalie os cenários abaixo e clique em "Coroar Campeão" para salvar na aba Config.'}
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

      {/* KPIs da Banca */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 block font-mono">FINALISTAS ENVIADOS</span>
          <span className="text-lg sm:text-xl font-['Press_Start_2P'] text-white font-bold mt-1 block tabular-nums">
            {finalistSubmissions.length}
          </span>
        </div>

        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 block font-mono">NOTAS REGISTRADAS</span>
          <span className="text-lg sm:text-xl font-['Press_Start_2P'] text-amber-400 font-bold mt-1 block tabular-nums">
            {totalScenariosGraded}
          </span>
        </div>

        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 block font-mono">MAIOR SOMA (★)</span>
          <span className="text-lg sm:text-xl font-['Press_Start_2P'] text-emerald-400 font-bold mt-1 block tabular-nums">
            {highestStars}
          </span>
        </div>

        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 block font-mono">CENÁRIOS ATIVOS</span>
          <span className="text-lg sm:text-xl font-['Press_Start_2P'] text-cyan-400 font-bold mt-1 block tabular-nums">
            {scenarios.length}
          </span>
        </div>
      </div>

      {/* Lista de Finalistas e Avaliação por Cenário */}
      {finalistSubmissions.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
          <FileText className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-200">
            Nenhuma resposta da Grande Final (19/11) foi recebida ainda.
          </p>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Assim que os finalistas concluírem os cenários do Chute de Ouro na data 19/11/2026 (ou em simulação), suas respostas aparecerão aqui agrupadas por e-mail para atribuição das estrelas.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {finalistSubmissions.map(({ attempt, blocks, totalStars, ratedCount, maxStars }, fIdx) => {
            const email = attempt.email.trim().toLowerCase();
            const isCrowned =
              remoteConfig.isChampionReleased &&
              remoteConfig.championEmail.toLowerCase() === email;

            return (
              <div
                key={email}
                className={`rounded-2xl border p-5 space-y-4 transition-all ${
                  isCrowned
                    ? 'bg-amber-950/20 border-amber-400/70'
                    : 'bg-slate-950/90 border-slate-800'
                }`}
              >
                {/* Cabeçalho do Finalista */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] tabular-nums">
                        #{fIdx + 1}
                      </span>
                      <h3 className="text-base font-bold text-white">{attempt.name}</h3>
                      {isCrowned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-bold">
                          <Crown className="w-3 h-3" />
                          <span>CAMPEÃO COROADO</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>{email}</span>
                      <span>·</span>
                      <span>Enviado em {attempt.timestamp}</span>
                      {attempt.tempoResposta && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-amber-300 tabular-nums">
                            <Clock className="w-3 h-3" />
                            <span>{attempt.tempoResposta}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pontuação consolidada + Botão Coroar Campeão */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-right">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">
                        Pontuação Consolidada ({ratedCount}/{blocks.length} cenários)
                      </span>
                      <span className="text-sm font-bold text-amber-300 font-mono tabular-nums">
                        {totalStars} / {maxStars} ★
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
                        disabled={crowningEmail === email}
                        onClick={() => handleCrownChampion(email, attempt.name)}
                        className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-60 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>
                          {crowningEmail === email ? 'Coroando...' : 'Coroar Campeão'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Cenários respondidos + Seletor de 1 a 5 Estrelas */}
                <div className="space-y-3">
                  {blocks.map((block, bIdx) => {
                    const currentEval = evaluations.find(
                      (ev) =>
                        ev.email.toLowerCase() === email && ev.scenarioId === block.scenarioId
                    );
                    const currentStars = currentEval?.stars || 0;
                    const key = `${email}__${block.scenarioId}`;
                    const isSavingStar = savingKey === key;

                    return (
                      <div
                        key={block.scenarioId || bIdx}
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-amber-300 block">
                              {block.scenarioTitle}
                            </span>
                            {block.elapsedTenths !== undefined && (
                              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                                ID: {block.scenarioId} · Tempo no cenário: {block.elapsedTenths.toFixed(1)}s
                              </span>
                            )}
                          </div>

                          {/* Seletor de 1 a 5 estrelas */}
                          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                            <span className="text-[11px] font-mono text-slate-400 mr-1">
                              {isSavingStar ? 'Salvando...' : 'Nota:'}
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((starNum) => {
                                const filled = starNum <= currentStars;
                                return (
                                  <button
                                    key={starNum}
                                    type="button"
                                    onClick={() =>
                                      handleRateScenario(email, block.scenarioId, starNum)
                                    }
                                    aria-label={`Avaliar cenário com ${starNum} estrela(s)`}
                                    className="p-1 rounded hover:bg-slate-800 transition-transform hover:scale-110 cursor-pointer"
                                    title={`${starNum} estrela(s)`}
                                  >
                                    <Star
                                      className={`w-4 h-4 ${
                                        filled
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-slate-600'
                                      }`}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                            <span className="text-xs font-mono font-bold text-amber-300 tabular-nums ml-1 min-w-[2.5rem] text-right">
                              {currentStars > 0 ? `${currentStars}/5` : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Respostas estruturadas */}
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
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
