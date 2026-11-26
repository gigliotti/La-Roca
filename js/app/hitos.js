// Tipos de hito, sugerencias para el entrenador y formatos de fecha

import { config } from './config.js';

// El orden sigue al sitio: primero lo de escalar, después cabeza, cuerpo y gente
export const TIPOS = {
  primera_vez: { nombre: 'Primera vez', tono: 'sol' },
  arriba: { nombre: 'Arriba', tono: 'atardecer' },
  grado: { nombre: 'Grado nuevo', tono: 'mar' },
  tecnica: { nombre: 'Técnica', tono: 'mar' },
  cabeza: { nombre: 'Cabeza', tono: 'oxido' },
  cuerpo: { nombre: 'Cuerpo', tono: 'atardecer' },
  gente: { nombre: 'Gente', tono: 'sol' },
  otro: { nombre: 'Logro', tono: 'arena' },
};

// Títulos listos para tocar y guardar. Son frases sin persona gramatical
// para que se lean bien en el perfil y en la historia de Instagram.
export const SUGERENCIAS = [
  { tipo: 'primera_vez', titulos: ['Primera clase en La Roca', 'Primera vez arriba del muro'] },
  { tipo: 'arriba', titulos: ['Arriba por primera vez', 'Primera vía completa', 'Vía completa sin descansar'] },
  { tipo: 'grado', titulos: ['Grado nuevo'] },
  { tipo: 'tecnica', titulos: ['Primer talón', 'Primer dinámico', 'Primera lectura de vía', 'Primer desplome'] },
  { tipo: 'cabeza', titulos: ['Primera caída controlada', 'El miedo a la altura, superado', 'Salió después de insistir'] },
  { tipo: 'cuerpo', titulos: ['Más tiempo que nunca en la pared', 'Travesía completa del muro', 'Primera dominada'] },
  { tipo: 'gente', titulos: ['Primera escalada de a dos', 'Primera secuencia compartida', 'Primera noche de muro'] },
  { tipo: 'otro', titulos: ['Otro logro'] },
];

export const nombreTipo = (tipo) => (TIPOS[tipo] ?? TIPOS.otro).nombre;
export const tonoTipo = (tipo) => (TIPOS[tipo] ?? TIPOS.otro).tono;

// Fechas en hora argentina. Las fechas de los hitos son "AAAA-MM-DD".
export const hoy = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: config.zonaHoraria, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const aFecha = (texto) => {
  const [a, m, d] = texto.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d, 12));
};

const formato = (opciones) => new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', ...opciones });
const fechaCorta = formato({ day: 'numeric', month: 'short' });
const fechaLarga = formato({ day: 'numeric', month: 'short', year: 'numeric' });
const diaSemana = formato({ weekday: 'short' });
const mesAnio = formato({ month: 'long', year: 'numeric' });
const mesAnioCorto = formato({ month: 'short', year: 'numeric' });

const sinPunto = (texto) => texto.replace(/\./g, '');
const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// Arma la fecha con sus partes, sin los "de": "11 nov 2026", "noviembre 2026"
const partes = (formateador, fecha) => formateador.formatToParts(fecha)
  .filter((parte) => parte.type !== 'literal')
  .map((parte) => sinPunto(parte.value))
  .join(' ');

export const fechaHito = (texto) => {
  const fecha = aFecha(texto);
  const anioActual = hoy().slice(0, 4);
  const base = partes(texto.startsWith(anioActual) ? fechaCorta : fechaLarga, fecha);
  return `${mayuscula(sinPunto(diaSemana.format(fecha)))} ${base}`;
};
export const fechaParaHistoria = (texto) => partes(fechaLarga, aFecha(texto));
export const mesDelHito = (texto) => mayuscula(partes(mesAnio, aFecha(texto)));
export const desdeCuando = (texto) => partes(mesAnioCorto, aFecha(texto));

export const primerNombre = (nombre) => (nombre ?? '').trim().split(/\s+/)[0] ?? '';

// Ordena del más nuevo al más viejo y les pone número (el primero es el 1)
export const ordenarVia = (hitos) => {
  const ascendente = [...hitos].sort((a, b) =>
    a.fecha === b.fecha ? a.creado_en.localeCompare(b.creado_en) : a.fecha.localeCompare(b.fecha));
  ascendente.forEach((hito, indice) => { hito.numero = indice + 1; });
  return ascendente.reverse();
};

export const resumenVia = (hitos) => {
  const dias = new Set(hitos.map((hito) => hito.fecha));
  const primero = hitos.reduce((min, hito) => (!min || hito.fecha < min ? hito.fecha : min), null);
  return { hitos: hitos.length, clases: dias.size, desde: primero };
};
