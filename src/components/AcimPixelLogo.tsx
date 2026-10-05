import React from 'react';

interface AcimPixelLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Logo ACIM oficial em Pixel Art Retrô (fiel à imagem de referência enviada pelo usuário).
 * - Fundo 100% transparente
 * - Cores fiéis: Onda superior verde-petróleo (#00a89d), Onda inferior verde-limão (#7ec832)
 * - Letras "acim" em estilo pixel art arredondado com preenchimento branco e contorno preto
 * - Arco estilizado sobre a letra 'a'
 * - Renderização 'crispEdges' para manter as bordas dos pixels perfeitamente nítidas
 */
export const AcimPixelLogo: React.FC<AcimPixelLogoProps> = ({
  className = '',
  width = 220,
  height = 92,
}) => {
  return (
    <svg
      viewBox="0 0 240 100"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      style={{
        imageRendering: 'pixelated',
        shapeRendering: 'crispEdges',
      }}
      aria-label="Logo ACIM Pixel Art Retrô"
    >
      {/* ========================================================
          1. ONDA SUPERIOR (VERDE-PETRÓLEO / TEAL)
         ======================================================== */}
      {/* Contorno Preto da Onda Superior */}
      <path
        d="
          M 98 12
          H 130 V 16 H 150 V 20 H 160 V 24 H 190 V 20 H 204 V 16 H 212 V 12 H 220 V 22
          H 214 V 26 H 206 V 30 H 194 V 34 H 180 V 30 H 162 V 26 H 142 V 22 H 122 V 18
          H 98 Z
          M 80 16 H 98 V 20 H 80 Z
          M 74 20 H 82 V 24 H 74 Z
          M 66 24 H 76 V 28 H 66 Z
        "
        fill="#000000"
      />
      {/* Preenchimento Verde-Petróleo (#00A89D) */}
      <path
        d="
          M 98 15
          H 128 V 19 H 148 V 23 H 158 V 24 H 188 V 23 H 202 V 19 H 210 V 15 H 216 V 19
          H 212 V 23 H 204 V 27 H 192 V 31 H 178 V 27 H 160 V 23 H 140 V 19 H 120 V 15
          H 98 Z
          M 82 19 H 98 V 23 H 82 Z
          M 76 23 H 84 V 27 H 76 Z
          M 68 25 H 78 V 28 H 68 Z
        "
        fill="#00A89D"
      />

      {/* ========================================================
          2. ONDA INFERIOR (VERDE-LIMÃO / LIME GREEN)
         ======================================================== */}
      {/* Contorno Preto da Onda Inferior */}
      <path
        d="
          M 68 26
          H 98 V 30 H 112 V 34 H 138 V 38 H 168 V 44 H 176 V 46 H 202 V 42 H 214 V 38
          H 218 V 44 H 212 V 48 H 196 V 52 H 174 V 54 H 150 V 52 H 126 V 46 H 110 V 42
          H 96 V 38 H 70 V 34 H 66 Z
        "
        fill="#000000"
      />
      {/* Preenchimento Verde-Limão (#7EC832) */}
      <path
        d="
          M 70 29
          H 98 V 33 H 112 V 37 H 138 V 41 H 166 V 45 H 174 V 47 H 200 V 43 H 212 V 40
          H 214 V 43 H 210 V 46 H 194 V 50 H 172 V 51 H 148 V 49 H 124 V 43 H 108 V 39
          H 94 V 35 H 70 Z
        "
        fill="#7EC832"
      />

      {/* ========================================================
          3. ARCO SOBRE A LETRA 'A' (Fita / Órbita)
         ======================================================== */}
      {/* Contorno Preto do Arco */}
      <path
        d="
          M 46 36
          H 62 V 32 H 78 V 30 H 94 V 32 H 108 V 36 H 116 V 42 H 110 V 38 H 96 V 35
          H 76 V 35 H 60 V 37 H 44 V 44 H 38 V 38 H 46 Z
        "
        fill="#000000"
      />
      {/* Preenchimento Branco do Arco */}
      <path
        d="
          M 48 37
          H 62 V 34 H 78 V 32 H 94 V 34 H 106 V 37 H 112 V 40 H 108 V 36 H 94 V 34
          H 76 V 34 H 60 V 36 H 46 V 41 H 41 V 38 H 48 Z
        "
        fill="#ffffff"
      />

      {/* ========================================================
          4. LETRA 'a' (Pixel Art Arredondada Branca c/ Borda Preta)
         ======================================================== */}
      {/* Borda Preta Externa 'a' */}
      <path
        d="
          M 44 48
          H 70 V 52 H 76 V 84 H 70 V 88 H 62 V 84 H 42 V 88 H 34 V 84 H 30 V 58
          H 34 V 52 H 44 Z
        "
        fill="#000000"
      />
      {/* Preenchimento Branco 'a' */}
      <path
        d="
          M 44 52
          H 66 V 56 H 72 V 82 H 62 V 80 H 42 V 82 H 34 V 60 H 38 V 56 H 44 Z
        "
        fill="#ffffff"
      />
      {/* Miolo / Furo Preto e Branco da Letra 'a' */}
      <rect x="44" y="62" width="16" height="12" fill="#000000" />
      <rect x="47" y="64" width="10" height="8" fill="#ffffff" />

      {/* ========================================================
          5. LETRA 'c' (Pixel Art Arredondada Branca c/ Borda Preta)
         ======================================================== */}
      {/* Borda Preta Externa 'c' */}
      <path
        d="
          M 92 48
          H 120 V 54 H 124 V 64 H 114 V 58 H 100 V 54 H 94 V 78 H 100 V 82 H 116 V 78
          H 124 V 86 H 118 V 90 H 92 V 86 H 84 V 80 H 80 V 58 H 84 V 52 H 92 Z
        "
        fill="#000000"
      />
      {/* Preenchimento Branco 'c' */}
      <path
        d="
          M 92 52
          H 116 V 56 H 120 V 62 H 114 V 56 H 98 V 56 H 92 V 76 H 98 V 80 H 114 V 76
          H 120 V 84 H 114 V 86 H 92 V 84 H 86 V 78 H 84 V 60 H 86 V 54 H 92 Z
        "
        fill="#ffffff"
      />
      {/* Miolo interno vazado transparente de 'c' */}
      <rect x="94" y="60" width="14" height="16" fill="transparent" />

      {/* ========================================================
          6. LETRA 'i' (Coluna Pixel Art Branca c/ Borda Preta)
         ======================================================== */}
      {/* Borda Preta Externa 'i' */}
      <rect x="130" y="48" width="18" height="42" fill="#000000" />
      {/* Preenchimento Branco 'i' */}
      <rect x="134" y="52" width="10" height="34" fill="#ffffff" />

      {/* ========================================================
          7. LETRA 'm' (Pixel Art Branca c/ Borda Preta)
         ======================================================== */}
      {/* Borda Preta Externa 'm' */}
      <path
        d="
          M 158 48
          H 174 V 56 H 182 V 48 H 198 V 56 H 206 V 86 H 202 V 90 H 188 V 86 H 188 V 64
          H 182 V 86 H 178 V 90 H 168 V 86 H 168 V 64 H 164 V 86 H 160 V 90 H 152 V 86
          H 152 V 54 H 158 Z
        "
        fill="#000000"
      />
      {/* Preenchimento Branco 'm' */}
      <path
        d="
          M 158 52
          H 170 V 60 H 176 V 60 H 182 V 52 H 194 V 60 H 200 V 84 H 192 V 62 H 184 V 84
          H 174 V 62 H 166 V 84 H 156 V 56 H 158 Z
        "
        fill="#ffffff"
      />
      {/* Recortes internos entre as pernas do 'm' (Fundo transparente) */}
      <rect x="168" y="62" width="4" height="24" fill="transparent" />
      <rect x="186" y="62" width="4" height="24" fill="transparent" />
    </svg>
  );
};
