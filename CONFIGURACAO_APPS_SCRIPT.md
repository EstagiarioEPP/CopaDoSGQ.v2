# GUIA DE CONFIGURAÇÃO DO GOOGLE APPS SCRIPT — COPA DO SGQ 2026

Este documento orienta, em passos simples e práticos, como atualizar ou configurar o script do Google Sheets para a **Copa do SGQ ACIM (Novembro 2026)**.

---

## 1. O que este script faz?

1. **Valida os e-mails autorizados (incluindo testes):**
   * `consultor12@acim.com.br`
   * `escoladenegocios2@acim.com.br`
   * `supervisorcomercial@acim.com.br`
   * `escoladenegocios6@acim.com.br`
   * `estagioepp@acim.com.br` (testes)
2. **Impede tentativas duplicadas:** bloqueia se o mesmo colaborador já tiver jogado no mesmo dia (`e-mail + data`).
3. **Validação oficial da pontuação:** confere os chutes com o gabarito oficial de 25 perguntas no servidor.
4. **Preserva dados anteriores:** não apaga linhas nem afeta registros antigos que já estão na sua planilha.

---

## 2. Passo a Passo para Atualizar o Script na sua Planilha

1. Abra a sua planilha do Google Sheets onde os resultados são salvos.
2. No menu superior da planilha, clique em:
   **Extensões** > **Apps Script**.
3. Na janela do editor de código que se abrir:
   - Se já houver um arquivo `Código.gs` (ou `Code.gs`), selecione todo o texto (`Ctrl + A`) e cole o conteúdo do arquivo `backend-apps-script/Code.gs` deste projeto.
4. Clique no ícone de **Salvar** (disquete) ou pressione `Ctrl + S`.

---

## 3. Publicar / Gerenciar a Implantação

Para que o script responda ao jogo:

1. No canto superior direito do Apps Script, clique no botão azul **Implantar** > **Gerenciar implantações**.
2. Clique no ícone de lápis (Editar) ao lado da implantação ativa.
3. No campo **Versão**, selecione: **Nova versão**.
4. Certifique-se de que as duas configurações abaixo estejam exatamente assim:
   * **Executar como:** *Eu (seu e-mail)*
   * **Quem tem acesso:** *Qualquer pessoa* (MUITO IMPORTANTE)
5. Clique em **Implantar**.
6. Copie a **URL do App da Web** gerada (que termina em `/exec`).
   *(Geralmente a URL continua a mesma já utilizada no projeto: `https://script.google.com/macros/s/AKfycbxqrWZt9-0r3TvJzI8yTTzkiULnTcxIulZsUTH6oB0tFlf_lkAc0K0SbXcosq6Cnqc/exec`)*.

---

## 4. Como testar sem comprometer os dados

Se você quiser testar antes da competição:
- Envie um disparo com um e-mail contendo a palavra `admin` ou `teste` (ex: `teste@acim.com.br`).
- O script aceitará o registro para permitir a validação sem bloquear as tentativas oficiais dos 4 colaboradores.

---

## 5. Estrutura das Colunas na Planilha

O script grava automaticamente as seguintes colunas a cada partida finalizada:

| Coluna A | Coluna B | Coluna C | Coluna D | Coluna E | Coluna F | Coluna G | Coluna H |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Data e Hora** | **Nome** | **E-mail** | **Data da Rodada** | **Gols (Acertos)** | **Total** | **Aproveitamento** | **Detalhes dos Chutes** |

Se a sua planilha já possuía colunas anteriores, as novas linhas se adaptarão suavemente sem perda de dados históricos.
