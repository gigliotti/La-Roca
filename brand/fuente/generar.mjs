// Genera todos los archivos de la marca La Roca.
//
//   node brand/fuente/generar.mjs
//
// El logo es una roca con techo, una escaladora colgada de él y el nombre
// calado en la piedra. Las letras ("canto rodado") no salen de ninguna
// tipografía: son contornos de piedra con las esquinas gastadas y el borde
// áspero, construidos acá. Todo es determinista: correrlo dos veces da lo mismo.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- colores
export const COLORES = {
  sol: { nombre: 'Sol', hex: '#FF7A2F', uso: 'Color principal. El logo, fondos de impacto, botones grandes.' },
  atardecer: { nombre: 'Atardecer', hex: '#E8461E', uso: 'Segundo naranja, para acentos y fondos.' },
  mar: { nombre: 'Mar', hex: '#1E4F7A', uso: 'Azul de la marca. Texto sobre fondos claros, fondos.' },
  hondo: { nombre: 'Hondo', hex: '#102A40', uso: 'Texto sobre naranja y fondos oscuros.' },
  arena: { nombre: 'Arena', hex: '#F3E3CF', uso: 'Fondo claro principal. El logo sobre fondos oscuros.' },
  oxido: { nombre: 'Óxido', hex: '#B03A10', uso: 'Naranja para texto chico y enlaces sobre fondos claros.' },
};
const C = Object.fromEntries(Object.entries(COLORES).map(([k, v]) => [k, v.hex]));
const BLANCO = '#FFFFFF';

// ---------------------------------------------------------------- utilidades
const fmt = (n) => { const v = Math.round(n * 10) / 10; return Object.is(v, -0) ? '0' : String(v); };
const P = ([x, y]) => `${fmt(x)} ${fmt(y)}`;
const rad = (d) => (d * Math.PI) / 180;
function azar(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const poli = (pts) => 'M' + pts.map(P).join('L') + 'Z';
const area = (V) => V.reduce((s, p, i) => { const q = V[(i + 1) % V.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
function capsula(x1, x2, y, h) {
  const r = h / 2;
  return `M${fmt(x1 + r)} ${fmt(y - r)}H${fmt(x2 - r)}A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x2 - r)} ${fmt(y + r)}H${fmt(x1 + r)}A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x1 + r)} ${fmt(y - r)}Z`;
}

// Borde áspero: subdivide cada lado y mueve los puntos un poco hacia afuera o adentro.
function aspero(V, rnd, { paso = 5, amp = 1.3, esquinas = true } = {}) {
  const s = Math.sign(area(V)) || 1;
  const res = [];
  V.forEach((p, i) => {
    const q = V[(i + 1) % V.length];
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const nx = ((q[1] - p[1]) / l) * s, ny = (-(q[0] - p[0]) / l) * s;
    const k = Math.max(1, Math.round(l / paso));
    const f1 = rnd() * 6.28, f2 = rnd() * 6.28;
    for (let j = 0; j < k; j++) {
      const t = j / k;
      const x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t;
      if (j === 0 && esquinas) { res.push([x, y]); continue; }
      const o = amp * (0.6 * Math.sin(f1 + t * 7.3) + 0.4 * Math.sin(f2 + t * 17.1) + (rnd() - 0.5) * 0.7) * Math.min(1, 4 * t * (1 - t) + 0.25);
      res.push([x + nx * o, y + ny * o]);
    }
  });
  return res;
}
// Canto rodado: lados apenas abombados y esquinas gastadas (Chaikin).
function chaikin(V, it = 3) {
  let A = V;
  for (let k = 0; k < it; k++) {
    const B = [];
    A.forEach((p, i) => { const q = A[(i + 1) % A.length]; B.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]], [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]); });
    A = B;
  }
  return A;
}
function abombar(V, f = 0.06) {
  const s = Math.sign(area(V)) || 1, W = [];
  V.forEach((p, i) => {
    const q = V[(i + 1) % V.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const nx = ((q[1] - p[1]) / l) * s, ny = (-(q[0] - p[0]) / l) * s;
    W.push(p, [p[0] + (q[0] - p[0]) * 0.12, p[1] + (q[1] - p[1]) * 0.12], [(p[0] + q[0]) / 2 + nx * l * f, (p[1] + q[1]) / 2 + ny * l * f], [p[0] + (q[0] - p[0]) * 0.88, p[1] + (q[1] - p[1]) * 0.88]);
  });
  return W;
}

// ---------------------------------------------------------------- letras
// Esqueletos de piedra partida, altura 100. El estilo canto rodado los gasta.
const LETRAS = {
  L: { w: 62, c: [[[1, 3], [29, 0], [30, 72], [60, 74], [62, 100], [0, 99]]] },
  A: { w: 80, c: [[[0, 100], [25, 1], [54, 0], [80, 99], [52, 100], [48, 82], [32, 82], [28, 100]], [[35, 63], [45, 63], [40, 40]]] },
  R: { w: 72, c: [[[0, 1], [46, 0], [66, 13], [69, 38], [56, 56], [72, 100], [43, 100], [32, 62], [29, 62], [29, 100], [0, 99]], [[29, 22], [38, 22], [42, 30], [40, 39], [29, 40]]] },
  O: { w: 75, c: [[[21, 0], [54, 1], [75, 21], [74, 78], [53, 100], [20, 99], [0, 78], [1, 21]], [[31, 26], [45, 26], [48, 34], [47, 66], [44, 74], [30, 74], [27, 66], [28, 34]]] },
  C: { w: 71, c: [[[21, 0], [55, 1], [71, 17], [71, 36], [45, 36], [43, 28], [32, 27], [28, 35], [28, 66], [32, 74], [43, 73], [45, 65], [71, 65], [70, 83], [53, 100], [19, 99], [0, 79], [1, 19]]] },
  E: { w: 55, c: [[[0, 1], [53, 0], [54, 22], [28, 23], [28, 39], [49, 40], [49, 60], [28, 60], [28, 77], [54, 77], [55, 100], [1, 99]]] },
  U: { w: 75, c: [[[0, 0], [28, 1], [28, 71], [33, 77], [42, 77], [47, 71], [47, 1], [75, 0], [75, 79], [55, 100], [21, 100], [0, 80]]] },
  D: { w: 71, c: [[[0, 1], [49, 0], [70, 20], [71, 80], [50, 100], [0, 99]], [[28, 22], [40, 22], [44, 30], [44, 70], [40, 78], [28, 78]]] },
  S: { w: 70, c: [[[18, 0], [67, 1], [67, 24], [31, 24], [30, 35], [54, 37], [70, 52], [70, 81], [52, 100], [3, 99], [3, 76], [42, 76], [42, 65], [17, 62], [0, 46], [0, 17]]] },
  M: { w: 86, c: [[[0, 100], [1, 0], [30, 0], [43, 40], [56, 0], [85, 1], [86, 100], [61, 100], [61, 50], [50, 82], [36, 82], [25, 50], [25, 100]]] },
};
const ESP = 6;
function palabra(texto, x0 = 0, y0 = 0, esc = 1, semilla = 7, espacio = 30) {
  const rnd = azar(semilla);
  let x = 0, d = '';
  for (const ch of texto) {
    if (ch === ' ') { x += espacio - ESP; continue; }
    const L = LETRAS[ch];
    const giro = (rnd() - 0.5) * 2.4, sube = (rnd() - 0.5) * 2.4; // cada letra apenas fuera de lugar
    const cx = L.w / 2, cy = 50, c = Math.cos(rad(giro)), s = Math.sin(rad(giro));
    for (const poly of L.c) {
      let V = poly.map(([px, py]) => [cx + (px - cx) * c - (py - cy) * s, cy + (px - cx) * s + (py - cy) * c + sube]);
      V = aspero(chaikin(abombar(V), 2), rnd, { paso: 5, amp: 0.7, esquinas: false });
      d += poli(V.map(([px, py]) => [x0 + (x + px) * esc, y0 + py * esc]));
    }
    x += L.w + ESP;
  }
  return { d, w: (x - ESP) * esc };
}

// ---------------------------------------------------------------- la roca y la escaladora
// Roca de 740 x 600: techo a la izquierda, panza redonda a la derecha.
const ROCA = [
  [14, 14], [120, 5], [250, 11], [400, 7], [520, 28], [640, 58], [708, 92], [726, 150], [738, 262], [731, 362],
  [705, 442], [660, 506], [590, 556], [500, 588], [420, 596], [292, 594], [283, 540], [288, 482], [273, 422],
  [242, 362], [228, 320], [172, 302], [120, 291], [70, 262], [30, 222], [5, 190], [0, 150], [10, 108], [5, 60],
];
const roca = () => poli(aspero(ROCA, azar(11), { paso: 16, amp: 3.2 }));
// La escaladora: manos en el techo, un pie en la pared.
const CUERPO = {
  cabeza: [110, 333, 17],
  brazos: [[[106, 270], [132, 350]], [[152, 285], [132, 350]]],
  torso: [[132, 350], [196, 398]],
  piernas: [[[196, 398], [226, 378]], [[226, 378], [257, 410]], [[196, 398], [210, 448]], [[210, 448], [244, 476]]],
};
function escaladora(color) {
  const t = (a, b, w) => `<path d="M${P(a)}L${P(b)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  const [cx, cy, r] = CUERPO.cabeza;
  return `<g fill="none">${CUERPO.brazos.map(([a, b]) => t(a, b, 15)).join('')}${t(...CUERPO.torso, 30)}${CUERPO.piernas.map(([a, b]) => t(a, b, 18)).join('')}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
}

// Texto calado en la roca: LA / ROCA, una línea (o el amanecer) y MURO DE ESCALADA.
function textoCalado({ amanecer = false } = {}) {
  const e = 1.12, cx = 506;
  const wRoca = palabra('ROCA', 0, 0, e, 9).w;
  const x0 = cx - wRoca / 2, x1 = cx + wRoca / 2;
  const y1 = 150, y2 = y1 + 100 * e + 16;
  const la = palabra('LA', x0, y1, e, 5).d;
  const roc = palabra('ROCA', x0, y2, e, 9).d;
  const yl = y2 + 100 * e + (amanecer ? 40 : 22);
  const e2 = 0.3;
  const w2 = palabra('MURO DE ESCALADA', 0, 0, e2, 3, 34).w;
  const bajada = palabra('MURO DE ESCALADA', cx - w2 / 2, yl + 22, e2, 3, 34).d;
  let medio;
  if (amanecer) {
    const r = 19, hy = yl + 3.5;
    medio = `M${fmt(cx - r)} ${fmt(hy)}A${r} ${r} 0 0 1 ${fmt(cx + r)} ${fmt(hy)}Z` + capsula(x0, cx - r - 10, hy - 3.5, 7) + capsula(cx + r + 10, x1, hy - 3.5, 7);
  } else {
    medio = capsula(x0, x1, yl, 8);
  }
  return la + roc + medio + bajada;
}

// ---------------------------------------------------------------- composiciones
function svg(viewBox, cuerpo, titulo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${titulo}"><title>${titulo}</title>${cuerpo}</svg>\n`;
}
const RVB = '-6 -6 752 612';
export function sello(color, { amanecer = false } = {}) {
  return svg(RVB, `<path fill="${color}" fill-rule="evenodd" d="${roca()}${textoCalado({ amanecer })}"/>${escaladora(color)}`, 'La Roca, muro de escalada');
}
export function isotipo(color) {
  return svg(RVB, `<path fill="${color}" d="${roca()}"/>${escaladora(color)}`, 'La Roca');
}
function rocaEn(color, x, y, alto) {
  const k = alto / 600;
  return `<g transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(k)})"><path fill="${color}" d="${roca()}"/>${escaladora(color)}</g>`;
}
export function horizontal({ roca: cr, letras }) {
  const H = 100, wIso = (740 / 600) * H, gap = 40;
  const e1 = 0.5, e2 = 0.15;
  const n = palabra('LA ROCA', wIso + gap, 14, e1, 7);
  const b = palabra('MURO DE ESCALADA', wIso + gap + 2, 14 + 100 * e1 + 12, e2, 3, 34);
  const W = wIso + gap + Math.max(n.w, b.w + 2);
  return svg(`-3 -3 ${fmt(W + 6)} ${H + 6}`, rocaEn(cr, 0, 0, H) + `<path fill="${letras}" fill-rule="evenodd" d="${n.d}${b.d}"/>`, 'La Roca, muro de escalada');
}
export function icono(fondo, color) {
  const lado = 600, alto = 380, ancho = (740 / 600) * alto;
  return svg(`0 0 ${lado} ${lado}`, `<rect width="${lado}" height="${lado}" fill="${fondo}"/>` + rocaEn(color, (lado - ancho) / 2 + 8, (lado - alto) / 2, alto), 'La Roca');
}

// ---------------------------------------------------------------- archivos
export const ARCHIVOS = {};
const TINTAS = { '': C.sol, '-arena': C.arena, '-mar': C.mar, '-blanco': BLANCO };
for (const [suf, color] of Object.entries(TINTAS)) {
  ARCHIVOS[`logo/la-roca${suf}.svg`] = sello(color);
  ARCHIVOS[`logo/la-roca-amanecer${suf}.svg`] = sello(color, { amanecer: true });
  ARCHIVOS[`isotipo/roca${suf}.svg`] = isotipo(color);
}
const HORIZ = {
  '': { roca: C.sol, letras: C.mar },
  '-fondo-oscuro': { roca: C.sol, letras: C.arena },
  '-fondo-naranja': { roca: C.arena, letras: C.hondo },
  '-una-tinta-mar': { roca: C.mar, letras: C.mar },
  '-una-tinta-blanco': { roca: BLANCO, letras: BLANCO },
};
for (const [suf, v] of Object.entries(HORIZ)) ARCHIVOS[`logo/la-roca-horizontal${suf}.svg`] = horizontal(v);
ARCHIVOS['icono/icono-mar.svg'] = icono(C.mar, C.sol);
ARCHIVOS['icono/icono-sol.svg'] = icono(C.sol, C.arena);
ARCHIVOS['icono/icono-arena.svg'] = icono(C.arena, C.sol);
ARCHIVOS['icono/favicon.svg'] = isotipo(C.sol);

ARCHIVOS['colores.css'] = `/* La Roca · colores y tipografías de marca (generado por brand/fuente/generar.mjs) */
:root {
${Object.entries(COLORES).map(([k, v]) => `  --roca-${k}: ${v.hex.toLowerCase()}; /* ${v.nombre}. ${v.uso} */`).join('\n')}

  --roca-fuente-titulos: "DM Serif Display", Georgia, "Times New Roman", serif;
  --roca-fuente-texto: "DM Sans", "Segoe UI", system-ui, sans-serif;
}
`;
ARCHIVOS['colores.json'] = JSON.stringify(
  Object.fromEntries(Object.entries(COLORES).map(([k, v]) => [k, { ...v, rgb: v.hex.match(/[0-9A-F]{2}/gi).map((h) => parseInt(h, 16)) }])),
  null, 2,
) + '\n';

// ---------------------------------------------------------------- hojas de referencia
const F_TEXTO = "'DM Sans', 'Segoe UI', Arial, sans-serif";
const F_TITULO = "'DM Serif Display', Georgia, serif";
const IMPORTAR = `<style>@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&amp;family=DM+Serif+Display:ital@0;1&amp;display=swap');</style>`;
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function encajar(svgTexto, x, y, w, h) {
  const vb = svgTexto.match(/viewBox="([^"]+)"/)[1];
  const cuerpo = svgTexto.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>.*?<\/title>/, '');
  return `<svg x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" viewBox="${vb}">${cuerpo}</svg>`;
}
const tinta = (hex) => (['#1E4F7A', '#102A40', '#B03A10', '#E8461E'].includes(hex) ? C.arena : C.hondo);

function hojaPaleta() {
  const W = 1200, H = 720, m = 40, g = 16;
  let s = IMPORTAR + `<rect width="${W}" height="${H}" fill="${BLANCO}"/>`;
  s += `<text x="${m}" y="74" font-family="${F_TITULO}" font-size="40" fill="${C.hondo}">Paleta de La Roca</text>`;
  s += `<text x="${m}" y="108" font-family="${F_TEXTO}" font-size="18" fill="${C.hondo}">El sol manda. El mar y la arena ordenan. El atardecer acompaña.</text>`;
  const caja = (k, x, y, w, h) => {
    const c = COLORES[k], tc = tinta(c.hex);
    const rgb = c.hex.match(/[0-9A-F]{2}/gi).map((v) => parseInt(v, 16)).join(' ');
    return `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" rx="18" fill="${c.hex}"${k === 'arena' ? ' stroke="#E2D2BC"' : ''}/>` +
      `<text x="${fmt(x + 22)}" y="${fmt(y + 44)}" font-family="${F_TEXTO}" font-weight="600" font-size="22" fill="${tc}">${esc(c.nombre)}</text>` +
      `<text x="${fmt(x + 22)}" y="${fmt(y + h - 48)}" font-family="${F_TEXTO}" font-size="17" fill="${tc}">HEX ${c.hex}</text>` +
      `<text x="${fmt(x + 22)}" y="${fmt(y + h - 24)}" font-family="${F_TEXTO}" font-size="17" fill="${tc}">RGB ${rgb}</text>`;
  };
  const y1 = 140, h1 = 300, wP = 440, wR = (W - 2 * m - wP - 2 * g) / 2;
  s += caja('sol', m, y1, wP, h1) + caja('atardecer', m + wP + g, y1, wR, h1) + caja('arena', m + wP + g + wR + g, y1, wR, h1);
  const y2 = y1 + h1 + g, h2 = H - y2 - m, w2 = (W - 2 * m - 2 * g) / 3;
  ['mar', 'hondo', 'oxido'].forEach((k, i) => { s += caja(k, m + i * (w2 + g), y2, w2, h2); });
  return svg(`0 0 ${W} ${H}`, s, 'Paleta de La Roca');
}

function hojaTipografia() {
  const W = 1200, H = 780, m = 48;
  const t = (x, y, txt, fam, peso, tam, color = C.hondo, extra = '') => `<text x="${x}" y="${y}" font-family="${fam}" font-weight="${peso}" font-size="${tam}" fill="${color}"${extra}>${esc(txt)}</text>`;
  let s = IMPORTAR + `<rect width="${W}" height="${H}" fill="${C.arena}"/>`;
  s += t(m, 70, 'TÍTULOS', F_TEXTO, 600, 15, C.oxido, ' letter-spacing="2.5"');
  s += t(m, 150, 'DM Serif Display', F_TITULO, 400, 76);
  s += t(m, 214, 'Primero la pared, después el mar.', F_TITULO, 400, 42);
  s += t(m, 268, 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnÑñOoPpQqRrSsTtUuVvWwXxYyZz 0123456789', F_TITULO, 400, 24);
  s += t(m, 306, 'También en cursiva, para destacar una palabra · Google Fonts · licencia libre (OFL)', F_TEXTO, 400, 17, '#5F6B76');
  s += `<line x1="${m}" y1="350" x2="${W - m}" y2="350" stroke="#E2D2BC" stroke-width="1.5"/>`;
  s += t(m, 410, 'TEXTO', F_TEXTO, 600, 15, C.oxido, ' letter-spacing="2.5"');
  s += t(m, 486, 'DM Sans', F_TEXTO, 600, 72);
  ['En la pared no hay notificaciones: hay una presa, la siguiente y tu respiración.',
    'Escalar te pide estar presente y animarte a soltar el miedo de a poco.'].forEach((l, i) => { s += t(m, 546 + i * 34, l, F_TEXTO, 400, 23); });
  s += t(m, 650, 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnÑñOoPpQqRrSsTtUuVvWwXxYyZz 0123456789', F_TEXTO, 400, 23);
  s += t(m, 690, 'Pesos 400, 500 y 600 · Google Fonts · licencia libre (OFL)', F_TEXTO, 400, 17, '#5F6B76');
  s += t(m, 736, 'El logo no usa estas tipografías: sus letras (canto rodado) están dibujadas para La Roca.', F_TEXTO, 400, 17, '#5F6B76');
  return svg(`0 0 ${W} ${H}`, s, 'Tipografías de La Roca');
}

function hojaVersiones() {
  const W = 1200, m = 32, g = 16, col = (W - 2 * m - 2 * g) / 3;
  let y = m, s = '';
  const panel = (x, yy, w, h, fondo) => `<rect x="${fmt(x)}" y="${fmt(yy)}" width="${fmt(w)}" height="${fmt(h)}" rx="14" fill="${fondo}"${fondo === BLANCO ? ' stroke="#E2D2BC"' : ''}/>`;
  // fila 1: sellos
  const hS = 300;
  [['logo/la-roca.svg', C.arena], ['logo/la-roca-amanecer.svg', C.arena], ['logo/la-roca-amanecer-arena.svg', C.mar]].forEach(([f, fondo], i) => {
    const x = m + i * (col + g);
    s += panel(x, y, col, hS, fondo) + encajar(ARCHIVOS[f], x + 30, y + 30, col - 60, hS - 60);
  });
  y += hS + g;
  // fila 2: una tinta
  [['logo/la-roca-mar.svg', BLANCO], ['logo/la-roca-arena.svg', C.atardecer], ['logo/la-roca-blanco.svg', '#2C3E50']].forEach(([f, fondo], i) => {
    const x = m + i * (col + g);
    s += panel(x, y, col, 240, fondo) + encajar(ARCHIVOS[f], x + 30, y + 26, col - 60, 188);
  });
  y += 240 + g;
  // fila 3: horizontales
  const hH = 150, colH = (W - 2 * m - g) / 2;
  [['logo/la-roca-horizontal.svg', C.arena], ['logo/la-roca-horizontal-fondo-oscuro.svg', C.mar]].forEach(([f, fondo], i) => {
    const x = m + i * (colH + g);
    s += panel(x, y, colH, hH, fondo) + encajar(ARCHIVOS[f], x + 40, y + 30, colH - 80, hH - 60);
  });
  y += hH + g;
  [['logo/la-roca-horizontal-fondo-naranja.svg', C.sol], ['logo/la-roca-horizontal-una-tinta-mar.svg', BLANCO]].forEach(([f, fondo], i) => {
    const x = m + i * (colH + g);
    s += panel(x, y, colH, hH, fondo) + encajar(ARCHIVOS[f], x + 40, y + 30, colH - 80, hH - 60);
  });
  y += hH + g;
  // fila 4: isotipo e íconos
  const lado = 150;
  s += panel(m, y, W - 2 * m, lado + 48, BLANCO);
  ['isotipo/roca.svg', 'isotipo/roca-mar.svg', 'icono/icono-mar.svg', 'icono/icono-sol.svg', 'icono/icono-arena.svg'].forEach((f, i) => {
    s += encajar(ARCHIVOS[f], m + 24 + i * (lado + 64), y + 24, lado, lado);
  });
  y += lado + 48 + m;
  return svg(`0 0 ${W} ${fmt(y)}`, `<rect width="${W}" height="${fmt(y)}" fill="#EFE6DA"/>` + s, 'Versiones del logo de La Roca');
}
ARCHIVOS['paleta.svg'] = hojaPaleta();
ARCHIVOS['tipografia.svg'] = hojaTipografia();
ARCHIVOS['versiones.svg'] = hojaVersiones();

// ---------------------------------------------------------------- escribir
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  for (const [ruta, contenido] of Object.entries(ARCHIVOS)) {
    const destino = join(RAIZ, ruta);
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, contenido);
  }
  console.log(`${Object.keys(ARCHIVOS).length} archivos en ${RAIZ}`);
}
