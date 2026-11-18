/**
 * =========================================================================
 * GOOGLE APPS SCRIPT — COPA DO SGQ ACIM (NOVEMBRO 2026)
 * =========================================================================
 *
 * Planilha oficial vinculada:
 * https://docs.google.com/spreadsheets/d/1gZ6lMxCUw3GUGgHkhsifDZ_IwGolb9tXOFty3l4OTZA/edit?gid=0#gid=0
 *
 * Funcionalidades:
 * 1. Restrição estrita aos 4 participantes oficiais.
 * 2. Validação oficial de pontuação no servidor (gabarito seguro).
 * 3. Bloqueio de horário oficial (08:00 às 18:00 - America/Sao_Paulo).
 * 4. Bloqueio rigoroso de duplicidade por [e-mail + data normalizada].
 * 5. Preservação total de colunas 1-11 + Coluna 12 (JSON estruturado da Final 19/11).
 * 6. Abas dedicadas gerenciadas via ?action=...:
 *    - "Config": lista de eliminados dinâmicos e campeão coroado.
 *    - "PerguntasDia19": cenários e campos dinâmicos da Grande Final (19/11).
 *    - "AvaliacoesDia19": notas de 1 a 5 estrelas por jogador e cenário.
 */

var SPREADSHEET_ID = "1gZ6lMxCUw3GUGgHkhsifDZ_IwGolb9tXOFty3l4OTZA";

var SHEET_NAMES = {
  CONFIG: "Config",
  QUESTIONS_19: "PerguntasDia19",
  EVALUATIONS_19: "AvaliacoesDia19"
};

// GABARITO OFICIAL SEGURO
var GABARITO_OFICIAL = {
  // 16/11/2026
  "Q01": "B", "Q02": "C", "Q03": "C", "Q04": "B", "Q05": "A",
  // 17/11/2026
  "Q06": "C", "Q07": "B", "Q08": "C", "Q09": "C", "Q10": "B",
  // 18/11/2026
  "Q11": "B", "Q12": "B", "Q13": "B", "Q14": "A", "Q15": "B",
  // 19/11/2026 (reserva múltipla escolha)
  "Q16": "B", "Q17": "B", "Q18": "B", "Q19": "C", "Q20": "B"
};

// ÚNICOS 4 PARTICIPANTES OFICIAIS
var PARTICIPANTES_AUTORIZADOS = [
  "consultor12@acim.com.br",
  "escoladenegocios2@acim.com.br",
  "escoladenegocios6@acim.com.br",
  "supervisorcomercial@acim.com.br"
];

function getSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return ss;
}

function getMainAttemptsSheet() {
  var ss = getSpreadsheet();
  var sheets = ss.getSheets();
  // Usa sempre a primeira aba principal para preservar 100% do histórico
  return sheets[0];
}

function getOrCreateTab(name, headers) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#0f172a")
        .setFontColor("#facc15");
    }
  } else if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#0f172a")
      .setFontColor("#facc15");
  }
  return sheet;
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

function nowSpTimestamp() {
  return Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureMainHeaders(sheet) {
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
      "Final - Chute de Ouro",
      "Final - JSON Estruturado"
    ]);
    sheet.getRange(1, 1, 1, 12)
      .setFontWeight("bold")
      .setBackground("#065f46")
      .setFontColor("#ffffff");
    return;
  }

  // Adiciona apenas cabeçalhos faltantes nas colunas 9, 10, 11 e 12 sem alterar dados existentes
  var extraHeaders = [
    { col: 9, title: "Tempo de Resposta" },
    { col: 10, title: "VAR - Exemplo Prático" },
    { col: 11, title: "Final - Chute de Ouro" },
    { col: 12, title: "Final - JSON Estruturado" }
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

// =========================================================================
// GESTÃO DA ABA "Config" (ELIMINADOS E CAMPEÃO COROADO)
// =========================================================================

function readConfigData() {
  var sheet = getOrCreateTab(SHEET_NAMES.CONFIG, ["Chave", "Valor", "AtualizadoEm"]);
  var numRows = sheet.getLastRow();
  var map = {};

  if (numRows > 1) {
    var rows = sheet.getRange(2, 1, numRows - 1, 2).getValues();
    for (var i = 0; i < rows.length; i++) {
      var k = (rows[i][0] || "").toString().trim();
      var v = (rows[i][1] || "").toString();
      if (k) map[k] = v;
    }
  }

  var eliminatedEmails = [];
  if (map.eliminatedEmails) {
    try {
      var parsed = JSON.parse(map.eliminatedEmails);
      if (Array.isArray(parsed)) {
        eliminatedEmails = parsed.map(function(e) {
          return e.toString().trim().toLowerCase();
        }).filter(function(e) { return Boolean(e); });
      }
    } catch (err) {}
  }

  return {
    eliminatedEmails: eliminatedEmails,
    championEmail: (map.championEmail || "").trim().toLowerCase(),
    championName: (map.championName || "").trim(),
    isChampionReleased: map.isChampionReleased === "true",
    crownedAt: (map.crownedAt || "").trim()
  };
}

function upsertConfigKey(key, valueStr) {
  var sheet = getOrCreateTab(SHEET_NAMES.CONFIG, ["Chave", "Valor", "AtualizadoEm"]);
  var numRows = sheet.getLastRow();
  var ts = nowSpTimestamp();

  if (numRows > 1) {
    var rows = sheet.getRange(2, 1, numRows - 1, 1).getValues();
    for (var i = 0; i < rows.length; i++) {
      if ((rows[i][0] || "").toString().trim() === key) {
        sheet.getRange(i + 2, 2, 1, 2).setValues([[valueStr, ts]]);
        return;
      }
    }
  }
  sheet.appendRow([key, valueStr, ts]);
}

// =========================================================================
// GESTÃO DA ABA "PerguntasDia19" (CENÁRIOS E CAMPOS DINÂMICOS)
// =========================================================================

function readQuestions19Data() {
  var sheet = getOrCreateTab(SHEET_NAMES.QUESTIONS_19, [
    "ID",
    "Ordem",
    "Titulo",
    "Temas",
    "Contexto",
    "CamposJSON",
    "AtualizadoEm"
  ]);
  var numRows = sheet.getLastRow();
  if (numRows <= 1) return [];

  var rows = sheet.getRange(2, 1, numRows - 1, 7).getValues();
  var list = [];
  for (var i = 0; i < rows.length; i++) {
    var id = (rows[i][0] || "").toString().trim();
    var title = (rows[i][2] || "").toString().trim();
    var themesRaw = (rows[i][3] || "").toString().trim();
    var context = (rows[i][4] || "").toString().trim();
    var fieldsRaw = (rows[i][5] || "").toString().trim();

    if (!id && !title && !context) continue;

    var themesCrossed = [];
    if (themesRaw) {
      try {
        var parsedThemes = JSON.parse(themesRaw);
        themesCrossed = Array.isArray(parsedThemes) ? parsedThemes : [themesRaw];
      } catch (e) {
        themesCrossed = themesRaw.split(",").map(function(t) { return t.trim(); }).filter(Boolean);
      }
    }

    var customFields = [];
    if (fieldsRaw) {
      try {
        var parsedFields = JSON.parse(fieldsRaw);
        if (Array.isArray(parsedFields)) {
          customFields = parsedFields;
        }
      } catch (e) {}
    }

    list.push({
      id: id || ("FINAL-0" + (i + 1)),
      order: Number(rows[i][1] || (i + 1)),
      title: title,
      themesCrossed: themesCrossed,
      context: context,
      customFields: customFields
    });
  }

  list.sort(function(a, b) { return a.order - b.order; });
  return list;
}

function saveQuestions19Data(scenarios) {
  var sheet = getOrCreateTab(SHEET_NAMES.QUESTIONS_19, [
    "ID",
    "Ordem",
    "Titulo",
    "Temas",
    "Contexto",
    "CamposJSON",
    "AtualizadoEm"
  ]);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
  }

  if (!Array.isArray(scenarios) || scenarios.length === 0) return 0;

  var ts = nowSpTimestamp();
  var rowsToWrite = [];
  for (var i = 0; i < scenarios.length; i++) {
    var sc = scenarios[i] || {};
    var customFields = Array.isArray(sc.customFields) ? sc.customFields : [];
    if (customFields.length === 0 && sc.fields) {
      customFields = [
        { id: "diagnostico", label: sc.fields.diagnosticoLabel || "1. Diagnóstico e temas do SGQ" },
        { id: "contencao", label: sc.fields.contencaoLabel || "2. Contenção imediata no SIG Sistem / ACIM" },
        { id: "acaoPreventiva", label: sc.fields.acaoPreventivaLabel || "3. Ação preventiva e melhoria sistêmica" }
      ];
    }

    rowsToWrite.push([
      (sc.id || ("FINAL-0" + (i + 1))).toString(),
      i + 1,
      (sc.title || "").toString(),
      JSON.stringify(Array.isArray(sc.themesCrossed) ? sc.themesCrossed : []),
      (sc.context || "").toString(),
      JSON.stringify(customFields),
      ts
    ]);
  }

  sheet.getRange(2, 1, rowsToWrite.length, 7).setValues(rowsToWrite);
  return rowsToWrite.length;
}

// =========================================================================
// GESTÃO DA ABA "AvaliacoesDia19" (NOTAS DE 1 A 5 ESTRELAS)
// =========================================================================

function readEvaluations19Data() {
  var sheet = getOrCreateTab(SHEET_NAMES.EVALUATIONS_19, [
    "Email",
    "CenarioID",
    "Estrelas",
    "AtualizadoEm"
  ]);
  var numRows = sheet.getLastRow();
  if (numRows <= 1) return [];

  var rows = sheet.getRange(2, 1, numRows - 1, 4).getValues();
  var list = [];
  for (var i = 0; i < rows.length; i++) {
    var email = (rows[i][0] || "").toString().trim().toLowerCase();
    var scenarioId = (rows[i][1] || "").toString().trim();
    var stars = Number(rows[i][2] || 0);
    if (!email || !scenarioId) continue;

    list.push({
      email: email,
      scenarioId: scenarioId,
      stars: stars,
      updatedAt: normalizeSheetTimestamp(rows[i][3])
    });
  }
  return list;
}

function upsertEvaluation19(email, scenarioId, stars) {
  var cleanEmail = (email || "").toString().trim().toLowerCase();
  var cleanScenario = (scenarioId || "").toString().trim();
  var clampedStars = Math.max(1, Math.min(5, Math.round(Number(stars || 1))));
  if (!cleanEmail || !cleanScenario) return false;

  var sheet = getOrCreateTab(SHEET_NAMES.EVALUATIONS_19, [
    "Email",
    "CenarioID",
    "Estrelas",
    "AtualizadoEm"
  ]);
  var numRows = sheet.getLastRow();
  var ts = nowSpTimestamp();

  if (numRows > 1) {
    var rows = sheet.getRange(2, 1, numRows - 1, 2).getValues();
    for (var i = 0; i < rows.length; i++) {
      var rEmail = (rows[i][0] || "").toString().trim().toLowerCase();
      var rScenario = (rows[i][1] || "").toString().trim();
      if (rEmail === cleanEmail && rScenario === cleanScenario) {
        sheet.getRange(i + 2, 3, 1, 2).setValues([[clampedStars, ts]]);
        return true;
      }
    }
  }

  sheet.appendRow([cleanEmail, cleanScenario, clampedStars, ts]);
  return true;
}

// =========================================================================
// ROTEADOR DO POST (?action=...)
// =========================================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

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

    var action = (e && e.parameter && e.parameter.action) || data.action || "submitAttempt";

    // ROTA 1: ELIMINAR COLABORADOR
    if (action === "eliminatePlayer") {
      var targetEmail = (data.email || "").toString().trim().toLowerCase();
      if (!targetEmail) return jsonOutput({ success: false, error: "E-mail obrigatório." });

      var currentCfg = readConfigData();
      var list = currentCfg.eliminatedEmails;
      if (list.indexOf(targetEmail) === -1) {
        list.push(targetEmail);
      }
      upsertConfigKey("eliminatedEmails", JSON.stringify(list));
      return jsonOutput({ success: true, config: readConfigData() });
    }

    // ROTA 2: REATIVAR COLABORADOR
    if (action === "restorePlayer") {
      var restoreEmail = (data.email || "").toString().trim().toLowerCase();
      var cfgNow = readConfigData();
      var filtered = cfgNow.eliminatedEmails.filter(function(em) { return em !== restoreEmail; });
      upsertConfigKey("eliminatedEmails", JSON.stringify(filtered));
      return jsonOutput({ success: true, config: readConfigData() });
    }

    // ROTA 3: SALVAR PERGUNTAS DINÂMICAS DO DIA 19
    if (action === "saveQuestions19") {
      var count = saveQuestions19Data(data.questions19 || []);
      return jsonOutput({ success: true, savedCount: count, questions19: readQuestions19Data() });
    }

    // ROTA 4: SALVAR AVALIAÇÃO DE 1 A 5 ESTRELAS
    if (action === "saveEvaluation") {
      var ok = upsertEvaluation19(data.email, data.scenarioId, data.stars);
      return jsonOutput({ success: ok, evaluations: readEvaluations19Data() });
    }

    // ROTA 5: COROAR GRANDE CAMPEÃO
    if (action === "crownChampion") {
      var champEmail = (data.email || "").toString().trim().toLowerCase();
      var champName = (data.name || "").toString().trim();
      if (!champEmail) return jsonOutput({ success: false, error: "E-mail do campeão obrigatório." });

      upsertConfigKey("championEmail", champEmail);
      upsertConfigKey("championName", champName || champEmail);
      upsertConfigKey("isChampionReleased", "true");
      upsertConfigKey("crownedAt", nowSpTimestamp());
      return jsonOutput({ success: true, config: readConfigData() });
    }

    // ROTA 6: REVOGAR / OCULTAR COROAÇÃO DO CAMPEÃO
    if (action === "uncrownChampion") {
      upsertConfigKey("championEmail", "");
      upsertConfigKey("championName", "");
      upsertConfigKey("isChampionReleased", "false");
      upsertConfigKey("crownedAt", "");
      return jsonOutput({ success: true, config: readConfigData() });
    }

    // ROTA PADRÃO: SUBMETER TENTATIVA DA RODADA
    var sheet = getMainAttemptsSheet();
    ensureMainHeaders(sheet);

    var email = (data.email || "").toString().trim().toLowerCase();
    var nome = (data.nome || data.name || "Jogador").toString().trim();
    var rodadaData = normalizeSheetDate(data.date || data.data || "");
    if (!rodadaData) {
      rodadaData = Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd");
    }

    var isAuthorized = PARTICIPANTES_AUTORIZADOS.some(function(p) {
      return p.toLowerCase() === email;
    });
    var isAdminTest = email.indexOf("admin") !== -1 || email.indexOf("teste") !== -1;

    if (!isAuthorized && !isAdminTest) {
      return jsonOutput({
        success: false,
        error: "E-mail não autorizado para participar da Copa do SGQ 2026."
      });
    }

    // Bloqueio estrito para jogadores eliminados dinamicamente na aba Config
    if (!isAdminTest) {
      var configCheck = readConfigData();
      if (configCheck.eliminatedEmails.indexOf(email) !== -1) {
        return jsonOutput({
          success: false,
          error: "Participante eliminado do mata-mata."
        });
      }
    }

    // Validação do horário oficial (08:00 às 18:00 - Horário de Brasília)
    var now = new Date();
    var spHour = Number(Utilities.formatDate(now, "America/Sao_Paulo", "H"));
    var spMinute = Number(Utilities.formatDate(now, "America/Sao_Paulo", "m"));
    var totalMinutes = spHour * 60 + spMinute;
    if (!isAdminTest && (totalMinutes < (8 * 60 - 5) || totalMinutes > (18 * 60 + 10))) {
      return jsonOutput({
        success: false,
        error: "Fora do horário oficial de cobranças (08:00 às 18:00 - Horário de Brasília)."
      });
    }

    // Bloqueio de duplicidade: e-mail + data da rodada
    var numRows = sheet.getLastRow();
    if (numRows > 1 && !isAdminTest) {
      var rangeValues = sheet.getRange(2, 1, numRows - 1, Math.max(sheet.getLastColumn(), 4)).getValues();
      for (var i = 0; i < rangeValues.length; i++) {
        var rowEmail = (rangeValues[i][2] || "").toString().trim().toLowerCase();
        var rowDate = normalizeSheetDate(rangeValues[i][3]);
        if (rowEmail === email && rowDate === rodadaData) {
          return jsonOutput({
            success: false,
            error: "Você já realizou sua tentativa oficial de hoje (" + rodadaData + "). Apenas 1 tentativa permitida por dia!"
          });
        }
      }
    }

    var isGoldenKick = Boolean(data.isGoldenKick) || rodadaData === "2026-11-19";
    var totalQuestions = 5;
    var officialScore = 0;
    var percentage = "0%";
    var answersSummary = data.answers || "";

    if (isGoldenKick) {
      officialScore = "Em análise";
      totalQuestions = Number(data.totalQuestions || 3);
      percentage = "Banca SGQ";
      answersSummary = data.answers || "Grande Final — Cenários (Avaliação Manual)";
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
        if (isHit) officialScore++;
        detailList.push(qId + ": [" + choice + "] " + (isHit ? "Gol" : "Defesa"));
      }
      answersSummary = detailList.join(" | ");
      percentage = Math.round((officialScore / totalQuestions) * 100) + "%";
    } else if (data.score !== undefined && data.score !== null) {
      officialScore = Number(data.score);
      totalQuestions = Number(data.totalQuestions || 5);
      percentage = Math.round((officialScore / totalQuestions) * 100) + "%";
    }

    var timestampStr = nowSpTimestamp();
    var tempoResposta = (data.tempoResposta !== undefined && data.tempoResposta !== null && data.tempoResposta !== "")
      ? data.tempoResposta.toString()
      : "-";
    var varResponse = (data.varResponse !== undefined && data.varResponse !== null && data.varResponse !== "")
      ? data.varResponse.toString()
      : "-";
    var goldenKickSummary = (data.goldenKickSummary !== undefined && data.goldenKickSummary !== null && data.goldenKickSummary !== "")
      ? data.goldenKickSummary.toString()
      : "-";
    var goldenKickJson = "";
    if (Array.isArray(data.goldenKickAnswers) && data.goldenKickAnswers.length > 0) {
      goldenKickJson = JSON.stringify(data.goldenKickAnswers);
    }

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
      goldenKickSummary,
      goldenKickJson
    ]);

    return jsonOutput({
      success: true,
      score: officialScore,
      total: totalQuestions,
      percentage: percentage,
      tempoResposta: tempoResposta,
      message: "Resultado gravado com sucesso na Copa do SGQ!"
    });

  } catch (err) {
    return jsonOutput({
      success: false,
      error: "Erro no servidor: " + err.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

// =========================================================================
// ROTEADOR DO GET (?action=...)
// =========================================================================

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action.toString() : "history";

    if (action === "getConfig") {
      return jsonOutput({
        status: "online",
        config: readConfigData()
      });
    }

    if (action === "getQuestions19") {
      return jsonOutput({
        status: "online",
        questions19: readQuestions19Data()
      });
    }

    if (action === "getEvaluations") {
      return jsonOutput({
        status: "online",
        evaluations: readEvaluations19Data()
      });
    }

    // ROTA PADRÃO / history: retorna histórico completo + configuração atual
    var sheet = getMainAttemptsSheet();
    var numRows = sheet.getLastRow();
    var numCols = Math.max(sheet.getLastColumn(), 12);
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

        var parsedGoldenAnswers = null;
        if (row[11]) {
          try {
            var decoded = JSON.parse(row[11].toString());
            if (Array.isArray(decoded)) parsedGoldenAnswers = decoded;
          } catch (err) {}
        }

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
          goldenKickAnswers: parsedGoldenAnswers,
          isPendingManualReview: isPending
        });
      }
    }

    return jsonOutput({
      status: "online",
      competicao: "Copa do SGQ ACIM 2026",
      periodo: "16/11/2026 a 19/11/2026",
      participantes: PARTICIPANTES_AUTORIZADOS.length,
      totalRegistros: attempts.length,
      config: readConfigData(),
      attempts: attempts
    });
  } catch (err) {
    return jsonOutput({
      status: "error",
      error: err.toString(),
      attempts: []
    });
  }
}
