import React, { useState, useEffect } from 'react';
import { Question, GameTheme, PlayerInfo, GameAnswerRecord, Corner } from '../types';
import { storageService } from '../services/storageService';
import { StadiumField } from '../components/StadiumField';
import { ScoreBoard } from '../components/ScoreBoard';
import { StartScreen } from '../components/StartScreen';
import { EndScreen } from '../components/EndScreen';
import { GoogleSitesGuideModal } from '../components/GoogleSitesGuideModal';
import { sounds } from '../sound';
import { Volume2, VolumeX, ShieldAlert } from 'lucide-react';

interface GamePageProps {
  onNavigateToAdmin?: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onNavigateToAdmin }) => {
  // Questions and Theme loaded dynamically from storageService
  const [questions, setQuestions] = useState<Question[]>(() => storageService.getActiveQuestions());
  const [theme, setTheme] = useState<GameTheme>(() => storageService.getTheme());
  const [webhookUrl, setWebhookUrl] = useState<string>(() => storageService.getWebhookUrl());

  // Listen to storage changes so if admin updates, player receives it
  useEffect(() => {
    return storageService.subscribe(() => {
      setQuestions(storageService.getActiveQuestions());
      setTheme(storageService.getTheme());
      setWebhookUrl(storageService.getWebhookUrl());
    });
  }, []);

  // Game Flow State
  const [phase, setPhase] = useState<'START' | 'AIMING' | 'SHOOTING' | 'RESULT_REVEAL' | 'GAME_OVER'>('START');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedCorner, setSelectedCorner] = useState<Corner | null>(null);
  const [records, setRecords] = useState<GameAnswerRecord[]>([]);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo>({ name: '', email: '' });
  const [isMuted, setIsMuted] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Result of current kick
  const [currentResult, setCurrentResult] = useState<{
    isCorrect: boolean;
    ballCorner: Corner;
    keeperCorner: Corner;
  } | null>(null);

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
    setPhase('AIMING');
  };

  // Restart match
  const handleRestart = () => {
    handleStartGame();
  };

  // When participant clicks one of the 4 corners (A, B, C, D)
  const handleSelectCorner = (corner: Corner) => {
    if (phase !== 'AIMING' || questions.length === 0) return;

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
      setRecords((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id || `q-${currentIndex}`,
          pergunta: currentQuestion.pergunta,
          userChoice: corner,
          userText: currentQuestion.respostas[corner],
          correctChoice: currentQuestion.correta,
          correctText: currentQuestion.respostas[currentQuestion.correta],
          isCorrect,
        },
      ]);

      // Pause briefly then advance to next question or game over
      setTimeout(() => {
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex((prev) => prev + 1);
          setSelectedCorner(null);
          setCurrentResult(null);
          setPhase('AIMING');
        } else {
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

          {/* Action: Som Mudo/Ativo */}
          <div className="flex items-center gap-3">
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

      {/* 2. MAIN ARENA CONTENT */}
      <main className="flex-1 flex flex-col justify-center items-center px-3 sm:px-6 py-4 w-full max-w-6xl mx-auto">
        {questions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center max-w-md">
            <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h2 className="text-base font-bold text-white mb-2">Nenhuma pergunta ativa encontrada</h2>
            <p className="text-xs text-slate-400 mb-4">
              Ative ou cadastre perguntas no painel administrativo para iniciar o jogo.
            </p>
            {onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                Acessar Administração
              </button>
            )}
          </div>
        ) : (
          <>
            {phase === 'START' && (
              <StartScreen
                theme={theme}
                playerInfo={playerInfo}
                onUpdatePlayer={setPlayerInfo}
                onStartGame={handleStartGame}
                totalQuestions={questions.length}
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
                  onRestart={() => setPhase('START')}
                  onOpenGuide={() => setIsGuideOpen(true)}
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
                onRestart={handleRestart}
              />
            )}
          </>
        )}
      </main>

      {/* 3. SUBTLE FOOTER */}
      <footer className="w-full border-t border-slate-800/80 py-3 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>{theme.title} · Pênalti dos 4 Cantos do Gol</span>
          <div className="flex items-center gap-3">
            <span>Google Sites & Google Sheets Ready</span>
            {onNavigateToAdmin && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  onClick={onNavigateToAdmin}
                  className="text-slate-600 hover:text-slate-400 transition-colors cursor-pointer text-[11px]"
                  title="Acesso dos organizadores"
                >
                  Área do Gestor
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Guia Modal */}
      <GoogleSitesGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        appUrl={typeof window !== 'undefined' ? window.location.href : ''}
        questions={questions}
        theme={theme}
        webhookUrl={webhookUrl}
      />
    </div>
  );
};
