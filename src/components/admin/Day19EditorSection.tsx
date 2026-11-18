import React, { useState, useEffect } from 'react';
import { GoldenKickField, GoldenKickScenario } from '../../types';
import { DEFAULT_DAY19_SCENARIOS, storageService } from '../../services/storageService';
import { sheetsSyncService } from '../../services/sheetsSyncService';
import { getScenarioFields } from '../../competition/competitionEngine';
import { sounds } from '../../sound';
import {
  Trophy,
  Plus,
  Trash2,
  RotateCcw,
  RefreshCw,
  Check,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface Day19EditorSectionProps {
  webhookUrl: string;
  scenarios: GoldenKickScenario[];
  onScenariosChange: (next: GoldenKickScenario[]) => void;
}

export const Day19EditorSection: React.FC<Day19EditorSectionProps> = ({
  webhookUrl,
  scenarios,
  onScenariosChange,
}) => {
  const [draft, setDraft] = useState<GoldenKickScenario[]>(scenarios);
  const [themesTextMap, setThemesTextMap] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'warn'; text: string } | null>(null);

  useEffect(() => {
    setDraft(scenarios);
    const map: Record<string, string> = {};
    scenarios.forEach((sc) => {
      map[sc.id] = (sc.themesCrossed || []).join(', ');
    });
    setThemesTextMap(map);
  }, [scenarios]);

  const syncDraft = (next: GoldenKickScenario[]) => {
    setDraft(next);
    storageService.saveDay19Questions(next);
    onScenariosChange(next);
  };

  const handleReloadFromSheet = async () => {
    sounds.playBlip();
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await sheetsSyncService.fetchQuestions19(webhookUrl);
      if (res.scenarios.length > 0) {
        setDraft(res.scenarios);
        onScenariosChange(res.scenarios);
        setStatusMessage({
          type: 'ok',
          text: res.fromSheet
            ? 'Perguntas do Dia 19 recarregadas diretamente da aba "PerguntasDia19" na planilha.'
            : 'Nenhuma pergunta personalizada encontrada na aba "PerguntasDia19". Exibindo configuração local.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToSheet = async () => {
    sounds.playWhistle();
    setIsSaving(true);
    setStatusMessage(null);

    const normalized = draft.map((sc, idx) => {
      const fields = getScenarioFields(sc).map((f, fIdx) => ({
        id: f.id || `campo_${fIdx + 1}`,
        label: f.label.trim() || `Campo ${fIdx + 1}`,
        placeholder: f.placeholder?.trim() || '',
      }));
      const rawThemes = themesTextMap[sc.id];
      const themes =
        rawThemes !== undefined
          ? rawThemes
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : sc.themesCrossed || [];

      return {
        ...sc,
        id: sc.id || `FINAL-0${idx + 1}`,
        title: sc.title.trim() || `Cenário ${idx + 1}`,
        themesCrossed: themes,
        context: sc.context.trim(),
        customFields: fields,
      };
    });

    syncDraft(normalized);

    try {
      const ok = await sheetsSyncService.saveQuestions19(webhookUrl, normalized);
      setStatusMessage(
        ok
          ? {
              type: 'ok',
              text: 'Perguntas e campos do Dia 19 salvos na aba "PerguntasDia19" do Google Sheets!',
            }
          : {
              type: 'warn',
              text: 'Salvo no navegador local. Verifique a URL do Apps Script ou publique a nova versão para sincronizar na planilha.',
            }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateScenario = (index: number, patch: Partial<GoldenKickScenario>) => {
    const next = [...draft];
    next[index] = { ...next[index], ...patch };
    setDraft(next);
  };

  const handleUpdateField = (
    scenarioIndex: number,
    fieldIndex: number,
    patch: Partial<GoldenKickField>
  ) => {
    const sc = draft[scenarioIndex];
    const fields = [...getScenarioFields(sc)];
    fields[fieldIndex] = { ...fields[fieldIndex], ...patch };
    handleUpdateScenario(scenarioIndex, { customFields: fields, fields: undefined });
  };

  const handleAddField = (scenarioIndex: number) => {
    sounds.playBlip();
    const sc = draft[scenarioIndex];
    const fields = [...getScenarioFields(sc)];
    const nextNum = fields.length + 1;
    fields.push({
      id: `campo_${Date.now().toString().slice(-4)}_${nextNum}`,
      label: `${nextNum}. Novo campo de resposta`,
      placeholder: 'Descreva sua resposta prática...',
    });
    handleUpdateScenario(scenarioIndex, { customFields: fields, fields: undefined });
  };

  const handleRemoveField = (scenarioIndex: number, fieldIndex: number) => {
    const sc = draft[scenarioIndex];
    const fields = getScenarioFields(sc);
    if (fields.length <= 1) return;
    sounds.playBlip();
    const filtered = fields.filter((_, idx) => idx !== fieldIndex);
    handleUpdateScenario(scenarioIndex, { customFields: filtered, fields: undefined });
  };

  const handleAddScenario = () => {
    sounds.playBlip();
    const nextNum = draft.length + 1;
    const newId = `FINAL-0${nextNum}`;
    const nextScenario: GoldenKickScenario = {
      id: newId,
      title: `Cenário ${nextNum}: Novo Desafio da Grande Final`,
      themesCrossed: ['SGQ ACIM', 'SIG Sistem'],
      context: 'Descreva aqui o caso prático que o finalista deverá analisar...',
      customFields: [
        {
          id: 'diagnostico',
          label: '1. Diagnóstico e temas do SGQ envolvidos',
          placeholder: 'Identifique o problema central e os requisitos afetados...',
        },
        {
          id: 'contencao',
          label: '2. Contenção imediata no SIG Sistem / ACIM',
          placeholder: 'Ação rápida na rotina e registro no sistema...',
        },
        {
          id: 'acaoSistemica',
          label: '3. Ação sistêmica e melhoria contínua',
          placeholder: 'Como prevenir recorrências e envolver os setores...',
        },
      ],
    };
    setThemesTextMap((prev) => ({ ...prev, [newId]: 'SGQ ACIM, SIG Sistem' }));
    setDraft([...draft, nextScenario]);
  };

  const handleRemoveScenario = (index: number) => {
    if (draft.length <= 1) return;
    sounds.playBlip();
    setDraft(draft.filter((_, idx) => idx !== index));
  };

  const handleResetDefault = () => {
    sounds.playBlip();
    if (confirm('Deseja restaurar os 3 cenários padrão da Grande Final (19/11)?')) {
      syncDraft(DEFAULT_DAY19_SCENARIOS);
      setStatusMessage({
        type: 'ok',
        text: 'Cenários padrão restaurados. Clique em "Salvar Perguntas do Dia 19 na Planilha" para atualizar o Google Sheets.',
      });
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl border border-amber-500/40 bg-amber-950/15 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-amber-500/20">
        <div>
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
            <Trophy className="w-4 h-4 shrink-0" />
            <span>Editor Dinâmico da Grande Final (19/11) — Aba &ldquo;PerguntasDia19&rdquo;</span>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Personalize os cenários cegos e os campos de resposta exibidos para os finalistas no dia 19/11/2026. As alterações salvas na planilha são carregadas automaticamente no jogo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReloadFromSheet}
            disabled={isLoading}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Recarregar da Planilha</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            statusMessage.type === 'ok'
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
          }`}
        >
          {statusMessage.type === 'ok' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="space-y-4">
        {draft.map((sc, scIdx) => {
          const fields = getScenarioFields(sc);
          const themesVal =
            themesTextMap[sc.id] !== undefined
              ? themesTextMap[sc.id]
              : (sc.themesCrossed || []).join(', ');

          return (
            <div
              key={sc.id || scIdx}
              className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/70">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-['Press_Start_2P'] text-[9px] font-bold">
                    CHUTE #{scIdx + 1}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{sc.id}</span>
                </div>

                {draft.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveScenario(scIdx)}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/30 text-rose-300 text-[11px] font-semibold cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remover Cenário</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Título do Cenário:
                  </label>
                  <input
                    type="text"
                    value={sc.title}
                    onChange={(e) => handleUpdateScenario(scIdx, { title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                    placeholder="Ex: Cenário 1: Atendimento, LGPD & SIG Sistem"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Temas Cruzados (separados por vírgula):
                  </label>
                  <input
                    type="text"
                    value={themesVal}
                    onChange={(e) => {
                      const val = e.target.value;
                      setThemesTextMap((prev) => ({ ...prev, [sc.id]: val }));
                      handleUpdateScenario(scIdx, {
                        themesCrossed: val
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-amber-400"
                    placeholder="Ex: Atendimento, LGPD, SIG Sistem"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Texto do Cenário Cego (Situação Prática):
                </label>
                <textarea
                  rows={3}
                  value={sc.context}
                  onChange={(e) => handleUpdateScenario(scIdx, { context: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:outline-hidden focus:border-amber-400 leading-relaxed"
                  placeholder="Descreva a situação prática enfrentada pelo colaborador..."
                />
              </div>

              {/* Campos de resposta dinâmicos */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider font-mono">
                    Campos de Resposta para o Jogador ({fields.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddField(scIdx)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-[11px] font-semibold cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Campo</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {fields.map((field, fIdx) => (
                    <div
                      key={field.id || fIdx}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center"
                    >
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          handleUpdateField(scIdx, fIdx, { label: e.target.value })
                        }
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                        placeholder="Nome do campo (ex: 1. Diagnóstico)"
                      />
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) =>
                          handleUpdateField(scIdx, fIdx, { placeholder: e.target.value })
                        }
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-amber-400"
                        placeholder="Dica dentro da caixa (placeholder)"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveField(scIdx, fIdx)}
                        disabled={fields.length <= 1}
                        className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/70 disabled:opacity-30 border border-slate-800 text-slate-400 hover:text-rose-300 cursor-pointer flex items-center justify-center"
                        title="Remover campo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={handleAddScenario}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>Adicionar Novo Cenário</span>
        </button>

        <button
          type="button"
          onClick={handleSaveToSheet}
          disabled={isSaving}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {isSaving ? 'Salvando na Planilha...' : 'Salvar Perguntas do Dia 19 na Planilha'}
          </span>
        </button>
      </div>
    </div>
  );
};
