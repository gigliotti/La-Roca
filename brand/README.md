# Marca de La Roca

Guía corta para usar el logo, los colores y las tipografías de La Roca, el muro de escalada del Complejo Trebi en Mar del Plata.

![Versiones del logo](versiones.svg)

## La idea

Una roca con techo, alguien escalando colgado de él y el nombre tallado en la piedra. Las letras son de **canto rodado**: gruesas, con las esquinas gastadas y el borde áspero, como las piedras que pule el mar. Los colores son los de un amanecer en la costa: el sol naranja, el mar y la arena.

Las letras no salen de ninguna tipografía: están dibujadas para La Roca.

## Qué archivo usar

| Necesito… | Archivo |
| --- | --- |
| El logo (sello) en general | `logo/la-roca.svg` (naranja) |
| El logo con el amanecer entre el nombre y la bajada | `logo/la-roca-amanecer.svg` |
| El logo sobre fondo oscuro o naranja | `logo/la-roca-arena.svg` (o `-amanecer-arena`) |
| El logo en una sola tinta (sello de goma, grabado, bordado) | `logo/la-roca-mar.svg` o `logo/la-roca-blanco.svg` (y sus `-amanecer`) |
| Un espacio ancho y bajo (encabezado de la web, firma de mail, cartel) | `logo/la-roca-horizontal.svg` y sus variantes `-fondo-oscuro`, `-fondo-naranja`, `-una-tinta-mar`, `-una-tinta-blanco` |
| Solo el símbolo (la roca con la escaladora, sin letras) | `isotipo/roca.svg` (también `-mar`, `-arena`, `-blanco`) |
| Foto de perfil de Instagram, WhatsApp, Google | `icono/icono-mar.svg`, `icono/icono-sol.svg` o `icono/icono-arena.svg` |
| Ícono de la pestaña del navegador | `icono/favicon.svg` |
| Colores para la web | `colores.css` (variables `--roca-*`) o `colores.json` |

## Logo

- **El sello** (la roca con LA / ROCA calado) es la versión principal. Es una sola silueta: las letras son huecos en la piedra, así que dejan ver el fondo que tengan detrás.
- **Horizontal**: el símbolo a la izquierda y el nombre al lado. Para lugares anchos y bajos, como el encabezado de la web.
- **Sobre fondos claros** usá el naranja. **Sobre el mar, el atardecer o fondos oscuros**, la roca en arena. **Sobre fotos**, la versión blanca en una zona tranquila de la imagen.
- **Espacio libre:** alrededor del logo dejá al menos la altura de la palabra "LA".
- **Tamaño mínimo:** el sello, 90 px de ancho en pantalla o 25 mm impreso; la horizontal, 140 px o 35 mm. Más chico, usá el isotipo.

**No hagas esto:**

- Estirar, aplastar o rotar el logo.
- Reescribir "La Roca" con una tipografía en lugar de usar el archivo.
- Separar la escaladora de la roca o moverla de lugar.
- Pintar la roca con colores fuera de la paleta o con degradés.
- Agregarle sombras, contornos o efectos.

## Colores

![Paleta](paleta.svg)

| Color | HEX | Para qué |
| --- | --- | --- |
| Sol | `#FF7A2F` | El color de la marca. El logo, fondos de impacto, botones grandes. |
| Atardecer | `#E8461E` | Segundo naranja, para acentos y fondos. |
| Mar | `#1E4F7A` | Azul de la marca. Texto sobre fondos claros, fondos. |
| Hondo | `#102A40` | Texto sobre naranja y fondos oscuros. |
| Arena | `#F3E3CF` | Fondo claro principal. El logo sobre fondos oscuros. |
| Óxido | `#B03A10` | Naranja para texto chico y enlaces sobre fondos claros. |

**Para que se lea bien:**

- Texto sobre Sol: en **Hondo** (contraste 5,7:1). El Mar sobre Sol (3,3:1) y la Arena sobre Sol (2,1:1) solo sirven para títulos muy grandes.
- Texto sobre Arena: en **Mar** (6,8:1) o **Hondo** (11,7:1).
- Naranja para texto chico o enlaces sobre fondo claro: **Óxido** (4,8:1 sobre Arena). El Sol queda para formas, el logo y botones grandes.
- Texto sobre Mar u Hondo: en **Arena**.

## Tipografías

![Tipografías](tipografia.svg)

- **Títulos: [DM Serif Display](https://fonts.google.com/specimen/DM+Serif+Display)**, con la cursiva para destacar una palabra.
- **Texto: [DM Sans](https://fonts.google.com/specimen/DM+Sans)**, pesos 400 a 600.

Las dos son gratuitas (Google Fonts, licencia OFL). Para cargarlas en una página:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display:ital@0;1&display=swap">
```

`tipografia.svg` y `paleta.svg` cargan las fuentes desde Google Fonts: abiertas en el navegador se ven con las tipografías reales; en otros programas puede aparecer una de reemplazo. Los archivos del logo no dependen de ninguna fuente.

## Cómo suena La Roca

- Cercana y en voseo: "vení", "animate", "tu gente".
- Habla de lo que la escalada te da por dentro (calma, confianza, comunidad) antes que del rendimiento.
- Invita, no exige: caerse es parte.

## Cambiar o regenerar los archivos

Todo sale de `fuente/generar.mjs` (letras, roca, escaladora, variantes, colores y estas hojas). Para regenerar:

```bash
node brand/fuente/generar.mjs
```
