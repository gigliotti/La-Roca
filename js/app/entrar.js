// Entrar con el mail y un código de 6 números (sin contraseña)

import { datos } from './datos.js';
import { modoDemo } from './config.js';
import { $, iniciarPagina, mensajeDe } from './comun.js';

const formMail = $('#paso-mail');
const formCodigo = $('#paso-codigo');
const campoMail = $('#email');
const campoCodigo = $('#codigo');
const estado = $('#estado');
const reenviar = $('#reenviar');

const MAIL_VALIDO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
let mailEnviado = '';
let espera = null;

// Solo se vuelve a páginas de la app
const destino = (perfil) => {
  const volver = new URLSearchParams(location.search).get('volver') ?? '';
  if (/^(perfil|entrenador)(\?[\w=&%.-]*)?$/.test(volver)) return volver;
  return perfil.rol === 'entrenador' ? 'entrenador' : 'perfil';
};

const mostrarEstado = (texto, tipo = 'ok') => {
  estado.textContent = texto;
  estado.dataset.tipo = tipo;
};

const ocupado = (form, si) => {
  const boton = form.querySelector('[type="submit"]');
  boton.disabled = si;
  boton.setAttribute('aria-busy', String(si));
};

const contarEspera = (segundos = 60) => {
  clearInterval(espera);
  let quedan = segundos;
  reenviar.disabled = true;
  reenviar.textContent = `Reenviar en ${quedan} s`;
  espera = setInterval(() => {
    quedan -= 1;
    if (quedan <= 0) {
      clearInterval(espera);
      reenviar.disabled = false;
      reenviar.textContent = 'Reenviar código';
    } else {
      reenviar.textContent = `Reenviar en ${quedan} s`;
    }
  }, 1000);
};

const marcar = (campo, valido) => {
  campo.classList.toggle('user-invalid-fallback', !valido);
  campo.setAttribute('aria-invalid', String(!valido));
};

async function enviar(mail) {
  ocupado(formMail, true);
  mostrarEstado('Mandando el código…');
  try {
    await datos.enviarCodigo(mail);
    mailEnviado = mail;
    $('#email-enviado').textContent = mail;
    formMail.hidden = true;
    formCodigo.hidden = false;
    mostrarEstado('');
    campoCodigo.value = '';
    campoCodigo.focus();
    contarEspera();
  } catch (error) {
    mostrarEstado(mensajeDe(error), 'error');
  } finally {
    ocupado(formMail, false);
  }
}

formMail.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const mail = campoMail.value.trim().toLowerCase();
  const valido = MAIL_VALIDO.test(mail);
  marcar(campoMail, valido);
  if (!valido) return campoMail.focus();
  enviar(mail);
});

formCodigo.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const codigo = campoCodigo.value.replace(/\D/g, '');
  const valido = codigo.length === 6;
  marcar(campoCodigo, valido);
  if (!valido) return campoCodigo.focus();
  ocupado(formCodigo, true);
  mostrarEstado('Entrando…');
  try {
    const perfil = await datos.verificarCodigo(mailEnviado, codigo);
    location.replace(destino(perfil));
  } catch (error) {
    mostrarEstado(mensajeDe(error), 'error');
    ocupado(formCodigo, false);
    campoCodigo.select();
  }
});

// Con los 6 números, entra solo
campoCodigo.addEventListener('input', () => {
  campoCodigo.value = campoCodigo.value.replace(/\D/g, '').slice(0, 6);
  if (campoCodigo.value.length === 6) formCodigo.requestSubmit();
});

reenviar.addEventListener('click', () => {
  formMail.hidden = false;
  formCodigo.hidden = true;
  enviar(mailEnviado);
});

$('#cambiar-mail').addEventListener('click', () => {
  clearInterval(espera);
  formCodigo.hidden = true;
  formMail.hidden = false;
  mostrarEstado('');
  campoMail.focus();
});

if (modoDemo) {
  const atajos = $('#demo-atajos');
  atajos.hidden = false;
  atajos.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('[data-demo]');
    if (!boton) return;
    const perfil = await datos.entrarComoEjemplo(boton.dataset.demo);
    location.replace(destino(perfil));
  });
}

// Si ya hay sesión (o se entró con el enlace del mail), seguir de largo
const perfil = await iniciarPagina({ requiere: null });
if (perfil) location.replace(destino(perfil));
