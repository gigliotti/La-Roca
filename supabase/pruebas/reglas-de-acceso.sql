-- Prueba las reglas de acceso: quién ve, anota, cambia y borra qué.
-- Cada bloque imprime un caso; los ERROR esperados son los permisos que se niegan.
\set ON_ERROR_STOP 0
\pset footer off
-- Bruno: lo hacemos entrenador antes de que entre
insert into public.perfiles (email, nombre, rol) values ('  Bruno@Ejemplo.com ', 'Bruno', 'entrenador');
insert into auth.users (id, email, email_confirmed_at) values ('00000000-0000-0000-0000-0000000000b1', 'bruno@ejemplo.com', now());
select 'bruno vinculado' as caso, nombre, rol, user_id is not null as vinculado from public.perfiles where email = 'bruno@ejemplo.com';

-- Como Bruno
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', false) \g /dev/null
insert into public.perfiles (email, nombre) values ('Sofia@Ejemplo.com', 'Sofía'), ('martina@ejemplo.com', 'Martina');
select 'clientes creados' as caso, p.email, p.nombre, c.nombre as creado_por from public.perfiles p left join public.perfiles c on c.id = p.creado_por where p.rol = 'cliente' order by 2;
insert into public.hitos (perfil_id, tipo, titulo, nota) select id, 'arriba', 'Primera vía completa', '  ¡Grande!  ' from public.perfiles where email = 'sofia@ejemplo.com';
insert into public.hitos (perfil_id, tipo, titulo) select id, 'primera_vez', 'Primera clase' from public.perfiles where email = 'martina@ejemplo.com';
select 'hitos anotados' as caso, titulo, nota, entrenador_nombre, fecha = (now() at time zone 'America/Argentina/Buenos_Aires')::date as hoy from public.hitos order by titulo;
-- Bruno no puede hacer entrenador a otro ni crear con user_id
update public.perfiles set rol = 'entrenador' where email = 'martina@ejemplo.com';
insert into public.perfiles (email, nombre, rol) values ('x@ejemplo.com', 'X', 'entrenador');
reset role;

-- Sofía entra: primero sin confirmar (no pasa nada), después confirma
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-00000000000a', 'sofia@ejemplo.com', '{"nombre":"Sofi"}');
select 'sofia sin confirmar' as caso, count(*) filter (where user_id is not null) as vinculados from public.perfiles where email = 'sofia@ejemplo.com';
update auth.users set email_confirmed_at = now() where id = '00000000-0000-0000-0000-00000000000a';
select 'sofia confirmada' as caso, nombre, user_id is not null as vinculado from public.perfiles where email = 'sofia@ejemplo.com';

-- Como Sofía
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false) \g /dev/null
select 'sofia ve perfiles' as caso, email from public.perfiles;
select 'sofia ve hitos' as caso, titulo, entrenador_nombre from public.hitos;
insert into public.hitos (perfil_id, tipo, titulo) select id, 'arriba', 'Me lo anoto yo' from public.perfiles where email = 'sofia@ejemplo.com';
update public.hitos set titulo = 'Cambiado' ;
update public.perfiles set rol = 'entrenador';
update public.perfiles set nombre = '  Sofía R. ', instagram = '@Sofi.Escala';
select 'sofia edito su nombre' as caso, nombre, instagram from public.perfiles;
-- video en su carpeta: sí; en otra carpeta: no
update public.hitos set video_path = (select id::text from public.perfiles where email='sofia@ejemplo.com') || '/' || id::text || '.mp4' returning 'video propio' as caso, video_path is not null as ok;
update public.hitos set video_path = 'otra/' || id::text || '.mp4';
insert into storage.objects (bucket_id, name) select 'videos', id::text || '/11111111-1111-1111-1111-111111111111.mp4' from public.perfiles where email = 'sofia@ejemplo.com' returning 'storage propio' as caso, name is not null as ok;
insert into storage.objects (bucket_id, name) values ('videos', (select id::text from public.perfiles limit 0) || 'x/11111111-1111-1111-1111-111111111111.mp4');
delete from public.hitos returning 'sofia borro' as caso, titulo;
reset role;
-- Sofía no puede subir a la carpeta de Martina
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false) \g /dev/null
insert into storage.objects (bucket_id, name) values ('videos', (select 'zzz') || '/11111111-1111-1111-1111-111111111111.mp4');
reset role;
select 'martina id' as caso, id from public.perfiles where email='martina@ejemplo.com' \gset martina_
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false) \g /dev/null
insert into storage.objects (bucket_id, name) values ('videos', :'martina_id' || '/22222222-2222-2222-2222-222222222222.mp4');
select 'sofia ve objetos' as caso, count(*) from storage.objects;
reset role;

-- Alguien nuevo entra solo
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ('00000000-0000-0000-0000-00000000000c', 'Nueva@Ejemplo.com', now(), '{}');
select 'perfil nuevo' as caso, email, nombre is null as sin_nombre, rol, creado_por is null as solo from public.perfiles where email = 'nueva@ejemplo.com';
-- Mail raro: no frena el ingreso
insert into auth.users (id, email, email_confirmed_at) values ('00000000-0000-0000-0000-00000000000d', 'raro', now());
select 'mail raro no frena' as caso, count(*) from auth.users where id = '00000000-0000-0000-0000-00000000000d';

-- Bruno ve todo, sube video a Martina y borra un hito
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', false) \g /dev/null
select 'bruno ve' as caso, (select count(*) from public.perfiles) as perfiles, (select count(*) from public.hitos) as hitos, (select count(*) from storage.objects) as videos;
insert into storage.objects (bucket_id, name) values ('videos', :'martina_id' || '/33333333-3333-3333-3333-333333333333.mp4') returning 'bruno sube a martina' as caso;
update public.hitos set titulo = 'Primera vía completa sin descansar' where titulo = 'Primera vía completa' returning 'bruno corrige' as caso, titulo;
delete from public.hitos where titulo = 'Primera clase' returning 'bruno borra' as caso, titulo;
reset role;

-- Nueva (cliente sin hitos) no ve nada ajeno; anon no ve nada
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false) \g /dev/null
select 'nueva ve' as caso, (select count(*) from public.perfiles) as perfiles, (select count(*) from public.hitos) as hitos, (select count(*) from storage.objects) as videos;
reset role;
set role anon;
select 'anon' as caso, count(*) from public.perfiles;
reset role;
