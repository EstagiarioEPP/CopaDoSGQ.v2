# ⚽ Finais da Copa do SGQ - Minijogo de Perguntas e Respostas 2D Retrô

Minijogo arcade retrô 2D em pixel art estilo cobrança de pênalti nos 4 cantos do gol, desenvolvido para campanhas de gamificação corporativa, treinamento da qualidade (5S, ISO 9001, PDCA) e engajamento interno com integração gratuita ao Google Sheets.

---

## 🎮 Mecânica do Jogo

- **Estética 2D Arcade Retrô:** Campo de futebol com faixas de grama em perspectiva, traves 3D, rede texturizada, torcida animada e efeitos sonoros sintetizados em 8-bit (sem dependência de arquivos externos de áudio).
- **Cobrança nos 4 Cantos do Gol:**
  - **[A]** Canto Superior Esquerdo
  - **[B]** Canto Superior Direito
  - **[C]** Canto Inferior Esquerdo
  - **[D]** Canto Inferior Direito
- **Goleiro Inteligente:**
  - Camisa oficial na cor `#a9ef79` (verde limão) com a estampa **SGQ**.
  - **Em caso de erro:** o goleiro se atira exatamente para o canto escolhido pelo colaborador e faz a **DEFESA!** (sem revelar qual era a resposta correta).
  - **Em caso de acerto:** o goleiro pula para um dos 3 cantos errados e a bola entra limpa na rede — **GOOOOOOOL!** ⚽
- **Aviso Obrigatório:** Regra de *Tentativa única por colaborador*.
- **Integração Silenciosa com Google Sheets:** Envio automático de Nome, E-mail, Gols e Respostas em segundo plano via Google Apps Script (sem expor configurações aos participantes).

---

## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado (versão 18 ou superior).

### Instalação e Execução
```bash
# 1. Clone o repositório
git clone https://github.com/EstagiarioEPP/Gameficacao-2026-v2.git

# 2. Acesse a pasta do projeto
cd Gameficacao-2026-v2

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Abra seu navegador em `http://localhost:3000` (ou o link indicado no terminal).

---

## 🌐 Como Publicar Gratuitamente no GitHub Pages

Para ter um link permanente na internet (`https://estagiarioepp.github.io/Gameficacao-2026-v2/`):

1. Gere a versão de produção com o comando:
   ```bash
   npm run build
   ```
2. Na aba **Settings** do seu repositório no GitHub:
   - Vá em **Pages** (no menu lateral esquerdo).
   - Em **Build and deployment > Source**, selecione **Deploy from a branch**.
   - Escolha o branch `main` e a pasta `/dist` (ou `/root` se subir o arquivo HTML único).
3. O GitHub gerará o link seguro em menos de 1 minuto!

---

## 📊 Configuração do Google Sheets (Apps Script)

Para salvar os resultados dos participantes automaticamente sem custos:

1. No Google Sheets, crie uma nova planilha.
2. Vá em **Extensões** > **Apps Script**.
3. Cole o código abaixo:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
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
  return ContentService.createTextOutput("✅ Webhook da Copa do SGQ ativo!")
    .setMimeType(ContentService.MimeType.TEXT);
}
```

4. Clique em **Implantar** > **Nova implantação** > Tipo: **App da Web**.
5. Configure:
   - **Executar como:** *Eu (seu email)*
   - **Quem tem acesso:** *Qualquer pessoa* (Obrigatório!)
6. Copie a URL gerada e configure no painel administrativo do jogo.
