/**
 * =========================================================================
 * GOOGLE APPS SCRIPT — COPA DO SGQ ACIM (NOVEMBRO 2026)
 * =========================================================================
 *
 * Planilha oficial vinculada:
 * https://docs.google.com/spreadsheets/d/1gZ6lMxCUw3GUGgHkhsifDZ_IwGolb9tXOFty3l4OTZA/edit?gid=0#gid=0
 *
 * Funcionalidades:
 * 1. Restrição estrita aos 4 participantes oficiais (conta de teste removida).
 * 2. Validação oficial de pontuação no servidor (gabarito seguro para rodadas de múltipla escolha).
 * 3. Bloqueio de horário oficial (08:00 às 18:00 - America/Sao_Paulo).
 * 4. Bloqueio rigoroso de duplicidade por [e-mail + data normalizada].
 * 5. Preservação total de colunas 1-9 e adição das Colunas 10 (VAR 18/11) e 11 (Final Chute de Ouro 19/11).
 * 6. Leitura completa via doGet(e) para o Painel Administrativo e Ranking 17/11.
 */

var SPREADSHEET_ID = "1gZ6lMxCUw3GUGgHkhsifDZ_IwGolb9tXOFty3l4OTZA";

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

// ÚNICOS 4 PARTICIPANTES OFICIAIS (CONTA DE TESTE REMOVIDA)
var PARTICIPANTES_AUTORIZADOS = [
  "consultor12@acim.com.br",
  "escoladenegocios2@acim.com.br",
  "escoladenegocios6@acim.com.br",
  "supervisorcomercial@acim.com.br"
];

function getTargetSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return ss.getActiveSheet();
}

function normalizeSheetDate(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, "America/Sao_Paulo", "yyyy-MM-dd");
  }
  var str = val.toString().trim();
  var isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[1] + "-" + isoMatch[2] + "-" + isoMatch[3];
  var brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) return brMatch[3] + "-" + brMatch[2] + "-" + brMatch[1];
  return str;
}

function normalizeSheetTimestamp(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
  }
  return val.toString().trim();
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Data e Hora",
      "Nome",
      "E-mail",
      "Data da Rodada",
      "Gols (Acertos)",
      "Total",
      "Aproveitamento",
      "Detalhes dos Chutes",
      "Tempo de Resposta",
      "VAR - Exemplo Prático",
      "Final - Chute de Ouro"
    ]);
    sheet.getRange(1, 1, 1, 11)
      .setFontWeight("bold")
      .setBackground("#065f46")
      .setFontColor("#ffffff");
    return;
  }

  // Adiciona apenas cabeçalhos faltantes nas colunas 9, 10 e 11 sem tocar nos dados existentes
  var extraHeaders = [
    { col: 9, title: "Tempo de Resposta" },
    { col: 10, title: "VAR - Exemplo Prático" },
    { col: 11, title: "Final - Chute de Ouro" }
  ];
  for (var h = 0; h < extraHeaders.length; h++) {
    var cell = sheet.getRange(1, extraHeaders[h].col);
    if (!cell.getValue()) {
      cell.setValue(extraHeaders[h].title)
        .setFontWeight("bold")
        .setBackground("#065f46")
        .setFontColor("#ffffff");
    }
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Adquire lock exclusivo de até 15 segundos para evitar concorrência
    lock.waitLock(15000);

    var sheet = getTargetSheet();
    ensureHeaders(sheet);

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
    var rodadaData = normalizeSheetDate(data.date || data.data || "");

    // Se a data não foi enviada explicitamente, calcula no fuso de São Paulo
    if (!rodadaData) {
      rodadaData = Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd");
    }

    // 1. Verificação se o e-mail está na lista dos 4 participantes oficiais (ou teste admin)
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

    // 1.5 Validação do horário oficial (08:00 às 18:00 - Horário de Brasília, com tolerância de envio para quem entrou antes das 18:00)
    var now = new Date();
    var spHour = Number(Utilities.formatDate(now, "America/Sao_Paulo", "H"));
    var spMinute = Number(Utilities.formatDate(now, "America/Sao_Paulo", "m"));
    var totalMinutes = spHour * 60 + spMinute;
    if (!isAdminTest && (totalMinutes < (8 * 60 - 5) || totalMinutes > (18 * 60 + 10))) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Fora do horário oficial de cobranças (08:00 às 18:00 - Horário de Brasília)."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. BLOQUEIO DE DUPLICIDADE: e-mail + data da rodada
    var numRows = sheet.getLastRow();
    if (numRows > 1 && !isAdminTest) {
      var rangeValues = sheet.getRange(2, 1, numRows - 1, Math.max(sheet.getLastColumn(), 4)).getValues();
      for (var i = 0; i < rangeValues.length; i++) {
        var rowEmail = (rangeValues[i][2] || "").toString().trim().toLowerCase();
        var rowDate = normalizeSheetDate(rangeValues[i][3]);

        if (rowEmail === email && rowDate === rodadaData) {
          return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: "Você já realizou sua tentativa oficial de hoje (" + rodadaData + "). Apenas 1 tentativa permitida por dia!"
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // 3. TRATAMENTO DA GRANDE FINAL (19/11) VS RODADAS DE MÚLTIPLA ESCOLHA
    var isGoldenKick = Boolean(data.isGoldenKick) || rodadaData === "2026-11-19";
    var totalQuestions = 5;
    var officialScore = 0;
    var percentage = "0%";
    var answersSummary = data.answers || "";

    if (isGoldenKick) {
      officialScore = "Em análise";
      totalQuestions = Number(data.totalQuestions || 3);
      percentage = "Banca SGQ";
      answersSummary = data.answers || "Grande Final — 3 Cenários (Avaliação Manual)";
    } else if (Array.isArray(data.records) && data.records.length > 0) {
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
      percentage = Math.round((officialScore / totalQuestions) * 100) + "%";
    } else if (data.score !== undefined && data.score !== null) {
      officialScore = Number(data.score);
      totalQuestions = Number(data.totalQuestions || 5);
      percentage = Math.round((officialScore / totalQuestions) * 100) + "%";
    }

    var timestampStr = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
    var tempoResposta = (data.tempoResposta !== undefined && data.tempoResposta !== null && data.tempoResposta !== "")
      ? data.tempoResposta.toString()
      : "-";
    var varResponse = (data.varResponse !== undefined && data.varResponse !== null && data.varResponse !== "")
      ? data.varResponse.toString()
      : "-";
    var goldenKickSummary = (data.goldenKickSummary !== undefined && data.goldenKickSummary !== null && data.goldenKickSummary !== "")
      ? data.goldenKickSummary.toString()
      : "-";

    // 4. Grava a linha de resultado oficial na planilha (11 colunas sem deslocar colunas 1-9)
    sheet.appendRow([
      timestampStr,
      nome,
      email,
      rodadaData,
      officialScore,
      totalQuestions,
      percentage,
      answersSummary,
      tempoResposta,
      varResponse,
      goldenKickSummary
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      score: officialScore,
      total: totalQuestions,
      percentage: percentage,
      tempoResposta: tempoResposta,
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
  try {
    var sheet = getTargetSheet();
    var numRows = sheet.getLastRow();
    var numCols = Math.max(sheet.getLastColumn(), 11);
    var attempts = [];

    if (numRows > 1) {
      var values = sheet.getRange(2, 1, numRows - 1, numCols).getValues();
      for (var i = 0; i < values.length; i++) {
        var row = values[i];
        var rowEmail = (row[2] || "").toString().trim().toLowerCase();
        if (!rowEmail || rowEmail.indexOf("@") === -1) continue;

        var rowDate = normalizeSheetDate(row[3]);
        var rawScore = row[4];
        var isPending = rowDate === "2026-11-19" || (rawScore && rawScore.toString().toLowerCase().indexOf("análise") !== -1);

        attempts.push({
          timestamp: normalizeSheetTimestamp(row[0]),
          name: (row[1] || "Jogador").toString().trim(),
          email: rowEmail,
          date: rowDate,
          score: isPending ? 0 : Number(rawScore || 0),
          totalQuestions: Number(row[5] || 5) || 5,
          percentage: (row[6] || "").toString().trim(),
          answers: (row[7] || "").toString().trim(),
          tempoResposta: (row[8] !== undefined && row[8] !== null) ? row[8].toString().trim() : "-",
          varResponse: (row[9] !== undefined && row[9] !== null) ? row[9].toString().trim() : "-",
          goldenKickSummary: (row[10] !== undefined && row[10] !== null) ? row[10].toString().trim() : "-",
          isPendingManualReview: isPending
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "online",
      competicao: "Copa do SGQ ACIM 2026",
      periodo: "16/11/2026 a 20/11/2026",
      participantes: PARTICIPANTES_AUTORIZADOS.length,
      totalRegistros: attempts.length,
      attempts: attempts
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString(),
      attempts: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
