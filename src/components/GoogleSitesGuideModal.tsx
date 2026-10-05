import React, { useState } from 'react';
import { X, Copy, Check, Code2, Sheet, Globe, AlertTriangle } from 'lucide-react';
import { sounds } from '../sound';
import { Question, GameTheme } from '../types';
import { generateStandaloneHtml } from '../exportStandaloneHtml';

interface GoogleSitesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
  questions: Question[];
  theme: GameTheme;
  webhookUrl: string;
}

export const GoogleSitesGuideModal: React.FC<GoogleSitesGuideModalProps> = ({
  isOpen,
  onClose,
  questions,
  theme,
  webhookUrl,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const standaloneHtml = generateStandaloneHtml(questions, theme, webhookUrl);

  const appsScriptCode = `// CÓDIGO 100% GRATUITO E INFALÍVEL PARA GOOGLE APPS SCRIPT
// 1. Abra sua planilha no Google Sheets
// 2. Vá em 'Extensões' > 'Apps Script'
// 3. Apague tudo que estiver lá, cole este código e clique em 'Salvar' (ícone do disquete)
// 4. Clique em 'Implantar' > 'Nova implantação'
// 5. Tipo: Selecione a engrenagem e escolha 'App da Web'
// 6. ATENÇÃO NAS DUAS CONFIGURAÇÕES OBRIGATÓRIAS:
//    - 'Executar como': Escolha 'Eu (seu email)'
//    - 'Quem tem acesso': Escolha 'Qualquer pessoa' (MUITO IMPORTANTE!)
// 7. Clique em 'Implantar', autorize o acesso (Avançado > Acessar) e copie a URL gerada (/exec)

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Cria cabeçalho automático se a planilha for nova
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

// Permite testar a URL abrindo direto no navegador
function doGet(e) {
  return ContentService.createTextOutput("✅ O Webhook da Copa do SGQ está ATIVO e pronto para receber dados!")
    .setMimeType(ContentService.MimeType.TEXT);
}`;

  const copyToClipboard = (text: string, index: number) => {
    sounds.playBlip();
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border-3 border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <Globe className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-['Press_Start_2P'] text-xs sm:text-sm text-amber-400">
                COMO IMPLANTAR NO GOOGLE SITES & SHEETS
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Solução definitiva para o erro &quot;recusou estabelecer ligação&quot; e configuração da planilha.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Section 1: Por que deu "recusou estabelecer ligação"? */}
          <div className="bg-amber-950/30 border-2 border-amber-500/50 p-4 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <strong className="text-amber-300 block">
                Por que a URL <code>ais-dev-*.run.app</code> recusou ligação no Google Sites?
              </strong>
              <p className="text-slate-300 leading-relaxed">
                A URL que começa com <code>ais-dev-</code> é apenas uma <strong>área restrita e temporária de desenvolvimento</strong> do Google Cloud Run. Ela possui proteções de segurança que bloqueiam conexões externas via iframe.
              </p>
              <p className="text-emerald-400 font-semibold mt-1">
                👉 A forma correta e recomendada pelo Google Sites é usar a aba <strong>&quot;Código de incorporação&quot;</strong> (colando o código HTML completo diretamente no site). Dessa forma, o Google Sites hospeda o jogo internamente, sem depender de nenhum servidor externo e NUNCA mais dá erro de conexão!
              </p>
            </div>
          </div>

          {/* Section 2: Passo a Passo no Google Sites com 1 clique */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Code2 className="w-5 h-5" />
                <span>1. Como Colocar o Jogo no Google Sites (Sem Erros)</span>
              </div>
              <button
                onClick={() => copyToClipboard(standaloneHtml, 1)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
              >
                {copiedIndex === 1 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedIndex === 1 ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO DO JOGO'}</span>
              </button>
            </div>

            <ol className="text-xs sm:text-sm text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Clique no botão verde acima <strong>&quot;COPIAR CÓDIGO DO JOGO&quot;</strong>.</li>
              <li>Abra seu <strong>Google Sites</strong> no modo de edição.</li>
              <li>No painel direito, clique em <strong>Inserir</strong> e depois em <strong>Incorporar (&lt; &gt;)</strong>.</li>
              <li>
                <strong className="text-amber-300">IMPORTANTE:</strong> Clique na aba <strong className="text-white underline">Código de incorporação</strong> (NÃO use a aba &quot;Por URL&quot;).
              </li>
              <li>Pressione <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">Ctrl + V</kbd> para colar o código.</li>
              <li>Clique em <strong>Próxima</strong> e depois em <strong>Inserir</strong>.</li>
              <li>Arraste os cantos do bloco azul para que o minijogo fique do tamanho ideal na página e clique em <strong>Publicar</strong>!</li>
            </ol>
          </div>

          {/* Section 3: Gravar no Google Sheets */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Sheet className="w-5 h-5" />
                <span>2. Código para o Google Sheets (Apps Script)</span>
              </div>
              <button
                onClick={() => copyToClipboard(appsScriptCode, 2)}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 cursor-pointer font-semibold py-1 px-3 rounded-lg bg-amber-400/10 border border-amber-400/30"
              >
                {copiedIndex === 2 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 2 ? 'Script Copiado!' : 'Copiar Script'}</span>
              </button>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Para gravar as respostas na planilha sem erro de permissão:
            </p>
            <ol className="text-xs sm:text-sm text-slate-300 space-y-1.5 list-decimal list-inside">
              <li>Na sua planilha, vá em <strong>Extensões &gt; Apps Script</strong>.</li>
              <li>Apague o código existente, cole o script abaixo e salve.</li>
              <li>Clique em <strong>Implantar &gt; Nova implantação</strong> (ou Gerenciar implantações).</li>
              <li>Selecione o tipo <strong>App da Web</strong>. Configure:
                <span className="block ml-5 text-emerald-400 font-medium">Executar como: &quot;Eu (seu email)&quot;</span>
                <span className="block ml-5 text-amber-300 font-medium">Quem tem acesso: &quot;Qualquer pessoa&quot; (OBRIGATÓRIO)</span>
              </li>
              <li>Copie a URL fornecida e cole no campo de Webhook da tela <strong>&quot;Configurar 4 Cantos&quot;</strong>.</li>
            </ol>

            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto max-h-40">
              {appsScriptCode}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => copyToClipboard(standaloneHtml, 1)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
          >
            {copiedIndex === 1 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>COPIAR CÓDIGO PARA O GOOGLE SITES</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
