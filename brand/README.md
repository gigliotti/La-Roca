# Marca de La Roca

Guía corta para usar el logo, los colores y las tipografías de La Roca, el muro de escalada del Complejo Trebi en Mar del Plata.

![Versiones del logo](versiones.svg)

## La idea

El símbolo es un arco con el **sol naranja saliendo del mar** y una **roca en la orilla**: escalar en la ciudad del mar. El nombre va en letras de **canto rodado**, gruesas y con las esquinas gastadas, como las piedras que pule el mar en la costa.

Las letras no salen de ninguna tipografía: están dibujadas para La Roca.

## Qué archivo usar

| Necesito… | Archivo |
| --- | --- |
| El logo en general (web, documentos, fondos claros) | `logo/la-roca-horizontal.svg` |
| El logo sobre el mar o fondos oscuros | `logo/la-roca-horizontal-fondo-oscuro.svg` |
| El logo sobre fondo naranja | `logo/la-roca-horizontal-fondo-naranja.svg` |
| Un espacio más cuadrado (posteos, carteles, remeras) | `logo/la-roca-vertical*.svg` (mismas variantes) |
| Imprimir en un solo color (sellos, grabado, bordado) | `logo/*-una-tinta-mar.svg`, `*-una-tinta-blanco.svg` o `*-una-tinta-naranja.svg` |
| Solo el nombre | `logo/la-roca-nombre.svg` (también `-arena` y `-blanco`) |
| Solo el símbolo | `isotipo/simbolo.svg` (también `-dos-tintas`, `-mar`, `-arena`, `-blanco`) |
| Foto de perfil de Instagram, WhatsApp, Google | `icono/icono-mar.svg`, `icono/icono-sol.svg` o `icono/icono-arena.svg` |
| Ícono de la pestaña del navegador | `icono/favicon.svg` |
| Colores para la web | `colores.css` (variables `--roca-*`) o `colores.json` |

## Logo

- **Horizontal** (símbolo a la izquierda, nombre al lado) es la versión principal. **Vertical** (símbolo arriba) es para formatos cuadrados o angostos.
- **Sobre fondos claros:** arco en Sol, letras en Mar. **Sobre el mar o fondos oscuros:** arco en Sol, letras en Arena. **Sobre naranja:** arco en Arena, letras en Hondo.
- En la versión de una tinta, el sol, el mar y la roca quedan calados: dejan ver el fondo. **Sobre fotos o videos** usá la de una tinta blanca, en una zona tranquila de la imagen.
- **Espacio libre:** alrededor del logo dejá al menos la mitad del ancho del arco.
- **Tamaño mínimo:** horizontal, 120 px de ancho en pantalla o 30 mm impreso. Vertical, 60 px o 18 mm. El símbolo solo, 20 px.

**No hagas esto:**

- Estirar, aplastar o rotar el logo.
- Reescribir "La Roca" con una tipografía en lugar de usar el archivo.
- Cambiar el orden del sol, el mar y la roca, o sacar alguno.
- Usar colores fuera de la paleta o degradés.
- Agregarle sombras, contornos o efectos.

## Colores

![Paleta](paleta.svg)

| Color | HEX | Para qué |
| --- | --- | --- |
| Sol | `#FF7A2F` | El color de la marca. El arco del símbolo, fondos de impacto, botones grandes. |
| Atardecer | `#E8461E` | Segundo naranja, para acentos y fondos. |
| Mar | `#1E4F7A` | Azul de la marca. Las letras del logo, texto sobre fondos claros. |
| Hondo | `#102A40` | Texto sobre naranja y fondos oscuros. |
| Arena | `#F3E3CF` | Fondo claro principal. Las letras del logo sobre fondos oscuros. |
| Óxido | `#B03A10` | Naranja para texto chico y enlaces sobre fondos claros. |

El sol manda; el mar y la arena ordenan; el atardecer acompaña.

**Para que se lea bien:**

- Texto sobre Sol: en **Hondo** (contraste 5,7:1). El Mar sobre Sol (3,3:1) y la Arena sobre Sol (2,1:1) solo sirven para títulos muy grandes.
- Texto sobre Arena: en **Mar** (6,8:1) o **Hondo** (11,7:1).
- Naranja para texto chico o enlaces sobre fondo claro: **Óxido** (4,8:1 sobre Arena). El Sol queda para formas, el logo y botones grandes.
- Texto sobre Mar u Hondo: en **Arena**.

## Tipografías

![Tipografías](tipografia.svg)

- **Logo: canto rodado**, dibujada para La Roca. Es solo para el nombre, no para escribir textos.
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

Todo sale de `fuente/generar.mjs` (letras, símbolo, variantes, colores y estas hojas). Para regenerar:

```bash
node brand/fuente/generar.mjs
```
