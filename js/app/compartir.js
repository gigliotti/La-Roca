// El diálogo para armar la historia de Instagram de un hito

import { config } from './config.js';
import { $, mensajeDe } from './comun.js';
import {
  armarPlaca, dibujarConSimbolo, dibujarConVideo, prepararEstudio, formatoDeGrabacion,
  lienzoABlob, textoParaCompartir, nombreDeArchivo, compartirArchivo,
} from './historia.js';

const dialogo = $('#compartir');
const lienzo = $('#lienzo');
const ctx = lienzo.getContext('2d');
const opcionesVideo = $('#opciones-video');
const conNombre = $('#con-nombre');
const conVideo = $('#con-video');
const conSonido = $('#con-sonido');
const desde = $('#desde');
const desdeValor = $('#desde-valor');
const campoDesde = $('#campo-desde');
const armar = $('#armar');
const listo = $('#listo');
const compartirYa = $('#compartir-ya');
const descargar = $('#descargar');
const estado = $('#compartir-estado');
const armando = $('#armando');
const progreso = $('#armando-progreso');
const textoCompartir = $('#texto-compartir');

const puedeCompartirArchivos = (() => {
  try {
    return Boolean(navigator.canShare?.({ files: [new File([new Blob(['x'])], 'x.png', { type: 'image/png' })] }));
  } catch {
    return false;
  }
})();

let sesion = null; // lo que hay abierto ahora

const mostrarEstado = (texto, tipo = 'ok') => {
  estado.textContent = texto;
  estado.dataset.tipo = tipo;
};

const estiloElegido = () => dialogo.querySelector('input[name="estilo"]:checked')?.value ?? 'arena';

function ponerResultado(archivo) {
  if (sesion.urlResultado) URL.revokeObjectURL(sesion.urlResultado);
  sesion.resultado = archivo;
  sesion.urlResultado = archivo ? URL.createObjectURL(archivo) : null;
  listo.hidden = !archivo;
  if (archivo) {
    descargar.href = sesion.urlResultado;
    descargar.download = archivo.name;
  } else {
    descargar.removeAttribute('href');
  }
}

const modoVideo = () => Boolean(sesion.estudio && conVideo.checked && formatoDeGrabacion());

// Redibuja la vista previa con las opciones elegidas
async function actualizar() {
  const actual = sesion;
  const placa = await armarPlaca({ hito: actual.hito, nombre: actual.nombre, estilo: estiloElegido(), conNombre: conNombre.checked });
  if (actual !== sesion) return;
  actual.placa = placa;
  ponerResultado(null);
  mostrarEstado('');

  if (actual.estudio) {
    await actual.estudio.usarPlaca(placa);
    conSonido.disabled = !conVideo.checked;
    campoDesde.hidden = actual.estudio.duracion <= config.segundosHistoria + 0.5;
  } else {
    dibujarConSimbolo(ctx, placa);
  }

  armar.hidden = !modoVideo();
  if (!modoVideo()) {
    // Imagen: queda lista para compartir enseguida
    const blob = await lienzoABlob(lienzo);
    if (actual !== sesion) return;
    ponerResultado(new File([blob], nombreDeArchivo(actual.hito, 'png'), { type: 'image/png' }));
  }
}

export async function abrirCompartir({ hito, nombre, obtenerVideo }) {
  cerrarSesion();
  sesion = { hito, nombre, estudio: null, placa: null, resultado: null, urlResultado: null, control: null };
  const actual = sesion;

  textoCompartir.textContent = textoParaCompartir(hito);
  compartirYa.hidden = !puedeCompartirArchivos;
  descargar.classList.toggle('boton-borde', puedeCompartirArchivos);
  opcionesVideo.hidden = true;
  armar.hidden = true;
  listo.hidden = true;
  armando.hidden = true;
  mostrarEstado('');
  ctx.clearRect(0, 0, lienzo.width, lienzo.height);
  dialogo.showModal();

  if (hito.video_path && obtenerVideo) {
    mostrarEstado('Cargando el video…');
    try {
      const blob = await obtenerVideo();
      const estudio = await prepararEstudio(lienzo, blob);
      if (actual !== sesion) return estudio.cerrar();
      actual.estudio = estudio;
      opcionesVideo.hidden = false;
      const maximo = Math.max(0, Math.floor((estudio.duracion - 1) * 2) / 2);
      desde.max = String(maximo);
      desde.value = '0';
      desdeValor.textContent = '0';
      conVideo.disabled = !formatoDeGrabacion();
      conVideo.checked = Boolean(formatoDeGrabacion());
      await estudio.irA(0);
    } catch (error) {
      mostrarEstado(`${mensajeDe(error)} Va con el símbolo de La Roca.`, 'error');
    }
  }
  if (actual === sesion) await actualizar();
}

function cerrarSesion() {
  if (!sesion) return;
  sesion.control?.abort();
  sesion.estudio?.cerrar();
  if (sesion.urlResultado) URL.revokeObjectURL(sesion.urlResultado);
  sesion = null;
}

dialogo.addEventListener('close', cerrarSesion);

dialogo.addEventListener('change', (evento) => {
  if (!sesion || evento.target === desde) return;
  actualizar();
});

desde.addEventListener('input', async () => {
  desdeValor.textContent = desde.value;
  if (!sesion?.estudio) return;
  await sesion.estudio.irA(Number(desde.value));
  ponerResultado(null);
  if (!modoVideo()) {
    const blob = await lienzoABlob(lienzo);
    ponerResultado(new File([blob], nombreDeArchivo(sesion.hito, 'png'), { type: 'image/png' }));
  }
});

armar.addEventListener('click', () => {
  const actual = sesion;
  if (!actual?.estudio) return;
  actual.control = new AbortController();
  armar.disabled = true;
  const campos = [...dialogo.querySelectorAll('.compartir-opciones input')].filter((campo) => !campo.disabled);
  for (const campo of campos) campo.disabled = true;
  armando.hidden = false;
  progreso.value = 0;
  mostrarEstado('');
  // grabar() se llama directo desde el toque (ver historia.js)
  actual.estudio.grabar({
    desde: Number(desde.value),
    conSonido: conSonido.checked,
    alProgresar: (valor) => { progreso.value = valor; },
    senal: actual.control.signal,
  }).then((blob) => {
    if (actual !== sesion) return;
    const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
    ponerResultado(new File([blob], nombreDeArchivo(actual.hito, extension), { type: blob.type }));
    mostrarEstado('Listo. Ya podés compartirlo.');
    compartirYa.focus();
  }).catch((error) => {
    if (error?.name !== 'AbortError' && actual === sesion) mostrarEstado(mensajeDe(error), 'error');
  }).finally(() => {
    armar.disabled = false;
    for (const campo of campos) campo.disabled = false;
    armando.hidden = true;
    if (actual === sesion) actual.estudio.irA(Number(desde.value));
  });
});

compartirYa.addEventListener('click', async () => {
  if (!sesion?.resultado) return;
  try {
    const compartido = await compartirArchivo(sesion.resultado);
    if (!compartido) {
      descargar.click();
      mostrarEstado('Lo descargamos: subilo desde Instagram como historia.');
    }
  } catch (error) {
    mostrarEstado('No se pudo abrir el menú para compartir. Descargalo y subilo desde Instagram.', 'error');
  }
});

$('#copiar').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(textoCompartir.textContent);
    mostrarEstado('Texto copiado.');
  } catch {
    mostrarEstado('No se pudo copiar. Mantené apretado el texto para copiarlo.', 'error');
  }
});
