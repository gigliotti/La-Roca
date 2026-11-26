-- =========================================================
-- La Roca · perfiles, hitos y videos
--
-- perfiles  Una fila por persona. La crea el entrenador (con el mail
--           de la persona) o se crea sola la primera vez que alguien
--           entra. Cuando la persona entra con ese mail, se vincula.
-- hitos     Los logros que el entrenador anota en cada clase. Forman
--           la "vía" (la línea de vida) de cada perfil.
-- videos    Bucket privado de Storage: un video corto por hito, en
--           la carpeta del perfil: <perfil_id>/<uuid>.<ext> (uno nuevo por subida)
--
-- Quién puede qué (con Row Level Security):
--   · Cada persona ve su perfil, sus hitos y sus videos, y puede
--     sumar o cambiar el video de sus hitos.
--   · El entrenador ve a todas las personas, suma personas nuevas,
--     anota, corrige y borra hitos, y sube videos para cualquiera.
--   · Para hacer entrenador a alguien, desde el SQL Editor:
--       update public.perfiles set rol = 'entrenador' where email = 'mail@ejemplo.com';
-- =========================================================

create schema if not exists privado;
revoke all on schema privado from public;
grant usage on schema privado to authenticated;

-- ---------- Perfiles ----------

create table public.perfiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users (id) on delete set null,
  email       text not null,
  nombre      text check (char_length(btrim(nombre)) between 1 and 60),
  instagram   text check (instagram ~ '^[a-z0-9._]{1,30}$'),
  rol         text not null default 'cliente' check (rol in ('cliente', 'entrenador')),
  creado_en   timestamptz not null default now(),
  creado_por  uuid references public.perfiles (id) on delete set null,
  constraint perfiles_email_key unique (email),
  constraint perfiles_email_valido check (email = lower(btrim(email)) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

comment on table public.perfiles is 'Personas de La Roca: clientes y entrenadores.';
comment on column public.perfiles.nombre is 'Null hasta que la persona dice cómo se llama (si entró sola).';

-- Funciones que usan las reglas de acceso. Son "security definer" para leer
-- perfiles sin pasar por sus propias reglas, y viven en un esquema que la API no expone.
create function privado.mi_perfil()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select id from public.perfiles where user_id = (select auth.uid())
$$;

create function privado.es_entrenador()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where user_id = (select auth.uid()) and rol = 'entrenador'
  )
$$;

revoke all on function privado.mi_perfil() from public;
revoke all on function privado.es_entrenador() from public;
grant execute on function privado.mi_perfil() to authenticated;
grant execute on function privado.es_entrenador() to authenticated;

alter table public.perfiles alter column creado_por set default privado.mi_perfil();

-- El mail siempre en minúsculas y sin espacios
create function privado.normalizar_perfil()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.email := lower(btrim(new.email));
  new.nombre := nullif(btrim(new.nombre), '');
  new.instagram := nullif(lower(btrim(ltrim(btrim(new.instagram), '@'))), '');
  return new;
end
$$;

create trigger normalizar_perfil
before insert or update on public.perfiles
for each row execute function privado.normalizar_perfil();

alter table public.perfiles enable row level security;

create policy "Cada uno ve su perfil; el entrenador ve todos"
on public.perfiles for select to authenticated
using (user_id = (select auth.uid()) or (select privado.es_entrenador()));

create policy "El entrenador suma clientes"
on public.perfiles for insert to authenticated
with check ((select privado.es_entrenador()) and rol = 'cliente' and user_id is null);

create policy "Cada uno edita su perfil; el entrenador, el de sus clientes"
on public.perfiles for update to authenticated
using (user_id = (select auth.uid()) or ((select privado.es_entrenador()) and rol = 'cliente'))
with check (user_id = (select auth.uid()) or ((select privado.es_entrenador()) and rol = 'cliente'));

-- Solo se pueden escribir estas columnas desde la app (el rol y el vínculo, nunca)
revoke all on public.perfiles from anon, authenticated;
grant select on public.perfiles to authenticated;
grant insert (email, nombre, instagram) on public.perfiles to authenticated;
grant update (nombre, instagram) on public.perfiles to authenticated;

-- ---------- Vincular la cuenta con su perfil ----------
-- Cuando alguien confirma su mail (al poner el código), se vincula con el
-- perfil que le armó el entrenador. Si no había, se crea uno nuevo.

create function privado.vincular_perfil()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  correo text := lower(btrim(new.email));
begin
  if new.email_confirmed_at is null or correo is null or correo = '' then
    return new;
  end if;
  if exists (select 1 from public.perfiles where user_id = new.id) then
    return new;
  end if;

  update public.perfiles set user_id = new.id
  where email = correo and user_id is null;

  if not found then
    insert into public.perfiles (user_id, email, nombre, creado_por)
    values (
      new.id,
      correo,
      nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'nombre', '')), 60), ''),
      null
    )
    on conflict (email) do nothing;
  end if;
  return new;
exception when others then
  -- Nunca frenar el ingreso por esto: la app avisa si falta el perfil
  raise warning 'vincular_perfil: %', sqlerrm;
  return new;
end
$$;

create trigger vincular_perfil
after insert or update of email_confirmed_at on auth.users
for each row execute function privado.vincular_perfil();

-- ---------- Hitos ----------

create table public.hitos (
  id                 uuid primary key default gen_random_uuid(),
  perfil_id          uuid not null,
  entrenador_id      uuid default privado.mi_perfil(),
  entrenador_nombre  text,
  tipo               text not null check (tipo in ('primera_vez', 'arriba', 'grado', 'tecnica', 'cabeza', 'cuerpo', 'gente', 'otro')),
  titulo             text not null check (char_length(btrim(titulo)) between 1 and 80),
  grado              text check (char_length(grado) <= 12),
  nota               text check (char_length(nota) <= 280),
  fecha              date not null default (now() at time zone 'America/Argentina/Buenos_Aires')::date,
  video_path         text,
  creado_en          timestamptz not null default now(),
  constraint hitos_perfil_fk foreign key (perfil_id) references public.perfiles (id) on delete cascade,
  constraint hitos_entrenador_fk foreign key (entrenador_id) references public.perfiles (id) on delete set null,
  -- El video vive en la carpeta del perfil del hito
  constraint hitos_video_en_su_carpeta check (
    video_path is null
    or video_path ~ ('^' || perfil_id::text || '/[0-9a-f-]{36}\.(mp4|mov|webm|m4v)$')
  )
);

comment on table public.hitos is 'Logros que el entrenador anota en cada clase: la vía de cada perfil.';

create index hitos_perfil_fecha on public.hitos (perfil_id, fecha desc, creado_en desc);
create index hitos_fecha on public.hitos (fecha desc);
create index hitos_entrenador on public.hitos (entrenador_id);
create index perfiles_creado_por on public.perfiles (creado_por);

-- Al anotar un hito se guarda quién lo anotó (y su nombre, para que el cliente lo vea)
create function privado.firmar_hito()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.entrenador_id is not null then
    select coalesce(nombre, split_part(email, '@', 1)) into new.entrenador_nombre
    from public.perfiles where id = new.entrenador_id;
  end if;
  new.titulo := btrim(new.titulo);
  new.grado := nullif(btrim(new.grado), '');
  new.nota := nullif(btrim(new.nota), '');
  return new;
end
$$;

create trigger firmar_hito
before insert on public.hitos
for each row execute function privado.firmar_hito();

-- Desde la app, el cliente solo puede cambiar el video de su hito
create function privado.cuidar_hito()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user = 'authenticated' and not privado.es_entrenador() then
    if (new.perfil_id, new.tipo, new.titulo, new.grado, new.nota, new.fecha)
       is distinct from
       (old.perfil_id, old.tipo, old.titulo, old.grado, old.nota, old.fecha) then
      raise exception 'Solo el entrenador puede cambiar un hito' using errcode = '42501';
    end if;
  end if;
  new.titulo := btrim(new.titulo);
  new.grado := nullif(btrim(new.grado), '');
  new.nota := nullif(btrim(new.nota), '');
  return new;
end
$$;

create trigger cuidar_hito
before update on public.hitos
for each row execute function privado.cuidar_hito();

alter table public.hitos enable row level security;

create policy "Cada uno ve sus hitos; el entrenador ve todos"
on public.hitos for select to authenticated
using (perfil_id = (select privado.mi_perfil()) or (select privado.es_entrenador()));

create policy "El entrenador anota hitos a su nombre"
on public.hitos for insert to authenticated
with check ((select privado.es_entrenador()) and entrenador_id = (select privado.mi_perfil()));

create policy "El entrenador corrige hitos; cada uno suma su video"
on public.hitos for update to authenticated
using (perfil_id = (select privado.mi_perfil()) or (select privado.es_entrenador()))
with check (perfil_id = (select privado.mi_perfil()) or (select privado.es_entrenador()));

create policy "El entrenador borra hitos"
on public.hitos for delete to authenticated
using ((select privado.es_entrenador()));

revoke all on public.hitos from anon, authenticated;
grant select, delete on public.hitos to authenticated;
grant insert (perfil_id, tipo, titulo, grado, nota, fecha) on public.hitos to authenticated;
grant update (tipo, titulo, grado, nota, fecha, video_path) on public.hitos to authenticated;

-- ---------- Videos (Storage) ----------
-- Privado, hasta 50 MB por archivo (el máximo del plan gratis).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', false, 52428800,
        array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'])
on conflict (id) do nothing;

create policy "Videos: ver los propios (entrenador: todos)"
on storage.objects for select to authenticated
using (
  bucket_id = 'videos'
  and ((storage.foldername(name))[1] = (select privado.mi_perfil())::text or (select privado.es_entrenador()))
);

create policy "Videos: subir los propios (entrenador: todos)"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'videos'
  and ((storage.foldername(name))[1] = (select privado.mi_perfil())::text or (select privado.es_entrenador()))
);

create policy "Videos: reemplazar los propios (entrenador: todos)"
on storage.objects for update to authenticated
using (
  bucket_id = 'videos'
  and ((storage.foldername(name))[1] = (select privado.mi_perfil())::text or (select privado.es_entrenador()))
)
with check (
  bucket_id = 'videos'
  and ((storage.foldername(name))[1] = (select privado.mi_perfil())::text or (select privado.es_entrenador()))
);

create policy "Videos: borrar los propios (entrenador: todos)"
on storage.objects for delete to authenticated
using (
  bucket_id = 'videos'
  and ((storage.foldername(name))[1] = (select privado.mi_perfil())::text or (select privado.es_entrenador()))
);
