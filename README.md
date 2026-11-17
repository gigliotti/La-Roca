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

## Publicar en Vercel

No necesita configuración de compilación: es un sitio estático y Vercel sirve la carpeta tal cual.
`vercel.json` agrega encabezados de seguridad (incluida una política de contenido que solo permite
fuentes de Google Fonts y videos de Mixkit) y caché corta para CSS, JS e imágenes.
