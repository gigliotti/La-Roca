// Genera todos los archivos de la marca La Roca.
//
//   node brand/fuente/generar.mjs
//
// El símbolo es un arco con el sol naranja saliendo del mar y una roca en la
// orilla. El nombre va en letras de "canto rodado": gruesas, con los lados
// apenas abombados y las esquinas gastadas, como las piedras que pule el mar.
// Las letras no salen de ninguna tipografía: se construyen acá.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- colores
export const COLORES = {
  sol: { nombre: 'Sol', hex: '#FF7A2F', uso: 'Color principal. El arco del símbolo, fondos de impacto, botones grandes.' },
  atardecer: { nombre: 'Atardecer', hex: '#E8461E', uso: 'Segundo naranja, para acentos y fondos.' },
  mar: { nombre: 'Mar', hex: '#1E4F7A', uso: 'Azul de la marca. Las letras del logo, texto sobre fondos claros.' },
  hondo: { nombre: 'Hondo', hex: '#102A40', uso: 'Texto sobre naranja y fondos oscuros.' },
  arena: { nombre: 'Arena', hex: '#F3E3CF', uso: 'Fondo claro principal. Letras del logo sobre fondos oscuros.' },
  oxido: { nombre: 'Óxido', hex: '#B03A10', uso: 'Naranja para texto chico y enlaces sobre fondos claros.' },
};
const C = Object.fromEntries(Object.entries(COLORES).map(([k, v]) => [k, v.hex]));
const BLANCO = '#FFFFFF';

// ---------------------------------------------------------------- utilidades
const fmt = (n) => { const v = Math.round(n * 100) / 100; return Object.is(v, -0) ? '0' : String(v); };
const P = ([x, y]) => `${fmt(x)} ${fmt(y)}`;
const area = (V) => V.reduce((s, p, i) => { const q = V[(i + 1) % V.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
function redondeado(V, r) {
  const n = V.length; let d = '';
  for (let i = 0; i < n; i++) {
    const A0 = V[(i - 1 + n) % n], Q = V[i], N = V[(i + 1) % n];
    const rr = Array.isArray(r) ? r[i] : r;
    const l1 = Math.hypot(A0[0] - Q[0], A0[1] - Q[1]), l2 = Math.hypot(N[0] - Q[0], N[1] - Q[1]);
    const t1 = Math.min(rr / l1, 0.5), t2 = Math.min(rr / l2, 0.5);
    const A = [Q[0] + (A0[0] - Q[0]) * t1, Q[1] + (A0[1] - Q[1]) * t1];
    const B = [Q[0] + (N[0] - Q[0]) * t2, Q[1] + (N[1] - Q[1]) * t2];
    d += (i === 0 ? `M${P(A)}` : `L${P(A)}`) + `Q${P(Q)} ${P(B)}`;
  }
  return d + 'Z';
}
// Canto rodado: cada lado se abomba un poco hacia afuera y las esquinas se gastan.
function canto(V, { abombe = 0.06, radio = 11 } = {}) {
  const s = Math.sign(area(V));
  const W = [];
  V.forEach((p, i) => {
    const q = V[(i + 1) % V.length];
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const nx = ((q[1] - p[1]) / l) * s, ny = (-(q[0] - p[0]) / l) * s;
    W.push(p, [(p[0] + q[0]) / 2 + nx * l * abombe, (p[1] + q[1]) / 2 + ny * l * abombe]);
  });
  return redondeado(W, W.map((_, i) => (i % 2 === 0 ? radio : 60)));
}
function capsula(x1, x2, y, h) {
  const r = h / 2;
  return `M${fmt(x1 + r)} ${fmt(y - r)}H${fmt(x2 - r)}A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x2 - r)} ${fmt(y + r)}H${fmt(x1 + r)}A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x1 + r)} ${fmt(y - r)}Z`;
}

// ---------------------------------------------------------------- letras
// Contornos de piedra partida (altura 100, trazo ~26) que el canto rodado gasta.
const LETRAS = {
  L: { w: 60, c: [[[1, 3], [27, 0], [28, 73], [58, 75], [60, 100], [0, 99]]] },
  A: { w: 76, c: [[[0, 100], [25, 1], [51, 0], [76, 99], [50, 100], [46, 81], [30, 81], [26, 100]], [[33, 62], [43, 62], [38, 37]]] },
  R: { w: 69, c: [[[0, 1], [44, 0], [63, 13], [66, 38], [54, 55], [69, 100], [42, 100], [31, 61], [27, 61], [27, 100], [0, 99]], [[27, 21], [37, 21], [41, 29], [39, 39], [27, 40]]] },
  O: { w: 72, c: [[[20, 0], [52, 1], [72, 21], [71, 78], [51, 100], [19, 99], [0, 78], [1, 21]], [[29, 25], [44, 25], [47, 33], [46, 67], [43, 75], [28, 75], [25, 66], [26, 33]]] },
  C: { w: 68, c: [[[20, 0], [53, 1], [68, 17], [68, 35], [43, 35], [41, 27], [30, 26], [26, 34], [26, 67], [30, 75], [41, 74], [43, 65], [68, 65], [67, 83], [51, 100], [18, 99], [0, 79], [1, 19]]] },
};
const ESP = 7, PALABRA = 30;
export function palabra(texto, x0 = 0, y0 = 0, esc = 1) {
  let x = 0, d = '';
  for (const ch of texto) {
    if (ch === ' ') { x += PALABRA - ESP; continue; }
    const L = LETRAS[ch];
    for (const poly of L.c) d += canto(poly.map(([px, py]) => [x0 + (x + px) * esc, y0 + py * esc]), { radio: 11 * esc, abombe: 0.06 });
    x += L.w + ESP;
  }
  return { d, w: (x - ESP) * esc };
}

// ---------------------------------------------------------------- el símbolo
// Arco de 80 x 100: el sol saliendo del mar (tres líneas) y una roca en la orilla.
function simbolo(x0 = 0, y0 = 0, e = 1) {
  const T = (x, y) => [x0 + x * e, y0 + y * e];
  const R = 40 * e;
  const arco = `M${P(T(0, 100))}V${fmt(y0 + 40 * e)}A${fmt(R)} ${fmt(R)} 0 0 1 ${P(T(80, 40))}V${fmt(y0 + 100 * e)}Z`;
  const sr = 17 * e;
  const sol = `M${P(T(24.5, 59))}A${fmt(sr)} ${fmt(sr)} 0 1 1 ${P(T(55.5, 59))}Z`;
  const linea = (a, b, y) => capsula(x0 + a * e, x0 + b * e, y0 + y * e, 3.6 * e);
  const mar = linea(38, 72, 66) + linea(43, 68, 74) + linea(48, 66, 82);
  const roca = redondeado([[0, 100], [0, 75], [8, 66], [18, 67], [26, 76], [33, 86], [38, 100]].map(([x, y]) => T(x, y)), [0, 7, 7, 8, 7, 6, 0].map((v) => v * e));
  return { arco, adentro: sol + mar + roca };
}
// Una tinta: lo de adentro queda calado. Dos tintas: lo de adentro va en otro color.
function pintarSimbolo(s, color, adentro = null) {
  return adentro
    ? `<path fill="${color}" d="${s.arco}"/><path fill="${adentro}" d="${s.adentro}"/>`
    : `<path fill="${color}" fill-rule="evenodd" d="${s.arco}${s.adentro}"/>`;
}

// ---------------------------------------------------------------- composiciones
function svg(viewBox, cuerpo, titulo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${titulo}"><title>${titulo}</title>${cuerpo}</svg>\n`;
}
export function horizontal({ arco, adentro = null, letras }) {
  const alto = 52, esc = alto / 100, gap = 22;
  const p = palabra('LA ROCA', 80 + gap, (100 - alto) / 2, esc);
  const W = 80 + gap + p.w;
  return svg(`-2 -2 ${fmt(W + 4)} 104`, pintarSimbolo(simbolo(), arco, adentro) + `<path fill="${letras}" fill-rule="evenodd" d="${p.d}"/>`, 'La Roca');
}
export function vertical({ arco, adentro = null, letras }) {
  const alto = 34, esc = alto / 100;
  const pw = palabra('LA ROCA', 0, 0, esc).w;
  const W = Math.max(pw, 80);
  const p = palabra('LA ROCA', (W - pw) / 2, 120, esc);
  return svg(`-2 -2 ${fmt(W + 4)} ${fmt(120 + alto + 4)}`, pintarSimbolo(simbolo((W - 80) / 2, 0), arco, adentro) + `<path fill="${letras}" fill-rule="evenodd" d="${p.d}"/>`, 'La Roca');
}
export function soloNombre(color) {
  const p = palabra('LA ROCA');
  return svg(`-2 -2 ${fmt(p.w + 4)} 104`, `<path fill="${color}" fill-rule="evenodd" d="${p.d}"/>`, 'La Roca');
}
export function isotipo(color, adentro = null) {
  return svg('-1 -1 82 102', pintarSimbolo(simbolo(), color, adentro), 'La Roca');
}
export function icono(fondo, color, adentro = null) {
  // Cuadrado completo: cada plataforma le pone sus esquinas o lo recorta en círculo.
  const lado = 200, e = 1.15, w = 80 * e, h = 100 * e;
  return svg(`0 0 ${lado} ${lado}`, `<rect width="${lado}" height="${lado}" fill="${fondo}"/>` + pintarSimbolo(simbolo((lado - w) / 2, (lado - h) / 2, e), color, adentro), 'La Roca');
}

// ---------------------------------------------------------------- archivos
export const ARCHIVOS = {};
const VARIANTES = {
  '': { arco: C.sol, letras: C.mar },
  '-fondo-oscuro': { arco: C.sol, letras: C.arena },
  '-fondo-naranja': { arco: C.arena, letras: C.hondo },
  '-una-tinta-mar': { arco: C.mar, letras: C.mar },
  '-una-tinta-blanco': { arco: BLANCO, letras: BLANCO },
  '-una-tinta-naranja': { arco: C.sol, letras: C.sol },
};
for (const [suf, v] of Object.entries(VARIANTES)) {
  ARCHIVOS[`logo/la-roca-horizontal${suf}.svg`] = horizontal(v);
  ARCHIVOS[`logo/la-roca-vertical${suf}.svg`] = vertical(v);
}
ARCHIVOS['logo/la-roca-nombre.svg'] = soloNombre(C.mar);
ARCHIVOS['logo/la-roca-nombre-arena.svg'] = soloNombre(C.arena);
ARCHIVOS['logo/la-roca-nombre-blanco.svg'] = soloNombre(BLANCO);
ARCHIVOS['isotipo/simbolo.svg'] = isotipo(C.sol);
ARCHIVOS['isotipo/simbolo-dos-tintas.svg'] = isotipo(C.sol, C.mar);
ARCHIVOS['isotipo/simbolo-mar.svg'] = isotipo(C.mar);
ARCHIVOS['isotipo/simbolo-arena.svg'] = isotipo(C.arena);
ARCHIVOS['isotipo/simbolo-blanco.svg'] = isotipo(BLANCO);
ARCHIVOS['icono/icono-mar.svg'] = icono(C.mar, C.sol, C.mar);
ARCHIVOS['icono/icono-arena.svg'] = icono(C.arena, C.sol, C.arena);
ARCHIVOS['icono/icono-sol.svg'] = icono(C.sol, C.arena, C.sol);
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
  const [, , vw, vh] = vb.split(' ').map(Number);
  const k = Math.min(w / vw, h / vh), ww = vw * k, hh = vh * k;
  const cuerpo = svgTexto.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>.*?<\/title>/, '');
  return `<svg x="${fmt(x + (w - ww) / 2)}" y="${fmt(y + (h - hh) / 2)}" width="${fmt(ww)}" height="${fmt(hh)}" viewBox="${vb}">${cuerpo}</svg>`;
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
  const W = 1200, H = 860, m = 48;
  const t = (x, y, txt, fam, peso, tam, color = C.hondo, extra = '') => `<text x="${x}" y="${y}" font-family="${fam}" font-weight="${peso}" font-size="${tam}" fill="${color}"${extra}>${esc(txt)}</text>`;
  let s = IMPORTAR + `<rect width="${W}" height="${H}" fill="${C.arena}"/>`;
  s += t(m, 70, 'LOGO', F_TEXTO, 600, 15, C.oxido, ' letter-spacing="2.5"');
  const p = palabra('LA ROCA', m, 92, 0.62);
  s += `<path fill="${C.mar}" fill-rule="evenodd" d="${p.d}"/>`;
  s += t(m + p.w + 32, 140, 'Canto rodado: letras dibujadas para La Roca.', F_TEXTO, 400, 18, '#5F6B76');
  s += t(m + p.w + 32, 166, 'Solo para el nombre; no es una tipografía para escribir.', F_TEXTO, 400, 18, '#5F6B76');
  s += `<line x1="${m}" y1="200" x2="${W - m}" y2="200" stroke="#E2D2BC" stroke-width="1.5"/>`;
  s += t(m, 256, 'TÍTULOS', F_TEXTO, 600, 15, C.oxido, ' letter-spacing="2.5"');
  s += t(m, 336, 'DM Serif Display', F_TITULO, 400, 76);
  s += t(m, 400, 'Primero la pared, después el mar.', F_TITULO, 400, 42);
  s += t(m, 452, 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnÑñOoPpQqRrSsTtUuVvWwXxYyZz 0123456789', F_TITULO, 400, 24);
  s += t(m, 488, 'Con su cursiva para destacar una palabra · Google Fonts · licencia libre (OFL)', F_TEXTO, 400, 17, '#5F6B76');
  s += `<line x1="${m}" y1="528" x2="${W - m}" y2="528" stroke="#E2D2BC" stroke-width="1.5"/>`;
  s += t(m, 584, 'TEXTO', F_TEXTO, 600, 15, C.oxido, ' letter-spacing="2.5"');
  s += t(m, 658, 'DM Sans', F_TEXTO, 600, 72);
  ['En la pared no hay notificaciones: hay una presa, la siguiente y tu respiración.',
    'Escalar te pide estar presente y animarte a soltar el miedo de a poco.'].forEach((l, i) => { s += t(m, 716 + i * 34, l, F_TEXTO, 400, 23); });
  s += t(m, 812, 'Pesos 400, 500 y 600 · Google Fonts · licencia libre (OFL)', F_TEXTO, 400, 17, '#5F6B76');
  return svg(`0 0 ${W} ${H}`, s, 'Tipografías de La Roca');
}

function hojaVersiones() {
  const W = 1200, m = 32, g = 16;
  let y = m, s = '';
  const panel = (x, yy, w, h, fondo) => `<rect x="${fmt(x)}" y="${fmt(yy)}" width="${fmt(w)}" height="${fmt(h)}" rx="14" fill="${fondo}"${fondo === BLANCO ? ' stroke="#E2D2BC"' : ''}/>`;
  s += panel(m, y, W - 2 * m, 260, C.arena) + encajar(ARCHIVOS['logo/la-roca-horizontal.svg'], m + 150, y + 60, W - 2 * m - 300, 140);
  y += 260 + g;
  const col2 = (W - 2 * m - g) / 2;
  [['logo/la-roca-horizontal-fondo-oscuro.svg', C.mar], ['logo/la-roca-horizontal-fondo-naranja.svg', C.sol]].forEach(([f, fondo], i) => {
    const x = m + i * (col2 + g);
    s += panel(x, y, col2, 170, fondo) + encajar(ARCHIVOS[f], x + 50, y + 45, col2 - 100, 80);
  });
  y += 170 + g;
  const col3 = (W - 2 * m - 2 * g) / 3;
  [['logo/la-roca-vertical.svg', C.arena], ['logo/la-roca-vertical-fondo-oscuro.svg', C.mar], ['logo/la-roca-vertical-fondo-naranja.svg', C.atardecer]].forEach(([f, fondo], i) => {
    const x = m + i * (col3 + g);
    s += panel(x, y, col3, 260, fondo) + encajar(ARCHIVOS[f], x + 40, y + 40, col3 - 80, 180);
  });
  y += 260 + g;
  [['logo/la-roca-horizontal-una-tinta-mar.svg', BLANCO], ['logo/la-roca-horizontal-una-tinta-blanco.svg', '#2C3E50'], ['logo/la-roca-horizontal-una-tinta-naranja.svg', BLANCO]].forEach(([f, fondo], i) => {
    const x = m + i * (col3 + g);
    s += panel(x, y, col3, 130, fondo) + encajar(ARCHIVOS[f], x + 30, y + 35, col3 - 60, 60);
  });
  y += 130 + g;
  const lado = 140;
  s += panel(m, y, W - 2 * m, lado + 48, BLANCO);
  ['isotipo/simbolo.svg', 'isotipo/simbolo-dos-tintas.svg', 'isotipo/simbolo-mar.svg', 'icono/icono-mar.svg', 'icono/icono-sol.svg', 'icono/icono-arena.svg'].forEach((f, i) => {
    s += encajar(ARCHIVOS[f], m + 30 + i * (lado + 46), y + 24, lado, lado);
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
