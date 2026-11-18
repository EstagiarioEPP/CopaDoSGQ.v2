import React, { useState, useEffect, useCallback } from 'react';
import {
  Question,
  GameTheme,
  Corner,
  AttemptRecord,
  TestModeConfig,
  GoldenKickScenario,
  GoldenKickEvaluation,
  RemoteCompetitionConfig,
} from '../../types';
import { PRESET_THEMES, DEFAULT_QUESTIONS } from '../../defaultQuestions';
import { storageService, DEFAULT_VAR_QUESTION_TEXT } from '../../services/storageService';
import { sheetsSyncService, SyncStatus, OFFICIAL_SPREADSHEET_ID } from '../../services/sheetsSyncService';
import { generateStandaloneHtml } from '../../exportStandaloneHtml';
import { sounds } from '../../sound';
import { Day19EditorSection } from './Day19EditorSection';
import { Day19EvaluationTab } from './Day19EvaluationTab';
import appsScriptCode from '../../../backend-apps-script/Code.gs?raw';
import {
  ArrowLeft,
  Trash2,
  Check,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Sheet,
  Globe,
  Palette,
  FileDown,
  Copy,
  Users,
  Code2,
  Trophy,
  Calendar,
  RefreshCw,
  FlaskConical,
  Play,
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle2,
  Eye,
  Tv,
  Scale,
  Lock,
  Unlock,
  EyeOff,
  Star,
  UserX,
  UserCheck,
} from 'lucide-react';
import {
  calculateCompetitionMatrix,
  COMPETITION_DAYS,
  AUTHORIZED_PARTICIPANTS,
  getSaoPauloDateString,
  getSaoPauloTimeInfo,
  isTimedKnockoutDay,
  isVarReviewDay,
  isGoldenKickDay,
  getEffectiveChampionConfig,
  getSuggestedChampionCandidates,
} from '../../competition/competitionEngine';

const DAY_TOPIC_TITLES: Record<number, string> = {
  1: '5S e Gestão da Informação / Não Conformidades',
  2: 'Não Conformidades / Objetivos e Indicadores / Gestão de Riscos (Cronometrado)',
  3: 'Gestão de Riscos / Missão, Visão, Valores e Política + VAR Desempate',
  4: 'Grande Final — Chute de Ouro (Cenários Práticos ACIM & SIG Sistem)',
};

interface AdminDashboardProps {
  onNavigateToGame: () => void;
  onStartTestGame: (config: TestModeConfig) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToGame,
  onStartTestGame,
}) => {
  // State from storageService
  const [questions, setQuestions] = useState<Question[]>(() => storageService.getQuestions());
  const [theme, setTheme] = useState<GameTheme>(() => storageService.getTheme());
  const [webhookUrl, setWebhookUrl] = useState<string>(() => storageService.getWebhookUrl());
  const [attempts, setAttempts] = useState<AttemptRecord[]>(() => storageService.getAttempts());
  const [day19Scenarios, setDay19Scenarios] = useState<GoldenKickScenario[]>(() =>
    storageService.getDay19Questions()
  );
  const [day19Evaluations, setDay19Evaluations] = useState<GoldenKickEvaluation[]>(() =>
    storageService.getDay19Evaluations()
  );
  const [remoteConfig, setRemoteConfig] = useState<RemoteCompetitionConfig>(() =>
    storageService.getRemoteConfig()
  );
  const [eliminatingEmail, setEliminatingEmail] = useState<string | null>(null);
  const [confirmEliminateEmail, setConfirmEliminateEmail] = useState<string | null>(null);

  // Sincronização real com a planilha Google Sheets
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Modal de configuração do "Testar Jogo"
  const todayStr = getSaoPauloDateString();
  const defaultTestDate = COMPETITION_DAYS.some((d) => d.date === todayStr)
    ? todayStr
    : '2026-11-17';
  const [showTestModal, setShowTestModal] = useState(false);
  const [testDate, setTestDate] = useState<string>(defaultTestDate);

  // UI state
  const [activeTab, setActiveTab] = useState<
    'questions' | 'theme' | 'sheets' | 'export' | 'players' | 'evaluation'
  >('questions');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [testWebhookStatus, setTestWebhookStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testWebhookMessage, setTestWebhookMessage] = useState('');
  const [copiedCodeType, setCopiedCodeType] = useState<string | null>(null);
  const [selectedOpenResponseAttempt, setSelectedOpenResponseAttempt] = useState<AttemptRecord | null>(null);

  // Pergunta aberta editável do VAR (18/11) e Controle Manual de Liberação do Campeão
  const [varQuestionDraft, setVarQuestionDraft] = useState<string>(() => storageService.getVarQuestion());
  const [varSavedNotice, setVarSavedNotice] = useState(false);
  const [championRelease, setChampionRelease] = useState(() => getEffectiveChampionConfig());
  const [selectedChampionEmail, setSelectedChampionEmail] = useState<string>('');

  const handleSyncSheets = useCallback(async () => {
    setSyncStatus('loading');
    const [result, cfg, q19, evals] = await Promise.all([
      sheetsSyncService.fetchAllAttempts(webhookUrl),
      sheetsSyncService.fetchRemoteConfig(webhookUrl),
      sheetsSyncService.fetchQuestions19(webhookUrl),
      sheetsSyncService.fetchEvaluations19(webhookUrl),
    ]);
    setAttempts(result.attempts);
    setSyncStatus(result.status);
    setSyncMessage(result.message);
    setRemoteConfig(cfg);
    setChampionRelease(getEffectiveChampionConfig(cfg));
    if (q19.scenarios.length > 0) {
      setDay19Scenarios(q19.scenarios);
    }
    setDay19Evaluations(evals);
    setLastSyncedAt(
      new Date().toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }, [webhookUrl]);

  // Busca real da planilha ao abrir o painel
  useEffect(() => {
    handleSyncSheets();
  }, [handleSyncSheets]);

  // Sync local state if changed externally
  useEffect(() => {
    return storageService.subscribe(() => {
      setQuestions(storageService.getQuestions());
      setTheme(storageService.getTheme());
      setWebhookUrl(storageService.getWebhookUrl());
      setVarQuestionDraft(storageService.getVarQuestion());
      const latestCfg = storageService.getRemoteConfig();
      setRemoteConfig(latestCfg);
      setChampionRelease(getEffectiveChampionConfig(latestCfg));
      setDay19Scenarios(storageService.getDay19Questions());
      setDay19Evaluations(storageService.getDay19Evaluations());
    });
  }, []);

  const cornerNames: Record<Corner, string> = {
    A: 'A (Sup. Esquerdo)',
    B: 'B (Sup. Direito)',
    C: 'C (Inf. Esquerdo)',
    D: 'D (Inf. Direito)',
  };

  // --- ACTIONS ---

  const handleSaveAll = () => {
    sounds.playWhistle();
    storageService.saveQuestions(questions);
    storageService.saveTheme(theme);
    storageService.saveWebhookUrl(webhookUrl);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Questions manipulation
  const handleAddQuestion = () => {
    sounds.playBlip();
    const newQ: Question = {
      id: `custom-${Date.now()}`,
      pergunta: 'Pergunta da Rodada: Digite o enunciado aqui...',
      respostas: {
        A: 'Opção Canto Superior Esquerdo',
        B: 'Opção Canto Superior Direito',
        C: 'Opção Canto Inferior Esquerdo',
        D: 'Opção Canto Inferior Direito',
      },
      correta: 'A',
      explicacao: 'Explicação didática após o gol.',
      ativo: true,
    };
    const updated = [...questions, newQ];
    setQuestions(updated);
    storageService.saveQuestions(updated);
  };

  const handleToggleAtivo = (index: number) => {
    sounds.playBlip();
    const updated = [...questions];
    updated[index] = {
      ...updated[index],
      ativo: updated[index].ativo === false ? true : false,
    };
    setQuestions(updated);
    storageService.saveQuestions(updated);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    sounds.playBlip();
    const updated = [...questions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setQuestions(updated);
    storageService.saveQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert('O jogo precisa de pelo menos 1 pergunta cadastrada.');
      return;
    }
    if (confirm(`Tem certeza que deseja excluir a pergunta #${index + 1}?`)) {
      sounds.playBlip();
      const updated = questions.filter((_, i) => i !== index);
      setQuestions(updated);
      storageService.saveQuestions(updated);
    }
  };

  const handleUpdatePergunta = (index: number, val: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], pergunta: val };
    setQuestions(updated);
  };

  const handleUpdateResposta = (index: number, corner: Corner, val: string) => {
    const updated = [...questions];
    updated[index] = {
      ...updated[index],
      respostas: {
        ...updated[index].respostas,
        [corner]: val,
      },
    };
    setQuestions(updated);
  };

  const handleUpdateCorreta = (index: number, corner: Corner) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], correta: corner };
    setQuestions(updated);
    storageService.saveQuestions(updated);
  };

  const handleUpdateExplicacao = (index: number, val: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], explicacao: val };
    setQuestions(updated);
  };

  const handleResetDefault = () => {
    sounds.playBlip();
    if (confirm('Deseja restaurar as perguntas originais dos 4 dias do SGQ (ACIM)?')) {
      const resetList = DEFAULT_QUESTIONS.map((q) => ({ ...q, ativo: true }));
      setQuestions(resetList);
      storageService.saveQuestions(resetList);
      const defaultTheme = PRESET_THEMES[0];
      setTheme(defaultTheme);
      storageService.saveTheme(defaultTheme);
    }
  };

  // JSON Import / Export
  const handleOpenJson = () => {
    setJsonText(JSON.stringify(questions, null, 2));
    setJsonError('');
    setShowJsonModal(true);
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setJsonError('O JSON deve ser um array com pelo menos 1 pergunta.');
        return;
      }
      for (const item of parsed) {
        if (!item.pergunta || !item.respostas || !item.correta) {
          setJsonError('Cada item precisa conter "pergunta", "respostas" {A,B,C,D} e "correta" ("A","B","C" ou "D").');
          return;
        }
      }
      const normalized = parsed.map((q) => ({ ...q, ativo: q.ativo !== false }));
      setQuestions(normalized);
      storageService.saveQuestions(normalized);
      setShowJsonModal(false);
      setJsonError('');
      sounds.playWhistle();
    } catch {
      setJsonError('Erro de sintaxe no JSON. Verifique as vírgulas e aspas.');
    }
  };

  // Google Sheets Test
  const handleTestWebhook = () => {
    if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
      setTestWebhookStatus('error');
      setTestWebhookMessage('Por favor, informe uma URL válida do Apps Script (iniciando com https://script.google.com/macros/s/...)');
      return;
    }

    setTestWebhookStatus('testing');
    setTestWebhookMessage('Disparando linha de validação...');

    const payload = {
      timestamp: new Date().toLocaleString('pt-BR'),
      nome: 'Validação SGQ Admin',
      name: 'Validação SGQ Admin',
      email: 'admin@acim.com.br',
      theme: theme.title,
      gols: 5,
      score: 5,
      total: 5,
      totalQuestions: 5,
      aproveitamento: '100%',
      percentage: '100%',
      medalha: 'MEDALHA DE OURO',
      answers: 'Disparo de teste da Área Administrativa realizado com sucesso!',
    };

    fetch(webhookUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    })
      .then(() => {
        setTestWebhookStatus('success');
        setTestWebhookMessage('✅ Disparo realizado! Verifique sua planilha: uma nova linha foi adicionada com sucesso.');
      })
      .catch(() => {
        setTestWebhookStatus('error');
        setTestWebhookMessage('❌ Falha na conexão de rede. Verifique a URL e garanta acesso para "Qualquer pessoa".');
      });
  };

  // Copy helper
  const handleCopy = (text: string, type: string) => {
    sounds.playBlip();
    navigator.clipboard.writeText(text);
    setCopiedCodeType(type);
    setTimeout(() => setCopiedCodeType(null), 2500);
  };

  // Standalone HTML Download
  const handleExportStandalone = () => {
    sounds.playBlip();
    const htmlContent = generateStandaloneHtml(questions, theme, webhookUrl);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copa-sgq-penaltis-${theme.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear local browser cache only (never touches Google Sheets)
  const handleClearPlayedEmails = () => {
    if (
      confirm(
        'Deseja limpar apenas o cache local deste navegador? Os registros salvos na planilha oficial do Google Sheets NÃO serão apagados.'
      )
    ) {
      sounds.playBlip();
      storageService.clearPlayedEmails();
      handleSyncSheets();
    }
  };

  const standaloneHtml = generateStandaloneHtml(questions, theme, webhookUrl);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar da Área Administrativa */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-['Press_Start_2P'] text-[10px] font-bold">
              ADMIN
            </span>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                Painel Administrativo da Copa do SGQ
              </h1>
              <span className="text-xs text-slate-400">
                Gerenciamento Oficial da Competição (16 a 19 de novembro de 2026)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playBlip();
                setShowTestModal(true);
              }}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow whitespace-nowrap shrink-0"
              title="Testar qualquer rodada fora de horário sem alterar a planilha oficial"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Testar Jogo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playWhistle();
                onStartTestGame({
                  active: true,
                  simulatedDate: '2026-11-20',
                  ignoreSchedule: true,
                  previewChampion: true,
                });
              }}
              className="px-3.5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-amber-300 border border-amber-400/50 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow whitespace-nowrap shrink-0"
              title={`Prévia da celebração oficial (${championRelease.isReleased ? 'Liberada para jogadores' : 'Oculta para jogadores até liberação'})`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Apresentar Campeão</span>
            </button>

            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow whitespace-nowrap shrink-0"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>

            <button
              onClick={onNavigateToGame}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Voltar para a tela do jogador"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ver Jogo do Jogador</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navegação por Abas Administrativas */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'questions'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>⚽ Perguntas Oficiais (4 Dias · 16 a 19/11)</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'theme'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Tema & Visual</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sheets'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sheet className="w-3.5 h-3.5" />
            <span>Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'export'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Sites & HTML</span>
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'players'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tentativas & Apuração ({attempts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'evaluation'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Avaliação (18 e 19/11)</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* ABA 1: PERGUNTAS OFICIAIS (4 DIAS · 16/11 A 19/11) */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Perguntas Oficiais — Calendário de 4 Dias (16/11 a 19/11)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Rodadas objetivas (16 a 18/11), pergunta aberta obrigatória do VAR (18/11) e Grande Final Chute de Ouro (19/11). Dia 20/11 (feriado) removido.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenJson}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5"
                  title="Importar ou exportar JSON completo"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Editor JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5"
                  title="Restaurar perguntas oficiais originais"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Padrão SGQ</span>
                </button>
              </div>
            </div>

            {/* Agrupamento das Perguntas nos 4 Dias Oficiais */}
            <div className="space-y-6">
              {COMPETITION_DAYS.map((day) => {
                const targetIds: readonly string[] = day.questionIds;
                const dayQuestions = questions.filter((q) => targetIds.includes(q.id));
                const isVarDay = isVarReviewDay(day.date);
                const isFinalDay = isGoldenKickDay(day.date);

                const varCodeSnippet = `export const DEFAULT_VAR_QUESTION_TEXT =\n  ${JSON.stringify(varQuestionDraft.trim() || DEFAULT_VAR_QUESTION_TEXT)};`;

                return (
                  <div
                    key={day.date}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg"
                  >
                    {/* Cabeçalho do Dia */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 font-['Press_Start_2P'] text-[10px] text-emerald-400">
                          {day.label}/2026 · Rodada {day.dayIndex} de 4
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-white">
                            {DAY_TOPIC_TITLES[day.dayIndex] || `Bateria de Perguntas`}
                          </h3>
                          <span className="text-xs text-slate-400 font-mono">
                            {isFinalDay
                              ? '3 cenários práticos abertos (Chute de Ouro)'
                              : `${day.questionIds.join(', ')} · 5 cobranças oficiais${isVarDay ? ' + VAR Desempate Obrigatório' : ''}`}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-mono text-amber-300">
                        {isFinalDay ? '3 cenários da Final' : `${dayQuestions.length} perguntas vinculadas`}
                      </span>
                    </div>

                    {/* Card editável da Pergunta Obrigatória do VAR (Dia 18/11) */}
                    {isVarDay && (
                      <div className="p-4 sm:p-5 rounded-xl border-2 border-cyan-500/50 bg-cyan-950/20 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs sm:text-sm">
                            <Scale className="w-4 h-4 shrink-0" />
                            <span>Pergunta Aberta Obrigatória do VAR — Critério de Desempate (18/11)</span>
                          </div>
                          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-200">
                            Obrigatória · Qualquer texto não vazio
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          Exibida ao final da rodada de 18/11 como critério de desempate. Salva imediatamente neste navegador; para aplicar em todos os computadores, copie o trecho de código abaixo em <span className="font-mono text-cyan-300">src/services/storageService.ts</span>.
                        </p>

                        <textarea
                          rows={3}
                          value={varQuestionDraft}
                          onChange={(e) => setVarQuestionDraft(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-cyan-500/40 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-cyan-300 leading-relaxed"
                          placeholder="Digite a pergunta avaliativa de desempate do VAR..."
                        />

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playWhistle();
                                storageService.saveVarQuestion(varQuestionDraft);
                                setVarSavedNotice(true);
                                setTimeout(() => setVarSavedNotice(false), 2500);
                              }}
                              className="px-3.5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                            >
                              {varSavedNotice ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                              <span>{varSavedNotice ? 'Pergunta VAR Salva!' : 'Salvar Pergunta do VAR'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                sounds.playBlip();
                                storageService.resetVarQuestion();
                                setVarQuestionDraft(DEFAULT_VAR_QUESTION_TEXT);
                              }}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restaurar Padrão</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopy(varCodeSnippet, 'var-code')}
                            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-mono rounded-xl cursor-pointer flex items-center gap-1.5"
                          >
                            {copiedCodeType === 'var-code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedCodeType === 'var-code' ? 'Código Copiado!' : 'Copiar Código (Outros PCs)'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Editor Dinâmico dos Cenários e Campos do Chute de Ouro (Dia 19/11) */}
                    {isFinalDay && (
                      <Day19EditorSection
                        webhookUrl={webhookUrl}
                        scenarios={day19Scenarios}
                        onScenariosChange={setDay19Scenarios}
                      />
                    )}

                    {/* Lista das 5 perguntas deste dia */}
                    <div className="space-y-4">
                      {dayQuestions.map((q) => {
                        const globalIdx = questions.findIndex((item) => item.id === q.id);
                        const questionNum = globalIdx >= 0 ? globalIdx + 1 : parseInt(q.id.replace('Q', ''));

                        return (
                          <div
                            key={q.id}
                            className="p-4 sm:p-5 rounded-xl border border-slate-800/80 bg-slate-950/80 space-y-3"
                          >
                            {/* Identificação da Pergunta */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/60">
                              <div className="flex items-center gap-2">
                                <span className="font-['Press_Start_2P'] text-[10px] text-amber-400">
                                  PERGUNTA #{questionNum} ({q.id})
                                </span>
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                  Dia {day.label}/2026
                                </span>
                              </div>

                              <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                                Canto Correto Oficial: <strong>[{q.correta}]</strong> {cornerNames[q.correta]}
                              </span>
                            </div>

                            {/* Enunciado */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Enunciado da Pergunta:
                              </label>
                              <textarea
                                rows={2}
                                value={q.pergunta}
                                onChange={(e) => handleUpdatePergunta(globalIdx, e.target.value)}
                                onBlur={handleSaveAll}
                                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-amber-400 leading-relaxed"
                              />
                            </div>

                            {/* 4 Alternativas / Cantos */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                Alternativas & Canto do Gol:
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {(['A', 'B', 'C', 'D'] as Corner[]).map((corner) => {
                                  const isCorrect = q.correta === corner;
                                  return (
                                    <div
                                      key={corner}
                                      className={`p-2.5 rounded-xl border transition-all ${
                                        isCorrect
                                          ? 'border-emerald-500/80 bg-emerald-950/20'
                                          : 'border-slate-800 bg-slate-900/60'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
                                          <span className="w-4 h-4 rounded bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-[9px]">
                                            {corner}
                                          </span>
                                          <span className="text-[11px]">{cornerNames[corner]}</span>
                                        </span>

                                        <label className="flex items-center gap-1 text-[11px] font-semibold cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`admin-correta-${q.id}`}
                                            checked={isCorrect}
                                            onChange={() => handleUpdateCorreta(globalIdx, corner)}
                                            className="accent-emerald-500 cursor-pointer"
                                          />
                                          <span className={isCorrect ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                                            {isCorrect ? 'Gabarito ✓' : 'Defesa'}
                                          </span>
                                        </label>
                                      </div>

                                      <input
                                        type="text"
                                        value={q.respostas[corner]}
                                        onChange={(e) => handleUpdateResposta(globalIdx, corner, e.target.value)}
                                        onBlur={handleSaveAll}
                                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-amber-400"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Explicação Didática */}
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                Explicação Didática (exibida após o chute para reforço do conteúdo):
                              </label>
                              <input
                                type="text"
                                value={q.explicacao || ''}
                                onChange={(e) => handleUpdateExplicacao(globalIdx, e.target.value)}
                                onBlur={handleSaveAll}
                                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-amber-400"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA 2: TEMA & VISUAL */}
        {activeTab === 'theme' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Tema Visual do Estádio & Uniformes
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Escolha o tema gráfico do estádio, cores e camisas do goleiro.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PRESET_THEMES.map((t) => {
                const isSelected = theme.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      sounds.playBlip();
                      setTheme(t);
                      storageService.saveTheme(t);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/10 shadow-lg'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-white mb-1">{t.name}</div>
                    <div className="text-xs text-slate-400 mb-3">{t.subtitle}</div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.primaryColor }} title="Cor Primária" />
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.accentColor }} title="Cor de Destaque" />
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.keeperJerseyColor }} title="Camisa Goleiro" />
                      <span className="text-[10px] text-slate-500 uppercase font-mono ml-auto">Gramado: {t.pitchGrassTone}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA 3: GOOGLE SHEETS */}
        {activeTab === 'sheets' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sheet className="w-4 h-4 text-emerald-400" />
                <span>Integração com Google Sheets (Apps Script Webhook)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ao término do jogo, o nome, e-mail, placar e histórico dos chutes de cada colaborador são enviados automaticamente para a planilha.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                URL do Webhook do Google Apps Script:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => {
                    setWebhookUrl(e.target.value);
                    storageService.saveWebhookUrl(e.target.value);
                    setTestWebhookStatus('idle');
                  }}
                  placeholder="https://script.google.com/macros/s/XXXXX/exec"
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-400"
                />
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testWebhookStatus === 'testing'}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs whitespace-nowrap cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  <span>🧪 Testar Conexão</span>
                </button>
              </div>

              {testWebhookMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium border ${
                    testWebhookStatus === 'success'
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                      : testWebhookStatus === 'error'
                      ? 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                      : 'bg-slate-950 border-slate-700 text-amber-300'
                  }`}
                >
                  {testWebhookMessage}
                </div>
              )}
            </div>

            {/* Código do Apps Script com 1 clique */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 font-mono">
                  Código para Colar no Google Apps Script da Planilha:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(appsScriptCode, 'script')}
                  className="px-3 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  {copiedCodeType === 'script' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCodeType === 'script' ? 'Copiado!' : 'Copiar Script'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto max-h-48">
                {appsScriptCode}
              </pre>
            </div>
          </div>
        )}

        {/* ABA 4: GOOGLE SITES & EXPORTAÇÃO */}
        {activeTab === 'export' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Incorporação no Google Sites & Exportação Offline</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Copie o código completo do minijogo para colar diretamente no Google Sites ou baixe o arquivo HTML autônomo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Code2 className="w-4 h-4" />
                  <span>Código para o Google Sites</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Gera um bloco HTML autossuficiente com todas as perguntas, gráficos pixel art e conexões já embutidos. Nunca dá erro de conexão!
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy(standaloneHtml, 'sites')}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  {copiedCodeType === 'sites' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCodeType === 'sites' ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO DO JOGO'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <FileDown className="w-4 h-4" />
                  <span>Download do Arquivo .HTML</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Baixe um arquivo único pronto para ser executado em qualquer navegador offline ou compartilhado internamente.
                </p>
                <button
                  type="button"
                  onClick={handleExportStandalone}
                  className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  <span>BAIXAR ARQUIVO .HTML</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA 5: TENTATIVAS & COMPETIÇÃO */}
        {activeTab === 'players' && (() => {
          const matrix = calculateCompetitionMatrix(attempts, remoteConfig);
          const candidateInfo = getSuggestedChampionCandidates(attempts, remoteConfig);
          const fallbackEmail =
            candidateInfo.autoWinner?.email ||
            candidateInfo.tiedCandidates[0]?.email ||
            candidateInfo.activeFinalists[0]?.email ||
            matrix[0]?.email ||
            '';
          const resolvedEmail =
            selectedChampionEmail ||
            (championRelease.isReleased && championRelease.championEmail
              ? championRelease.championEmail
              : fallbackEmail);
          const chosenRow =
            matrix.find((r) => r.email.toLowerCase() === resolvedEmail.toLowerCase()) || matrix[0];

          const championCodeSnippet = `export const CHAMPION_CONFIG: ChampionConfig = {\n  isReleased: true,\n  championName: ${JSON.stringify(chosenRow?.name || championRelease.championName)},\n  championEmail: ${JSON.stringify(chosenRow?.email || championRelease.championEmail)},\n  championTitle: 'GRANDE CAMPEÃO DA COPA DO SGQ ACIM 2026',\n};`;

          const distinctEmailsWithAttempts = new Set(attempts.map((a) => a.email.toLowerCase())).size;
          const activeParticipantsCount = matrix.filter((m) => m.status !== 'Eliminado').length;
          const scoredAttempts = attempts.filter(
            (a) => !a.isPendingManualReview && a.date !== '2026-11-19'
          );
          const totalPossibleScore = scoredAttempts.length * 5;
          const totalActualScore = scoredAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
          const avgPercentage = totalPossibleScore > 0 ? Math.round((totalActualScore / totalPossibleScore) * 100) : 0;

          return (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
              {/* Cabeçalho */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Competição 2026 — Apuração Real (Planilha + Sistema)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Acompanhamento diário dos participantes (16 a 19 de novembro · 08:00 às 18:00) sincronizado com a planilha oficial.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playBlip();
                      handleSyncSheets();
                    }}
                    disabled={syncStatus === 'loading'}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-slate-950 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'loading' ? 'animate-spin' : ''}`} />
                    <span>{syncStatus === 'loading' ? 'Sincronizando...' : 'Atualizar da Planilha'}</span>
                  </button>

                  <a
                    href={`https://docs.google.com/spreadsheets/d/${OFFICIAL_SPREADSHEET_ID}/edit?gid=0#gid=0`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Planilha</span>
                  </a>

                  {attempts.some((a) => a.source !== 'sheet') && (
                    <button
                      type="button"
                      onClick={handleClearPlayedEmails}
                      className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      title="Limpa apenas o cache local deste navegador sem afetar a planilha oficial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar Cache Local</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Barra de Status da Sincronização com Google Sheets */}
              <div
                className={`p-3.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
                  syncStatus === 'synced' || syncStatus === 'gviz_fallback'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : syncStatus === 'outdated_script'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : syncStatus === 'error'
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-start sm:items-center gap-2">
                  {syncStatus === 'synced' || syncStatus === 'gviz_fallback' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>{syncMessage || 'Conectando à planilha oficial...'}</span>
                </div>

                <div className="flex items-center gap-3">
                  {lastSyncedAt && (
                    <span className="font-mono tabular-nums text-[11px] text-slate-400">
                      Atualizado às {lastSyncedAt}
                    </span>
                  )}
                  {syncStatus === 'outdated_script' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('sheets')}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-[11px] cursor-pointer whitespace-nowrap"
                    >
                      Copiar Script Atualizado
                    </button>
                  )}
                </div>
              </div>

              {/* CONTROLE DE LIBERAÇÃO DO GRANDE CAMPEÃO (MOMENTO ACIM) */}
              <div className="p-5 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Liberação do Grande Campeão (Momento ACIM)</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      O campeão nunca é exibido automaticamente após 19/11. Enquanto estiver oculto, os colaboradores veem a tela misteriosa <em>&ldquo;Aguarde a divulgação no próximo Momento ACIM&rdquo;</em>.
                    </p>
                  </div>

                  {championRelease.isReleased ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold whitespace-nowrap">
                      <Unlock className="w-3.5 h-3.5" />
                      <span>ANUNCIADO: {championRelease.championName}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold whitespace-nowrap">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>OCULTO DOS JOGADORES</span>
                    </span>
                  )}
                </div>

                {/* Vencedor automático ou seleção manual em caso de empate */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                  {candidateInfo.autoWinner ? (
                    <div className="text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        Vencedor identificado automaticamente pela matriz: <strong>{candidateInfo.autoWinner.name}</strong> ({candidateInfo.autoWinner.total} gols).
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        {candidateInfo.tiedCandidates.length > 0
                          ? 'Empate identificado na matriz — escolha abaixo quem a gestão definiu como Grande Campeão:'
                          : 'Selecione abaixo o participante definido pela gestão:'}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matrix.map((row) => {
                      const isSelected = chosenRow?.email.toLowerCase() === row.email.toLowerCase();
                      return (
                        <label
                          key={row.email}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-amber-400 bg-amber-400/15 text-white'
                              : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="radio"
                              name="champion-candidate"
                              checked={isSelected}
                              onChange={() => {
                                sounds.playBlip();
                                setSelectedChampionEmail(row.email);
                              }}
                              className="accent-amber-400 cursor-pointer shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold truncate">{row.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">{row.email}</div>
                            </div>
                          </div>
                          <span className="font-mono text-[11px] text-amber-300 shrink-0 tabular-nums">
                            {row.total} pts · {row.status}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!chosenRow}
                      onClick={async () => {
                        if (!chosenRow) return;
                        sounds.playChampionFanfare();
                        const nextCfg = await sheetsSyncService.crownChampion(
                          webhookUrl,
                          chosenRow.email,
                          chosenRow.name
                        );
                        setRemoteConfig(nextCfg);
                        setChampionRelease(getEffectiveChampionConfig(nextCfg));
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Liberar e Anunciar Grande Campeão</span>
                    </button>

                    {championRelease.isReleased && (
                      <button
                        type="button"
                        onClick={async () => {
                          sounds.playBlip();
                          const nextCfg = await sheetsSyncService.uncrownChampion(webhookUrl);
                          setRemoteConfig(nextCfg);
                          setChampionRelease(getEffectiveChampionConfig(nextCfg));
                        }}
                        className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ocultar Novamente</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playWhistle();
                        onStartTestGame({
                          active: true,
                          simulatedDate: '2026-11-20',
                          ignoreSchedule: true,
                          previewChampion: true,
                        });
                      }}
                      className="px-3.5 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-amber-300 border border-amber-400/40 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Abrir Cerimônia em Tela Cheia</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(championCodeSnippet, 'champion-code')}
                    className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-amber-400/40 text-amber-300 text-xs font-mono rounded-xl cursor-pointer flex items-center gap-1.5"
                    title="Copia CHAMPION_CONFIG para colar em src/competition/competitionEngine.ts e publicar para todos os computadores"
                  >
                    {copiedCodeType === 'champion-code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodeType === 'champion-code' ? 'Código Copiado!' : 'Copiar Código (Outros PCs)'}</span>
                  </button>
                </div>
              </div>

              {/* 4 Cards de Métricas Reais do Sistema */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400 block font-mono">AUTORIZADOS</span>
                  <span className="text-lg sm:text-xl font-['Press_Start_2P'] text-white font-bold mt-1 block">
                    {AUTHORIZED_PARTICIPANTS.length}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Colaboradores</span>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400 block font-mono">ATIVOS NA COPA</span>
                  <span className="text-lg sm:text-xl font-['Press_Start_2P'] text-emerald-400 font-bold mt-1 block">
                    {activeParticipantsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Não eliminados</span>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400 block font-mono">TENTATIVAS REAIS</span>
                  <span className="text-lg sm:text-xl font-['Press_Start_2P'] text-amber-400 font-bold mt-1 block">
                    {attempts.length}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {distinctEmailsWithAttempts} participante(s)
                  </span>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400 block font-mono">APROVEITAMENTO GERAL</span>
                  <span className="text-lg sm:text-xl font-['Press_Start_2P'] text-cyan-400 font-bold mt-1 block">
                    {avgPercentage}%
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Gols / Total</span>
                </div>
              </div>

              {/* 1. VISÃO RESUMIDA: MATRIZ COLABORADORES X DIAS */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-2">
                    <span>📊 VISÃO RESUMIDA (COLABORADORES × DIAS)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    4 rodadas · 16/11 a 19/11
                  </span>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                          <th className="px-4 py-3">Colaborador</th>
                          <th className="px-3 py-3 text-center">16/11</th>
                          <th className="px-3 py-3 text-center">17/11</th>
                          <th className="px-3 py-3 text-center">18/11</th>
                          <th className="px-3 py-3 text-center">19/11</th>
                          <th className="px-3 py-3 text-center font-bold text-white">Total</th>
                          <th className="px-4 py-3 text-right">Situação</th>
                          <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {matrix.map((row, idx) => {
                          const isEliminated = row.status === 'Eliminado';
                          const isChampion = row.status === 'Campeão';
                          const isManualEliminated = remoteConfig.eliminatedEmails.some(
                            (e) => e.toLowerCase() === row.email.toLowerCase()
                          );
                          const isUpdatingPlayer =
                            eliminatingEmail?.toLowerCase() === row.email.toLowerCase();

                          return (
                            <tr
                              key={idx}
                              className={`transition-colors ${
                                isChampion
                                  ? 'bg-amber-950/20 hover:bg-amber-950/30'
                                  : isEliminated
                                  ? 'bg-rose-950/10 hover:bg-rose-950/20 opacity-80'
                                  : 'hover:bg-slate-900/40'
                              }`}
                            >
                              <td className="px-4 py-3 font-sans">
                                <div className="font-semibold text-white text-xs">{row.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{row.email}</div>
                              </td>

                              {/* 16/11 */}
                              <td className="px-3 py-3 text-center tabular-nums">
                                {row.dias['2026-11-16'] !== null ? `${row.dias['2026-11-16']}/5` : '—'}
                              </td>

                              {/* 17/11 */}
                              <td className="px-3 py-3 text-center tabular-nums">
                                {row.dias['2026-11-17'] !== null ? `${row.dias['2026-11-17']}/5` : '—'}
                              </td>

                              {/* 18/11 */}
                              <td className="px-3 py-3 text-center tabular-nums">
                                {row.dias['2026-11-18'] !== null ? `${row.dias['2026-11-18']}/5` : '—'}
                              </td>

                              {/* 19/11 */}
                              <td className="px-3 py-3 text-center">
                                {(() => {
                                  const finalAttempt = attempts.find(
                                    (a) => a.email.toLowerCase() === row.email.toLowerCase() && a.date === '2026-11-19'
                                  );
                                  if (finalAttempt && (finalAttempt.isPendingManualReview || finalAttempt.goldenKickSummary)) {
                                    return (
                                      <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[10px]">
                                        Em análise
                                      </span>
                                    );
                                  }
                                  return row.dias['2026-11-19'] !== null ? `${row.dias['2026-11-19']}/5` : '—';
                                })()}
                              </td>

                              {/* Total Acumulado */}
                              <td className="px-3 py-3 text-center font-bold text-white text-sm tabular-nums">
                                {row.total}
                              </td>

                              {/* Situação */}
                              <td className="px-4 py-3 text-right font-sans">
                                {isChampion && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 whitespace-nowrap">
                                    <Trophy className="w-3 h-3 text-amber-400" />
                                    <span>Campeão</span>
                                  </span>
                                )}
                                {isEliminated && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 whitespace-nowrap">
                                    <span>
                                      {row.eliminatedDate
                                        ? `Eliminado (${row.eliminatedDate})`
                                        : 'Eliminado'}
                                    </span>
                                  </span>
                                )}
                                {!isChampion && !isEliminated && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap">
                                    <span>Ativo</span>
                                  </span>
                                )}
                              </td>

                              {/* Ação de Eliminação Dinâmica (Planilha Config) */}
                              <td className="px-4 py-3 text-right font-sans">
                                {isManualEliminated ? (
                                  <button
                                    type="button"
                                    disabled={isUpdatingPlayer}
                                    onClick={async () => {
                                      sounds.playBlip();
                                      setEliminatingEmail(row.email);
                                      try {
                                        const nextCfg = await sheetsSyncService.restorePlayer(
                                          webhookUrl,
                                          row.email
                                        );
                                        setRemoteConfig(nextCfg);
                                      } finally {
                                        setEliminatingEmail(null);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>{isUpdatingPlayer ? 'Salvando...' : 'Reativar'}</span>
                                  </button>
                                ) : confirmEliminateEmail === row.email ? (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      disabled={isUpdatingPlayer}
                                      onClick={async () => {
                                        sounds.playBuzzer();
                                        setConfirmEliminateEmail(null);
                                        setEliminatingEmail(row.email);
                                        try {
                                          const nextCfg = await sheetsSyncService.eliminatePlayer(
                                            webhookUrl,
                                            row.email
                                          );
                                          setRemoteConfig(nextCfg);
                                        } finally {
                                          setEliminatingEmail(null);
                                        }
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0"
                                    >
                                      Confirmar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmEliminateEmail(null)}
                                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isUpdatingPlayer || isChampion}
                                    onClick={() => {
                                      sounds.playBlip();
                                      setConfirmEliminateEmail(row.email);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>
                                      {isUpdatingPlayer ? 'Salvando...' : 'Eliminar Colaborador'}
                                    </span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 2. HISTÓRICO DETALHADO INDIVIDUAL */}
              <div className="space-y-2.5 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    📋 HISTÓRICO DETALHADO ({attempts.length} tentativas registradas)
                  </h3>
                </div>

                {attempts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                    <p className="font-semibold text-slate-300 mb-1">Nenhuma tentativa registrada ainda no sistema.</p>
                    <p className="text-slate-500">Os dados reais aparecerão aqui em tempo real assim que os colaboradores concluírem suas cobranças oficiais.</p>
                  </div>
                ) : (
                  <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-md">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">Nome do Colaborador</th>
                            <th className="px-4 py-3">E-mail</th>
                            <th className="px-4 py-3 text-center">Data da Rodada</th>
                            <th className="px-4 py-3 text-center">Acertos (Gols)</th>
                            <th className="px-4 py-3 text-center">Aproveitamento</th>
                            <th className="px-4 py-3 text-center">Tempo</th>
                            <th className="px-4 py-3 text-center">VAR / Final</th>
                            <th className="px-4 py-3 text-right">Data e Horário do Registro</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {attempts.map((attempt, idx) => {
                            const isManualPending =
                              Boolean(attempt.isPendingManualReview) || attempt.date === '2026-11-19';
                            const total = attempt.totalQuestions || (isManualPending ? 3 : 5);
                            const isHigh = attempt.score >= Math.ceil(total * 0.7);
                            const perc = Math.round((attempt.score / total) * 100);
                            const hasVar = Boolean(attempt.varResponse && attempt.varResponse !== '-');
                            const hasFinal = Boolean(
                              attempt.goldenKickSummary && attempt.goldenKickSummary !== '-'
                            );

                            return (
                              <tr key={`${attempt.email}-${attempt.date}-${idx}`} className="hover:bg-slate-900/40 transition-colors">
                                <td className="px-4 py-3 text-slate-500 font-mono tabular-nums">{idx + 1}</td>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-white">{attempt.name || 'Jogador'}</div>
                                  {attempt.answersSummary && (
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 max-w-xs truncate" title={attempt.answersSummary}>
                                      {attempt.answersSummary}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-400">
                                  {attempt.email}
                                </td>
                                <td className="px-4 py-3 text-center font-mono tabular-nums text-slate-300">
                                  {attempt.date && attempt.date.includes('-')
                                    ? `${attempt.date.slice(8, 10)}/${attempt.date.slice(5, 7)}/${attempt.date.slice(0, 4)}`
                                    : attempt.date || '—'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {isManualPending ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold font-mono text-xs border bg-amber-950/70 text-amber-300 border-amber-500/40 whitespace-nowrap">
                                      Em análise
                                    </span>
                                  ) : (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold font-mono tabular-nums text-xs border ${
                                        isHigh
                                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                                          : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                                      }`}
                                    >
                                      ⚽ {attempt.score}/{total}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center font-mono tabular-nums text-xs text-slate-300">
                                  {isManualPending ? 'Banca SGQ' : `${perc}%`}
                                </td>
                                <td className="px-4 py-3 text-center font-mono tabular-nums text-xs text-amber-300">
                                  {attempt.tempoResposta || '—'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {hasVar || hasFinal ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        sounds.playBlip();
                                        setSelectedOpenResponseAttempt(attempt);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>{hasFinal ? 'Ver Final' : 'Ver VAR'}</span>
                                    </button>
                                  ) : (
                                    <span className="text-slate-600 font-mono">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-400 font-mono tabular-nums text-[11px]">
                                  <div>{attempt.timestamp}</div>
                                  <div className="text-[10px] text-slate-500">
                                    {attempt.source === 'sheet' ? 'Planilha Oficial' : 'Cache Local'}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ABA 6: AVALIAÇÃO DA GRANDE FINAL (19/11 - 1 A 5 ESTRELAS) */}
        {activeTab === 'evaluation' && (
          <Day19EvaluationTab
            webhookUrl={webhookUrl}
            attempts={attempts}
            scenarios={day19Scenarios}
            evaluations={day19Evaluations}
            remoteConfig={remoteConfig}
            onEvaluationsChange={setDay19Evaluations}
            onConfigChange={(nextCfg) => {
              setRemoteConfig(nextCfg);
              setChampionRelease(getEffectiveChampionConfig(nextCfg));
            }}
            onRefreshAll={handleSyncSheets}
            onOpenChampionPreview={() => {
              sounds.playWhistle();
              onStartTestGame({
                active: true,
                simulatedDate: '2026-11-20',
                ignoreSchedule: true,
                previewChampion: true,
              });
            }}
          />
        )}
      </main>

      {/* Modal: Visualização Completa de Respostas Abertas (VAR 18/11 & Chute de Ouro 19/11) */}
      {selectedOpenResponseAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-cyan-400/60 rounded-2xl p-6 text-slate-100 space-y-4 shadow-2xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                  <Tv className="w-4 h-4 shrink-0" />
                  <span>Respostas Abertas para Avaliação da Banca SGQ</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {selectedOpenResponseAttempt.name} ({selectedOpenResponseAttempt.email}) · Rodada{' '}
                  {selectedOpenResponseAttempt.date}
                  {selectedOpenResponseAttempt.tempoResposta
                    ? ` · Tempo: ${selectedOpenResponseAttempt.tempoResposta}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOpenResponseAttempt(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedOpenResponseAttempt.varResponse &&
              selectedOpenResponseAttempt.varResponse !== '-' && (
                <div className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-xl space-y-1.5">
                  <span className="text-[11px] font-bold font-mono uppercase text-cyan-300 block">
                    Coluna 10 · Exemplo Prático no VAR (18/11)
                  </span>
                  <p className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                    {selectedOpenResponseAttempt.varResponse}
                  </p>
                </div>
              )}

            {selectedOpenResponseAttempt.goldenKickSummary &&
              selectedOpenResponseAttempt.goldenKickSummary !== '-' && (
                <div className="p-4 bg-amber-950/25 border border-amber-500/40 rounded-xl space-y-2.5">
                  <span className="text-[11px] font-bold font-mono uppercase text-amber-300 block">
                    Coluna 11 · Grande Final — Chute de Ouro (19/11)
                  </span>
                  <div className="space-y-2">
                    {selectedOpenResponseAttempt.goldenKickSummary.split(' || ').map((block, bIdx) => (
                      <div
                        key={bIdx}
                        className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 leading-relaxed whitespace-pre-wrap"
                      >
                        {block}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setSelectedOpenResponseAttempt(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Configurar Testar Jogo (Qualquer data e fora de horário) */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-400/60 rounded-2xl p-6 text-slate-100 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FlaskConical className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  Testar Jogo (Modo Gestão)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Simule qualquer rodada da Copa do SGQ mesmo fora do horário oficial (08:00 às 18:00), ignorando bloqueios de tentativa única ou eliminação. <strong>Nenhum dado será gravado na planilha oficial.</strong>
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Escolha a data da rodada para testar:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMPETITION_DAYS.map((day) => {
                  const selected = testDate === day.date;
                  const timed = isTimedKnockoutDay(day.date);
                  const varDay = isVarReviewDay(day.date);
                  const goldenDay = isGoldenKickDay(day.date);
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => {
                        sounds.playBlip();
                        setTestDate(day.date);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'border-amber-400 bg-amber-400/15 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs">
                          Dia {day.label}/2026 (Rodada {day.dayIndex})
                        </span>
                        {timed && <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        {varDay && <Tv className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        {goldenDay && <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">
                        {goldenDay
                          ? '3 Cenários · Chute de Ouro'
                          : `${day.questionIds[0]} a ${day.questionIds[day.questionIds.length - 1]}${
                              timed ? ' · Cronômetro' : varDay ? ' · Com VAR' : ''
                            }`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
              <span>Horário atual (Brasília):</span>
              <span className="font-mono tabular-nums text-slate-200">
                {getSaoPauloTimeInfo().formattedTime} · {getSaoPauloTimeInfo().isWithinHours ? 'Dentro de 08h–18h' : 'Fora de 08h–18h (Liberado no teste)'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playBlip();
                  setShowTestModal(false);
                  onStartTestGame({
                    active: true,
                    simulatedDate: '2026-11-20',
                    ignoreSchedule: true,
                    previewMystery: true,
                  });
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-amber-400/40 text-amber-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                title="Visualizar a tela misteriosa exibida após 19/11 antes da liberação do campeão"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Prévia Pós-19/11 (Momento ACIM)</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playWhistle();
                    setShowTestModal(false);
                    onStartTestGame({
                      active: true,
                      simulatedDate: testDate,
                      ignoreSchedule: true,
                    });
                  }}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Iniciar Simulação</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JSON Import/Export Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-2xl p-5 text-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-['Press_Start_2P'] text-xs text-amber-400">
                IMPORTAR / EXPORTAR JSON
              </h3>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 mb-2">
              Edite ou cole a lista completa de perguntas em formato JSON:
            </p>
            <textarea
              rows={12}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 focus:outline-hidden focus:border-amber-400"
            />
            {jsonError && (
              <p className="text-xs text-rose-400 mt-2 font-mono">{jsonError}</p>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-xs rounded-lg text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyJson}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-lg text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Aplicar JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
