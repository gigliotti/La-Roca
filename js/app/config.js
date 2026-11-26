// La Roca · configuración de la app (perfiles y vía de logros)
//
// Con supabaseUrl y supabaseClave vacíos, la app funciona en "modo demo":
// los datos quedan solo en este navegador. Para conectarla a Supabase,
// poné acá la URL del proyecto y la clave publicable (sb_publishable_…).
// Las dos son públicas: lo que protege los datos son las reglas de la base
// (ver supabase/migrations).

export const config = {
  // Proyecto "la-roca" en Supabase (São Paulo)
  supabaseUrl: 'https://vpahhojmxeztpjxbgihg.supabase.co',
  supabaseClave: 'sb_publishable_K6o2RmHRRlQVSzpNsDXOKQ_YOlyNyvy',

  // Usuario de Instagram de La Roca, sin @. Vacío hasta que exista la cuenta.
  instagram: '',
  hashtags: ['#LaRoca', '#EscaladaMDP'],

  zonaHoraria: 'America/Argentina/Buenos_Aires',

  // El plan gratis de Supabase acepta archivos de hasta 50 MB
  maxVideoMB: 50,
  // Lo máximo que dura el video armado para la historia de Instagram
  segundosHistoria: 15,
};

export const modoDemo = !config.supabaseUrl || !config.supabaseClave;
