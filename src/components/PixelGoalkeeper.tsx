import React, { useState, useEffect } from 'react';
import { Corner } from '../types';

export type GoalkeeperState = 'idle' | Corner;

interface PixelGoalkeeperProps {
  state: GoalkeeperState;
  jerseyColor?: string;
  isSaving?: boolean;
}

const TAUNT_PHRASES = [
  'VEM PRA CIMA!',
  'ESSE EU PEGO!',
  'AQUI NÃO PASSA!',
  'DUVIDO ACERTAR!',
  'TÔ PRONTO!',
  'CHUTA FORTE!'
];

export const PixelGoalkeeper: React.FC<PixelGoalkeeperProps> = ({
  state,
  jerseyColor = '#00be98',
}) => {
  const [tauntIndex, setTauntIndex] = useState<number>(0);
  const [showTaunt, setShowTaunt] = useState<boolean>(true);
  const [sway, setSway] = useState<number>(0);

  // Subtle breathing and gentle glove movement while in idle
  useEffect(() => {
    if (state !== 'idle') {
      setShowTaunt(false);
      return;
    }

    setShowTaunt(true);
    const phraseInterval = setInterval(() => {
      setTauntIndex((prev) => (prev + 1) % TAUNT_PHRASES.length);
    }, 3000);

    const swayInterval = setInterval(() => {
      setSway((prev) => (prev === 0 ? 1 : 0));
    }, 900);

    return () => {
      clearInterval(phraseInterval);
      clearInterval(swayInterval);
    };
  }, [state]);

  // Hardware-accelerated smooth dive trajectories calculated from goal center
  const getDiveTransform = () => {
    switch (state) {
      case 'A': // Canto Superior Esquerdo
        return 'translate(-145px, -36px) rotate(-32deg) scale(1.02)';
      case 'B': // Canto Superior Direito
        return 'translate(145px, -36px) rotate(32deg) scale(1.02)';
      case 'C': // Canto Inferior Esquerdo
        return 'translate(-155px, 34px) rotate(-52deg) scale(0.96)';
      case 'D': // Canto Inferior Direito
        return 'translate(155px, 34px) rotate(52deg) scale(0.96)';
      case 'idle':
      default:
        return 'translate(0px, 0px) rotate(0deg) scale(1)';
    }
  };

  // Glove extension during dive or subtle breathing
  let gloveLeftTransform = 'translate(0px, 0px)';
  let gloveRightTransform = 'translate(0px, 0px)';

  if (state === 'idle') {
    if (sway === 1) {
      gloveLeftTransform = 'translate(0px, -2px)';
      gloveRightTransform = 'translate(0px, -2px)';
    }
  } else if (state === 'A' || state === 'C') {
    // Reaching leftwards
    gloveLeftTransform = 'translate(-6px, -4px) scale(1.08)';
    gloveRightTransform = 'translate(-3px, -2px)';
  } else if (state === 'B' || state === 'D') {
    // Reaching rightwards
    gloveLeftTransform = 'translate(3px, -2px)';
    gloveRightTransform = 'translate(6px, -4px) scale(1.08)';
  }

  return (
    <div
      className="relative z-20 flex flex-col items-center pointer-events-none select-none"
      style={{
        transform: getDiveTransform(),
        transition: 'transform 0.65s cubic-bezier(0.2, 0.8, 0.25, 1)',
        willChange: 'transform',
        imageRendering: 'pixelated',
      }}
    >
      {/* 1. Balão de Provocação com transição suave */}
      <div
        className={`absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-400 text-slate-950 font-['Press_Start_2P'] text-[8px] sm:text-[9px] px-2.5 py-1 rounded-md shadow-lg border-2 border-slate-950 z-30 transition-all duration-300 ${
          state === 'idle' && showTaunt ? 'opacity-100 scale-100 -translate-y-1' : 'opacity-0 scale-90 translate-y-2 pointer-events-none'
        }`}
      >
        {TAUNT_PHRASES[tauntIndex]}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-amber-400" />
      </div>

      {/* 2. Goalkeeper Sprite SVG in pure pixel geometry */}
      <svg
        width="110"
        height="120"
        viewBox="0 0 110 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_8px_4px_rgba(0,0,0,0.5)]"
      >
        {/* Shadow on pitch under feet */}
        <ellipse cx="55" cy="115" rx="34" ry="7" fill="rgba(0,0,0,0.4)" />

        {/* Headband / Hair */}
        <rect x="42" y="8" width="26" height="12" fill="#292524" />
        <rect x="38" y="14" width="34" height="6" fill="#f59e0b" />

        {/* Face */}
        <rect x="42" y="20" width="26" height="16" fill="#fbcfe8" />
        <rect x="44" y="24" width="4" height="4" fill="#18181b" />
        <rect x="62" y="24" width="4" height="4" fill="#18181b" />
        <rect x="52" y="32" width="6" height="2" fill="#be185d" />

        {/* Neck */}
        <rect x="50" y="36" width="10" height="4" fill="#f472b6" />

        {/* Jersey Torso (#00be98) */}
        <rect x="36" y="40" width="38" height="30" fill={jerseyColor} />
        {/* Collar accent */}
        <rect x="47" y="40" width="16" height="4" fill="#ffffff" />
        {/* "SGQ" on goalkeeper chest */}
        <text
          x="55"
          y="59"
          textAnchor="middle"
          fill="#022c22"
          fontSize="8"
          fontWeight="900"
          fontFamily="'Press Start 2P', monospace, sans-serif"
          letterSpacing="0.5"
        >
          SGQ
        </text>

        {/* Arms & Massive Goalkeeper Gloves with fluid reach */}
        {/* Left Arm & Glove */}
        <g
          style={{
            transform: gloveLeftTransform,
            transition: 'transform 0.45s ease-out',
            transformOrigin: '30px 45px',
          }}
        >
          <rect x="22" y="42" width="14" height="12" fill={jerseyColor} />
          <rect x="14" y="46" width="10" height="14" fill="#f472b6" />
          <rect x="2" y="42" width="16" height="22" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
          <rect x="4" y="44" width="12" height="6" fill="#ffffff" />
          <rect x="5" y="52" width="3" height="8" fill="#78350f" />
          <rect x="11" y="52" width="3" height="8" fill="#78350f" />
        </g>

        {/* Right Arm & Glove */}
        <g
          style={{
            transform: gloveRightTransform,
            transition: 'transform 0.45s ease-out',
            transformOrigin: '80px 45px',
          }}
        >
          <rect x="74" y="42" width="14" height="12" fill={jerseyColor} />
          <rect x="86" y="46" width="10" height="14" fill="#f472b6" />
          <rect x="92" y="42" width="16" height="22" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
          <rect x="94" y="44" width="12" height="6" fill="#ffffff" />
          <rect x="96" y="52" width="3" height="8" fill="#78350f" />
          <rect x="102" y="52" width="3" height="8" fill="#78350f" />
        </g>

        {/* Shorts */}
        <rect x="40" y="70" width="30" height="18" fill="#18181b" />
        <rect x="53" y="76" width="4" height="12" fill="#09090b" />

        {/* Legs / Skin */}
        <rect x="43" y="88" width="8" height="10" fill="#fbcfe8" />
        <rect x="59" y="88" width="8" height="10" fill="#fbcfe8" />

        {/* Socks */}
        <rect x="42" y="98" width="10" height="12" fill="#ffffff" />
        <rect x="42" y="99" width="10" height="3" fill={jerseyColor} />
        <rect x="58" y="98" width="10" height="12" fill="#ffffff" />
        <rect x="58" y="99" width="10" height="3" fill={jerseyColor} />

        {/* Cleats / Boots */}
        <rect x="38" y="110" width="16" height="6" fill="#09090b" />
        <rect x="56" y="110" width="16" height="6" fill="#09090b" />
        <rect x="40" y="115" width="4" height="2" fill="#e4e4e7" />
        <rect x="48" y="115" width="4" height="2" fill="#e4e4e7" />
        <rect x="58" y="115" width="4" height="2" fill="#e4e4e7" />
        <rect x="66" y="115" width="4" height="2" fill="#e4e4e7" />
      </svg>
    </div>
  );
};
