# La Roca

Sitio web de La Roca, muro de escalada en el Complejo Trebi, Mar del Plata.
Dominio previsto: murolaroca.com.ar.

Es un sitio estático (HTML, CSS y JavaScript, sin dependencias ni paso de compilación),
pensado para adultos de 24 a 34 años, mayormente mujeres, y armado alrededor de los videos.
El mensaje central es lo que da la escalada, en este orden: la cabeza, la gente y el cuerpo.

## Verlo en tu computadora

Necesitás Node 20 o más nuevo.

```bash
npm run dev
```

Después abrí http://localhost:4321. No hace falta instalar nada.

## Estructura

```
index.html          Toda la página
css/estilos.css     Estilos (colores y tipografías de marca arriba de todo)
js/sitio.js         Videos, manifiesto, escenas, visor y formulario
img/marca/          Logos y favicon (copiados de brand/)
img/presa*.svg      La presa naranja de las viñetas y los pasos
scripts/servidor.mjs  Servidor local mínimo
vercel.json         Encabezados de seguridad y caché para Vercel

entrar.html         Entrar con el mail y un código (sin contraseña)
perfil.html         Tu vía: el perfil con la línea de hitos
entrenador.html     Panel del muro: el entrenador anota los hitos de la clase
css/app.css         Estilos de esas tres páginas
js/app/             La app: datos (Supabase o demo), vía, panel, historia para Instagram
js/vendor/          supabase-js 2.119.0 (copiado tal cual, licencia MIT)
supabase/           Base de datos: migración, plantilla del mail y pruebas de las reglas
```

## La idea de diseño

El sitio usa la marca **"Canto rodado"**: un arco con el sol saliendo del mar y una roca en la orilla, y el nombre en letras de canto rodado.
La guía completa y los archivos originales están en la carpeta `brand/` de la rama `marca`.

- **El arco como ventana.** La portada es un fondo de arena (azul hondo si el teléfono está en modo oscuro)
  con el logo y un arco grande, con las proporciones del arco del símbolo, por donde se ve el video.
  Al bajar, el arco se agranda hasta llenar la pantalla y entrás al video; el logo pasa a la cabecera.
  Nunca se reescribe "La Roca" con una tipografía: siempre se usa el archivo del logo.
- **La grilla de agujeros.** Las secciones claras tienen de fondo la grilla de agujeros de un panel de muro.
- **La cinta de marcar vías.** Las etiquetas imitan la cinta que se pega al lado de las presas, escrita con fibrón.
- **Paleta de marca:** Sol `#FF7A2F`, Atardecer `#E8461E`, Mar `#1E4F7A`, Hondo `#102A40`, Arena `#F3E3CF`
  y Óxido `#B03A10`. Texto sobre Sol, siempre en Hondo; el naranja para texto chico sobre arena es Óxido.
- **Tipografías (Google Fonts):** DM Serif Display para títulos (con la cursiva para destacar una palabra),
  DM Sans para texto y Permanent Marker solo para las cintas.

Los archivos de marca que usa la web están copiados en `img/marca/` (logo horizontal claro y oscuro, logo vertical para el pie y favicon).
Si la marca cambia, hay que volver a copiarlos desde `brand/`.

Usa funciones modernas del navegador con alternativas para los que no las tienen:
animaciones atadas al scroll (la portada y el manifiesto), transiciones de vista al abrir una escena,
acordeón con `details`, validación con `:user-invalid`, tema claro y oscuro con `light-dark()`.
Si la persona pidió menos movimiento en su sistema, no hay animaciones de scroll y los videos
arrancan pausados. El botón "Pausar videos" de la cabecera frena todos los videos de fondo.

## Videos: todos son de muestra

Por ahora no hay videos propios. Todos los videos son de [Mixkit](https://mixkit.co/)
(licencia gratuita, permite uso comercial) y se cargan directo desde su servidor: no están en el repo.
Cada uno tiene la etiqueta "Video de muestra" en pantalla y un comentario en `index.html`.

| Lugar | Video de muestra | Qué filmar para reemplazarlo |
| --- | --- | --- |
| Portada | Mixkit 50925 | Plano general del muro con alguien escalando. Horizontal, con la acción en el centro, porque al principio se ve solo dentro del arco. |
| Lo que te da · la cabeza | Mixkit 41029 | Primer plano lento: manos buscando una presa, respiración, mirada concentrada. |
| Lo que te da · la gente | Mixkit 41023 | Grupo charlando abajo del muro, alguien explicando una secuencia, risas. |
| Lo que te da · el cuerpo | Mixkit 50914 | Un movimiento de fuerza completo: espalda, piernas, llegada arriba. |
| Escenas (7 videos) | 41035, 50913, 41036, 50911, 50928, 50920, 50924 | Videos verticales cortos: magnesio, leer la vía, escalar de a dos, alguien corrigiendo, pasarse la secuencia, llegar arriba, la cara de "lo hice". |
| Bruno | Mixkit 50926 (muro sin personas) | **Video de Bruno** escalando o enseñando. Hoy la tarjeta dice "Acá va el video de Bruno". |

Recomendaciones para los videos propios:

- Entre 6 y 15 segundos, que funcionen en bucle y sin sonido.
- Horizontal a 1280×720 (escritorio) y una versión liviana de 640×360 (celular). Las escenas, verticales.
- MP4 (H.264), apuntando a menos de 4 MB el de escritorio y menos de 1 MB el de celular.
- Un póster JPG del primer cuadro de cada video.

Para reemplazarlos:

1. Copiá los archivos a una carpeta `videos/` del proyecto.
2. En `index.html`, cambiá cada `src` y `poster` de Mixkit por la ruta nueva (por ejemplo `videos/portada-720.mp4`).
   Las escenas abren el visor con la URL que arma `js/sitio.js` a partir de `data-video`: cambiá la función `fuente()`.
3. Cuando ya no quede ninguno de muestra, sacá la clase `con-muestras` del `<html>`:
   se ocultan las etiquetas "Video de muestra" y el crédito a Mixkit del pie.
4. Si los videos quedan en otro dominio, agregalo a `media-src` e `img-src` en `vercel.json`.

## El formulario todavía no guarda datos

El formulario de "la primera cordada" valida los campos, pero no envía nada: avisa que es una vista previa.
Para conectarlo, poné la URL de un servicio de formularios (Formspree, Google Apps Script o una base propia)
en `data-endpoint` y en `action` del `<form>`, y agregá ese dominio a `connect-src` y `form-action` en `vercel.json`.

## Pendiente antes de publicar

- Confirmar el nombre exacto del complejo (Trebi), la dirección y la fecha de apertura.
- Confirmar lo que el sitio da por hecho: que hay alguien que acompaña a quien empieza,
  y las propuestas de "Lo que se viene" (clases para empezar de cero, noches de muro con música,
  desafíos del mes, salidas a la sierra con Bruno).
- Horarios y precios (hoy dice que se anuncian pronto).
- Instagram de La Roca (hoy dice "muy pronto").
- Video y foto de Bruno.
- Imagen para compartir en redes (`og:image`).
- Conectar el formulario.
- Terminar de configurar Supabase para los perfiles (ver «Supabase»): plantilla del mail con el código, direcciones,
  SMTP propio y hacer entrenador a Bruno.

## Perfiles y vía de logros

Cada persona que escala en La Roca tiene su **vía**: un perfil con la línea de los logros (hitos)
que va sumando clase a clase, del más nuevo arriba al primero abajo, como una vía de escalada.

- **El entrenador** entra al **panel del muro** (`/entrenador`) desde el celu, elige a la persona
  (o la suma con nombre y mail), toca lo que logró («Primer talón», «Arriba por primera vez», «Grado nuevo»…),
  le agrega unas palabras si quiere y, si filmó, el video. Aparece al instante en la vía de esa persona.
- **Cada cliente** entra en `/entrar` con su mail y un código de 6 números (sin contraseña) y ve su vía en `/perfil`:
  sus hitos, las palabras del entrenador, cuántas clases lleva y desde cuándo.
  A cada hito le puede **sumar un videíto** desde el celu.
- **Compartir en Instagram:** el botón *Compartir* arma una historia vertical (1080 × 1920) con la marca:
  el logo, el arco de La Roca con el video adentro (o el símbolo si no hay video), la cinta con el número
  de hito y la fecha, el título y «con Bruno». Con video, graba hasta 15 segundos (se elige desde qué segundo)
  con sonido. Después abre el menú de compartir del celu, donde aparece Instagram → Historia.
  Si el navegador no puede compartir archivos (en la compu), la descarga. También deja copiar un texto con los hashtags.
  Apenas alguien sube un video, se abre solo para compartirlo.

Se entra desde «Entrar» en la cabecera (en pantallas anchas), desde «¿Ya escalás en La Roca?» en la portada y desde el pie.

### Modo demo

Si `supabaseUrl` o `supabaseClave` de `js/app/config.js` quedan vacíos, la app funciona en **modo demo**: todo queda
en el navegador (los videos en IndexedDB), con datos de ejemplo (Bruno y algunas personas). En `/entrar` hay atajos para ver
la vía de Sofía o entrar como Bruno, y sirve cualquier código de 6 números. «Empezar de cero» borra todo.
Sirve para mostrar y probar el recorrido completo sin tocar la base de verdad.

### Supabase

Los perfiles, los hitos y los videos viven en el proyecto **la-roca** de Supabase
(región São Paulo, plan gratis, dirección `https://vpahhojmxeztpjxbgihg.supabase.co`).
La base ya está cargada con `supabase/migrations/20261125220000_perfiles_hitos_videos.sql`:
las tablas `perfiles` y `hitos`, el bucket privado `videos` (hasta 50 MB por archivo) y las reglas de acceso.
`js/app/config.js` ya tiene la dirección y la clave publicable (`sb_publishable_…`). Las dos son públicas:
lo que protege los datos son las reglas de la base.

Falta, en el panel de Supabase del proyecto:

1. **Mail con código.** En *Authentication → Emails*, en las plantillas **Magic Link** y **Confirm signup**,
   pegá `supabase/plantillas/codigo.html` (asunto sugerido: «Tu código para entrar a La Roca»).
   Lo importante es `{{ .Token }}`: es el código de 6 números que la persona escribe en la página.
   Sin esto, el mail trae solo un enlace (también sirve, tocándolo desde el mismo celu).
2. **Direcciones.** En *Authentication → URL Configuration*, poné la dirección del sitio
   (la de Vercel hasta que esté `https://murolaroca.com.ar`) y sumá en *Redirect URLs* esa misma, la de Vercel
   y `http://localhost:4321`.
3. **Envío de mails (necesario para abrir).** El servicio de mails que trae Supabase solo manda a los miembros
   del equipo del proyecto y muy pocos por hora. Para clientes de verdad hay que configurar un SMTP propio
   en *Authentication → Emails → SMTP* (por ejemplo Resend, que tiene plan gratis) y después subir el límite
   en *Authentication → Rate Limits*.
4. **Entrenadores.** Para que Bruno (o quien entrene) vea el panel, en el *SQL Editor*:
   ```sql
   insert into public.perfiles (email, nombre, rol) values ('mail-de-bruno@ejemplo.com', 'Bruno', 'entrenador')
   on conflict (email) do update set rol = 'entrenador', nombre = coalesce(perfiles.nombre, excluded.nombre);
   ```
   Cuando entre con ese mail, queda vinculado.

Para armar la base en otro proyecto: correr la migración en el *SQL Editor* (o `supabase db push` con la CLI),
cambiar la dirección y la clave en `js/app/config.js` y la dirección en la política de contenido de `vercel.json`.

### Quién puede qué

Lo controla la base de datos (Row Level Security), no la página:

- Cada persona ve **solo** su perfil, sus hitos y sus videos. Puede cambiar su nombre y su Instagram, y sumar o cambiar
  el video de sus hitos; no puede anotarse hitos ni cambiar los que anotó el entrenador.
- El entrenador ve a todas las personas, suma personas nuevas, anota, corrige y borra hitos, y sube videos para cualquiera.
  No puede hacer entrenador a nadie: eso se hace solo desde el SQL Editor.
- Si el entrenador sumó a alguien con su mail, cuando esa persona entra con ese mail (y pone el código) se vincula sola
  con su perfil y ya ve sus hitos. Si entra alguien que nadie sumó, se le crea un perfil vacío y se le pide el nombre.
- Los videos son privados: se ven con enlaces firmados que vencen.

Las reglas tienen pruebas en `supabase/pruebas/`. Corren en cualquier Postgres 15 o más nuevo (no hace falta Supabase):

```bash
createdb prueba_la_roca
psql -d prueba_la_roca -f supabase/pruebas/00-imitacion-supabase.sql
psql -d prueba_la_roca -f supabase/migrations/20261125220000_perfiles_hitos_videos.sql
psql -d prueba_la_roca -f supabase/pruebas/reglas-de-acceso.sql
```

### Para tener en cuenta

- **Videos pesados.** El plan gratis de Supabase acepta archivos de hasta 50 MB y guarda 1 GB en total.
  Un video de 15 a 30 segundos del celu pesa entre 10 y 40 MB, así que entran unas decenas. Cuando haya más,
  conviene pasar al plan Pro (100 GB) o achicar los videos antes de subirlos.
- **Armar el video tarda lo que dura** (hasta 15 segundos) y hay que dejar la pantalla abierta mientras tanto.
  En iPhone y Android sale en MP4, el formato que Instagram acepta. Si el navegador no puede grabar video,
  se comparte la imagen.
- **Instagram de La Roca.** Cuando exista la cuenta, poné el usuario en `instagram` de `js/app/config.js`:
  aparece en el pie de la historia y en el texto para copiar. Los hashtags también están ahí (`#LaRoca`, `#EscaladaMDP`).
- **Plan gratis.** Supabase pausa los proyectos gratis que pasan una semana sin uso; se reactivan desde el panel.
  Con clases todas las semanas no debería pasar.

## Publicar en Vercel

No necesita configuración de compilación: es un sitio estático y Vercel sirve la carpeta tal cual.
`vercel.json` agrega encabezados de seguridad (incluida una política de contenido que solo permite
fuentes de Google Fonts, videos de Mixkit y la conexión con el proyecto de Supabase) y caché corta para CSS, JS e imágenes.
