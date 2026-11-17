// Genera todos los archivos de la marca La Roca (dirección "Ronda").
//
//   node brand/fuente/generar.mjs
//
// Las letras no salen de ninguna tipografía: están construidas con geometría
// (trazos de punta redonda convertidos a contorno), y la O es una ronda de
// cinco presas distintas. Cambiando los números de abajo se regenera todo.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- colores
export const COLORES = {
  naranja: { nombre: 'Naranja Ronda', hex: '#FF5A1F', uso: 'Color principal. La ronda, fondos de impacto, botones.' },
  tostado: { nombre: 'Naranja tostado', hex: '#C4400F', uso: 'Naranja para texto chico y enlaces sobre fondos claros.' },
  noche: { nombre: 'Noche atlántica', hex: '#0D1B26', uso: 'Letras del logo, texto y fondos oscuros.' },
  magnesio: { nombre: 'Magnesio', hex: '#F1F3F0', uso: 'Fondo claro principal.' },
  durazno: { nombre: 'Durazno', hex: '#FFB089', uso: 'Acento suave, fondos de tarjetas.' },
  lila: { nombre: 'Lila', hex: '#B49CFF', uso: 'Acento secundario.' },
  menta: { nombre: 'Menta', hex: '#8EE0C3', uso: 'Acento secundario.' },
};
const C = Object.fromEntries(Object.entries(COLORES).map(([k, v]) => [k, v.hex]));
const BLANCO = '#FFFFFF';

// ---------------------------------------------------------------- utilidades
const fmt = (n) => {
  const v = Math.round(n * 100) / 100;
  return Object.is(v, -0) ? '0' : String(v);
};
const P = ([x, y]) => `${fmt(x)} ${fmt(y)}`;
const rad = (d) => (d * Math.PI) / 180;

function curvaSuave(pts) {
  // Catmull-Rom cerrada -> Bézier cúbicas
  const n = pts.length;
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${P([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${P([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${P(p2)}`;
  }
  return d + 'Z';
}
const circulo = (cx, cy, r) =>
  `M${fmt(cx - r)} ${fmt(cy)}a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(2 * r)} 0a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(-2 * r)} 0Z`;

// Trazo recto con puntas redondas, como contorno (sentido horario).
function trazo([x1, y1], [x2, y2], r) {
  const l = Math.hypot(x2 - x1, y2 - y1);
  const nx = (-(y2 - y1) / l) * r, ny = ((x2 - x1) / l) * r;
  return `M${P([x1 - nx, y1 - ny])}L${P([x2 - nx, y2 - ny])}A${fmt(r)} ${fmt(r)} 0 0 1 ${P([x2 + nx, y2 + ny])}L${P([x1 + nx, y1 + ny])}A${fmt(r)} ${fmt(r)} 0 0 1 ${P([x1 - nx, y1 - ny])}Z`;
}
// Trazo curvo (arco de centro c y radio R, de a0 a a1 en grados, horario) con puntas redondas.
function arco([cx, cy], R, a0, a1, r) {
  const t0 = rad(a0), t1 = rad(a1);
  const pt = (rr, t) => [cx + rr * Math.cos(t), cy + rr * Math.sin(t)];
  const grande = a1 - a0 > 180 ? 1 : 0;
  return `M${P(pt(R + r, t0))}A${fmt(R + r)} ${fmt(R + r)} 0 ${grande} 1 ${P(pt(R + r, t1))}` +
    `A${fmt(r)} ${fmt(r)} 0 0 1 ${P(pt(R - r, t1))}` +
    `A${fmt(R - r)} ${fmt(R - r)} 0 ${grande} 0 ${P(pt(R - r, t0))}` +
    `A${fmt(r)} ${fmt(r)} 0 0 1 ${P(pt(R + r, t0))}Z`;
}

// ---------------------------------------------------------------- letras
// Altura de mayúscula 100, trazo 22 (r = 11). Cada letra: ancho y trazos.
const r = 11;
const LETRAS = {
  L: { ancho: 69, trazos: [['t', [11, 11], [11, 89]], ['t', [11, 89], [58, 89]]] },
  A: { ancho: 92, trazos: [['t', [11, 89], [46, 11]], ['t', [46, 11], [81, 89]], ['t', [21, 67], [71, 67]]] },
  R: {
    ancho: 73,
    trazos: [['t', [11, 89], [11, 11]], ['t', [11, 11], [38, 11]], ['a', [38, 31], 20, -90, 90], ['t', [38, 51], [11, 51]], ['t', [36, 51], [62, 89]]],
  },
  C: { ancho: 90, trazos: [['a', [50, 50], 39, 42, 318]] },
};
function letra(ch, dx, dy) {
  return LETRAS[ch].trazos.map(([tipo, ...a]) => {
    if (tipo === 't') return trazo([a[0][0] + dx, a[0][1] + dy], [a[1][0] + dx, a[1][1] + dy], r);
    return arco([a[0][0] + dx, a[0][1] + dy], a[1], a[2], a[3], r);
  }).join('');
}

// ---------------------------------------------------------------- la ronda
// Cinco presas, cada una con su forma. Parámetros de una superelipse con
// ondulaciones; el hueco entre vecinas se ajusta solo para que sea parejo.
const PRESAS = [
  { th: -90, a: 19.5, b: 14.0, e: 2.6, taper: 0.20, w2: 0.04, p2: 0.5, w3: 0.05, p3: 1.2, dr: 0.4, agujero: [-2, 0.5] },
  { th: -18, a: 19.0, b: 15.0, e: 2.2, taper: -0.24, w2: 0.06, p2: 2.0, w3: 0.03, p3: 0.3, dr: -0.6, agujero: [2, -1] },
  { th: 54, a: 20.0, b: 13.4, e: 3.1, taper: 0.12, w2: 0.03, p2: 4.0, w3: 0.06, p3: 2.5, dr: 0.8, agujero: [-1, 0] },
  { th: 126, a: 18.5, b: 14.6, e: 2.4, taper: -0.16, w2: 0.07, p2: 1.0, w3: 0.04, p3: 5.0, dr: -0.4, agujero: [1.5, 0.5] },
  { th: 198, a: 19.5, b: 13.8, e: 2.9, taper: 0.26, w2: 0.05, p2: 3.0, w3: 0.05, p3: 4.0, dr: 0.2, agujero: [-1, -0.5] },
];
const RONDA_R = 37.5; // radio del eje del anillo
const HUECO = 3.0; // separación mínima entre presas
const AGUJERO = 3.1; // radio del agujero del bulón

function presa(cx, cy, h, { n = 36, conAgujero = true } = {}) {
  const { th, a, b, e, taper, w2, p2, w3, p3, dr, agujero } = h;
  const t0 = rad(th);
  const D = (2 * Math.PI) / PRESAS.length;
  const g = RONDA_R * D - 2 * a;
  const ubicar = (u, v) => {
    const rr = RONDA_R + dr + v;
    const ang = t0 + (u / a) * (D / 2 - g / (2 * rr)); // cuña: hueco de ancho parejo
    return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)];
  };
  const pts = [];
  for (let i = 0; i < n; i++) {
    const f = (2 * Math.PI * i) / n;
    const c = Math.cos(f), s = Math.sin(f);
    const cu = Math.sign(c) * Math.abs(c) ** (2 / (e + 1.6));
    const sv = Math.sign(s) * Math.abs(s) ** (2 / e);
    const k = 1 + w2 * Math.cos(2 * f + p2) + w3 * Math.cos(3 * f + p3);
    pts.push(ubicar(a * cu * (1 + 0.3 * (k - 1)), b * sv * k * (1 + 0.6 * taper * cu)));
  }
  let d = curvaSuave(pts);
  if (conAgujero) d += circulo(...ubicar(agujero[0], agujero[1]), AGUJERO);
  return { d, pts };
}

let ESCALA_PRESAS = null;
function ajustarRonda() {
  if (ESCALA_PRESAS) return ESCALA_PRESAS;
  const dist = (A, B) => { let m = Infinity; for (const p of A) for (const q of B) m = Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1])); return m; };
  let lo = 0.6, hi = 1.6;
  for (let it = 0; it < 30; it++) {
    const f = (lo + hi) / 2;
    const cs = PRESAS.map((h) => presa(0, 0, { ...h, a: h.a * f }, { n: 90, conAgujero: false }).pts);
    let gmin = Infinity;
    for (let i = 0; i < cs.length; i++) gmin = Math.min(gmin, dist(cs[i], cs[(i + 1) % cs.length]));
    if (gmin > HUECO) lo = f; else hi = f;
  }
  return (ESCALA_PRESAS = lo);
}
function ronda(cx, cy, { conAgujero = true } = {}) {
  const f = ajustarRonda();
  return PRESAS.map((h) => presa(cx, cy, { ...h, a: h.a * f }, { conAgujero }).d).join('');
}
function cajaRonda(cx, cy) {
  const f = ajustarRonda();
  const pts = PRESAS.flatMap((h) => presa(cx, cy, { ...h, a: h.a * f }, { n: 120, conAgujero: false }).pts);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

// ---------------------------------------------------------------- composiciones
const RO = 104; // ancho que ocupa la ronda como O
const ESPACIO = { 'L-A': 6, 'A-_': 38, '_-R': 0, 'R-O': 7, 'O-C': 8, 'C-A': 5 };

function linea(texto, x0, y0) {
  // texto: "LA" o "ROCA" o "LA ROCA"; devuelve { letras, ronda, ancho }
  let x = x0, letras = '', anillo = '';
  let prev = null;
  for (const ch of texto) {
    if (ch === ' ') { x += ESPACIO['A-_']; prev = '_'; continue; }
    if (prev && prev !== '_') x += ESPACIO[`${prev}-${ch}`] ?? 8;
    if (ch === 'O') { anillo += ronda(x + RO / 2, y0 + 50); x += RO; }
    else { letras += letra(ch, x, y0); x += LETRAS[ch].ancho; }
    prev = ch;
  }
  return { letras, anillo, ancho: x - x0 };
}

function svg(viewBox, cuerpo, titulo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${titulo}"><title>${titulo}</title>${cuerpo}</svg>\n`;
}
const capa = (d, color, evenodd = false) => (d ? `<path fill="${color}"${evenodd ? ' fill-rule="evenodd"' : ''} d="${d}"/>` : '');

export function logoHorizontal({ letras, anillo }) {
  const l = linea('LA ROCA', 0, 0);
  const b = cajaRonda(0, 0); // margen vertical de la ronda (sobresale un poco)
  const y0 = Math.floor(50 + b.y0) - 1, y1 = Math.ceil(50 + b.y1) + 1;
  return svg(`-1 ${y0} ${fmt(l.ancho + 2)} ${y1 - y0}`, capa(l.letras, letras) + capa(l.anillo, anillo, true), 'La Roca');
}
export function logoVertical({ letras, anillo }) {
  const abajo = linea('ROCA', 0, 132);
  const arriba = linea('LA', 0, 0);
  const dx = (abajo.ancho - arriba.ancho) / 2;
  const top = linea('LA', dx, 0);
  const b = cajaRonda(0, 0);
  const y1 = Math.ceil(132 + 50 + b.y1) + 1;
  return svg(`-1 -1 ${fmt(abajo.ancho + 2)} ${y1 + 1}`, capa(top.letras + abajo.letras, letras) + capa(abajo.anillo, anillo, true), 'La Roca');
}
export function isotipo(color, { conAgujero = true } = {}) {
  const b = cajaRonda(60, 60);
  const m = 1;
  return svg(`${fmt(b.x0 - m)} ${fmt(b.y0 - m)} ${fmt(b.x1 - b.x0 + 2 * m)} ${fmt(b.y1 - b.y0 + 2 * m)}`, capa(ronda(60, 60, { conAgujero }), color, true), 'La Roca, isotipo');
}
export function icono(fondo, color, { conAgujero = true } = {}) {
  // Cuadrado completo: cada plataforma le pone sus propias esquinas o lo recorta en círculo.
  const lado = 180;
  return svg(`0 0 ${lado} ${lado}`, `<rect width="${lado}" height="${lado}" fill="${fondo}"/>` + capa(ronda(lado / 2, lado / 2, { conAgujero }), color, true), 'La Roca');
}

// ---------------------------------------------------------------- variantes
const VARIANTES = {
  '': { letras: C.noche, anillo: C.naranja, uso: 'Color, sobre fondos claros' },
  '-fondo-oscuro': { letras: C.magnesio, anillo: C.naranja, uso: 'Color, sobre fondos oscuros' },
  '-fondo-naranja': { letras: C.noche, anillo: C.magnesio, uso: 'Sobre fondo naranja' },
  '-una-tinta-noche': { letras: C.noche, anillo: C.noche, uso: 'Una tinta oscura (sellos, grabados, fotocopias)' },
  '-una-tinta-blanco': { letras: BLANCO, anillo: BLANCO, uso: 'Una tinta blanca, sobre fotos o fondos oscuros' },
  '-una-tinta-naranja': { letras: C.naranja, anillo: C.naranja, uso: 'Una tinta naranja, sobre fondos claros' },
};

export const ARCHIVOS = {};
for (const [suf, v] of Object.entries(VARIANTES)) {
  ARCHIVOS[`logo/la-roca-horizontal${suf}.svg`] = logoHorizontal(v);
  ARCHIVOS[`logo/la-roca-vertical${suf}.svg`] = logoVertical(v);
}
ARCHIVOS['isotipo/ronda.svg'] = isotipo(C.naranja);
ARCHIVOS['isotipo/ronda-noche.svg'] = isotipo(C.noche);
ARCHIVOS['isotipo/ronda-blanco.svg'] = isotipo(BLANCO);
ARCHIVOS['isotipo/ronda-simple.svg'] = isotipo(C.naranja, { conAgujero: false });
ARCHIVOS['icono/icono-noche.svg'] = icono(C.noche, C.naranja);
ARCHIVOS['icono/icono-naranja.svg'] = icono(C.naranja, C.magnesio);
ARCHIVOS['icono/icono-magnesio.svg'] = icono(C.magnesio, C.naranja);
ARCHIVOS['icono/favicon.svg'] = isotipo(C.naranja, { conAgujero: false });

ARCHIVOS['colores.css'] = `/* La Roca · colores y tipografías de marca (generado por brand/fuente/generar.mjs) */
:root {
${Object.entries(COLORES).map(([k, v]) => `  --roca-${k}: ${v.hex.toLowerCase()}; /* ${v.nombre}. ${v.uso} */`).join('\n')}

  --roca-fuente-titulos: "Unbounded", "Arial Black", system-ui, sans-serif;
  --roca-fuente-texto: "Instrument Sans", "Segoe UI", system-ui, sans-serif;
}
`;

ARCHIVOS['colores.json'] = JSON.stringify(
  Object.fromEntries(Object.entries(COLORES).map(([k, v]) => [k, { ...v, rgb: v.hex.match(/[0-9A-F]{2}/gi).map((h) => parseInt(h, 16)) }])),
  null, 2,
) + '\n';

// ---------------------------------------------------------------- hojas de referencia
const FUENTE_TEXTO = "'Instrument Sans', 'Segoe UI', Arial, sans-serif";
const FUENTE_TITULOS = "Unbounded, 'Arial Black', sans-serif";
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function interior(svgTexto) {
  const vb = svgTexto.match(/viewBox="([^"]+)"/)[1];
  const cuerpo = svgTexto.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>.*?<\/title>/, '');
  return { vb, cuerpo };
}
function encajar(svgTexto, x, y, w, h) {
  const { vb, cuerpo } = interior(svgTexto);
  return `<svg x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" viewBox="${vb}">${cuerpo}</svg>`;
}
const textoColor = (hex) => (['#0D1B26', '#C4400F'].includes(hex) ? C.magnesio : C.noche);

function hojaPaleta() {
  const W = 1200, H = 760, m = 40, g = 16;
  const fila1 = ['naranja', 'tostado', 'noche', 'magnesio'];
  const fila2 = ['durazno', 'lila', 'menta'];
  let s = `<style>@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600&amp;family=Unbounded:wght@700&amp;display=swap');</style>`;
  s += `<rect width="${W}" height="${H}" fill="${BLANCO}"/>`;
  s += `<text x="${m}" y="70" font-family="${FUENTE_TITULOS}" font-weight="700" font-size="34" fill="${C.noche}">Paleta de La Roca</text>`;
  s += `<text x="${m}" y="106" font-family="${FUENTE_TEXTO}" font-size="18" fill="${C.noche}">El naranja manda. Noche y magnesio ordenan. Durazno, lila y menta son los colores de las presas: acentos, no protagonistas.</text>`;
  const caja = (k, x, y, w, h) => {
    const c = COLORES[k], tc = textoColor(c.hex);
    const rgb = c.hex.match(/[0-9A-F]{2}/gi).map((v) => parseInt(v, 16)).join(' ');
    return `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" rx="18" fill="${c.hex}"${k === 'magnesio' ? ' stroke="#D5DAD4"' : ''}/>` +
      `<text x="${fmt(x + 22)}" y="${fmt(y + 42)}" font-family="${FUENTE_TEXTO}" font-weight="600" font-size="22" fill="${tc}">${esc(c.nombre)}</text>` +
      `<text x="${fmt(x + 22)}" y="${fmt(y + h - 48)}" font-family="${FUENTE_TEXTO}" font-size="17" fill="${tc}">HEX ${c.hex}</text>` +
      `<text x="${fmt(x + 22)}" y="${fmt(y + h - 24)}" font-family="${FUENTE_TEXTO}" font-size="17" fill="${tc}">RGB ${rgb}</text>`;
  };
  const y1 = 140, h1 = 330, wPrin = 420;
  const wResto = (W - 2 * m - wPrin - 3 * g) / 3;
  s += caja('naranja', m, y1, wPrin, h1);
  fila1.slice(1).forEach((k, i) => { s += caja(k, m + wPrin + g + i * (wResto + g), y1, wResto, h1); });
  const y2 = y1 + h1 + g, h2 = H - y2 - m, w2 = (W - 2 * m - 2 * g) / 3;
  fila2.forEach((k, i) => { s += caja(k, m + i * (w2 + g), y2, w2, h2); });
  return svg(`0 0 ${W} ${H}`, s, 'Paleta de La Roca');
}

function hojaTipografia() {
  const W = 1200, H = 860, m = 48;
  const imp = `<style>@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600&amp;family=Unbounded:wght@500;700&amp;display=swap');</style>`;
  let s = imp + `<rect width="${W}" height="${H}" fill="${C.magnesio}"/>`;
  const t = (x, y, txt, fam, peso, tam, color = C.noche, extra = '') => `<text x="${x}" y="${y}" font-family="${fam}" font-weight="${peso}" font-size="${tam}" fill="${color}"${extra}>${esc(txt)}</text>`;
  s += t(m, 70, 'TÍTULOS', FUENTE_TEXTO, 600, 15, C.tostado, ' letter-spacing="2.5"');
  s += t(m, 150, 'Unbounded', FUENTE_TITULOS, 700, 76);
  s += t(m, 214, 'Arriba, la cabeza se calla.', FUENTE_TITULOS, 700, 40);
  s += t(m, 270, 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnÑñOoPpQqRrSsTtUuVvWwXxYyZz', FUENTE_TITULOS, 500, 25);
  s += t(m, 306, '0123456789 ¿?¡! áéíóú', FUENTE_TITULOS, 500, 25);
  s += t(m, 344, 'Pesos 500 y 700 · Google Fonts · licencia libre (OFL)', FUENTE_TEXTO, 400, 17, '#4A5A66');
  s += `<line x1="${m}" y1="392" x2="${W - m}" y2="392" stroke="#C3CBC6" stroke-width="1.5"/>`;
  s += t(m, 452, 'TEXTO', FUENTE_TEXTO, 600, 15, C.tostado, ' letter-spacing="2.5"');
  s += t(m, 530, 'Instrument Sans', FUENTE_TEXTO, 600, 72);
  const parrafo = [
    'En la pared no hay notificaciones: hay una presa, la siguiente y tu respiración.',
    'Escalar te pide estar presente, leer el problema y animarte a soltar el miedo',
    'de a poco. Esa calma se queda con vos cuando bajás.',
  ];
  parrafo.forEach((l, i) => { s += t(m, 590 + i * 34, l, FUENTE_TEXTO, 400, 23); });
  s += t(m, 720, 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnÑñOoPpQqRrSsTtUuVvWwXxYyZz 0123456789', FUENTE_TEXTO, 400, 23);
  s += t(m, 760, 'Pesos 400, 500 y 600 · Google Fonts · licencia libre (OFL)', FUENTE_TEXTO, 400, 17, '#4A5A66');
  s += t(m, 812, 'El logo no usa estas tipografías: sus letras están dibujadas a mano. Estas son para títulos y textos.', FUENTE_TEXTO, 400, 17, '#4A5A66');
  return svg(`0 0 ${W} ${H}`, s, 'Tipografías de La Roca');
}

function hojaVersiones() {
  const W = 1200, m = 32, g = 16, colW = (W - 2 * m - g) / 2;
  const filas = [
    ['', C.magnesio], ['-fondo-oscuro', C.noche], ['-fondo-naranja', C.naranja],
    ['-una-tinta-noche', BLANCO], ['-una-tinta-blanco', '#4A5A66'], ['-una-tinta-naranja', BLANCO],
  ];
  const hFila = 190;
  let y = m, s = '';
  for (const [suf, fondo] of filas) {
    const horiz = ARCHIVOS[`logo/la-roca-horizontal${suf}.svg`], vert = ARCHIVOS[`logo/la-roca-vertical${suf}.svg`];
    const rH = interior(horiz).vb.split(' ').map(Number), rV = interior(vert).vb.split(' ').map(Number);
    const wH = colW * 0.66, hH = (wH * rH[3]) / rH[2];
    const hV = 128, wV = (hV * rV[2]) / rV[3];
    const borde = fondo === BLANCO ? ' stroke="#D5DAD4"' : '';
    s += `<rect x="${m}" y="${y}" width="${fmt(colW)}" height="${hFila}" rx="14" fill="${fondo}"${borde}/>`;
    s += encajar(horiz, m + (colW - wH) / 2, y + (hFila - hH) / 2, wH, hH);
    s += `<rect x="${fmt(m + colW + g)}" y="${y}" width="${fmt(colW)}" height="${hFila}" rx="14" fill="${fondo}"${borde}/>`;
    s += encajar(vert, m + colW + g + (colW - wV) / 2, y + (hFila - hV) / 2, wV, hV);
    y += hFila + g;
  }
  const iconos = ['isotipo/ronda.svg', 'isotipo/ronda-noche.svg', 'isotipo/ronda-simple.svg', 'icono/icono-noche.svg', 'icono/icono-naranja.svg', 'icono/icono-magnesio.svg'];
  const celda = (W - 2 * m) / 6, lado = celda - 48;
  s += `<rect x="${m}" y="${y}" width="${W - 2 * m}" height="${fmt(lado + 48)}" rx="14" fill="${BLANCO}" stroke="#D5DAD4"/>`;
  iconos.forEach((p, i) => { s += encajar(ARCHIVOS[p], m + i * celda + 24, y + 24, lado, lado); });
  y += lado + 48 + m;
  return svg(`0 0 ${W} ${fmt(y)}`, `<rect width="${W}" height="${fmt(y)}" fill="#E9ECE8"/>` + s, 'Versiones del logo de La Roca');
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
