import fs from 'fs';

// Grid size: 240 x 100
// Exact pixel coordinates matching the user's uploaded "Logo acim em pixel art retrô.png"
const svgContent = `<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 250 106"
  width="100%"
  height="100%"
  fill="none"
  shape-rendering="crispEdges"
  style="image-rendering: pixelated; shape-rendering: crispEdges;"
>
  <!-- ==========================================
       1. ONDA SUPERIOR (VERDE-AZUL / TEAL #00A896)
       ========================================== -->
  <!-- Contorno Preto da Onda Superior -->
  <path
    d="
      M 78 12
      H 134 V 16 H 146 V 19 H 168 V 22 H 192 V 19 H 206 V 16 H 218 V 12 H 224 V 19
      H 220 V 23 H 214 V 27 H 204 V 30 H 190 V 33 H 174 V 30 H 154 V 27 H 136 V 23
      H 116 V 19 H 94 V 16 H 78 Z
      M 72 16 H 78 V 20 H 72 Z
      M 66 20 H 74 V 24 H 66 Z
    "
    fill="#000000"
  />
  <!-- Preenchimento Teal da Onda Superior -->
  <path
    d="
      M 80 15
      H 132 V 18 H 144 V 21 H 166 V 24 H 190 V 21 H 204 V 18 H 216 V 15 H 221 V 17
      H 217 V 21 H 211 V 25 H 201 V 28 H 188 V 31 H 172 V 28 H 152 V 25 H 134 V 21
      H 114 V 18 H 92 V 15 H 80 Z
      M 74 18 H 80 V 22 H 74 Z
      M 68 22 H 74 V 26 H 68 Z
    "
    fill="#00A896"
  />

  <!-- ==========================================
       2. ONDA INFERIOR (VERDE-LIMÃO #82D137)
       ========================================== -->
  <!-- Contorno Preto da Onda Inferior -->
  <path
    d="
      M 64 24
      H 92 V 28 H 112 V 32 H 134 V 36 H 158 V 39 H 182 V 36 H 200 V 33 H 212 V 30
      H 220 V 37 H 214 V 41 H 202 V 45 H 186 V 48 H 166 V 49 H 144 V 47 H 124 V 43
      H 106 V 39 H 88 V 35 H 68 V 31 H 60 V 27 H 64 Z
    "
    fill="#000000"
  />
  <!-- Preenchimento Verde-Limão da Onda Inferior -->
  <path
    d="
      M 66 27
      H 90 V 31 H 110 V 35 H 132 V 38 H 156 V 41 H 180 V 38 H 198 V 35 H 210 V 33
      H 216 V 35 H 210 V 39 H 198 V 43 H 182 V 46 H 164 V 47 H 142 V 45 H 122 V 41
      H 104 V 37 H 86 V 33 H 66 V 29 H 62 Z
    "
    fill="#82D137"
  />

  <!-- ==========================================
       3. ARCO ORBITAL SOBRE A LETRA 'A'
       ========================================== -->
  <!-- Contorno Preto do Arco -->
  <path
    d="
      M 48 38
      H 66 V 33 H 84 V 30 H 100 V 33 H 116 V 38 H 124 V 46 H 116 V 42 H 102 V 37
      H 82 V 35 H 64 V 38 H 48 V 46 H 40 V 38 H 48 Z
    "
    fill="#000000"
  />
  <!-- Preenchimento Branco do Arco -->
  <path
    d="
      M 50 40
      H 66 V 35 H 84 V 32 H 100 V 35 H 114 V 40 H 120 V 43 H 114 V 40 H 100 V 36
      H 82 V 34 H 64 V 37 H 48 V 43 H 42 V 40 H 50 Z
    "
    fill="#FFFFFF"
  />

  <!-- ==========================================
       4. LETRAS "acim" EM PIXEL ART RETRÔ
       Preenchimento Branco (#FFFFFF) com Contorno Preto (#000000)
       ========================================== -->

  <!-- --- LETRA 'a' --- -->
  <!-- Contorno Preto 'a' -->
  <path
    d="
      M 46 52
      H 74 V 57 H 80 V 93 H 74 V 98 H 64 V 94 H 42 V 98 H 32 V 94 H 28 V 65
      H 32 V 57 H 46 Z
    "
    fill="#000000"
  />
  <!-- Preenchimento Branco 'a' -->
  <path
    d="
      M 46 57
      H 70 V 61 H 75 V 90 H 64 V 88 H 42 V 90 H 34 V 67 H 38 V 61 H 46 Z
    "
    fill="#FFFFFF"
  />
  <!-- Furo Central 'a' (Preto e Branco) -->
  <rect x="46" y="69" width="16" height="13" fill="#000000" />
  <rect x="50" y="72" width="9" height="7" fill="#FFFFFF" />

  <!-- --- LETRA 'c' --- -->
  <!-- Contorno Preto 'c' -->
  <path
    d="
      M 98 52
      H 130 V 60 H 134 V 70 H 122 V 64 H 108 V 59 H 100 V 87 H 108 V 91 H 124 V 86
      H 134 V 94 H 128 V 98 H 98 V 94 H 88 V 87 H 84 V 65 H 88 V 57 H 98 Z
    "
    fill="#000000"
  />
  <!-- Preenchimento Branco 'c' -->
  <path
    d="
      M 98 57
      H 124 V 62 H 128 V 67 H 120 V 62 H 106 V 62 H 98 V 85 H 106 V 88 H 122 V 85
      H 128 V 92 H 122 V 94 H 98 V 91 H 92 V 85 H 90 V 67 H 92 V 61 H 98 Z
    "
    fill="#FFFFFF"
  />

  <!-- --- LETRA 'i' --- -->
  <!-- Contorno Preto 'i' -->
  <rect x="142" y="52" width="22" height="46" fill="#000000" />
  <!-- Preenchimento Branco 'i' -->
  <rect x="147" y="57" width="12" height="36" fill="#FFFFFF" />

  <!-- --- LETRA 'm' --- -->
  <!-- Contorno Preto 'm' -->
  <path
    d="
      M 176 52
      H 194 V 62 H 204 V 52 H 222 V 62 H 232 V 94 H 226 V 98 H 212 V 94 H 212 V 70
      H 204 V 94 H 198 V 98 H 186 V 94 H 186 V 70 H 182 V 94 H 176 V 98 H 166 V 94
      H 166 V 60 H 176 Z
    "
    fill="#000000"
  />
  <!-- Preenchimento Branco 'm' -->
  <path
    d="
      M 176 57
      H 190 V 66 H 196 V 66 H 202 V 57 H 216 V 66 H 224 V 91 H 216 V 68 H 206 V 91
      H 196 V 68 H 186 V 91 H 174 V 62 H 176 Z
    "
    fill="#FFFFFF"
  />
</svg>`;

fs.writeFileSync('public/acim-logo-retro.svg', svgContent);
console.log('Saved public/acim-logo-retro.svg');
