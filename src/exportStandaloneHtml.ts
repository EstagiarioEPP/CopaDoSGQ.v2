import { Question, GameTheme } from './types';

export function generateStandaloneHtml(
  questions: Question[],
  theme: GameTheme,
  webhookUrl: string = ''
): string {
  const questionsJson = JSON.stringify(questions, null, 2);
  const keeperColor = '#00be98';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${theme.title} - ESTÁDIO ACIM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Plus+Jakarta+Sans:wght@400;600;700;800&family=VT323&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      user-select: none;
    }
    body {
      background-color: #020617;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
    }
    .pixel-font {
      font-family: 'Press Start 2P', monospace;
    }
    .game-card {
      width: 100%;
      max-width: 980px;
      background: #0f172a;
      border: 4px solid #1e293b;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      overflow: hidden;
      position: relative;
    }
    .screen {
      display: none;
      padding: 24px;
    }
    .screen.active {
      display: block;
    }
    /* STADIUM PITCH */
    .stadium-wrap {
      position: relative;
      width: 100%;
      height: 520px;
      background: #020617;
      overflow: hidden;
      border-radius: 16px;
      border: 2px solid #334155;
    }
    .sky {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 95px;
      background: linear-gradient(180deg, #090d16 0%, #1e1b4b 100%);
    }
    .crowd {
      position: absolute;
      top: 26px;
      left: 0;
      right: 0;
      height: 52px;
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      padding: 0 8px;
    }
    .fan {
      width: 7px;
      height: 14px;
      border-radius: 2px 2px 0 0;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .crowd.celebrating .fan {
      animation: fanWave 0.5s ease-in-out infinite alternate;
    }
    @keyframes fanWave {
      0% { transform: translateY(0); }
      100% { transform: translateY(-8px); }
    }
    /* BALÃO DA TORCIDA ACIM */
    .crowd-chant-bubble {
      position: absolute;
      top: 6px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(30, 27, 75, 0.95);
      border: 1px solid #facc15;
      color: #facc15;
      font-size: 8px;
      padding: 3px 12px;
      border-radius: 99px;
      white-space: nowrap;
      z-index: 15;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      transition: opacity 0.35s ease, transform 0.35s ease;
    }
    .crowd-reaction-banner {
      position: absolute;
      top: 6px;
      left: 50%;
      transform: translateX(-50%) scale(0.9);
      font-size: 9px;
      padding: 4px 14px;
      border-radius: 99px;
      white-space: nowrap;
      z-index: 25;
      pointer-events: none;
      box-shadow: 0 4px 14px rgba(0,0,0,0.7);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    }
    .crowd-reaction-banner.active-goal {
      opacity: 1;
      transform: translateX(-50%) scale(1);
      background: #10b981;
      color: #020617;
      border: 2px solid #ffffff;
    }
    .crowd-reaction-banner.active-save {
      opacity: 1;
      transform: translateX(-50%) scale(1);
      background: #e11d48;
      color: #ffffff;
      border: 2px solid #ffffff;
    }

    .led-board {
      position: absolute;
      top: 80px;
      left: 0;
      right: 0;
      height: 22px;
      background: #020617;
      border-top: 1px solid rgba(234, 179, 8, 0.4);
      border-bottom: 1px solid rgba(234, 179, 8, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      z-index: 5;
    }
    .led-text {
      font-family: 'Press Start 2P', monospace;
      font-size: 8px;
      color: #facc15;
      letter-spacing: 2px;
      white-space: nowrap;
      animation: pulse 2s infinite;
    }
    /* PITCH WITH LAWN PERSPECTIVE STRIPES */
    .pitch-grass {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      top: 102px;
      background: #047857;
      background-image: repeating-linear-gradient(
        180deg,
        #065f46 0px,
        #065f46 26px,
        #047857 26px,
        #047857 52px
      );
      overflow: hidden;
    }
    .goal-frame {
      position: absolute;
      top: 75px;
      left: 50%;
      transform: translateX(-50%);
      width: 420px;
      height: 210px;
      z-index: 10;
      pointer-events: none;
    }
    .goal-net {
      position: absolute;
      inset: 6px;
      background-color: rgba(15, 23, 42, 0.7);
      background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
                        linear-gradient(-45deg, rgba(255, 255, 255, 0.25) 1px, transparent 1px);
      background-size: 11px 11px;
    }
    .crossbar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 10px;
      background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
      border-bottom: 2px solid #64748b;
      border-radius: 2px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.6);
    }
    .post-left, .post-right {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 10px;
      background: linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%);
      border-radius: 2px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.6);
    }
    .post-left { left: 0; border-right: 2px solid #64748b; }
    .post-right { right: 0; border-left: 2px solid #64748b; }

    /* FLUID HARDWARE-ACCELERATED GOALKEEPER */
    .keeper-wrap {
      position: absolute;
      top: 135px;
      left: 50%;
      transform: translate(-50%, 0) rotate(0deg) scale(1);
      z-index: 20;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.65s cubic-bezier(0.2, 0.8, 0.25, 1);
      will-change: transform;
    }
    .keeper-taunt-bubble {
      position: absolute;
      top: -24px;
      left: 50%;
      transform: translateX(-50%);
      background: #fbbf24;
      color: #020617;
      border: 2px solid #020617;
      font-size: 8px;
      padding: 2px 8px;
      border-radius: 6px;
      white-space: nowrap;
      font-weight: 900;
      box-shadow: 0 3px 6px rgba(0,0,0,0.5);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .keeper-taunt-bubble::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      border-width: 5px 4px 0;
      border-style: solid;
      border-color: #fbbf24 transparent transparent;
      display: block;
      width: 0;
    }
    /* FLUID DIVE CLASSES WITHOUT !important */
    .keeper-wrap.dive-A {
      transform: translate(calc(-50% - 145px), -36px) rotate(-32deg) scale(1.02);
    }
    .keeper-wrap.dive-B {
      transform: translate(calc(-50% + 145px), -36px) rotate(32deg) scale(1.02);
    }
    .keeper-wrap.dive-C {
      transform: translate(calc(-50% - 155px), 34px) rotate(-52deg) scale(0.96);
    }
    .keeper-wrap.dive-D {
      transform: translate(calc(-50% + 155px), 34px) rotate(52deg) scale(0.96);
    }

    /* FLUID HARDWARE-ACCELERATED BALL */
    .ball {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translate(-50%, 0) scale(1) rotate(0deg);
      width: 40px;
      height: 40px;
      z-index: 30;
      transition: transform 0.65s cubic-bezier(0.2, 0.85, 0.28, 1);
      will-change: transform;
      pointer-events: none;
    }
    .ball.fly-A {
      transform: translate(calc(-50% - 145px), -235px) scale(0.44) rotate(-720deg);
    }
    .ball.fly-B {
      transform: translate(calc(-50% + 145px), -235px) scale(0.44) rotate(720deg);
    }
    .ball.fly-C {
      transform: translate(calc(-50% - 150px), -150px) scale(0.50) rotate(-540deg);
    }
    .ball.fly-D {
      transform: translate(calc(-50% + 150px), -150px) scale(0.50) rotate(540deg);
    }

    /* 4 CORNERS BUTTONS CONTAINER */
    .corners-grid {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 12px;
      pointer-events: none;
      z-index: 40;
    }
    .corners-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
    }
    .corners-row-bottom {
      margin-bottom: 20px;
    }
    .corner-btn {
      width: 44%;
      max-width: 270px;
      padding: 12px 14px;
      background: rgba(15, 23, 42, 0.95);
      border: 2px solid #eab308;
      border-radius: 12px;
      color: #ffffff;
      text-align: left;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 4px 12px rgba(0,0,0,0.6);
      transition: all 0.2s cubic-bezier(0.2, 0.8, 0.25, 1);
    }
    .corner-btn:hover {
      background: #1e293b;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(234, 179, 8, 0.4);
    }
    .corner-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .corner-badge {
      display: inline-block;
      padding: 2px 7px;
      background: #eab308;
      color: #020617;
      font-weight: 800;
      border-radius: 4px;
      font-size: 10px;
      margin-right: 6px;
      font-family: 'Press Start 2P', monospace;
    }

    /* RESULT BANNER */
    .result-banner {
      position: absolute;
      inset: 0;
      background: rgba(2, 6, 23, 0.75);
      backdrop-filter: blur(2px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 50;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .result-banner.active {
      opacity: 1;
      pointer-events: auto;
    }
    .btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #020617;
      font-weight: 800;
      border: none;
      padding: 14px 28px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 13px;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
      transition: all 0.2s ease;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
    }
    input {
      width: 100%;
      padding: 12px 16px;
      background: #020617;
      border: 2px solid #334155;
      border-radius: 10px;
      color: #ffffff;
      font-size: 14px;
      margin-top: 6px;
      outline: none;
      transition: border-color 0.2s ease;
    }
    input:focus {
      border-color: #eab308;
    }
    .alert-box {
      display: none;
      background: rgba(225, 29, 72, 0.2);
      border: 1px solid #e11d48;
      color: #fda4af;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 12px;
      text-align: left;
    }
  </style>
</head>
<body>

  <div class="game-card">
    <!-- 1. TELA INICIAL (COLABORADOR) COM IDENTIDADE ACIM -->
    <div id="screen-start" class="screen active text-center">
      <div style="display: flex; justify-content: center; margin-bottom: 12px;">
        <svg viewBox="0 0 240 100" width="190" height="79" fill="none" style="image-rendering: pixelated; shape-rendering: crispEdges;">
          <path d="M 98 12 H 130 V 16 H 150 V 20 H 160 V 24 H 190 V 20 H 204 V 16 H 212 V 12 H 220 V 22 H 214 V 26 H 206 V 30 H 194 V 34 H 180 V 30 H 162 V 26 H 142 V 22 H 122 V 18 H 98 Z M 80 16 H 98 V 20 H 80 Z M 74 20 H 82 V 24 H 74 Z M 66 24 H 76 V 28 H 66 Z" fill="#000000" />
          <path d="M 98 15 H 128 V 19 H 148 V 23 H 158 V 24 H 188 V 23 H 202 V 19 H 210 V 15 H 216 V 19 H 212 V 23 H 204 V 27 H 192 V 31 H 178 V 27 H 160 V 23 H 140 V 19 H 120 V 15 H 98 Z M 82 19 H 98 V 23 H 82 Z M 76 23 H 84 V 27 H 76 Z M 68 25 H 78 V 28 H 68 Z" fill="#00A89D" />
          <path d="M 68 26 H 98 V 30 H 112 V 34 H 138 V 38 H 168 V 44 H 176 V 46 H 202 V 42 H 214 V 38 H 218 V 44 H 212 V 48 H 196 V 52 H 174 V 54 H 150 V 52 H 126 V 46 H 110 V 42 H 96 V 38 H 70 V 34 H 66 Z" fill="#000000" />
          <path d="M 70 29 H 98 V 33 H 112 V 37 H 138 V 41 H 166 V 45 H 174 V 47 H 200 V 43 H 212 V 40 H 214 V 43 H 210 V 46 H 194 V 50 H 172 V 51 H 148 V 49 H 124 V 43 H 108 V 39 H 94 V 35 H 70 Z" fill="#7EC832" />
          <path d="M 46 36 H 62 V 32 H 78 V 30 H 94 V 32 H 108 V 36 H 116 V 42 H 110 V 38 H 96 V 35 H 76 V 35 H 60 V 37 H 44 V 44 H 38 V 38 H 46 Z" fill="#000000" />
          <path d="M 48 37 H 62 V 34 H 78 V 32 H 94 V 34 H 106 V 37 H 112 V 40 H 108 V 36 H 94 V 34 H 76 V 34 H 60 V 36 H 46 V 41 H 41 V 38 H 48 Z" fill="#ffffff" />
          <path d="M 44 48 H 70 V 52 H 76 V 84 H 70 V 88 H 62 V 84 H 42 V 88 H 34 V 84 H 30 V 58 H 34 V 52 H 44 Z" fill="#000000" />
          <path d="M 44 52 H 66 V 56 H 72 V 82 H 62 V 80 H 42 V 82 H 34 V 60 H 38 V 56 H 44 Z" fill="#ffffff" />
          <rect x="44" y="62" width="16" height="12" fill="#000000" />
          <rect x="47" y="64" width="10" height="8" fill="#ffffff" />
          <path d="M 92 48 H 120 V 54 H 124 V 64 H 114 V 58 H 100 V 54 H 94 V 78 H 100 V 82 H 116 V 78 H 124 V 86 H 118 V 90 H 92 V 86 H 84 V 80 H 80 V 58 H 84 V 52 H 92 Z" fill="#000000" />
          <path d="M 92 52 H 116 V 56 H 120 V 62 H 114 V 56 H 98 V 56 H 92 V 76 H 98 V 80 H 114 V 76 H 120 V 84 H 114 V 86 H 92 V 84 H 86 V 78 H 84 V 60 H 86 V 54 H 92 Z" fill="#ffffff" />
          <rect x="130" y="48" width="18" height="42" fill="#000000" />
          <rect x="134" y="52" width="10" height="34" fill="#ffffff" />
          <path d="M 158 48 H 174 V 56 H 182 V 48 H 198 V 56 H 206 V 86 H 202 V 90 H 188 V 86 H 188 V 64 H 182 V 86 H 178 V 90 H 168 V 86 H 168 V 64 H 164 V 86 H 160 V 90 H 152 V 86 H 152 V 54 H 158 Z" fill="#000000" />
          <path d="M 158 52 H 170 V 60 H 176 V 60 H 182 V 52 H 194 V 60 H 200 V 84 H 192 V 62 H 184 V 84 H 174 V 62 H 166 V 84 H 156 V 56 H 158 Z" fill="#ffffff" />
        </svg>
      </div>
      <div style="display: inline-block; padding: 4px 12px; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 99px; font-size: 10px; color: #34d399; font-weight: bold; margin-bottom: 8px;">
        🏟️ ESTÁDIO ACIM
      </div>
      <h1 class="pixel-font" style="color: #eab308; font-size: 19px; line-height: 1.5; margin-bottom: 8px;">
        ${theme.title}
      </h1>
      <p style="color: #34d399; font-weight: bold; margin-bottom: 12px; font-size: 13px;">
        ${theme.subtitle}
      </p>

      <!-- AVISO DE TENTATIVA ÚNICA -->
      <div style="display: inline-block; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 8px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">
        ⚠️ Tentativa única por colaborador! Concentre-se antes do chute.
      </div>

      <div style="background: #020617; border: 2px solid #1e293b; border-radius: 16px; padding: 14px; margin-bottom: 20px; text-align: left; font-size: 12px; line-height: 1.6; color: #cbd5e1;">
        <strong style="color: #eab308;">MECÂNICA DOS 4 CANTOS DO GOL:</strong><br>
        • Cada cobrança possui <strong>4 opções (A, B, C, D)</strong> associadas aos 4 cantos do gol.<br>
        • <strong>A:</strong> Superior Esquerdo | <strong>B:</strong> Superior Direito<br>
        • <strong>C:</strong> Inferior Esquerdo | <strong>D:</strong> Inferior Direito<br>
        • <strong>Acerto:</strong> o goleiro pula para outro canto e é <strong>GOOOOOOOL!</strong><br>
        • <strong>Erro:</strong> o goleiro se joga no mesmo canto e faz a <strong>DEFESA!</strong> (sem revelar a resposta certa).
      </div>

      <form id="start-form" style="max-width: 440px; margin: 0 auto; text-align: left;">
        <div style="margin-bottom: 12px;">
          <label style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">
            Nome do Colaborador *
          </label>
          <input type="text" id="player-name" required placeholder="Digite seu nome completo">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">
            E-mail Corporativo *
          </label>
          <input type="email" id="player-email" required placeholder="seu.email@empresa.com.br">
          <span style="display: block; font-size: 11px; color: #64748b; margin-top: 4px;">
            Permitida apenas 1 tentativa por e-mail nesta rodada.
          </span>
        </div>

        <div id="email-duplicate-alert" class="alert-box">
          ⚠️ Este e-mail já participou desta rodada! Lembre-se: é permitida apenas 1 tentativa por colaborador. Fique ligado nos próximos dias!
        </div>

        <button type="submit" class="btn-primary pixel-font" style="width: 100%; margin-top: 14px;">
          ⚽ ENTRAR EM CAMPO
        </button>
      </form>
    </div>

    <!-- 2. TELA DO JOGO (PÊNALTI 4 CANTOS) COM IDENTIDADE ACIM -->
    <div id="screen-game" class="screen">
      <!-- HUD Topo -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 8px 16px; background: #020617; border-radius: 12px; border: 1px solid #1e293b;">
        <div style="font-size: 12px; font-weight: bold; color: #cbd5e1;" id="hud-player">Jogador</div>
        <div style="font-size: 11px; font-weight: bold; color: #fbbf24;" id="hud-question-num">Pênalti 1/5</div>
        <div class="pixel-font" style="font-size: 11px; color: #34d399;" id="hud-score">GOLS: 0</div>
      </div>

      <!-- Enunciado -->
      <div style="background: #1e293b; padding: 12px; border-radius: 12px; text-align: center; margin-bottom: 10px; border: 1px solid #334155;">
        <h2 id="question-text" style="font-size: 15px; color: #ffffff; font-weight: 700;">
          Carregando pergunta...
        </h2>
      </div>

      <!-- Estádio 2D -->
      <div class="stadium-wrap">
        <div class="sky"></div>
        
        <!-- Torcida ACIM -->
        <div class="crowd" id="crowd-container"></div>
        <div class="pixel-font crowd-chant-bubble" id="crowd-chant">
          📢 VAI, ACIM!
        </div>
        <div class="pixel-font crowd-reaction-banner" id="crowd-reaction">
          GOOOOOOOL!
        </div>

        <div class="led-board">
          <span class="led-text">★ ESTÁDIO ACIM — FINAL DA COPA DO SGQ ★ VAI, ACIM! ★ TORCIDA DA QUALIDADE ★ É COPA DO SGQ! ★</span>
        </div>

        <div class="pitch-grass">
          <svg style="position: absolute; inset: 0; width: 100%; height: 100%;" viewBox="0 0 800 320" preserveAspectRatio="none">
            <line x1="120" y1="60" x2="680" y2="60" stroke="#ffffff" stroke-width="4" stroke-opacity="0.85" />
            <line x1="150" y1="60" x2="50" y2="320" stroke="#ffffff" stroke-width="3" stroke-opacity="0.65" />
            <line x1="650" y1="60" x2="750" y2="320" stroke="#ffffff" stroke-width="3" stroke-opacity="0.65" />
            <line x1="100" y1="280" x2="700" y2="280" stroke="#ffffff" stroke-width="3" stroke-opacity="0.65" />
            <circle cx="400" cy="265" r="6" fill="#ffffff" />
          </svg>
        </div>

        <!-- Gol & Traves -->
        <div class="goal-frame">
          <div class="goal-net"></div>
          <div class="crossbar"></div>
          <div class="post-left"></div>
          <div class="post-right"></div>
        </div>

        <!-- Goleiro Pixel Art com camisa #00be98, SGQ e Salto Fluido -->
        <div class="keeper-wrap" id="keeper-wrap">
          <div class="pixel-font keeper-taunt-bubble" id="keeper-taunt">
            VEM PRA CIMA!
          </div>
          <div class="keeper" id="keeper">
            <svg width="100" height="110" viewBox="0 0 110 120" fill="none">
              <ellipse cx="55" cy="115" rx="34" ry="7" fill="rgba(0,0,0,0.4)" />
              <rect x="42" y="8" width="26" height="12" fill="#292524" />
              <rect x="38" y="14" width="34" height="6" fill="#f59e0b" />
              <rect x="42" y="20" width="26" height="16" fill="#fbcfe8" />
              <rect x="44" y="24" width="4" height="4" fill="#18181b" />
              <rect x="62" y="24" width="4" height="4" fill="#18181b" />
              <rect x="52" y="32" width="6" height="2" fill="#be185d" />
              <!-- Camisa #00be98 com SGQ -->
              <rect x="36" y="40" width="38" height="30" fill="${keeperColor}" />
              <rect x="47" y="40" width="16" height="4" fill="#ffffff" />
              <text x="55" y="59" text-anchor="middle" fill="#022c22" font-size="8" font-weight="900" font-family="'Press Start 2P', monospace, sans-serif" letter-spacing="0.5">SGQ</text>
              <rect x="2" y="42" width="16" height="22" fill="#fbbf24" stroke="#78350f" stroke-width="2" />
              <rect x="92" y="42" width="16" height="22" fill="#fbbf24" stroke="#78350f" stroke-width="2" />
              <rect x="40" y="70" width="30" height="18" fill="#18181b" />
              <rect x="42" y="98" width="10" height="12" fill="#ffffff" />
              <rect x="58" y="98" width="10" height="12" fill="#ffffff" />
              <rect x="38" y="110" width="16" height="6" fill="#09090b" />
              <rect x="56" y="110" width="16" height="6" fill="#09090b" />
            </svg>
          </div>
        </div>

        <!-- Bola de Futebol com Voo Fluido -->
        <div class="ball" id="ball">
          <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
            <circle cx="22" cy="22" r="20" fill="#ffffff" stroke="#18181b" stroke-width="2" />
            <polygon points="22,12 28,16 26,23 18,23 16,16" fill="#18181b" />
            <polygon points="22,2 25,6 19,6" fill="#18181b" />
            <polygon points="38,16 41,20 37,25 33,21" fill="#18181b" />
            <polygon points="6,16 11,21 7,25 3,20" fill="#18181b" />
            <polygon points="15,36 22,32 29,36 26,42 18,42" fill="#18181b" />
            <line x1="22" y1="12" x2="22" y2="6" stroke="#18181b" stroke-width="1.5" />
            <line x1="28" y1="16" x2="33" y2="21" stroke="#18181b" strokeWidth="1.5" />
            <line x1="26" y1="23" x2="29" y2="36" stroke="#18181b" strokeWidth="1.5" />
            <line x1="18" y1="23" x2="15" y2="36" stroke="#18181b" strokeWidth="1.5" />
            <line x1="16" y1="16" x2="11" y2="21" stroke="#18181b" strokeWidth="1.5" />
          </svg>
        </div>

        <!-- 4 RESPOSTAS NOS 4 CANTOS -->
        <div class="corners-grid">
          <!-- Linha Superior: A e B -->
          <div class="corners-row">
            <button class="corner-btn" id="btn-A" onclick="chutar('A')">
              <span class="corner-badge">A</span>
              <span style="font-size: 10px; color: #fbbf24;">Sup. Esquerdo</span>
              <div id="text-A" style="font-size: 12px; font-weight: 600; margin-top: 3px;">Opção A</div>
            </button>
            <button class="corner-btn" id="btn-B" onclick="chutar('B')">
              <span class="corner-badge">B</span>
              <span style="font-size: 10px; color: #fbbf24;">Sup. Direito</span>
              <div id="text-B" style="font-size: 12px; font-weight: 600; margin-top: 3px;">Opção B</div>
            </button>
          </div>

          <!-- Linha Inferior: C e D -->
          <div class="corners-row corners-row-bottom">
            <button class="corner-btn" id="btn-C" onclick="chutar('C')">
              <span class="corner-badge">C</span>
              <span style="font-size: 10px; color: #fbbf24;">Inf. Esquerdo</span>
              <div id="text-C" style="font-size: 12px; font-weight: 600; margin-top: 3px;">Opção C</div>
            </button>
            <button class="corner-btn" id="btn-D" onclick="chutar('D')">
              <span class="corner-badge">D</span>
              <span style="font-size: 10px; color: #fbbf24;">Inf. Direito</span>
              <div id="text-D" style="font-size: 12px; font-weight: 600; margin-top: 3px;">Opção D</div>
            </button>
          </div>
        </div>

        <!-- Banner de Resultado -->
        <div class="result-banner" id="result-banner">
          <div style="background: #020617; border: 4px solid #eab308; border-radius: 16px; padding: 24px; text-align: center; max-width: 440px; box-shadow: 0 0 30px rgba(0,0,0,0.8);">
            <div class="pixel-font" id="result-title" style="font-size: 24px; margin-bottom: 10px;">
              GOOOOOL!
            </div>
            <p id="result-desc" style="font-size: 14px; color: #cbd5e1; margin-bottom: 8px;">
              Chute certeiro na rede!
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. TELA FINAL ATUALIZADA: Fim da Rodada! -->
    <div id="screen-end" class="screen text-center">
      <div id="medal-icon-box" style="font-size: 52px; margin-bottom: 12px;">⚽</div>
      <h2 class="pixel-font" style="color: #eab308; font-size: 22px; margin-bottom: 8px;">
        Fim da Rodada!
      </h2>
      <div id="final-badge" style="display: inline-block; padding: 6px 16px; background: rgba(234,179,8,0.1); border: 1px solid #eab308; border-radius: 99px; color: #fde047; font-weight: bold; margin-bottom: 12px;">
        Fique ligado nos próximos dias
      </div>
      <p id="final-message" style="font-size: 13px; color: #cbd5e1; max-width: 460px; margin: 0 auto 20px auto; line-height: 1.5;">
        Obrigado pela sua participação! Fique ligado nos próximos dias para as novas rodadas da Copa do SGQ!
      </p>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        <div style="background: #020617; padding: 14px; border-radius: 12px; border: 1px solid #1e293b;">
          <div style="font-size: 11px; color: #94a3b8;">GOLS MARCADOS</div>
          <div class="pixel-font" id="final-score" style="font-size: 20px; color: #34d399; margin-top: 6px;">0</div>
        </div>
        <div style="background: #020617; padding: 14px; border-radius: 12px; border: 1px solid #1e293b;">
          <div style="font-size: 11px; color: #94a3b8;">COBRANÇAS</div>
          <div class="pixel-font" id="final-total" style="font-size: 20px; color: #ffffff; margin-top: 6px;">5</div>
        </div>
        <div style="background: #020617; padding: 14px; border-radius: 12px; border: 1px solid #1e293b;">
          <div style="font-size: 11px; color: #94a3b8;">APROVEITAMENTO</div>
          <div class="pixel-font" id="final-percent" style="font-size: 20px; color: #fbbf24; margin-top: 6px;">0%</div>
        </div>
      </div>

      <div style="color: #64748b; font-size: 12px; margin-top: 8px;">
        Esta rodada foi gravada com sucesso. Fique ligado nos próximos dias!
      </div>
    </div>
  </div>

  <script>
    const PERGUNTAS = ${questionsJson};
    const WEBHOOK_URL = "${webhookUrl}";

    const PROVOCACOES = [
      'VEM PRA CIMA!',
      'ESSE EU PEGO!',
      'AQUI NÃO PASSA!',
      'DUVIDO ACERTAR!',
      'TÔ PRONTO!'
    ];

    const CANTOS_TORCIDA = [
      '📢 VAI, ACIM!',
      '📢 VAI, TORCIDA DA QUALIDADE!',
      '📢 É COPA DO SGQ!'
    ];

    let jogador = { nome: '', email: '' };
    let indiceAtual = 0;
    let pontuacao = 0;
    let historico = [];
    let bloqueado = false;
    let chantTimer = null;
    let tauntTimer = null;

    // Áudio Web Audio API
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    function getAudio() {
      if (!audioCtx && AudioContext) audioCtx = new AudioContext();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }
    function playTone(freq, duration, type = 'square') {
      try {
        const ctx = getAudio();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch(e) {}
    }
    function somApito() { playTone(2800, 0.25, 'triangle'); }
    function somChute() { playTone(120, 0.15, 'triangle'); }
    function somGol() {
      [261, 329, 392, 523].forEach((f, i) => {
        setTimeout(() => playTone(f, 0.2, 'square'), i * 80);
      });
    }
    function somDefesa() { playTone(140, 0.35, 'sawtooth'); }

    // Torcida
    const crowdBox = document.getElementById('crowd-container');
    const cores = ['#eab308', '#22c55e', '#3b82f6', '#ef4444', '#f8fafc'];
    for (let i = 0; i < 38; i++) {
      const fan = document.createElement('div');
      fan.className = 'fan';
      fan.style.backgroundColor = cores[i % cores.length];
      fan.style.animationDelay = (i * 0.04) + 's';
      crowdBox.appendChild(fan);
    }

    // Formulário com bloqueio de e-mail duplicado
    document.getElementById('start-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const n = document.getElementById('player-name').value.trim();
      const em = document.getElementById('player-email').value.trim().toLowerCase();
      const alertBox = document.getElementById('email-duplicate-alert');

      // Checa e-mails já jogados
      let jogados = [];
      try {
        jogados = JSON.parse(localStorage.getItem('copa_sgq_played_emails') || '[]');
      } catch(err) {}

      if (jogados.includes(em)) {
        alertBox.style.display = 'block';
        return;
      }

      alertBox.style.display = 'none';
      jogador.nome = n;
      jogador.email = em;
      somApito();
      iniciarJogo();
    });

    function mostrarTela(id) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(id).classList.add('active');
    }

    function iniciarJogo() {
      indiceAtual = 0;
      pontuacao = 0;
      historico = [];
      mostrarTela('screen-game');
      document.getElementById('hud-player').innerText = jogador.nome;
      iniciarLoopsProvocacao();
      carregarPergunta();
    }

    function iniciarLoopsProvocacao() {
      if (chantTimer) clearInterval(chantTimer);
      if (tauntTimer) clearInterval(tauntTimer);

      let chantIdx = 0;
      chantTimer = setInterval(() => {
        if (!bloqueado) {
          chantIdx = (chantIdx + 1) % CANTOS_TORCIDA.length;
          const chantElem = document.getElementById('crowd-chant');
          if (chantElem) {
            chantElem.style.opacity = '0';
            setTimeout(() => {
              chantElem.innerText = CANTOS_TORCIDA[chantIdx];
              chantElem.style.opacity = '1';
            }, 200);
          }
        }
      }, 2800);

      let tauntIdx = 0;
      tauntTimer = setInterval(() => {
        if (!bloqueado) {
          tauntIdx = (tauntIdx + 1) % PROVOCACOES.length;
          const tb = document.getElementById('keeper-taunt');
          if (tb) {
            tb.style.opacity = '0';
            setTimeout(() => {
              tb.innerText = PROVOCACOES[tauntIdx];
              tb.style.opacity = '1';
            }, 200);
          }
        }
      }, 2600);
    }

    function carregarPergunta() {
      bloqueado = false;
      const q = PERGUNTAS[indiceAtual];
      document.getElementById('hud-question-num').innerText = 'Pênalti ' + (indiceAtual + 1) + '/' + PERGUNTAS.length;
      document.getElementById('hud-score').innerText = 'GOLS: ' + pontuacao;
      document.getElementById('question-text').innerText = q.pergunta;

      ['A', 'B', 'C', 'D'].forEach(c => {
        document.getElementById('text-' + c).innerText = q.respostas[c];
        document.getElementById('btn-' + c).disabled = false;
      });

      const ball = document.getElementById('ball');
      const keeperWrap = document.getElementById('keeper-wrap');
      const taunt = document.getElementById('keeper-taunt');
      const crowdReaction = document.getElementById('crowd-reaction');
      crowdBox.classList.remove('celebrating');
      crowdReaction.className = 'pixel-font crowd-reaction-banner';

      ball.className = 'ball';
      keeperWrap.className = 'keeper-wrap';
      if (taunt) taunt.style.opacity = '1';
      document.getElementById('result-banner').classList.remove('active');
    }

    function chutar(cantoEscolhido) {
      if (bloqueado) return;
      bloqueado = true;
      ['A', 'B', 'C', 'D'].forEach(c => {
        document.getElementById('btn-' + c).disabled = true;
      });
      somChute();

      const taunt = document.getElementById('keeper-taunt');
      if (taunt) taunt.style.opacity = '0';

      const q = PERGUNTAS[indiceAtual];
      const acertou = (cantoEscolhido === q.correta);
      const ball = document.getElementById('ball');
      const keeperWrap = document.getElementById('keeper-wrap');
      const crowdReaction = document.getElementById('crowd-reaction');

      let cantoGoleiro = '';
      if (!acertou) {
        // REGRA: Errou -> Goleiro pula no MESMO canto e defende!
        cantoGoleiro = cantoEscolhido;
        ball.className = 'ball fly-' + cantoEscolhido;
        keeperWrap.className = 'keeper-wrap dive-' + cantoGoleiro;
        setTimeout(() => {
          somDefesa();
          crowdReaction.className = 'pixel-font crowd-reaction-banner active-save';
          crowdReaction.innerText = '🧤 AAAAH! O GOLEIRO ESPALMOU!';
          mostrarResultado(false);
        }, 650);
      } else {
        // REGRA: Acertou -> Goleiro pula em um dos outros 3 cantos errados!
        const outrosCantos = ['A', 'B', 'C', 'D'].filter(c => c !== q.correta);
        cantoGoleiro = outrosCantos[Math.floor(Math.random() * outrosCantos.length)];
        ball.className = 'ball fly-' + cantoEscolhido;
        keeperWrap.className = 'keeper-wrap dive-' + cantoGoleiro;
        pontuacao++;
        setTimeout(() => {
          somGol();
          crowdBox.classList.add('celebrating');
          crowdReaction.className = 'pixel-font crowd-reaction-banner active-goal';
          crowdReaction.innerText = '🎉 GOOOOOOOL! A TORCIDA DA ACIM COMEMORA!';
          mostrarResultado(true);
        }, 650);
      }

      historico.push({
        pergunta: q.pergunta,
        acertou: acertou,
        canto: cantoEscolhido
      });
    }

    // REGRA: NUNCA revelar a resposta correta em caso de erro!
    function mostrarResultado(acertou) {
      const banner = document.getElementById('result-banner');
      const title = document.getElementById('result-title');
      const desc = document.getElementById('result-desc');

      if (acertou) {
        title.innerText = 'GOOOOOOOL! ⚽';
        title.style.color = '#34d399';
        desc.innerText = 'Chute certeiro na rede! O goleiro caiu para outro canto!';
      } else {
        title.innerText = 'DEFESA! 🧤';
        title.style.color = '#f43f5e';
        desc.innerText = 'O goleiro pegou essa!';
      }
      banner.classList.add('active');

      setTimeout(() => {
        indiceAtual++;
        if (indiceAtual < PERGUNTAS.length) {
          carregarPergunta();
        } else {
          finalizarJogo();
        }
      }, 2200);
    }

    function finalizarJogo() {
      if (chantTimer) clearInterval(chantTimer);
      if (tauntTimer) clearInterval(tauntTimer);

      // Salva email na lista de jogados
      if (jogador.email) {
        try {
          let jogados = JSON.parse(localStorage.getItem('copa_sgq_played_emails') || '[]');
          if (!jogados.includes(jogador.email)) {
            jogados.push(jogador.email);
            localStorage.setItem('copa_sgq_played_emails', JSON.stringify(jogados));
          }
        } catch(e) {}
      }

      mostrarTela('screen-end');
      const pct = Math.round((pontuacao / PERGUNTAS.length) * 100);
      document.getElementById('final-score').innerText = pontuacao;
      document.getElementById('final-total').innerText = PERGUNTAS.length;
      document.getElementById('final-percent').innerText = pct + '%';

      const iconBox = document.getElementById('medal-icon-box');
      const badge = document.getElementById('final-badge');
      const msg = document.getElementById('final-message');

      // REGRA: Medalha de ouro para 5, prata para 4, bronze para 3 e nada a mais para < 3!
      let medalhaNome = 'Sem medalha';
      if (pontuacao === 5) {
        iconBox.innerText = '🥇';
        badge.innerText = '🥇 MEDALHA DE OURO (5 GOLS)';
        msg.innerText = 'Desempenho perfeito! 5 gols em 5 cobranças na Copa do SGQ da ACIM!';
        medalhaNome = 'Medalha de Ouro';
      } else if (pontuacao === 4) {
        iconBox.innerText = '🥈';
        badge.innerText = '🥈 MEDALHA DE PRATA (4 GOLS)';
        msg.innerText = 'Excelente pontaria! 4 gols marcados com categoria!';
        medalhaNome = 'Medalha de Prata';
      } else if (pontuacao === 3) {
        iconBox.innerText = '🥉';
        badge.innerText = '🥉 MEDALHA DE BRONZE (3 GOLS)';
        msg.innerText = 'Bom desempenho! 3 gols marcados nas cobranças!';
        medalhaNome = 'Medalha de Bronze';
      } else {
        iconBox.innerText = '⚽';
        badge.innerText = 'Fique ligado nos próximos dias';
        msg.innerText = 'Obrigado pela sua participação! Fique ligado nos próximos dias para as novas rodadas da Copa do SGQ!';
      }

      // Envio silencioso em segundo plano para o Google Sheets
      if (WEBHOOK_URL && WEBHOOK_URL.startsWith('http')) {
        fetch(WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            timestamp: new Date().toLocaleString('pt-BR'),
            nome: jogador.nome,
            name: jogador.nome,
            email: jogador.email || '-',
            gols: pontuacao,
            score: pontuacao,
            total: PERGUNTAS.length,
            totalQuestions: PERGUNTAS.length,
            aproveitamento: pct + '%',
            percentage: pct + '%',
            medalha: medalhaNome,
            answers: historico.map((h, i) => 'P' + (i+1) + ': [' + h.canto + '] ' + (h.acertou ? 'Gol' : 'Defesa')).join(' | ')
          })
        }).catch(e => console.log('Envio silencioso:', e));
      }
    }
  </script>
</body>
</html>`;
}
