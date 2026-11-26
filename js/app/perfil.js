// Tu vía: el perfil con la línea de hitos, del más nuevo al primero

import { datos, validarVideo } from './datos.js';
import { $, avisar, mensajeDe, iniciarPagina, clonar } from './comun.js';
import { nombreTipo, tonoTipo, fechaHito, mesDelHito, desdeCuando, ordenarVia, resumenVia, primerNombre } from './hitos.js';
import { abrirCompartir } from './compartir.js';

const yo = await iniciarPagina({ requiere: 'sesion' });
const personaId = new URLSearchParams(location.search).get('persona');
const viendoOtro = Boolean(personaId && personaId !== yo.id && yo.rol === 'entrenador');

const lista = $('#via-lista');
const archivosLocales = new Map(); // videos recién subidos: no hace falta bajarlos de nuevo
let perfil = yo;
let hitos = [];

function titular() {
  const titulo = $('#via-titulo');
  titulo.replaceChildren();
  if (viendoOtro) {
    $('#via-antetitulo').textContent = 'La vía de';
    titulo.textContent = perfil.nombre || perfil.email;
    document.title = `La vía de ${perfil.nombre || perfil.email} · La Roca`;
    const sumar = $('#sumar-hito');
    sumar.href = `entrenador?persona=${encodeURIComponent(perfil.id)}`;
    sumar.hidden = false;
    document.querySelector('.nav-app a[href="perfil"]')?.removeAttribute('aria-current');
    return;
  }
  const nombre = primerNombre(perfil.nombre);
  if (nombre) {
    const destacado = document.createElement('em');
    destacado.textContent = nombre;
    titulo.append('Hola, ', destacado, '.');
  } else {
    titulo.textContent = 'Tu vía';
  }
}

function resumir() {
  const resumen = resumenVia(hitos);
  $('#via-resumen').hidden = hitos.length === 0;
  $('#resumen-hitos').textContent = String(resumen.hitos);
  $('#resumen-clases').textContent = String(resumen.clases);
  $('#resumen-desde').textContent = resumen.desde ? desdeCuando(resumen.desde) : '—';

  const proximo = $('#via-proximo');
  proximo.hidden = false;
  $('#via-proximo-texto').textContent = hitos.length
    ? (viendoOtro ? 'El próximo hito lo anotás en la próxima clase.' : 'Tu próximo hito te espera en la próxima clase.')
    : (viendoOtro ? 'Todavía no tiene hitos. El primero lo anotás desde el panel.' : 'Tu vía empieza en tu primera clase: cuando quien te entrena anote tu primer logro, aparece acá.');

  const inicio = $('#via-inicio');
  inicio.hidden = hitos.length === 0;
  if (resumen.desde) inicio.textContent = `Inicio de ${viendoOtro ? 'la' : 'tu'} vía · ${desdeCuando(resumen.desde)}`;
}

// Carga el video cuando la tarjeta está por verse
const observador = new IntersectionObserver((entradas) => {
  for (const entrada of entradas) {
    if (!entrada.isIntersecting) continue;
    observador.unobserve(entrada.target);
    const video = entrada.target;
    datos.urlVideo(video.dataset.ruta)
      .then((url) => { video.src = `${url}#t=0.1`; })
      .catch(() => { video.closest('.hito-video').hidden = true; });
  }
}, { rootMargin: '400px 0px' });

function tarjeta(hito) {
  const li = clonar('plantilla-hito');
  li.dataset.id = hito.id;
  li.dataset.tono = tonoTipo(hito.tipo);
  const fecha = li.querySelector('.hito-fecha');
  fecha.dateTime = hito.fecha;
  fecha.textContent = fechaHito(hito.fecha);
  li.querySelector('.hito-tipo').textContent = nombreTipo(hito.tipo);
  li.querySelector('.hito-titulo').textContent = hito.titulo;

  if (hito.grado) {
    const grado = li.querySelector('.hito-grado');
    grado.hidden = false;
    grado.textContent = hito.grado;
  }
  if (hito.nota) {
    const nota = li.querySelector('.hito-nota');
    nota.hidden = false;
    li.querySelector('.hito-nota-texto').textContent = hito.nota;
    li.querySelector('.hito-nota-firma').textContent = hito.entrenador_nombre ? `${primerNombre(hito.entrenador_nombre)}, ${viendoOtro ? 'entrenador' : 'tu entrenador'}` : '';
  }
  if (hito.video_path) {
    li.querySelector('.hito-video').hidden = false;
    const video = li.querySelector('video');
    video.dataset.ruta = hito.video_path;
    video.setAttribute('aria-label', `Video: ${hito.titulo}`);
    observador.observe(video);
    li.querySelector('.hito-subir-texto').textContent = 'Cambiar video';
  }

  li.querySelector('[data-accion="compartir"]').addEventListener('click', () => compartir(hito));
  const entrada = li.querySelector('input[type="file"]');
  entrada.addEventListener('change', () => {
    const archivo = entrada.files?.[0];
    entrada.value = '';
    if (archivo) subir(hito, archivo, li);
  });
  return li;
}

function dibujarVia() {
  $('#via-cargando').hidden = true;
  const elementos = [];
  let mes = null;
  for (const hito of hitos) {
    const esteMes = hito.fecha.slice(0, 7);
    if (esteMes !== mes) {
      mes = esteMes;
      const separador = clonar('plantilla-mes');
      separador.querySelector('.cinta').textContent = mesDelHito(hito.fecha);
      elementos.push(separador);
    }
    elementos.push(tarjeta(hito));
  }
  lista.replaceChildren(...elementos);
  resumir();
}

function compartir(hito) {
  abrirCompartir({
    hito,
    nombre: perfil.nombre,
    obtenerVideo: hito.video_path
      ? async () => archivosLocales.get(hito.video_path) ?? datos.archivoVideo(hito.video_path)
      : null,
  });
}

async function subir(hito, archivo, li) {
  try {
    validarVideo(archivo);
  } catch (error) {
    avisar(mensajeDe(error), 'error');
    return;
  }
  const subida = li.querySelector('.hito-subida');
  const barra = subida.querySelector('progress');
  const acciones = li.querySelector('.hito-acciones');
  subida.hidden = false;
  barra.value = 0;
  acciones.inert = true;
  try {
    const actualizado = await datos.subirVideo(hito, archivo, (valor) => { barra.value = valor; });
    archivosLocales.set(actualizado.video_path, archivo);
    Object.assign(hito, actualizado);
    li.replaceWith(tarjeta(hito));
    avisar('Listo, el video quedó en el hito.');
    // Lo siguiente que querés hacer: compartirlo
    compartir(hito);
  } catch (error) {
    avisar(mensajeDe(error), 'error');
    subida.hidden = true;
    acciones.inert = false;
  }
}

// Bienvenida: si entró sola, pedirle el nombre
function bienvenida() {
  const form = $('#bienvenida');
  if (viendoOtro || perfil.nombre) return;
  form.hidden = false;
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const campo = $('#bienvenida-nombre');
    const nombre = campo.value.trim();
    campo.classList.toggle('user-invalid-fallback', !nombre);
    if (!nombre) return campo.focus();
    try {
      perfil = await datos.guardarPerfil(perfil.id, { nombre });
      form.hidden = true;
      titular();
      llenarDatos();
      avisar(`¡Hola, ${primerNombre(nombre)}!`);
    } catch (error) {
      avisar(mensajeDe(error), 'error');
    }
  });
}

function llenarDatos() {
  if (viendoOtro) return;
  $('#tus-datos').hidden = false;
  $('#datos-nombre').value = perfil.nombre ?? '';
  $('#datos-instagram').value = perfil.instagram ? `@${perfil.instagram}` : '';
  $('#datos-email').textContent = perfil.email;
}

$('#form-datos').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const nombre = $('#datos-nombre');
  const instagram = $('#datos-instagram');
  const nombreValido = Boolean(nombre.value.trim());
  const instagramValido = instagram.checkValidity();
  nombre.classList.toggle('user-invalid-fallback', !nombreValido);
  instagram.classList.toggle('user-invalid-fallback', !instagramValido);
  if (!nombreValido || !instagramValido) return;
  try {
    perfil = await datos.guardarPerfil(perfil.id, {
      nombre: nombre.value.trim(),
      instagram: instagram.value.trim().replace(/^@/, '').toLowerCase() || null,
    });
    titular();
    llenarDatos();
    avisar('Guardado.');
  } catch (error) {
    avisar(mensajeDe(error), 'error');
  }
});

try {
  if (viendoOtro) {
    perfil = await datos.perfil(personaId);
    if (!perfil) throw new Error('No encontramos a esa persona.');
  }
  titular();
  bienvenida();
  llenarDatos();
  hitos = ordenarVia(await datos.hitosDe(perfil.id));
  dibujarVia();
} catch (error) {
  $('#via-cargando').textContent = mensajeDe(error);
}
