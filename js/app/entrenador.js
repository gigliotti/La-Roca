// Panel del muro: el entrenador elige a la persona y anota su hito de la clase

import { datos, validarVideo } from './datos.js';
import { $, avisar, mensajeDe, iniciarPagina, clonar } from './comun.js';
import { SUGERENCIAS, nombreTipo, tonoTipo, hoy, fechaHito, primerNombre } from './hitos.js';

const yo = await iniciarPagina({ requiere: 'sesion' });

const pasoPersona = $('#paso-persona');
const pasoHito = $('#paso-hito');
const listaPersonas = $('#personas');
const buscar = $('#buscar');
const formHito = $('#form-hito');
const campoTitulo = $('#hito-titulo');
const campoGrado = $('#hito-grado');
const campoFecha = $('#hito-fecha');
const campoNota = $('#hito-nota');
const campoVideo = $('#hito-video');
const sugerencias = $('#sugerencias');

let personas = [];
let elegida = null;
let tipo = null;
let hitosDeHoy = [];

const MAIL_VALIDO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const normalizar = (texto) => (texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const nombreDe = (persona) => persona.nombre || persona.email;

$('#hoy-fecha').textContent = fechaHito(hoy());
$('#hoy-fecha').dateTime = hoy();

/* ---------- Personas ---------- */

function dibujarPersonas() {
  const filtro = normalizar(buscar.value.trim());
  const conHitoHoy = new Set(hitosDeHoy.map((hito) => hito.perfil_id));
  const visibles = personas.filter((p) => !filtro || normalizar(p.nombre).includes(filtro) || normalizar(p.email).includes(filtro));
  listaPersonas.replaceChildren(...visibles.map((persona) => {
    const li = clonar('plantilla-persona');
    const boton = li.querySelector('.persona');
    li.querySelector('.persona-inicial').textContent = nombreDe(persona).charAt(0).toUpperCase();
    li.querySelector('.persona-nombre').textContent = nombreDe(persona);
    const cuantos = hitosDeHoy.filter((hito) => hito.perfil_id === persona.id).length;
    li.querySelector('.persona-dato').textContent = cuantos
      ? `Hoy: ${cuantos} ${cuantos === 1 ? 'hito' : 'hitos'}`
      : (persona.user_id ? persona.email : 'Todavía no entró a su vía');
    boton.classList.toggle('persona-hoy', conHitoHoy.has(persona.id));
    boton.addEventListener('click', () => elegir(persona));
    return li;
  }));
  $('#personas-vacio').hidden = visibles.length > 0 || personas.length === 0;
}

buscar.addEventListener('input', dibujarPersonas);

// Con Enter en el buscador, si queda una sola persona, se elige
buscar.addEventListener('keydown', (evento) => {
  if (evento.key !== 'Enter') return;
  const botones = listaPersonas.querySelectorAll('.persona');
  if (botones.length === 1) {
    evento.preventDefault();
    botones[0].click();
  }
});

$('#form-persona').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const nombre = $('#persona-nombre');
  const email = $('#persona-email');
  const nombreValido = Boolean(nombre.value.trim());
  const emailValido = MAIL_VALIDO.test(email.value.trim());
  nombre.classList.toggle('user-invalid-fallback', !nombreValido);
  email.classList.toggle('user-invalid-fallback', !emailValido);
  if (!nombreValido) return nombre.focus();
  if (!emailValido) return email.focus();
  const boton = evento.submitter ?? evento.target.querySelector('[type="submit"]');
  boton.disabled = true;
  try {
    const persona = await datos.crearCliente({ nombre: nombre.value.trim(), email: email.value.trim().toLowerCase() });
    if (persona.yaExistia) {
      avisar(`${nombreDe(persona)} ya estaba: seguimos con su hito.`);
    } else {
      personas.push(persona);
      personas.sort((a, b) => nombreDe(a).localeCompare(nombreDe(b), 'es'));
    }
    evento.target.reset();
    $('#nueva-persona').open = false;
    elegir(personas.find((p) => p.id === persona.id) ?? persona);
  } catch (error) {
    avisar(mensajeDe(error), 'error');
  } finally {
    boton.disabled = false;
  }
});

/* ---------- Hito ---------- */

function armarSugerencias() {
  for (const grupo of SUGERENCIAS) {
    const fila = document.createElement('div');
    fila.className = 'sugerencias-grupo';
    fila.dataset.tono = tonoTipo(grupo.tipo);
    const titulo = document.createElement('p');
    titulo.className = 'sugerencias-tipo';
    titulo.textContent = nombreTipo(grupo.tipo);
    fila.append(titulo);
    for (const texto of grupo.titulos) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = texto;
      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', () => usarSugerencia(grupo.tipo, texto, chip));
      fila.append(chip);
    }
    sugerencias.append(fila);
  }
}

function usarSugerencia(tipoElegido, texto, chip) {
  tipo = tipoElegido;
  for (const otro of sugerencias.querySelectorAll('.chip')) otro.setAttribute('aria-pressed', String(otro === chip));
  campoTitulo.classList.remove('user-invalid-fallback');
  if (tipoElegido === 'otro') {
    campoTitulo.value = '';
    campoTitulo.focus();
  } else {
    campoTitulo.value = texto;
    if (tipoElegido === 'grado') campoGrado.focus();
  }
}

// Si escribe un título propio, se desmarca la sugerencia
campoTitulo.addEventListener('input', () => {
  const marcada = sugerencias.querySelector('.chip[aria-pressed="true"]');
  if (marcada && marcada.textContent !== campoTitulo.value && tipo !== 'otro' && tipo !== 'grado') {
    marcada.setAttribute('aria-pressed', 'false');
  }
});

campoVideo.addEventListener('change', () => {
  const archivo = campoVideo.files?.[0];
  const nombre = $('#hito-video-nombre');
  if (!archivo) {
    nombre.textContent = 'Hasta 50 MB. Si no, lo puede sumar la persona desde su vía.';
    $('#hito-video-boton').textContent = 'Elegir video';
    return;
  }
  try {
    validarVideo(archivo);
    nombre.textContent = `${archivo.name} · ${(archivo.size / 1024 / 1024).toFixed(1)} MB`;
    $('#hito-video-boton').textContent = 'Cambiar video';
  } catch (error) {
    campoVideo.value = '';
    nombre.textContent = mensajeDe(error);
    avisar(mensajeDe(error), 'error');
  }
});

function limpiarHito() {
  formHito.reset();
  tipo = null;
  for (const chip of sugerencias.querySelectorAll('.chip')) chip.setAttribute('aria-pressed', 'false');
  campoFecha.value = hoy();
  campoFecha.max = hoy();
  $('#hito-video-nombre').textContent = 'Hasta 50 MB. Si no, lo puede sumar la persona desde su vía.';
  $('#hito-video-boton').textContent = 'Elegir video';
  campoTitulo.classList.remove('user-invalid-fallback');
}

function elegir(persona) {
  elegida = persona;
  limpiarHito();
  $('#hito-para').textContent = primerNombre(nombreDe(persona)) || nombreDe(persona);
  pasoPersona.hidden = true;
  pasoHito.hidden = false;
  pasoHito.scrollIntoView({ block: 'start' });
  sugerencias.querySelector('.chip')?.focus({ preventScroll: true });
  const url = new URL(location.href);
  url.searchParams.set('persona', persona.id);
  history.replaceState(null, '', url);
}

function volverAPersonas() {
  elegida = null;
  pasoHito.hidden = true;
  pasoPersona.hidden = false;
  const url = new URL(location.href);
  url.searchParams.delete('persona');
  history.replaceState(null, '', url);
  dibujarPersonas();
  buscar.focus({ preventScroll: true });
}

$('#cambiar-persona').addEventListener('click', volverAPersonas);

formHito.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const titulo = campoTitulo.value.trim();
  campoTitulo.classList.toggle('user-invalid-fallback', !titulo);
  if (!titulo) return campoTitulo.focus();

  const archivo = campoVideo.files?.[0] ?? null;
  const guardar = $('#guardar-hito');
  const subida = $('#hito-subida');
  guardar.disabled = true;
  let hito = null;
  try {
    hito = await datos.crearHito({
      perfil_id: elegida.id,
      tipo: tipo ?? 'otro',
      titulo,
      grado: campoGrado.value.trim() || null,
      nota: campoNota.value.trim() || null,
      fecha: campoFecha.value || hoy(),
    });
    if (archivo) {
      subida.hidden = false;
      const barra = subida.querySelector('progress');
      barra.value = 0;
      try {
        hito = await datos.subirVideo(hito, archivo, (valor) => { barra.value = valor; });
      } catch (error) {
        avisar(`El hito quedó guardado, pero el video no: ${mensajeDe(error)}`, 'error');
      }
    }
    const para = primerNombre(nombreDe(elegida));
    await cargarHoy();
    volverAPersonas();
    avisar(`Listo: «${hito.titulo}» quedó en la vía de ${para}.`);
  } catch (error) {
    avisar(mensajeDe(error), 'error');
  } finally {
    guardar.disabled = false;
    subida.hidden = true;
  }
});

/* ---------- Hoy en el muro ---------- */

function dibujarHoy() {
  const lista = $('#hoy-lista');
  lista.replaceChildren(...hitosDeHoy.map((hito) => {
    const li = clonar('plantilla-hoy');
    li.dataset.tono = tonoTipo(hito.tipo);
    const enlace = li.querySelector('.hoy-persona');
    enlace.textContent = hito.perfil ? nombreDe(hito.perfil) : 'Alguien';
    enlace.href = `perfil?persona=${encodeURIComponent(hito.perfil_id)}`;
    li.querySelector('.hoy-titulo').textContent = [hito.titulo, hito.grado, hito.video_path && 'con video'].filter(Boolean).join(' · ');
    const borrar = li.querySelector('.hoy-borrar');
    let confirmar = null;
    borrar.setAttribute('aria-label', `Borrar «${hito.titulo}» de ${enlace.textContent}`);
    borrar.addEventListener('click', async () => {
      if (!confirmar) {
        borrar.textContent = '¿Borrar? Tocá de nuevo';
        confirmar = setTimeout(() => { borrar.textContent = 'Borrar'; confirmar = null; }, 4000);
        return;
      }
      clearTimeout(confirmar);
      borrar.disabled = true;
      try {
        await datos.borrarHito(hito);
        avisar('Hito borrado.');
        await cargarHoy();
      } catch (error) {
        avisar(mensajeDe(error), 'error');
        borrar.disabled = false;
      }
    });
    return li;
  }));
  $('#hoy-vacio').hidden = hitosDeHoy.length > 0;
}

async function cargarHoy() {
  hitosDeHoy = await datos.hitosDelDia(hoy());
  dibujarHoy();
  dibujarPersonas();
}

/* ---------- Arranque ---------- */

if (yo.rol !== 'entrenador') {
  $('#sin-permiso').hidden = false;
} else {
  armarSugerencias();
  pasoPersona.hidden = false;
  $('#panel-hoy').hidden = false;
  try {
    [personas, hitosDeHoy] = await Promise.all([datos.clientes(), datos.hitosDelDia(hoy())]);
    dibujarHoy();
    dibujarPersonas();
    const pedida = new URLSearchParams(location.search).get('persona');
    const persona = pedida && personas.find((p) => p.id === pedida);
    if (persona) elegir(persona);
  } catch (error) {
    avisar(mensajeDe(error), 'error');
  }
}
