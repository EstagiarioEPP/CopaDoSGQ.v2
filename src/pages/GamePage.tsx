import React, { useState, useEffect, useRef } from 'react';
import { Question, GameTheme, PlayerInfo, GameAnswerRecord, Corner, GamePhase, TestModeConfig } from '../types';
import { storageService } from '../services/storageService';
import { StadiumField } from '../components/StadiumField';
import { ScoreBoard } from '../components/ScoreBoard';
import { StartScreen } from '../components/StartScreen';
import { EndScreen } from '../components/EndScreen';
import { EliminatedScreen } from '../components/EliminatedScreen';
import { TimerWarningModal } from '../components/TimerWarningModal';
import { sounds } from '../sound';
import { Volume2, VolumeX, ShieldAlert, ArrowLeft, FlaskConical } from 'lucide-react';

import {
  getSaoPauloDateString,
  getQuestionsForDate,
  isTimedKnockoutDay,
} from '../competition/competitionEngine';

interface GamePageProps {
  testMode?: TestModeConfig | null;
  onExitTestMode?: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({ testMode, onExitTestMode }) => {
  const isTestMode = Boolean(testMode?.active);
  const today =
    isTestMode && testMode?.simulatedDate ? testMode.simulatedDate : getSaoPauloDateString();
  const isTimedRound = isTimedKnockoutDay(today);

  // Carrega as 5 perguntas correspondentes ao dia ativo (ou dia simulado no Modo Teste)
  const [questions, setQuestions] = useState<Question[]>(() => {
    const daily = getQuestionsForDate(today);
    return daily.length > 0 ? daily : storageService.getActiveQuestions();
  });
  const [theme, setTheme] = useState<GameTheme>(() => storageService.getTheme());
  const [webhookUrl, setWebhookUrl] = useState<string>(() => storageService.getWebhookUrl());

  // Atualiza perguntas ao alterar data simulada no Modo Teste ou alterações no storage
  useEffect(() => {
    const daily = getQuestionsForDate(today);
    setQuestions(daily.length > 0 ? daily : storageService.getActiveQuestions());
  }, [today]);

  // Listen to storage changes so if admin updates, player receives it
  useEffect(() => {
    return storageService.subscribe(() => {
      const updatedDaily = getQuestionsForDate(today);
      setQuestions(updatedDaily.length > 0 ? updatedDaily : storageService.getActiveQuestions());
      setTheme(storageService.getTheme());
      setWebhookUrl(storageService.getWebhookUrl());
    });
  }, [today]);

  // Retomada automática de tentativa em andamento no mesmo dia (apenas modo oficial)
  useEffect(() => {
    if (isTestMode) return;
    const inProg = storageService.getInProgressAttempt();
    if (inProg && inProg.date === today && inProg.email) {
      setPlayerInfo({ name: inProg.name, email: inProg.email });
      setCurrentIndex(inProg.currentIndex || 0);
      setScore(inProg.score || 0);
      setRecords(inProg.records || []);
      setPhase('AIMING');
    }
  }, [today, isTestMode]);

  // Game Flow State
  const [phase, setPhase] = useState<GamePhase>('START');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedCorner, setSelectedCorner] = useState<Corner | null>(null);
  const [records, setRecords] = useState<GameAnswerRecord[]>([]);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo>({ name: '', email: '' });
  const [eliminatedInfo, setEliminatedInfo] = useState<{
    name: string;
    email: string;
    eliminatedDate?: string;
  } | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Cronômetro em décimos de segundo (Dia 17)
  const questionStartTimeRef = useRef<number | null>(null);
  const [currentQuestionTenths, setCurrentQuestionTenths] = useState<number>(0);
  const totalTimeTenths = records.reduce((acc, r) => acc + (r.responseTimeTenths || 0), 0);

  // Result of current kick
  const [currentResult, setCurrentResult] = useState<{
    isCorrect: boolean;
    ballCorner: Corner;
    keeperCorner: Corner;
  } | null>(null);

  // Cronômetro em décimos de segundo e áudio tic-tac exclusivamente durante AIMING na rodada cronometrada
  useEffect(() => {
    if (phase !== 'AIMING' || !isTimedRound) {
      sounds.stopTickTock();
      return;
    }

    const startTime = Date.now();
    questionStartTimeRef.current = startTime;
    setCurrentQuestionTenths(0);
    sounds.startTickTock();

    const intervalId = window.setInterval(() => {
      if (questionStartTimeRef.current !== null) {
        const elapsedTenths = Math.round(((Date.now() - questionStartTimeRef.current) / 1000) * 10) / 10;
        setCurrentQuestionTenths(elapsedTenths);
      }
    }, 100);

    return () => {
      window.clearInterval(intervalId);
      sounds.stopTickTock();
    };
  }, [phase, currentIndex, isTimedRound]);

  // Sound toggle
  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Start the match
  const handleStartGame = () => {
    setCurrentIndex(0);
    setScore(0);
    setRecords([]);
    setSelectedCorner(null);
    setCurrentResult(null);
    setCurrentQuestionTenths(0);
    questionStartTimeRef.current = null;
    if (isTimedRound) {
      setPhase('TIMER_WARNING');
    } else {
      setPhase('AIMING');
    }
  };

  // Confirm pre-round timed warning modal (Dia 17)
  const handleConfirmTimedStart = () => {
    sounds.playWhistle();
    setPhase('AIMING');
  };

  // When participant clicks one of the 4 corners (A, B, C, D)
  const handleSelectCorner = (corner: Corner) => {
    if (phase !== 'AIMING' || questions.length === 0) return;

    // Trava e calcula imediatamente o tempo da pergunta em décimos de segundo antes das animações
    let questionTenths: number | undefined;
    if (isTimedRound) {
      sounds.stopTickTock();
      const elapsed = questionStartTimeRef.current
        ? Math.round(((Date.now() - questionStartTimeRef.current) / 1000) * 10) / 10
        : currentQuestionTenths;
      questionTenths = elapsed;
      questionStartTimeRef.current = null;
      setCurrentQuestionTenths(elapsed);
      sounds.playCoachWhistle();
    }

    const currentQuestion = questions[currentIndex];
    const isCorrect = corner === currentQuestion.correta;

    // LÓGICA DO GOLEIRO:
    // 1. Participante escolhe resposta ERRADA:
    //    - Bola vai para o canto escolhido
    //    - Goleiro se joga exatamente para o MESMO canto escolhido e defende!
    //    - Resultado: DEFESA!
    // 2. Participante escolhe resposta CORRETA:
    //    - Bola vai para o canto correto escolhido
    //    - Goleiro se joga para um dos 3 cantos ERRADOS (escolhido aleatoriamente)!
    //    - Resultado: GOOOOOOOL!
    let keeperCorner: Corner;
    if (!isCorrect) {
      keeperCorner = corner;
    } else {
      const allCorners: Corner[] = ['A', 'B', 'C', 'D'];
      const wrongCorners = allCorners.filter((c) => c !== currentQuestion.correta);
      keeperCorner = wrongCorners[Math.floor(Math.random() * wrongCorners.length)];
    }

    setSelectedCorner(corner);
    setCurrentResult({
      isCorrect,
      ballCorner: corner,
      keeperCorner,
    });
    setPhase('SHOOTING');
    sounds.playKick();

    // After kick animation (~650ms), resolve and trigger sound & banner
    setTimeout(() => {
      if (isCorrect) {
        setScore((prev) => prev + 1);
        sounds.playGoal();
      } else {
        sounds.playSave();
      }
      setPhase('RESULT_REVEAL');

      // Record answer history
      const newRecord: GameAnswerRecord = {
        questionId: currentQuestion.id || `q-${currentIndex}`,
        pergunta: currentQuestion.pergunta,
        userChoice: corner,
        userText: currentQuestion.respostas[corner],
        correctChoice: currentQuestion.correta,
        correctText: currentQuestion.respostas[currentQuestion.correta],
        isCorrect,
        ...(questionTenths !== undefined ? { responseTimeTenths: questionTenths } : {}),
      };

      setRecords((prev) => {
        const updated = [...prev, newRecord];
        // Grava tentativa em andamento para retomada sem perda em caso de refresh (apenas modo oficial)
        if (!isTestMode) {
          storageService.saveInProgressAttempt({
            email: playerInfo.email,
            name: playerInfo.name,
            date: today,
            currentIndex: currentIndex + 1,
            score: isCorrect ? score + 1 : score,
            records: updated,
          });
        }
        return updated;
      });

      // Pause briefly then advance to next question or game over
      setTimeout(() => {
        // Hooks estruturais para mecânicas futuras do mata-mata:
        // - Dia 18/11/2026 ('VAR_REVIEW'): acionar revisão por texto / VAR antes da próxima etapa.
        // - Dia 19/11/2026 ('GOLDEN_KICK'): acionar cobrança decisiva de cenário aberto.
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex((prev) => prev + 1);
          setSelectedCorner(null);
          setCurrentResult(null);
          setPhase('AIMING');
        } else {
          if (!isTestMode) {
            storageService.clearInProgressAttempt();
          }
          setPhase('GAME_OVER');
          sounds.playWhistle();
        }
      }, 2600);
    }, 650);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* 1. TOP BAR DO JOGADOR: Limpa, focada no jogo, sem expor a administração */}
      <header className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Wordmark */}
          <div className="flex items-center gap-2.5">
            <span className="font-['Press_Start_2P'] text-xs sm:text-sm text-amber-400 tracking-wider">
              {theme.title}
            </span>
          </div>

          {/* Action: Som Mudo/Ativo e saída do Modo Teste */}
          <div className="flex items-center gap-3">
            {isTestMode && onExitTestMode && (
              <button
                type="button"
                onClick={() => {
                  sounds.stopTickTock();
                  onExitTestMode();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Painel</span>
              </button>
            )}

            <button
              onClick={handleToggleMute}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title={isMuted ? 'Ativar som' : 'Desativar som'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span className="hidden sm:inline">{isMuted ? 'Mudo' : 'Som 8-Bit'}</span>
            </button>
          </div>
        </div>
      </header>

      {isTestMode && (
        <div className="w-full bg-amber-950/70 border-b border-amber-500/40 px-4 py-2 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong>Modo Teste Admin</strong> · Rodada simulada: <span className="font-mono font-bold">{today.split('-').reverse().join('/')}</span> · Gravação na planilha desativada
          </span>
        </div>
      )}

      {/* 2. MAIN ARENA CONTENT */}
      <main className="flex-1 flex flex-col justify-center items-center px-3 sm:px-6 py-4 w-full max-w-6xl mx-auto">
        {questions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center max-w-md">
            <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h2 className="text-base font-bold text-white mb-2">Aguardando início da rodada</h2>
            <p className="text-xs text-slate-400">
              As perguntas da rodada estão sendo preparadas pela organização. Em breve o jogo estará disponível!
            </p>
          </div>
        ) : (
          <>
            {phase === 'START' && (
              <StartScreen
                theme={theme}
                playerInfo={playerInfo}
                onUpdatePlayer={setPlayerInfo}
                onStartGame={handleStartGame}
                onEliminated={(info) => {
                  setEliminatedInfo(info);
                  setPhase('ELIMINATED');
                }}
                totalQuestions={questions.length}
                testMode={testMode}
              />
            )}

            {phase === 'ELIMINATED' && (
              <EliminatedScreen
                playerName={eliminatedInfo?.name || playerInfo.name}
                playerEmail={eliminatedInfo?.email || playerInfo.email}
                eliminatedDate={eliminatedInfo?.eliminatedDate}
                onBackToStart={() => setPhase('START')}
              />
            )}

            {phase === 'TIMER_WARNING' && (
              <TimerWarningModal
                playerName={playerInfo.name}
                totalQuestions={questions.length}
                onConfirmStart={handleConfirmTimedStart}
              />
            )}

            {(phase === 'AIMING' || phase === 'SHOOTING' || phase === 'RESULT_REVEAL') && (
              <div className="w-full flex flex-col items-center">
                {/* Scoreboard HUD */}
                <ScoreBoard
                  currentIndex={currentIndex}
                  totalQuestions={questions.length}
                  score={score}
                  records={records}
                  playerName={playerInfo.name}
                  theme={theme}
                  isMuted={isMuted}
                  onToggleMute={handleToggleMute}
                  isTimedRound={isTimedRound}
                  currentQuestionTenths={currentQuestionTenths}
                  totalTimeTenths={totalTimeTenths}
                />

                {/* Stadium Pitch, Goalkeeper, Ball and 4 Corners */}
                <StadiumField
                  question={questions[currentIndex]}
                  theme={theme}
                  phase={phase}
                  selectedCorner={selectedCorner}
                  onSelectCorner={handleSelectCorner}
                  result={currentResult}
                />
              </div>
            )}

            {phase === 'GAME_OVER' && (
              <EndScreen
                score={score}
                totalQuestions={questions.length}
                records={records}
                playerInfo={playerInfo}
                theme={theme}
                webhookUrl={webhookUrl}
                isTimedRound={isTimedRound}
                isTestMode={isTestMode}
                effectiveDate={today}
                onExitTestMode={onExitTestMode}
              />
            )}
          </>
        )}
      </main>

      {/* 3. SUBTLE FOOTER */}
      <footer className="w-full border-t border-slate-800/80 py-3 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <span>{theme.title} · Pênalti dos 4 Cantos do Gol</span>
          <span className="text-[11px] font-mono text-slate-500">Copa SGQ ACIM</span>
        </div>
      </footer>
    </div>
  );
};
