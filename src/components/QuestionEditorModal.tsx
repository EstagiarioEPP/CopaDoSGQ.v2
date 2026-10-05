import React, { useState } from 'react';
import { Question, GameTheme, Corner } from '../types';
import { PRESET_THEMES, DEFAULT_QUESTIONS } from '../defaultQuestions';
import { X, Plus, Trash2, Download, Upload, RotateCcw, Check, Sparkles } from 'lucide-react';
import { sounds } from '../sound';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onSaveQuestions: (questions: Question[]) => void;
  currentTheme: GameTheme;
  onSelectTheme: (theme: GameTheme) => void;
  webhookUrl: string;
  onSaveWebhookUrl: (url: string) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  questions,
  onSaveQuestions,
  currentTheme,
  onSelectTheme,
  webhookUrl,
  onSaveWebhookUrl,
}) => {
  const [localQuestions, setLocalQuestions] = useState<Question[]>(questions);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(currentTheme.id);
  const [localWebhook, setLocalWebhook] = useState<string>(webhookUrl);
  const [jsonText, setJsonText] = useState<string>('');
  const [showJsonMode, setShowJsonMode] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [jsonError, setJsonError] = useState<string>('');
  const [testWebhookStatus, setTestWebhookStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testWebhookMessage, setTestWebhookMessage] = useState<string>('');

  const handleTestWebhook = () => {
    if (!localWebhook || !localWebhook.trim().startsWith('http')) {
      setTestWebhookStatus('error');
      setTestWebhookMessage('Por favor, cole uma URL válida do Apps Script (começando com https://script.google.com/macros/s/...)');
      return;
    }

    setTestWebhookStatus('testing');
    setTestWebhookMessage('Enviando linha de teste para a planilha...');

    const payload = {
      timestamp: new Date().toLocaleString('pt-BR'),
      nome: 'Teste de Conexão',
      name: 'Teste de Conexão',
      email: 'teste@exemplo.com',
      theme: 'Validação SGQ',
      gols: 5,
      score: 5,
      total: 5,
      totalQuestions: 5,
      aproveitamento: '100%',
      percentage: '100%',
      answers: 'Disparo de teste realizado com sucesso!',
    };

    fetch(localWebhook.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    })
      .then(() => {
        setTestWebhookStatus('success');
        setTestWebhookMessage('✅ Disparo realizado! Abra sua planilha no Google Sheets: uma nova linha chamada "Teste de Conexão" deve ter acabado de surgir!');
      })
      .catch((err) => {
        setTestWebhookStatus('error');
        setTestWebhookMessage('❌ Erro de rede ao disparar. Verifique se a URL termina com /exec e se está configurada para "Qualquer pessoa".');
      });
  };

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    sounds.playBlip();
    const newQ: Question = {
      id: `custom-${Date.now()}`,
      pergunta: 'Pergunta do Dia: Digite o enunciado aqui...',
      respostas: {
        A: 'Opção Canto Superior Esquerdo',
        B: 'Opção Canto Superior Direito',
        C: 'Opção Canto Inferior Esquerdo',
        D: 'Opção Canto Inferior Direito',
      },
      correta: 'A',
      explicacao: 'Explicação breve do conceito correto.',
    };
    setLocalQuestions([...localQuestions, newQ]);
  };

  const handleUpdatePergunta = (index: number, val: string) => {
    const updated = [...localQuestions];
    updated[index] = { ...updated[index], pergunta: val };
    setLocalQuestions(updated);
  };

  const handleUpdateResposta = (index: number, corner: Corner, val: string) => {
    const updated = [...localQuestions];
    updated[index] = {
      ...updated[index],
      respostas: {
        ...updated[index].respostas,
        [corner]: val,
      },
    };
    setLocalQuestions(updated);
  };

  const handleUpdateCorreta = (index: number, corner: Corner) => {
    const updated = [...localQuestions];
    updated[index] = { ...updated[index], correta: corner };
    setLocalQuestions(updated);
  };

  const handleUpdateExplicacao = (index: number, val: string) => {
    const updated = [...localQuestions];
    updated[index] = { ...updated[index], explicacao: val };
    setLocalQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    sounds.playBlip();
    if (localQuestions.length <= 1) {
      alert('O jogo precisa de pelo menos 1 pergunta para funcionar.');
      return;
    }
    const updated = localQuestions.filter((_, i) => i !== index);
    setLocalQuestions(updated);
  };

  const handleSaveAll = () => {
    sounds.playWhistle();
    onSaveQuestions(localQuestions);
    const chosenTheme = PRESET_THEMES.find((t) => t.id === selectedThemeId) || currentTheme;
    onSelectTheme(chosenTheme);
    onSaveWebhookUrl(localWebhook.trim());

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetDefault = () => {
    sounds.playBlip();
    if (confirm('Deseja restaurar as perguntas padrão de 5 dias do SGQ?')) {
      setLocalQuestions(DEFAULT_QUESTIONS);
      setSelectedThemeId('sgq');
    }
  };

  const handleOpenJson = () => {
    setJsonText(JSON.stringify(localQuestions, null, 2));
    setShowJsonMode(true);
    setJsonError('');
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setJsonError('O JSON deve ser uma lista (array) com pelo menos 1 pergunta.');
        return;
      }
      for (const item of parsed) {
        if (!item.pergunta || !item.respostas || !item.correta) {
          setJsonError('Cada item deve conter: "pergunta", objeto "respostas" com {A, B, C, D} e "correta" ("A", "B", "C" ou "D").');
          return;
        }
        if (!['A', 'B', 'C', 'D'].includes(item.correta)) {
          setJsonError('O campo "correta" deve ser "A", "B", "C" ou "D".');
          return;
        }
      }
      setLocalQuestions(parsed);
      setShowJsonMode(false);
      setJsonError('');
    } catch {
      setJsonError('Erro de sintaxe no JSON. Verifique as vírgulas e aspas.');
    }
  };

  const cornerNames: Record<Corner, string> = {
    A: 'A (Sup. Esquerdo)',
    B: 'B (Sup. Direito)',
    C: 'C (Inf. Esquerdo)',
    D: 'D (Inf. Direito)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border-3 border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div>
            <h2 className="font-['Press_Start_2P'] text-xs sm:text-sm text-amber-400">
              CONFIGURADOR DE PERGUNTAS & 4 CANTOS
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Defina manualmente em qual dos 4 cantos (A, B, C, D) estará a resposta correta de cada cobrança.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Themes */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider mb-3">
              🎨 1. TEMA VISUAL DO ESTÁDIO
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESET_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    selectedThemeId === theme.id
                      ? 'border-amber-400 bg-amber-400/10 shadow-md'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-white mb-0.5">{theme.name}</div>
                  <div className="text-xs text-slate-400">{theme.subtitle}</div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.keeperJerseyColor }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Google Sheets Webhook URL */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider mb-1">
              📊 2. REGISTRO NO GOOGLE SHEETS (OPCIONAL)
            </h3>
            <p className="text-xs text-slate-400 mb-2.5">
              URL do seu Google Apps Script para registrar automaticamente Nome, E-mail, Gols e Chutes na planilha.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={localWebhook}
                onChange={(e) => {
                  setLocalWebhook(e.target.value);
                  setTestWebhookStatus('idle');
                }}
                placeholder="https://script.google.com/macros/s/XXXXX/exec"
                className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testWebhookStatus === 'testing'}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <span>🧪 Testar Conexão</span>
              </button>
            </div>
            {testWebhookMessage && (
              <div className={`mt-2 p-2.5 rounded-lg text-xs font-medium border ${
                testWebhookStatus === 'success'
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  : testWebhookStatus === 'error'
                  ? 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                  : 'bg-slate-900 border-slate-700 text-amber-300'
              }`}>
                {testWebhookMessage}
              </div>
            )}
          </div>

          {/* Section 3: Questions with 4 corners */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">
                  ⚽ 3. PERGUNTAS & CANTOS DO GOL ({localQuestions.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Preencha as 4 opções e selecione o botão de opção correspondente ao canto correto.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenJson}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  title="Ver ou colar JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Editor JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar SGQ</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Pergunta</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-5">
              {localQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 font-['Press_Start_2P'] text-[9px] text-amber-400">
                        <span>PÊNALTI #{idx + 1}</span>
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                        Canto Correto: <strong>[{q.correta}]</strong> {cornerNames[q.correta]}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(idx)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                      title="Excluir pergunta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Enunciado da Pergunta:
                    </label>
                    <input
                      type="text"
                      value={q.pergunta}
                      onChange={(e) => handleUpdatePergunta(idx, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  {/* 4 Corners Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                name={`correta-${idx}`}
                                checked={isCorrect}
                                onChange={() => handleUpdateCorreta(idx, corner)}
                                className="accent-emerald-500 cursor-pointer"
                              />
                              <span className={isCorrect ? 'text-emerald-400' : 'text-slate-400'}>
                                {isCorrect ? 'Correta ✓' : 'Marcar Correta'}
                              </span>
                            </label>
                          </div>
                          <input
                            type="text"
                            value={q.respostas[corner]}
                            onChange={(e) => handleUpdateResposta(idx, corner, e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-hidden focus:border-amber-400"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Explicação pós-gol (opcional):
                    </label>
                    <input
                      type="text"
                      value={q.explicacao || ''}
                      onChange={(e) => handleUpdateExplicacao(idx, e.target.value)}
                      placeholder="Ex: A etapa Check (C) confere os indicadores..."
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-['Press_Start_2P'] text-xs font-bold tracking-wider cursor-pointer shadow-lg flex items-center gap-2"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>SALVO!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>SALVAR ALTERAÇÕES</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* JSON Import/Export Modal */}
      {showJsonMode && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90">
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-2xl p-5 text-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-['Press_Start_2P'] text-xs text-amber-400">
                EDITOR JSON DAS 4 RESPOSTAS
              </h3>
              <button
                onClick={() => setShowJsonMode(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 mb-2">
              Você pode copiar ou colar sua lista de perguntas com 4 alternativas:
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
                onClick={() => setShowJsonMode(false)}
                className="px-3 py-1.5 bg-slate-800 text-xs rounded-lg text-slate-300"
              >
                Voltar
              </button>
              <button
                onClick={handleApplyJson}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-lg text-white flex items-center gap-1.5"
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
