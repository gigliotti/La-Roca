// La Roca · historia para Instagram (1080 × 1920)
//
// Arma una placa con la marca: el logo arriba, el arco de La Roca como
// ventana (con el video del hito adentro, o el símbolo si no hay video),
// la cinta con el número y la fecha, el título del hito y quién lo acompañó.
// Con video, graba la placa animada con MediaRecorder; sin video, es una imagen.

import { config } from './config.js';
import { fechaParaHistoria, primerNombre } from './hitos.js';

export const ANCHO = 1080;
export const ALTO = 1920;
// El arco tiene las proporciones del símbolo: ancho 4, alto 5, medio círculo arriba
const ARCO = { x: 190, y: 430, ancho: 700, alto: 875 };

const COLOR = {
  sol: '#FF7A2F',
  hondo: '#102A40',
  mar: '#1E4F7A',
  arena: '#F3E3CF',
  arenaSuave: '#CDBFAD',
};

export const ESTILOS = {
  arena: {
    fondo: COLOR.arena,
    punto: 'rgba(16, 42, 64, 0.13)',
    texto: COLOR.hondo,
    suave: COLOR.mar,
    logo: 'img/marca/la-roca-horizontal.svg',
  },
  noche: {
    fondo: COLOR.hondo,
    punto: 'rgba(243, 227, 207, 0.1)',
    texto: COLOR.arena,
    suave: COLOR.arenaSuave,
    logo: 'img/marca/la-roca-horizontal-fondo-oscuro.svg',
  },
};

// El símbolo de la marca (img/marca/favicon.svg), en su caja de 80 × 100
const SIMBOLO = 'M0 100V40A40 40 0 0 1 80 40V100ZM24.5 59A17 17 0 1 1 55.5 59ZM39.8 64.2H70.2A1.8 1.8 0 0 1 70.2 67.8H39.8A1.8 1.8 0 0 1 39.8 64.2ZM44.8 72.2H66.2A1.8 1.8 0 0 1 66.2 75.8H44.8A1.8 1.8 0 0 1 44.8 72.2ZM49.8 80.2H64.2A1.8 1.8 0 0 1 64.2 83.8H49.8A1.8 1.8 0 0 1 49.8 80.2ZM0 100Q0 100 0 100L0 82Q0 75 4 70.5L4 70.5Q8 66 13 66.5L13 66.5Q18 67 22 71.5L22 71.5Q26 76 29.5 81L29.56 81.08Q33 86 35.02 91.65L38 100Q38 100 38 100Z';

const FUENTES = [
  '400 96px "DM Serif Display"',
  '500 40px "DM Sans"',
  '600 26px "DM Sans"',
  '400 44px "Permanent Marker"',
];

const logos = new Map();

async function cargarLogo(ruta) {
  if (logos.has(ruta)) return logos.get(ruta);
  const promesa = (async () => {
    // Se le pone tamaño al SVG para que se dibuje nítido en el lienzo
    const texto = await (await fetch(ruta)).text();
    const conTamano = texto.replace('<svg ', '<svg width="1420" height="416" ');
    const url = URL.createObjectURL(new Blob([conTamano], { type: 'image/svg+xml' }));
    const imagen = new Image();
    imagen.src = url;
    await imagen.decode();
    return imagen;
  })();
  logos.set(ruta, promesa);
  return promesa;
}

export async function cargarFuentes() {
  if (!document.fonts?.load) return;
  await Promise.all(FUENTES.map((fuente) => document.fonts.load(fuente).catch(() => null)));
}

function caminoArco(ctx) {
  const { x, y, ancho, alto } = ARCO;
  const radio = ancho / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + alto);
  ctx.lineTo(x, y + radio);
  ctx.arc(x + radio, y + radio, radio, Math.PI, 0);
  ctx.lineTo(x + ancho, y + alto);
  ctx.closePath();
}

function espaciar(ctx, valor) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = valor;
}

// Corta un texto en renglones que entren en el ancho
function renglones(ctx, texto, anchoMax) {
  const palabras = texto.split(/\s+/);
  const lineas = [];
  let actual = '';
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width <= anchoMax || !actual) actual = prueba;
    else {
      lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

// La cinta de marcar vías, con los bordes cortados a mano
function dibujarCinta(ctx, texto, centroX, centroY) {
  ctx.save();
  ctx.font = FUENTES[3];
  espaciar(ctx, '0px');
  const anchoTexto = ctx.measureText(texto).width;
  const ancho = anchoTexto + 64;
  const alto = 78;
  ctx.translate(centroX, centroY);
  ctx.rotate((-2 * Math.PI) / 180);
  const puntos = [[0, 10], [3, 0], [97, 5], [100, 0], [98, 32], [100, 58], [97, 82], [100, 100], [4, 95], [0, 100], [2, 68], [0, 42], [3, 22]];
  ctx.beginPath();
  puntos.forEach(([px, py], indice) => {
    const x = -ancho / 2 + (px / 100) * ancho;
    const y = -alto / 2 + (py / 100) * alto;
    if (indice === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = COLOR.sol;
  ctx.fill();
  ctx.fillStyle = COLOR.hondo;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, 0, 4);
  ctx.restore();
}

export function textoDelHito(hito) {
  return hito.grado ? `${hito.titulo} · ${hito.grado}` : hito.titulo;
}

// Todo lo que no se mueve: fondo, logo, cinta y textos. El arco queda
// transparente, para que el video (o el símbolo) se vea solo adentro.
export async function armarPlaca({ hito, nombre, estilo = 'arena', conNombre = true }) {
  const tema = ESTILOS[estilo] ?? ESTILOS.arena;
  const [logo] = await Promise.all([cargarLogo(tema.logo), cargarFuentes()]);

  const placa = document.createElement('canvas');
  placa.width = ANCHO;
  placa.height = ALTO;
  const ctx = placa.getContext('2d');

  // Fondo con la grilla de agujeros de un panel de muro
  ctx.fillStyle = tema.fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.fillStyle = tema.punto;
  for (let y = 30; y < ALTO; y += 60) {
    for (let x = 30; x < ANCHO; x += 60) {
      ctx.beginPath();
      ctx.arc(x, y, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ventana del arco
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  caminoArco(ctx);
  ctx.fill();
  ctx.restore();

  // Logo (la horizontal nunca se reescribe con una tipografía)
  const anchoLogo = 520;
  const altoLogo = (anchoLogo * 104) / 355.08;
  ctx.drawImage(logo, (ANCHO - anchoLogo) / 2, 236, anchoLogo, altoLogo);

  // Cinta con el número de hito y la fecha
  const pie = ARCO.y + ARCO.alto;
  const cinta = hito.numero ? `Hito ${hito.numero} · ${fechaParaHistoria(hito.fecha)}` : fechaParaHistoria(hito.fecha);
  dibujarCinta(ctx, cinta, ANCHO / 2, pie + 72);

  // Título: hasta dos renglones; si no entra, más chico
  ctx.fillStyle = tema.texto;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  espaciar(ctx, '-1px');
  const titulo = textoDelHito(hito);
  let tamano = 96;
  let lineas;
  do {
    ctx.font = `400 ${tamano}px "DM Serif Display"`;
    lineas = renglones(ctx, titulo, 920);
    tamano -= 8;
  } while (lineas.length > 2 && tamano >= 64);
  tamano += 8;
  lineas = lineas.slice(0, 3);
  let base = pie + 150 + tamano * 0.78;
  for (const linea of lineas) {
    ctx.fillText(linea, ANCHO / 2, base);
    base += tamano * 1.04;
  }

  // Quién escaló y con quién
  const quien = conNombre ? primerNombre(nombre) : '';
  const entrenador = hito.entrenador_nombre ? primerNombre(hito.entrenador_nombre) : '';
  const linea = [quien, entrenador && (quien ? `con ${entrenador}` : `Con ${entrenador}`)].filter(Boolean).join(' · ');
  if (linea) {
    ctx.font = FUENTES[1];
    espaciar(ctx, '0px');
    ctx.fillStyle = tema.suave;
    ctx.fillText(linea, ANCHO / 2, base + 28);
  }

  // Pie
  ctx.font = FUENTES[2];
  espaciar(ctx, '4px');
  ctx.fillStyle = tema.suave;
  const lugar = ['Complejo Trebi', 'Mar del Plata', config.instagram && `@${config.instagram}`].filter(Boolean).join(' · ');
  ctx.fillText(lugar.toUpperCase(), ANCHO / 2, ALTO - 96);

  return { lienzo: placa, tema };
}

// Sin video: el símbolo de la marca llena el arco
export function dibujarConSimbolo(ctx, placa) {
  ctx.clearRect(0, 0, ANCHO, ALTO);
  ctx.fillStyle = placa.tema.fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.save();
  ctx.translate(ARCO.x, ARCO.y);
  ctx.scale(ARCO.ancho / 80, ARCO.alto / 100);
  ctx.fillStyle = COLOR.sol;
  ctx.fill(new Path2D(SIMBOLO), 'evenodd');
  ctx.restore();
  ctx.drawImage(placa.lienzo, 0, 0);
}

// Con video: el cuadro actual del video, recortado para llenar el arco
export function dibujarConVideo(ctx, placa, video) {
  ctx.fillStyle = placa.tema.fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  const { x, y, ancho, alto } = ARCO;
  const vw = video.videoWidth || ancho;
  const vh = video.videoHeight || alto;
  const escala = Math.max(ancho / vw, alto / vh);
  const w = vw * escala;
  const h = vh * escala;
  ctx.fillStyle = COLOR.hondo;
  ctx.fillRect(x, y, ancho, alto);
  ctx.drawImage(video, x + (ancho - w) / 2, y + (alto - h) / 2, w, h);
  ctx.drawImage(placa.lienzo, 0, 0);
}

export const lienzoABlob = (lienzo, tipo = 'image/png') =>
  new Promise((resolver, rechazar) => lienzo.toBlob((blob) => (blob ? resolver(blob) : rechazar(new Error('sin imagen'))), tipo));

// Formatos de video que acepta Instagram, en orden de preferencia
export function formatoDeGrabacion() {
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null;
  const opciones = [
    'video/mp4;codecs=avc1.640028,mp4a.40.2',
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  return opciones.find((tipo) => MediaRecorder.isTypeSupported(tipo)) ?? null;
}

const esperarEvento = (elemento, evento) => new Promise((resolver, rechazar) => {
  const listo = () => { limpiar(); resolver(); };
  const fallo = () => { limpiar(); rechazar(new Error('No pudimos leer el video en este navegador.')); };
  const limpiar = () => {
    elemento.removeEventListener(evento, listo);
    elemento.removeEventListener('error', fallo);
  };
  elemento.addEventListener(evento, listo, { once: true });
  elemento.addEventListener('error', fallo, { once: true });
});

// Prepara un video para la historia: se usa para la vista previa (al mover
// "desde") y para grabar. grabar() hay que llamarlo directo desde el toque
// en el botón, así el navegador deja reproducir con sonido.
export async function prepararEstudio(lienzo, blobVideo) {
  const ctx = lienzo.getContext('2d');
  const video = document.createElement('video');
  video.playsInline = true;
  video.muted = true;
  video.preload = 'auto';
  const url = URL.createObjectURL(blobVideo);
  video.src = url;
  await esperarEvento(video, 'loadeddata');

  let placa = null;
  let audio = null;
  let grabando = false;

  const dibujar = () => { if (placa) dibujarConVideo(ctx, placa, video); };

  const irA = async (segundo) => {
    if (grabando) return;
    video.currentTime = Math.max(0, Math.min(segundo, Math.max(0, video.duration - 0.1)));
    await esperarEvento(video, 'seeked');
    dibujar();
  };

  return {
    video,
    get duracion() { return Number.isFinite(video.duration) ? video.duration : 0; },

    async usarPlaca(nueva) {
      placa = nueva;
      dibujar();
    },

    irA,

    grabar({ desde = 0, segundos = config.segundosHistoria, conSonido = true, alProgresar, senal } = {}) {
      const formato = formatoDeGrabacion();
      if (!formato) return Promise.reject(new Error('Este navegador no puede armar videos. Probá con la imagen.'));
      grabando = true;

      // Esto va antes de cualquier espera, para no perder el permiso del toque
      let pistasAudio = [];
      if (conSonido) {
        try {
          if (!audio) {
            const contexto = new (window.AudioContext || window.webkitAudioContext)();
            const fuente = contexto.createMediaElementSource(video);
            const destino = contexto.createMediaStreamDestination();
            fuente.connect(destino);
            audio = { contexto, destino };
          }
          audio.contexto.resume();
          video.muted = false;
          pistasAudio = audio.destino.stream.getAudioTracks();
        } catch {
          video.muted = true;
        }
      } else {
        video.muted = true;
      }
      const inicio = Math.max(0, Math.min(desde, Math.max(0, video.duration - 0.5)));
      const fin = Math.min(video.duration || segundos, inicio + segundos);
      video.currentTime = inicio;
      const reproduccion = video.play();

      return (async () => {
        try {
          await reproduccion.catch(async () => {
            // Si no deja con sonido, va sin sonido
            video.muted = true;
            pistasAudio = [];
            await video.play();
          });
          video.pause();
          if (Math.abs(video.currentTime - inicio) > 0.05) {
            video.currentTime = inicio;
            await esperarEvento(video, 'seeked');
          }
          dibujar();

          const flujo = lienzo.captureStream(30);
          for (const pista of pistasAudio) flujo.addTrack(pista);
          const grabadora = new MediaRecorder(flujo, { mimeType: formato, videoBitsPerSecond: 8_000_000 });
          const partes = [];
          grabadora.ondataavailable = (evento) => { if (evento.data.size) partes.push(evento.data); };
          const terminada = new Promise((resolver) => { grabadora.onstop = resolver; });

          grabadora.start(500);
          await video.play();

          await new Promise((resolver) => {
            const cuadro = () => {
              dibujar();
              const avance = (video.currentTime - inicio) / (fin - inicio);
              alProgresar?.(Math.min(1, Math.max(0, avance)));
              if (senal?.aborted || video.ended || video.currentTime >= fin) return resolver();
              requestAnimationFrame(cuadro);
            };
            requestAnimationFrame(cuadro);
          });

          video.pause();
          grabadora.stop();
          await terminada;
          for (const pista of flujo.getVideoTracks()) pista.stop();
          if (senal?.aborted) throw new DOMException('Cancelado', 'AbortError');
          const tipo = formato.split(';')[0];
          return new Blob(partes, { type: tipo });
        } finally {
          grabando = false;
          video.muted = true;
        }
      })();
    },

    cerrar() {
      video.pause();
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      audio?.contexto.close().catch(() => {});
    },
  };
}

export function textoParaCompartir(hito) {
  const partes = [`${textoDelHito(hito)} en La Roca.`, 'Muro de escalada en Mar del Plata.'];
  if (config.instagram) partes.push(`@${config.instagram}`);
  partes.push(config.hashtags.join(' '));
  return partes.join(' ');
}

export function nombreDeArchivo(hito, extension) {
  const base = textoDelHito(hito)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 40);
  return `la-roca-${base || 'hito'}.${extension}`;
}

// Abre el menú de compartir del celu con el archivo (ahí aparece Instagram).
// Devuelve false si el navegador no puede compartir archivos.
export async function compartirArchivo(archivo) {
  if (!navigator.canShare?.({ files: [archivo] })) return false;
  try {
    await navigator.share({ files: [archivo] });
  } catch (error) {
    if (error?.name === 'AbortError') return true;
    throw error;
  }
  return true;
}
