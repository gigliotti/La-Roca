// Lo que comparten las páginas de la app: sesión, cabecera, avisos

import { datos } from './datos.js';
import { modoDemo } from './config.js';

export const $ = (selector, raiz = document) => raiz.querySelector(selector);
export const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

export function avisar(texto, tipo = 'ok') {
  let zona = $('#avisos');
  if (!zona) {
    zona = document.createElement('div');
    zona.id = 'avisos';
    zona.className = 'avisos';
    zona.setAttribute('role', 'status');
    zona.setAttribute('aria-live', 'polite');
    document.body.append(zona);
  }
  const aviso = document.createElement('p');
  aviso.className = 'aviso';
  aviso.dataset.tipo = tipo;
  aviso.textContent = texto;
  zona.append(aviso);
  setTimeout(() => aviso.remove(), tipo === 'error' ? 7000 : 4000);
}

export const mensajeDe = (error) => error?.message || 'Algo salió mal. Probá de nuevo.';

export function irAEntrar() {
  const volver = location.pathname.split('/').pop() + location.search;
  location.replace(`entrar?volver=${encodeURIComponent(volver)}`);
}

// Muestra el aviso de demo, arma la cabecera y exige sesión si hace falta.
// requiere: null | 'sesion' | 'entrenador'
export async function iniciarPagina({ requiere = 'sesion' } = {}) {
  const aviso = $('#aviso-demo');
  if (aviso && modoDemo) {
    aviso.hidden = false;
    $('[data-accion="reiniciar-demo"]', aviso)?.addEventListener('click', async () => {
      await datos.reiniciar();
      location.href = 'entrar';
    });
  }

  let perfil = null;
  try {
    perfil = await datos.sesion();
  } catch (error) {
    if (error.codigo === 'sin_perfil') {
      await datos.salir();
      avisar(mensajeDe(error), 'error');
    } else {
      avisar(mensajeDe(error), 'error');
    }
  }

  if (requiere && !perfil) {
    irAEntrar();
    return new Promise(() => {}); // la página se va
  }

  for (const elemento of $$('[data-solo]')) {
    const solo = elemento.dataset.solo;
    elemento.hidden = !(
      (solo === 'sesion' && perfil) ||
      (solo === 'entrenador' && perfil?.rol === 'entrenador') ||
      (solo === 'sin-sesion' && !perfil)
    );
  }

  let saliendo = false;
  for (const boton of $$('[data-accion="salir"]')) {
    boton.addEventListener('click', async () => {
      saliendo = true;
      boton.disabled = true;
      await datos.salir();
      location.replace('entrar');
    });
  }

  // Si la sesión se cierra en otra pestaña, volver a entrar (y después regresar acá)
  datos.alCambiarSesion((evento) => {
    if (evento === 'SIGNED_OUT' && requiere && !saliendo) irAEntrar();
  });

  return perfil;
}

// Crea un elemento a partir de un <template> de la página
export const clonar = (id) => document.getElementById(id).content.firstElementChild.cloneNode(true);
