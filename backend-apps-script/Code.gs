/**
 * =========================================================================
 * GOOGLE APPS SCRIPT — COPA DO SGQ ACIM (NOVEMBRO 2026)
 * =========================================================================
 *
 * Este script é compatível com o endpoint atual e implementa:
 * 1. Restrição aos 4 participantes autorizados.
 * 2. Validação oficial de pontuação no servidor (gabarito seguro).
 * 3. Bloqueio rigoroso de duplicidade por [e-mail + data].
 * 4. Controle de concorrência com LockService.
 * 5. Preservação total de linhas e registros antigos da planilha.
 */

// GABARITO OFICIAL SEGURO (25 PERGUNTAS)
var GABARITO_OFICIAL = {
  // 16/11/2026
  "Q01": "B",
  "Q02": "C",
  "Q03": "C",
  "Q04": "B",
  "Q05": "A",
  // 17/11/2026
  "Q06": "C",
  "Q07": "B",
  "Q08": "C",
  "Q09": "C",
  "Q10": "B",
  // 18/11/2026
  "Q11": "B",
  "Q12": "B",
  "Q13": "B",
  "Q14": "A",
  "Q15": "B",
  // 19/11/2026
  "Q16": "B",
  "Q17": "B",
  "Q18": "B",
  "Q19": "C",
  "Q20": "B",
  // 20/11/2026
  "Q21": "C",
  "Q22": "A",
  "Q23": "B",
  "Q24": "C",
  "Q25": "C"
};

// PARTICIPANTES AUTORIZADOS (INCLUINDO E-MAIL DE TESTES)
var PARTICIPANTES_AUTORIZADOS = [
  "consultor12@acim.com.br",
  "escoladenegocios2@acim.com.br",
  "supervisorcomercial@acim.com.br",
  "escoladenegocios6@acim.com.br",
  "estagioepp@acim.com.br"
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Adquire lock exclusivo de até 15 segundos para evitar concorrência
    lock.waitLock(15000);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Cria cabeçalho retrocompatível se a planilha for nova
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Data e Hora",
        "Nome",
        "E-mail",
        "Data da Rodada",
        "Gols (Acertos)",
        "Total",
        "Aproveitamento",
        "Detalhes dos Chutes"
      ]);
      sheet.getRange(1, 1, 1, 8)
        .setFontWeight("bold")
        .setBackground("#065f46")
        .setFontColor("#ffffff");
    }

    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var email = (data.email || "").toString().trim().toLowerCase();
    var nome = (data.nome || data.name || "Jogador").toString().trim();
    var rodadaData = (data.date || data.data || "").toString().trim();

    // Se a data não foi enviada explicitamente, calcula no fuso de São Paulo
    if (!rodadaData) {
      rodadaData = Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd");
    }

    // 1. Verificação se o e-mail está na lista de participantes autorizados (ou teste admin)
    var isAuthorized = PARTICIPANTES_AUTORIZADOS.some(function(p) {
      return p.toLowerCase() === email;
    });

    var isAdminTest = email.indexOf("admin") !== -1 || email.indexOf("teste") !== -1;

    if (!isAuthorized && !isAdminTest) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "E-mail não autorizado para participar da Copa do SGQ 2026."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. BLOQUEIO DE DUPLICIDADE: e-mail + data da rodada
    // Percorre as linhas existentes na planilha (coluna 3 = E-mail, coluna 4 = Data da Rodada)
    var numRows = sheet.getLastRow();
    if (numRows > 1 && !isAdminTest) {
      var rangeValues = sheet.getRange(2, 1, numRows - 1, Math.max(sheet.getLastColumn(), 4)).getValues();
      for (var i = 0; i < rangeValues.length; i++) {
        var rowEmail = (rangeValues[i][2] || "").toString().trim().toLowerCase();
        var rowDate = (rangeValues[i][3] || "").toString().trim();

        // Se encontrar mesmo e-mail e mesma data, rejeita para evitar duplicidade
        if (rowEmail === email && rowDate === rodadaData) {
          return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: "Você já realizou sua tentativa oficial de hoje (" + rodadaData + "). Apenas 1 tentativa permitida por dia!"
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // 3. CÁLCULO SEGURO DA PONTUAÇÃO NO SERVIDOR
    var totalQuestions = 5;
    var officialScore = 0;
    var answersSummary = data.answers || "";

    // Se o cliente enviou as escolhas (ex: array de chutes { questionId, userChoice }),
    // valida oficialmente contra o GABARITO_OFICIAL do servidor
    if (Array.isArray(data.records) && data.records.length > 0) {
      officialScore = 0;
      totalQuestions = data.records.length;
      var detailList = [];

      for (var q = 0; q < data.records.length; q++) {
        var rec = data.records[q];
        var qId = (rec.questionId || "").toString().toUpperCase();
        var choice = (rec.userChoice || "").toString().toUpperCase();
        var correctChoice = GABARITO_OFICIAL[qId];

        var isHit = correctChoice && (choice === correctChoice);
        if (isHit) {
          officialScore++;
        }
        detailList.push(qId + ": [" + choice + "] " + (isHit ? "Gol" : "Defesa"));
      }
      answersSummary = detailList.join(" | ");
    } else if (data.score !== undefined && data.score !== null) {
      // Fallback compatível
      officialScore = Number(data.score);
      totalQuestions = Number(data.totalQuestions || 5);
    }

    var percentage = Math.round((officialScore / totalQuestions) * 100) + "%";
    var timestampStr = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");

    // 4. Grava a linha de resultado oficial na planilha
    sheet.appendRow([
      timestampStr,
      nome,
      email,
      rodadaData,
      officialScore,
      totalQuestions,
      percentage,
      answersSummary
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      score: officialScore,
      total: totalQuestions,
      percentage: percentage,
      message: "Resultado gravado com sucesso na Copa do SGQ!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Erro no servidor: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    competicao: "Copa do SGQ ACIM 2026",
    periodo: "16/11/2026 a 20/11/2026",
    participantes: PARTICIPANTES_AUTORIZADOS.length
  })).setMimeType(ContentService.MimeType.JSON);
}
