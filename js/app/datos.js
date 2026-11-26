// La Roca · datos de la app
// Dos implementaciones con la misma forma:
//   · Supabase (login con código por mail, base de datos y videos en Storage)
//   · Demo (sin servidor: todo queda en este navegador, para probar la app)

import { config, modoDemo } from './config.js';
import { hoy } from './hitos.js';

const CAMPOS_HITO = 'id, perfil_id, entrenador_id, entrenador_nombre, tipo, titulo, grado, nota, fecha, video_path, creado_en';
const BUCKET = 'videos';

export class ErrorApp extends Error {
  constructor(mensaje, codigo) {
    super(mensaje);
    this.codigo = codigo;
  }
}

const extensionDe = (archivo) => {
  const porTipo = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'video/x-m4v': 'm4v' };
  if (porTipo[archivo.type]) return porTipo[archivo.type];
  const deNombre = archivo.name?.split('.').pop()?.toLowerCase();
  return ['mp4', 'mov', 'webm', 'm4v'].includes(deNombre) ? deNombre : 'mp4';
};

const tipoDe = (archivo) => {
  const ext = extensionDe(archivo);
  return archivo.type || { mov: 'video/quicktime', webm: 'video/webm', m4v: 'video/x-m4v' }[ext] || 'video/mp4';
};

export const validarVideo = (archivo) => {
  if (!archivo) throw new ErrorApp('Elegí un video.');
  if (archivo.type && !archivo.type.startsWith('video/')) throw new ErrorApp('Ese archivo no es un video.');
  if (archivo.size > config.maxVideoMB * 1024 * 1024) {
    throw new ErrorApp(`El video pesa más de ${config.maxVideoMB} MB. Recortalo en el celu (con 15 a 30 segundos alcanza) y probá de nuevo.`);
  }
};

/* =========================================================
   Supabase
   ========================================================= */

function traducir(error) {
  if (error instanceof ErrorApp) return error;
  const codigo = error?.code ?? error?.error_code ?? '';
  const estado = Number(error?.status ?? error?.statusCode ?? 0);
  const texto = String(error?.message ?? '');
  const mensajes = {
    otp_expired: 'El código no es válido o ya venció. Pedí uno nuevo.',
    over_email_send_rate_limit: 'Pediste muchos códigos seguidos. Esperá un rato y probá de nuevo.',
    over_request_rate_limit: 'Demasiados intentos seguidos. Esperá un minuto y probá de nuevo.',
    email_address_not_authorized: 'Todavía no podemos mandar mails a esa dirección. Avisale al equipo de La Roca.',
    email_address_invalid: 'Revisá el mail: parece que tiene un error.',
    validation_failed: 'Revisá el mail: parece que tiene un error.',
    23505: 'Ya hay alguien con ese mail.',
    42501: 'No tenés permiso para hacer eso.',
  };
  if (mensajes[codigo]) return new ErrorApp(mensajes[codigo], codigo);
  if (estado === 413 || /too large|exceeded the maximum/i.test(texto)) {
    return new ErrorApp(`El video pesa más de ${config.maxVideoMB} MB.`, 'muy_pesado');
  }
  if (/Failed to fetch|NetworkError|Load failed/i.test(texto)) {
    return new ErrorApp('No hay conexión. Revisá internet y probá de nuevo.', 'sin_conexion');
  }
  console.error(error);
  return new ErrorApp('Algo salió mal. Probá de nuevo en un rato.', codigo || 'desconocido');
}

function crearSupabase() {
  if (!window.supabase?.createClient) {
    throw new ErrorApp('No se pudo cargar la conexión con la base de datos.');
  }
  const cliente = window.supabase.createClient(config.supabaseUrl, config.supabaseClave, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  const urlsFirmadas = new Map();

  const resultado = ({ data, error }) => {
    if (error) throw traducir(error);
    return data;
  };

  const usuario = async () => {
    const { data } = await cliente.auth.getSession();
    return data.session?.user ?? null;
  };

  const subirConProgreso = async (ruta, archivo, alProgresar) => {
    const { data } = await cliente.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new ErrorApp('Tu sesión venció. Volvé a entrar.', 'sin_sesion');
    const url = `${config.supabaseUrl}/storage/v1/object/${BUCKET}/${ruta}`;
    await new Promise((resolver, rechazar) => {
      const pedido = new XMLHttpRequest();
      pedido.open('POST', url);
      pedido.setRequestHeader('authorization', `Bearer ${token}`);
      pedido.setRequestHeader('apikey', config.supabaseClave);
      pedido.setRequestHeader('content-type', tipoDe(archivo));
      pedido.setRequestHeader('cache-control', 'max-age=31536000');
      pedido.upload.onprogress = (evento) => {
        if (evento.lengthComputable) alProgresar?.(evento.loaded / evento.total);
      };
      pedido.onload = () => {
        if (pedido.status >= 200 && pedido.status < 300) return resolver();
        let cuerpo = {};
        try { cuerpo = JSON.parse(pedido.responseText); } catch { /* sin cuerpo */ }
        rechazar(traducir({ status: Number(cuerpo.statusCode) || pedido.status, message: cuerpo.message || cuerpo.error }));
      };
      pedido.onerror = () => rechazar(traducir({ message: 'Failed to fetch' }));
      pedido.send(archivo);
    });
  };

  return {
    modo: 'supabase',

    async sesion() {
      const usuarioActual = await usuario();
      if (!usuarioActual) return null;
      const perfil = resultado(await cliente.from('perfiles').select('*').eq('user_id', usuarioActual.id).maybeSingle());
      if (!perfil) {
        throw new ErrorApp('Entraste, pero no encontramos tu perfil. Escribinos y lo resolvemos.', 'sin_perfil');
      }
      return perfil;
    },

    alCambiarSesion(funcion) {
      cliente.auth.onAuthStateChange((evento) => funcion(evento));
    },

    async enviarCodigo(email) {
      resultado(await cliente.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, emailRedirectTo: new URL('entrar', location.href).href },
      }));
    },

    async verificarCodigo(email, codigo) {
      resultado(await cliente.auth.verifyOtp({ email, token: codigo, type: 'email' }));
      return this.sesion();
    },

    async salir() {
      // Solo en este dispositivo: salir en la compu no cierra la sesión del celu
      await cliente.auth.signOut({ scope: 'local' });
      urlsFirmadas.clear();
    },

    async guardarPerfil(id, cambios) {
      return resultado(await cliente.from('perfiles').update(cambios).eq('id', id).select('*').single());
    },

    async perfil(id) {
      return resultado(await cliente.from('perfiles').select('*').eq('id', id).maybeSingle());
    },

    async hitosDe(perfilId) {
      return resultado(await cliente.from('hitos').select(CAMPOS_HITO).eq('perfil_id', perfilId)
        .order('fecha', { ascending: false }).order('creado_en', { ascending: false }));
    },

    async clientes() {
      return resultado(await cliente.from('perfiles').select('id, nombre, email, user_id, creado_en')
        .eq('rol', 'cliente').order('nombre', { ascending: true, nullsFirst: false }));
    },

    async crearCliente({ nombre, email }) {
      const { data, error } = await cliente.from('perfiles').insert({ nombre, email }).select('id, nombre, email, user_id, creado_en').single();
      if (error?.code === '23505') {
        const existente = resultado(await cliente.from('perfiles').select('id, nombre, email, user_id, creado_en, rol')
          .eq('email', email.trim().toLowerCase()).maybeSingle());
        if (existente?.rol === 'cliente') return { ...existente, yaExistia: true };
      }
      if (error) throw traducir(error);
      return data;
    },

    async crearHito(hito) {
      return resultado(await cliente.from('hitos').insert(hito).select(CAMPOS_HITO).single());
    },

    async borrarHito(hito) {
      resultado(await cliente.from('hitos').delete().eq('id', hito.id));
      if (hito.video_path) await cliente.storage.from(BUCKET).remove([hito.video_path]);
    },

    async hitosDelDia(fecha = hoy()) {
      return resultado(await cliente.from('hitos')
        .select(`${CAMPOS_HITO}, perfil:perfiles!hitos_perfil_fk(id, nombre, email)`)
        .eq('fecha', fecha).order('creado_en', { ascending: false }));
    },

    async subirVideo(hito, archivo, alProgresar) {
      validarVideo(archivo);
      const ruta = `${hito.perfil_id}/${crypto.randomUUID()}.${extensionDe(archivo)}`;
      await subirConProgreso(ruta, archivo, alProgresar);
      const actualizado = resultado(await cliente.from('hitos').update({ video_path: ruta }).eq('id', hito.id).select(CAMPOS_HITO).single());
      if (hito.video_path && hito.video_path !== ruta) {
        await cliente.storage.from(BUCKET).remove([hito.video_path]);
      }
      return actualizado;
    },

    async urlVideo(ruta) {
      const guardada = urlsFirmadas.get(ruta);
      if (guardada && guardada.vence > Date.now()) return guardada.url;
      const data = resultado(await cliente.storage.from(BUCKET).createSignedUrl(ruta, 60 * 60 * 6));
      urlsFirmadas.set(ruta, { url: data.signedUrl, vence: Date.now() + 1000 * 60 * 60 * 5 });
      return data.signedUrl;
    },

    async archivoVideo(ruta) {
      return resultado(await cliente.storage.from(BUCKET).download(ruta));
    },
  };
}

/* =========================================================
   Demo: todo en este navegador
   ========================================================= */

function crearDemo() {
  const CLAVE = 'laroca-demo-v1';
  const CLAVE_SESION = 'laroca-demo-sesion';
  const esperar = (ms = 150) => new Promise((resolver) => setTimeout(resolver, ms));
  const urls = new Map();

  const leer = () => {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE));
      if (guardado?.perfiles) return guardado;
    } catch { /* sin datos */ }
    const semilla = sembrar();
    escribir(semilla);
    return semilla;
  };
  const escribir = (estado) => {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* sin almacenamiento */ }
  };
  const sesionId = () => {
    try { return localStorage.getItem(CLAVE_SESION); } catch { return null; }
  };

  // Videos en IndexedDB (no entran en localStorage)
  const abrirBase = () => new Promise((resolver, rechazar) => {
    const pedido = indexedDB.open('laroca-demo', 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore('videos');
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rechazar(pedido.error);
  });
  const conVideos = async (modo, accion) => {
    const base = await abrirBase();
    return new Promise((resolver, rechazar) => {
      const tienda = base.transaction('videos', modo).objectStore('videos');
      const pedido = accion(tienda);
      pedido.onsuccess = () => resolver(pedido.result);
      pedido.onerror = () => rechazar(pedido.error);
    });
  };

  const yo = (estado) => estado.perfiles.find((perfil) => perfil.id === sesionId()) ?? null;
  const exigir = (condicion) => {
    if (!condicion) throw new ErrorApp('No tenés permiso para hacer eso.', '42501');
  };

  return {
    modo: 'demo',

    async sesion() {
      await esperar(60);
      return yo(leer());
    },

    alCambiarSesion() {},

    async enviarCodigo(email) {
      await esperar(400);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ErrorApp('Revisá el mail: parece que tiene un error.');
    },

    async verificarCodigo(email, codigo) {
      await esperar(400);
      if (!/^\d{6}$/.test(codigo)) throw new ErrorApp('El código no es válido o ya venció. Pedí uno nuevo.');
      const estado = leer();
      const correo = email.trim().toLowerCase();
      let perfil = estado.perfiles.find((p) => p.email === correo);
      if (!perfil) {
        perfil = { id: crypto.randomUUID(), user_id: crypto.randomUUID(), email: correo, nombre: null, instagram: null, rol: 'cliente', creado_en: new Date().toISOString() };
        estado.perfiles.push(perfil);
      } else if (!perfil.user_id) {
        perfil.user_id = crypto.randomUUID();
      }
      escribir(estado);
      return this.entrarComo(perfil.id);
    },

    async entrarComo(id) {
      try { localStorage.setItem(CLAVE_SESION, id); } catch { /* sin almacenamiento */ }
      return this.sesion();
    },

    // Atajos de la demo: la vía de Sofía o el panel de Bruno
    async entrarComoEjemplo(rol) {
      const estado = leer();
      const perfil = rol === 'entrenador'
        ? estado.perfiles.find((p) => p.rol === 'entrenador')
        : estado.perfiles.find((p) => p.email === 'sofia@demo.laroca') ?? estado.perfiles.find((p) => p.rol === 'cliente');
      return this.entrarComo(perfil.id);
    },

    async salir() {
      try { localStorage.removeItem(CLAVE_SESION); } catch { /* nada */ }
    },

    async reiniciar() {
      try { localStorage.removeItem(CLAVE); localStorage.removeItem(CLAVE_SESION); } catch { /* nada */ }
      await conVideos('readwrite', (tienda) => tienda.clear()).catch(() => {});
    },

    async guardarPerfil(id, cambios) {
      await esperar();
      const estado = leer();
      const actual = yo(estado);
      const perfil = estado.perfiles.find((p) => p.id === id);
      exigir(perfil && (perfil.id === actual?.id || (actual?.rol === 'entrenador' && perfil.rol === 'cliente')));
      if ('nombre' in cambios) perfil.nombre = cambios.nombre?.trim() || null;
      if ('instagram' in cambios) perfil.instagram = cambios.instagram?.trim().replace(/^@/, '').toLowerCase() || null;
      escribir(estado);
      return { ...perfil };
    },

    async perfil(id) {
      await esperar(60);
      const estado = leer();
      const actual = yo(estado);
      const perfil = estado.perfiles.find((p) => p.id === id);
      if (!perfil || !(perfil.id === actual?.id || actual?.rol === 'entrenador')) return null;
      return { ...perfil };
    },

    async hitosDe(perfilId) {
      await esperar(80);
      const estado = leer();
      const actual = yo(estado);
      exigir(actual && (actual.id === perfilId || actual.rol === 'entrenador'));
      return estado.hitos.filter((hito) => hito.perfil_id === perfilId)
        .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creado_en.localeCompare(a.creado_en));
    },

    async clientes() {
      await esperar(80);
      const estado = leer();
      exigir(yo(estado)?.rol === 'entrenador');
      return estado.perfiles.filter((p) => p.rol === 'cliente')
        .sort((a, b) => (a.nombre ?? '￿').localeCompare(b.nombre ?? '￿', 'es'));
    },

    async crearCliente({ nombre, email }) {
      await esperar();
      const estado = leer();
      const actual = yo(estado);
      exigir(actual?.rol === 'entrenador');
      const correo = email.trim().toLowerCase();
      const existente = estado.perfiles.find((p) => p.email === correo);
      if (existente) {
        if (existente.rol === 'cliente') return { ...existente, yaExistia: true };
        throw new ErrorApp('Ya hay alguien con ese mail.', '23505');
      }
      const perfil = { id: crypto.randomUUID(), user_id: null, email: correo, nombre: nombre.trim(), instagram: null, rol: 'cliente', creado_en: new Date().toISOString(), creado_por: actual.id };
      estado.perfiles.push(perfil);
      escribir(estado);
      return { ...perfil };
    },

    async crearHito(datos) {
      await esperar();
      const estado = leer();
      const actual = yo(estado);
      exigir(actual?.rol === 'entrenador');
      const hito = {
        id: crypto.randomUUID(),
        perfil_id: datos.perfil_id,
        entrenador_id: actual.id,
        entrenador_nombre: actual.nombre,
        tipo: datos.tipo,
        titulo: datos.titulo.trim(),
        grado: datos.grado?.trim() || null,
        nota: datos.nota?.trim() || null,
        fecha: datos.fecha || hoy(),
        video_path: null,
        creado_en: new Date().toISOString(),
      };
      estado.hitos.push(hito);
      escribir(estado);
      return { ...hito };
    },

    async borrarHito(hito) {
      await esperar();
      const estado = leer();
      exigir(yo(estado)?.rol === 'entrenador');
      estado.hitos = estado.hitos.filter((h) => h.id !== hito.id);
      escribir(estado);
      if (hito.video_path) await conVideos('readwrite', (tienda) => tienda.delete(hito.video_path)).catch(() => {});
    },

    async hitosDelDia(fecha = hoy()) {
      await esperar(80);
      const estado = leer();
      exigir(yo(estado)?.rol === 'entrenador');
      return estado.hitos.filter((hito) => hito.fecha === fecha)
        .sort((a, b) => b.creado_en.localeCompare(a.creado_en))
        .map((hito) => {
          const perfil = estado.perfiles.find((p) => p.id === hito.perfil_id);
          return { ...hito, perfil: perfil && { id: perfil.id, nombre: perfil.nombre, email: perfil.email } };
        });
    },

    async subirVideo(hito, archivo, alProgresar) {
      validarVideo(archivo);
      const estado = leer();
      const actual = yo(estado);
      exigir(actual && (actual.id === hito.perfil_id || actual.rol === 'entrenador'));
      const ruta = `${hito.perfil_id}/${crypto.randomUUID()}.${extensionDe(archivo)}`;
      for (const parte of [0.15, 0.45, 0.8]) {
        alProgresar?.(parte);
        await esperar(180);
      }
      const blob = new Blob([await archivo.arrayBuffer()], { type: tipoDe(archivo) });
      await conVideos('readwrite', (tienda) => tienda.put(blob, ruta));
      alProgresar?.(1);
      const fresco = leer();
      const guardado = fresco.hitos.find((h) => h.id === hito.id);
      const anterior = guardado.video_path;
      guardado.video_path = ruta;
      escribir(fresco);
      if (anterior && anterior !== ruta) await conVideos('readwrite', (tienda) => tienda.delete(anterior)).catch(() => {});
      return { ...guardado };
    },

    async urlVideo(ruta) {
      if (urls.has(ruta)) return urls.get(ruta);
      const blob = await this.archivoVideo(ruta);
      const url = URL.createObjectURL(blob);
      urls.set(ruta, url);
      return url;
    },

    async archivoVideo(ruta) {
      const blob = await conVideos('readonly', (tienda) => tienda.get(ruta));
      if (!blob) throw new ErrorApp('No encontramos ese video en este navegador.');
      return blob;
    },
  };
}

// Datos de ejemplo para la demo: Bruno (entrenador) y algunas personas
function sembrar() {
  const dia = (desplazamiento) => {
    const [a, m, d] = hoy().split('-').map(Number);
    const fecha = new Date(Date.UTC(a, m - 1, d + desplazamiento, 12));
    return fecha.toISOString().slice(0, 10);
  };
  const momento = (desplazamiento, hora) => `${dia(desplazamiento)}T${hora}:00.000Z`;
  const id = () => crypto.randomUUID();

  const bruno = { id: id(), user_id: id(), email: 'bruno@demo.laroca', nombre: 'Bruno', instagram: null, rol: 'entrenador', creado_en: momento(-60, '12:00') };
  const persona = (nombre, email, entro = true) => ({ id: id(), user_id: entro ? id() : null, email, nombre, instagram: null, rol: 'cliente', creado_en: momento(-45, '12:00'), creado_por: bruno.id });
  const sofia = persona('Sofía', 'sofia@demo.laroca');
  const camila = persona('Camila', 'camila@demo.laroca');
  const lucia = persona('Lucía', 'lucia@demo.laroca', false);
  const martina = persona('Martina', 'martina@demo.laroca');
  const joaquin = persona('Joaquín', 'joaquin@demo.laroca', false);

  const hito = (perfil, desplazamiento, tipo, titulo, nota = null, grado = null) => ({
    id: id(), perfil_id: perfil.id, entrenador_id: bruno.id, entrenador_nombre: 'Bruno',
    tipo, titulo, grado, nota, fecha: dia(desplazamiento), video_path: null,
    creado_en: momento(desplazamiento, '21:30'),
  });

  return {
    perfiles: [bruno, sofia, camila, lucia, martina, joaquin],
    hitos: [
      hito(sofia, -42, 'primera_vez', 'Primera clase en La Roca', 'Llegaste con miedo a la altura y te fuiste pidiendo otra vía. Así se arranca.'),
      hito(sofia, -35, 'cabeza', 'Primera caída controlada', 'Soltaste y caíste bien, como lo practicamos. Eso es enorme.'),
      hito(sofia, -28, 'arriba', 'Arriba por primera vez', 'Tocaste la última presa. La próxima, sin descansar.'),
      hito(sofia, -21, 'tecnica', 'Primer talón', 'Enganchaste el talón en el desplome sin que te lo dijera.'),
      hito(sofia, -14, 'grado', 'Grado nuevo', 'Tu primer 5+. Lo leíste antes de subir y salió.', '5+'),
      hito(sofia, -7, 'gente', 'Primera escalada de a dos', 'Se pasaron la secuencia con Camila y salió para las dos.'),
      hito(camila, -7, 'gente', 'Primera escalada de a dos', 'Le pasaste la secuencia a Sofía como una profe.'),
      hito(martina, -3, 'cuerpo', 'Más tiempo que nunca en la pared'),
      hito(lucia, 0, 'primera_vez', 'Primera clase en La Roca', 'Bienvenida al muro. Hoy fue el primer paso.'),
    ],
  };
}

export const datos = modoDemo ? crearDemo() : crearSupabase();
