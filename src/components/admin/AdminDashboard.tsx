import React, { useState, useEffect } from 'react';
import { Question, GameTheme, Corner } from '../../types';
import { PRESET_THEMES, DEFAULT_QUESTIONS } from '../../defaultQuestions';
import { storageService } from '../../services/storageService';
import { generateStandaloneHtml } from '../../exportStandaloneHtml';
import { sounds } from '../../sound';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Sheet,
  Globe,
  Palette,
  HelpCircle,
  FileDown,
  CheckCircle2,
  XCircle,
  Copy,
  Users,
  Code2
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateToGame: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToGame }) => {
  // State from storageService
  const [questions, setQuestions] = useState<Question[]>(() => storageService.getQuestions());
  const [theme, setTheme] = useState<GameTheme>(() => storageService.getTheme());
  const [webhookUrl, setWebhookUrl] = useState<string>(() => storageService.getWebhookUrl());
  const [playedEmails, setPlayedEmails] = useState<string[]>(() => storageService.getPlayedEmails());

  // UI state
  const [activeTab, setActiveTab] = useState<'questions' | 'theme' | 'sheets' | 'export' | 'players'>('questions');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [testWebhookStatus, setTestWebhookStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testWebhookMessage, setTestWebhookMessage] = useState('');
  const [copiedCodeType, setCopiedCodeType] = useState<string | null>(null);

  // Sync state if changed externally
  useEffect(() => {
    return storageService.subscribe(() => {
      setQuestions(storageService.getQuestions());
      setTheme(storageService.getTheme());
      setWebhookUrl(storageService.getWebhookUrl());
      setPlayedEmails(storageService.getPlayedEmails());
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
    if (confirm('Deseja restaurar as perguntas originais dos 5 dias do SGQ (ACIM)?')) {
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

  // Clear played emails
  const handleClearPlayedEmails = () => {
    if (confirm('Deseja limpar todos os e-mails registrados? Isso permitirá que os colaboradores joguem novamente.')) {
      sounds.playBlip();
      storageService.clearPlayedEmails();
      setPlayedEmails([]);
    }
  };

  const activeQuestionsCount = questions.filter((q) => q.ativo !== false).length;
  const standaloneHtml = generateStandaloneHtml(questions, theme, webhookUrl);

  const appsScriptCode = `// CÓDIGO GOOGLE APPS SCRIPT PARA RECEBER RESULTADOS DA COPA DO SGQ
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Cabeçalho automático
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Data e Hora", "Nome", "E-mail", "Gols", "Total", "Aproveitamento", "Detalhes"]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#065f46").setFontColor("#ffffff");
    }
    
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString("pt-BR"),
      data.nome || data.name || "Anônimo",
      data.email || "-",
      data.gols !== undefined ? data.gols : (data.score !== undefined ? data.score : 0),
      data.total || data.totalQuestions || 5,
      data.aproveitamento || data.percentage || "-",
      data.answers || "-"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("✅ Webhook Copa do SGQ Ativo!")
    .setMimeType(ContentService.MimeType.TEXT);
}`;

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
                Gerencie perguntas, temas, planilha e integração com Google Sites
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow"
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
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
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
            <span>⚽ Perguntas & 4 Cantos ({activeQuestionsCount}/{questions.length} Ativas)</span>
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
            <span>Tentativas ({playedEmails.length})</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* ABA 1: PERGUNTAS */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Banco de Perguntas & Cantos do Gol</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure o enunciado, as 4 opções (A, B, C, D), a ordem das cobranças e o canto correto.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenJson}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5"
                  title="Importar ou exportar JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Editor JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5"
                  title="Restaurar padrão SGQ"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar SGQ</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Pergunta</span>
                </button>
              </div>
            </div>

            {/* Lista das Perguntas */}
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const isAtivo = q.ativo !== false;
                return (
                  <div
                    key={q.id || idx}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isAtivo
                        ? 'bg-slate-900 border-slate-800 shadow-md'
                        : 'bg-slate-950/70 border-slate-900 opacity-60'
                    }`}
                  >
                    {/* Header da Pergunta com Ordem, Ativação e Exclusão */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className="font-['Press_Start_2P'] text-[10px] text-amber-400">
                          PÊNALTI #{idx + 1}
                        </span>

                        {/* Botão Ativar / Desativar Pergunta */}
                        <button
                          type="button"
                          onClick={() => handleToggleAtivo(idx)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            isAtivo
                              ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-800 border border-slate-700 text-slate-400'
                          }`}
                          title="Clique para alternar se esta pergunta participa do jogo"
                        >
                          {isAtivo ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                          <span>{isAtivo ? 'Ativa no Jogo' : 'Inativa (Pausada)'}</span>
                        </button>

                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                          Canto Correto: <strong>[{q.correta}]</strong> {cornerNames[q.correta]}
                        </span>
                      </div>

                      {/* Reordenar e Excluir */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
                          title="Mover pergunta para cima"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          disabled={idx === questions.length - 1}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
                          title="Mover pergunta para baixo"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(idx)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 cursor-pointer ml-1"
                          title="Excluir pergunta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Enunciado */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Enunciado da Pergunta:
                      </label>
                      <input
                        type="text"
                        value={q.pergunta}
                        onChange={(e) => handleUpdatePergunta(idx, e.target.value)}
                        onBlur={handleSaveAll}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    {/* 4 Cantos / Alternativas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {(['A', 'B', 'C', 'D'] as Corner[]).map((corner) => {
                        const isCorrect = q.correta === corner;
                        return (
                          <div
                            key={corner}
                            className={`p-3 rounded-xl border-2 transition-all ${
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-950/25'
                                : 'border-slate-800 bg-slate-950'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                                  {corner}
                                </span>
                                <span>{cornerNames[corner]}</span>
                              </span>

                              <label className="flex items-center gap-1 text-[11px] font-semibold cursor-pointer">
                                <input
                                  type="radio"
                                  name={`admin-correta-${idx}`}
                                  checked={isCorrect}
                                  onChange={() => handleUpdateCorreta(idx, corner)}
                                  className="accent-emerald-500 cursor-pointer"
                                />
                                <span className={isCorrect ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                                  {isCorrect ? 'Correta ✓' : 'Marcar Correta'}
                                </span>
                              </label>
                            </div>

                            <input
                              type="text"
                              value={q.respostas[corner]}
                              onChange={(e) => handleUpdateResposta(idx, corner, e.target.value)}
                              onBlur={handleSaveAll}
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Explicação pós-gol */}
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Explicação Didática (exibida após o gol para fixação do conteúdo):
                      </label>
                      <input
                        type="text"
                        value={q.explicacao || ''}
                        onChange={(e) => handleUpdateExplicacao(idx, e.target.value)}
                        onBlur={handleSaveAll}
                        placeholder="Ex: A etapa Check (C) do PDCA tem o objetivo de verificar indicadores..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-amber-400"
                      />
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

        {/* ABA 5: TENTATIVAS & COLABORADORES */}
        {activeTab === 'players' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Colaboradores que já Jogaram ({playedEmails.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  O jogo bloqueia novas tentativas no mesmo e-mail para garantir a regra de tentativa única por rodada.
                </p>
              </div>

              {playedEmails.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearPlayedEmails}
                  className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Liberar Todos os E-mails para Jogar Novamente</span>
                </button>
              )}
            </div>

            {playedEmails.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                Nenhum colaborador registrado ainda nesta rodada.
              </div>
            ) : (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 max-h-64 overflow-y-auto space-y-1.5">
                {playedEmails.map((email, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 text-xs text-slate-300 font-mono"
                  >
                    <span>{idx + 1}. {email}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                      Tentativa Realizada
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

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
