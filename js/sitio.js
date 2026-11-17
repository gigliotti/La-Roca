// La Roca · comportamiento del sitio
// Todo es mejora progresiva: sin JavaScript el sitio se lee completo.

const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)');
const pantallaAncha = matchMedia('(min-width: 48em)');
const soportaScroll = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');

const leer = (clave) => {
  try { return localStorage.getItem(clave); } catch { return null; }
};
const guardar = (clave, valor) => {
  try { localStorage.setItem(clave, valor); } catch { /* sin almacenamiento: no pasa nada */ }
};

/* ---------- Videos de ambiente ----------
   Se reproducen solo cuando están a la vista. Si la persona pidió
   menos movimiento, arrancan pausados. El botón de la cabecera
   pausa o reanuda todos (WCAG 2.2.2). */

const videos = [...document.querySelectorAll('video[data-ambiente]')];
const botonVideos = document.getElementById('boton-videos');
const textoBotonVideos = botonVideos?.querySelector('.boton-videos-texto');
const visibles = new Set();
let eleccion = leer('laroca-videos'); // 'reproducir' | 'pausar' | null

const sePuedenReproducir = () => {
  if (eleccion === 'reproducir') return true;
  if (eleccion === 'pausar') return false;
  return !movimientoReducido.matches;
};

const reproducir = (video) => {
  const intento = video.play();
  if (intento) intento.catch(() => { /* el navegador puede bloquearlo; queda el póster */ });
};

const sincronizarVideos = () => {
  const permitido = sePuedenReproducir();
  for (const video of videos) {
    if (permitido && visibles.has(video)) reproducir(video);
    else video.pause();
  }
  if (botonVideos) {
    botonVideos.dataset.estado = permitido ? 'reproduciendo' : 'pausado';
    textoBotonVideos.textContent = permitido ? 'Pausar videos' : 'Reproducir videos';
  }
};

const observadorVideos = new IntersectionObserver((entradas) => {
  for (const entrada of entradas) {
    if (entrada.isIntersecting) visibles.add(entrada.target);
    else visibles.delete(entrada.target);
  }
  sincronizarVideos();
}, { threshold: 0.2 });

for (const video of videos) {
  video.removeAttribute('autoplay');
  observadorVideos.observe(video);
}

if (botonVideos) {
  botonVideos.hidden = false;
  botonVideos.addEventListener('click', () => {
    eleccion = sePuedenReproducir() ? 'pausar' : 'reproducir';
    guardar('laroca-videos', eleccion);
    sincronizarVideos();
  });
}

movimientoReducido.addEventListener('change', sincronizarVideos);
sincronizarVideos();

/* ---------- Portada: el hueco se abre desde la presa ----------
   Calcula el centro del agujero del bulón de la presa, en
   coordenadas de la placa, para que la animación nazca ahí. */

const placa = document.querySelector('.placa');
const presa = document.querySelector('.placa-presa');

const medirPresa = () => {
  if (!placa || !presa) return;
  const caja = placa.getBoundingClientRect();
  const r = presa.getBoundingClientRect();
  if (!caja.width || !caja.height) return;
  // La placa puede estar escalada por la animación: se corrige la escala.
  const escala = caja.width / placa.offsetWidth;
  const x = (r.left + r.width * 0.5 - caja.left) / escala;
  const y = (r.top + r.height * 0.47 - caja.top) / escala;
  placa.style.setProperty('--ox', `${x.toFixed(1)}px`);
  placa.style.setProperty('--oy', `${y.toFixed(1)}px`);
};

if (placa && presa) {
  document.fonts?.ready.then(medirPresa);
  new ResizeObserver(medirPresa).observe(placa);
}

/* ---------- Manifiesto: las palabras se encienden al bajar ---------- */

const manifiesto = document.querySelector('[data-palabras]');

if (manifiesto && soportaScroll) {
  let indice = 0;
  const partir = (nodo) => {
    for (const hijo of [...nodo.childNodes]) {
      if (hijo.nodeType === Node.TEXT_NODE) {
        const fragmento = document.createDocumentFragment();
        for (const parte of hijo.textContent.split(/(\s+)/)) {
          if (!parte) continue;
          if (/^\s+$/.test(parte)) {
            fragmento.append(parte);
          } else {
            const palabra = document.createElement('span');
            palabra.className = 'palabra';
            palabra.style.setProperty('--i', indice++);
            palabra.textContent = parte;
            fragmento.append(palabra);
          }
        }
        hijo.replaceWith(fragmento);
      } else if (hijo.nodeType === Node.ELEMENT_NODE) {
        partir(hijo);
      }
    }
  };
  partir(manifiesto);
  manifiesto.style.setProperty('--paso', `${(40 / Math.max(indice, 1)).toFixed(3)}%`);
}

/* ---------- Escenas: carril con flechas ---------- */

const carril = document.querySelector('.carril');
const flechas = [...document.querySelectorAll('.boton-flecha')];
const estadoEscenas = document.getElementById('estado-escenas');

if (carril && flechas.length) {
  const tarjetas = [...carril.querySelectorAll('li')];
  let ultimaAnunciada = -1;
  let navegandoConFlecha = false;

  const paso = () => {
    const [a, b] = tarjetas;
    return b ? b.offsetLeft - a.offsetLeft : carril.clientWidth;
  };

  const actual = () => Math.round(carril.scrollLeft / paso());

  const actualizarFlechas = () => {
    const max = carril.scrollWidth - carril.clientWidth - 2;
    const [anterior, siguiente] = flechas;
    const enfocada = document.activeElement;
    anterior.disabled = carril.scrollLeft <= 2;
    siguiente.disabled = carril.scrollLeft >= max;
    // Si la flecha con foco quedó deshabilitada, el foco pasa a la otra.
    if (enfocada === anterior && anterior.disabled) siguiente.focus();
    if (enfocada === siguiente && siguiente.disabled) anterior.focus();
  };

  const alAsentarse = () => {
    actualizarFlechas();
    if (!navegandoConFlecha) return;
    navegandoConFlecha = false;
    const n = Math.min(actual(), tarjetas.length - 1);
    if (n !== ultimaAnunciada) {
      ultimaAnunciada = n;
      estadoEscenas.textContent = `Escena ${n + 1} de ${tarjetas.length}`;
    }
  };

  for (const flecha of flechas) {
    flecha.addEventListener('click', () => {
      navegandoConFlecha = true;
      carril.scrollBy({
        left: Number(flecha.dataset.direccion) * paso(),
        behavior: movimientoReducido.matches ? 'auto' : 'smooth',
      });
    });
  }

  if ('onscrollend' in window) {
    carril.addEventListener('scrollend', alAsentarse);
  } else {
    let espera;
    carril.addEventListener('scroll', () => {
      clearTimeout(espera);
      espera = setTimeout(alAsentarse, 120);
    });
  }

  new ResizeObserver(actualizarFlechas).observe(carril);
  actualizarFlechas();
}

/* ---------- Visor de escenas ---------- */

const visor = document.getElementById('visor');
const videoVisor = visor?.querySelector('.visor-video');
const tituloVisor = document.getElementById('visor-titulo');

if (visor && videoVisor) {
  const fuente = (id) => {
    const calidad = pantallaAncha.matches ? 720 : 360;
    return `https://assets.mixkit.co/videos/${id}/${id}-${calidad}.mp4`;
  };

  const abrir = (boton) => {
    const id = boton.dataset.video;
    const mini = boton.querySelector('video');
    tituloVisor.textContent = boton.querySelector('.escena-texto')?.textContent ?? '';
    videoVisor.poster = `https://assets.mixkit.co/videos/${id}/${id}-thumb-720-0.jpg`;
    videoVisor.src = fuente(id);

    const mostrar = () => {
      visor.showModal();
      reproducir(videoVisor);
    };

    if (document.startViewTransition && !movimientoReducido.matches && mini) {
      mini.style.viewTransitionName = 'escena';
      const transicion = document.startViewTransition(() => {
        mini.style.viewTransitionName = '';
        videoVisor.style.viewTransitionName = 'escena';
        mostrar();
      });
      transicion.finished.finally(() => {
        videoVisor.style.viewTransitionName = '';
      });
    } else {
      mostrar();
    }
  };

  document.querySelectorAll('.escena').forEach((boton) => {
    boton.addEventListener('click', () => abrir(boton));
  });

  visor.addEventListener('close', () => {
    videoVisor.pause();
    videoVisor.removeAttribute('src');
    videoVisor.load();
  });

  // Cerrar tocando afuera donde closedby todavía no existe
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    visor.addEventListener('click', (evento) => {
      if (evento.target === visor) visor.close();
    });
  }
}

/* ---------- Formulario de la primera cordada ---------- */

const formulario = document.getElementById('formulario');

if (formulario) {
  const estado = document.getElementById('formulario-estado');
  const boton = formulario.querySelector('button[type="submit"]');
  const campos = [...formulario.querySelectorAll('input:not([type="radio"]):not([tabindex="-1"])')];

  // aria-invalid y el mensaje de error siguen al estado visual (:user-invalid)
  const vincularError = (campo, mostrar) => {
    const idError = campo.dataset.error;
    if (!idError) return;
    const ids = (campo.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== idError);
    if (mostrar) ids.push(idError);
    if (ids.length) campo.setAttribute('aria-describedby', ids.join(' '));
    else campo.removeAttribute('aria-describedby');
  };

  const soportaUserInvalid = CSS.supports('selector(:user-invalid)');
  const tocados = new WeakSet();

  const sincronizar = (campo) => {
    const invalido = soportaUserInvalid
      ? campo.matches(':user-invalid')
      : tocados.has(campo) && !campo.validity.valid;
    if (!soportaUserInvalid) {
      campo.classList.toggle('user-invalid-fallback', invalido);
      campo.classList.toggle('user-valid-fallback', tocados.has(campo) && campo.validity.valid);
    }
    campo.setAttribute('aria-invalid', String(invalido));
    vincularError(campo, invalido);
  };

  for (const campo of campos) {
    campo.setAttribute('aria-invalid', 'false');
    campo.addEventListener('blur', () => {
      if (campo.value) tocados.add(campo);
      sincronizar(campo);
    });
    campo.addEventListener('input', () => {
      if (campo.getAttribute('aria-invalid') === 'true') sincronizar(campo);
    });
    campo.addEventListener('invalid', () => {
      tocados.add(campo);
      sincronizar(campo);
    });
  }

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    estado.removeAttribute('data-tipo');

    // Si un bot completó la trampa, se ignora en silencio.
    if (formulario.elements.sitio_web?.value) return;

    const destino = formulario.dataset.endpoint;
    if (!destino) {
      estado.textContent = 'Vista previa: tus datos no se guardaron. Cuando el formulario esté conectado vas a poder anotarte desde acá.';
      return;
    }

    boton.disabled = true;
    estado.textContent = 'Enviando…';
    try {
      const respuesta = await fetch(destino, {
        method: 'POST',
        body: new FormData(formulario),
        headers: { Accept: 'application/json' },
      });
      if (!respuesta.ok) throw new Error(String(respuesta.status));
      formulario.reset();
      campos.forEach((campo) => {
        campo.setAttribute('aria-invalid', 'false');
        vincularError(campo, false);
      });
      estado.textContent = 'Te anotaste. Te escribimos antes de abrir.';
    } catch {
      estado.dataset.tipo = 'error';
      estado.textContent = 'No pudimos guardar tus datos. Revisá tu conexión y probá de nuevo.';
    } finally {
      boton.disabled = false;
    }
  });
}
