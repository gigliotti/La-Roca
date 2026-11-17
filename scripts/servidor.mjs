// Servidor local mínimo para ver el sitio: `npm run dev`
// No necesita dependencias. Sirve los archivos de la carpeta del proyecto.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)));
const puerto = Number(process.env.PORT) || 4321;

const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.vtt': 'text/vtt; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (pedido, respuesta) => {
  try {
    const ruta = decodeURIComponent(new URL(pedido.url, 'http://localhost').pathname);
    let archivo = normalize(join(raiz, ruta));
    if (!archivo.startsWith(raiz)) throw Object.assign(new Error('fuera'), { code: 'ENOENT' });
    if ((await stat(archivo)).isDirectory()) archivo = join(archivo, 'index.html');
    const contenido = await readFile(archivo);
    respuesta.writeHead(200, {
      'Content-Type': tipos[extname(archivo).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    respuesta.end(contenido);
  } catch (error) {
    respuesta.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
    respuesta.end(error.code === 'ENOENT' ? 'No encontrado' : 'Error del servidor');
  }
}).listen(puerto, () => {
  console.log(`La Roca en http://localhost:${puerto}`);
});
