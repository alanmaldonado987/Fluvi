-- Módulo de listas de compras, con listas compartidas entre usuarios de Fluvi.
-- Es independiente: no toca saldos, billeteras, movimientos ni ningún otro módulo.
-- Ejecutar una sola vez en el SQL Editor.

-- ---------------------------------------------------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------------------------------------------------

create table public.listas_compras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  compartida boolean not null default false,
  -- Datos del propietario, para mostrarlos a quienes comparten la lista. Los fija un trigger, no el cliente.
  propietario_nombre text not null default '',
  propietario_email text not null default '',
  creado_en timestamptz not null default now()
);

create table public.lista_items (
  id uuid primary key default gen_random_uuid(),
  lista_id uuid not null references public.listas_compras (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  precio numeric(14, 2) not null default 0 check (precio >= 0),
  fecha_compra date,
  comprado boolean not null default false,
  comprado_en timestamptz,
  creado_por uuid default auth.uid() references auth.users (id) on delete set null,
  creado_en timestamptz not null default now()
);

-- Quién tiene acceso a una lista compartida. Una fila "pendiente" es una invitación sin responder.
create table public.lista_miembros (
  lista_id uuid not null references public.listas_compras (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  nombre text not null default '',
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada')),
  puede_crear boolean not null default true,
  puede_editar boolean not null default true,
  puede_eliminar boolean not null default true,
  invitado_por uuid references auth.users (id) on delete set null,
  -- Cuándo se envió el correo de la invitación (lo marca la función enviar-invitacion; evita reenviarlo).
  correo_enviado_en timestamptz,
  creado_en timestamptz not null default now(),
  primary key (lista_id, usuario_id)
);

create index listas_compras_user_idx on public.listas_compras (user_id);
create index lista_items_lista_idx on public.lista_items (lista_id);
create index lista_miembros_usuario_idx on public.lista_miembros (usuario_id);

create function public.listas_propietario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select coalesce(u.email, ''), coalesce(u.raw_user_meta_data ->> 'nombre', '')
    into new.propietario_email, new.propietario_nombre
    from auth.users u
   where u.id = new.user_id;
  return new;
end;
$$;

create trigger listas_propietario
  before insert on public.listas_compras
  for each row execute function public.listas_propietario();

-- ---------------------------------------------------------------------------------------------------------------------
-- Funciones de apoyo para las políticas. Son "security definer" para consultar las tablas sin que las políticas se llamen
-- unas a otras en círculo. Un miembro solo cuenta si la lista sigue marcada como compartida.
-- ---------------------------------------------------------------------------------------------------------------------

create function public.lista_es_propietario(p_lista uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from listas_compras l where l.id = p_lista and l.user_id = (select auth.uid()));
$$;

-- Permisos: 'ver', 'crear', 'editar' o 'eliminar'. El propietario los tiene todos.
create function public.lista_permiso(p_lista uuid, p_permiso text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from listas_compras l where l.id = p_lista and l.user_id = (select auth.uid()))
      or exists (
        select 1
          from lista_miembros m
          join listas_compras l on l.id = m.lista_id
         where m.lista_id = p_lista
           and m.usuario_id = (select auth.uid())
           and m.estado = 'aceptada'
           and l.compartida
           and case p_permiso
                 when 'ver' then true
                 when 'crear' then m.puede_crear
                 when 'editar' then m.puede_editar
                 when 'eliminar' then m.puede_eliminar
                 else false
               end
      );
$$;

-- Quien tiene una invitación (pendiente o aceptada) puede ver el nombre de la lista a la que lo invitan.
create function public.lista_con_vinculo(p_lista uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from lista_miembros m where m.lista_id = p_lista and m.usuario_id = (select auth.uid()));
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- Seguridad por filas
-- ---------------------------------------------------------------------------------------------------------------------

alter table public.listas_compras enable row level security;
alter table public.lista_items enable row level security;
alter table public.lista_miembros enable row level security;

-- Listas: las ve el propietario y quien tenga una invitación; solo el propietario las crea, edita y borra.
create policy "ver" on public.listas_compras for select to authenticated
  using (user_id = (select auth.uid()) or public.lista_con_vinculo(id));
create policy "crear" on public.listas_compras for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "editar" on public.listas_compras for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "borrar" on public.listas_compras for delete to authenticated
  using (user_id = (select auth.uid()));

-- Ítems: cada operación exige su permiso sobre la lista.
create policy "ver" on public.lista_items for select to authenticated
  using (public.lista_permiso(lista_id, 'ver'));
create policy "crear" on public.lista_items for insert to authenticated
  with check (public.lista_permiso(lista_id, 'crear') and creado_por = (select auth.uid()));
create policy "editar" on public.lista_items for update to authenticated
  using (public.lista_permiso(lista_id, 'editar')) with check (public.lista_permiso(lista_id, 'editar'));
create policy "borrar" on public.lista_items for delete to authenticated
  using (public.lista_permiso(lista_id, 'eliminar'));

-- Miembros: se leen (el propietario, el invitado y quienes ya participan), y se borran (el propietario saca a alguien, o uno
-- sale por su cuenta). No hay políticas de insertar ni actualizar: eso solo ocurre por las funciones de abajo, para que
-- nadie pueda agregarse a una lista ni darse permisos.
create policy "ver" on public.lista_miembros for select to authenticated
  using (usuario_id = (select auth.uid()) or public.lista_es_propietario(lista_id) or public.lista_permiso(lista_id, 'ver'));
create policy "borrar" on public.lista_miembros for delete to authenticated
  using (usuario_id = (select auth.uid()) or public.lista_es_propietario(lista_id));

-- ---------------------------------------------------------------------------------------------------------------------
-- Operaciones sobre miembros e invitaciones
-- ---------------------------------------------------------------------------------------------------------------------

-- El propietario invita a un usuario de Fluvi por su correo. Si ya estaba invitado o participa, no cambia nada.
create function public.invitar_a_lista(p_lista uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_correo text := lower(trim(p_email));
  v_destino auth.users%rowtype;
begin
  if v_user is null then
    raise exception 'Se requiere una sesión activa';
  end if;
  if not public.lista_es_propietario(p_lista) then
    raise exception 'Solo quien creó la lista puede invitar';
  end if;
  if not (select compartida from listas_compras where id = p_lista) then
    raise exception 'Activa "Compartir" en la lista antes de invitar';
  end if;
  select * into v_destino from auth.users where lower(email) = v_correo limit 1;
  if not found then
    raise exception 'No hay un usuario de Fluvi con ese correo';
  end if;
  if v_destino.id = v_user then
    raise exception 'Ese correo es el tuyo';
  end if;
  insert into lista_miembros (lista_id, usuario_id, email, nombre, invitado_por)
  values (p_lista, v_destino.id, v_destino.email, coalesce(v_destino.raw_user_meta_data ->> 'nombre', ''), v_user)
  on conflict (lista_id, usuario_id) do nothing;
end;
$$;

-- El invitado acepta (pasa a participar) o rechaza (se borra la invitación).
create function public.responder_invitacion(p_lista uuid, p_aceptar boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Se requiere una sesión activa';
  end if;
  if p_aceptar then
    update lista_miembros set estado = 'aceptada'
     where lista_id = p_lista and usuario_id = v_user and estado = 'pendiente';
  else
    delete from lista_miembros where lista_id = p_lista and usuario_id = v_user and estado = 'pendiente';
  end if;
  if not found then
    raise exception 'No tienes una invitación pendiente para esa lista';
  end if;
end;
$$;

-- El propietario cambia lo que puede hacer cada participante con los ítems de la lista.
create function public.cambiar_permisos_miembro(p_lista uuid, p_usuario uuid, p_crear boolean, p_editar boolean, p_eliminar boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Se requiere una sesión activa';
  end if;
  if not public.lista_es_propietario(p_lista) then
    raise exception 'Solo quien creó la lista puede cambiar los permisos';
  end if;
  update lista_miembros set puede_crear = p_crear, puede_editar = p_editar, puede_eliminar = p_eliminar
   where lista_id = p_lista and usuario_id = p_usuario;
  if not found then
    raise exception 'Esa persona no participa en la lista';
  end if;
end;
$$;

-- Estas funciones solo las usan usuarios con sesión.
revoke execute on function public.invitar_a_lista(uuid, text) from public, anon;
revoke execute on function public.responder_invitacion(uuid, boolean) from public, anon;
revoke execute on function public.cambiar_permisos_miembro(uuid, uuid, boolean, boolean, boolean) from public, anon;
revoke execute on function public.lista_es_propietario(uuid) from public, anon;
revoke execute on function public.lista_permiso(uuid, text) from public, anon;
revoke execute on function public.lista_con_vinculo(uuid) from public, anon;
revoke execute on function public.listas_propietario() from public, anon, authenticated;
grant execute on function public.invitar_a_lista(uuid, text) to authenticated;
grant execute on function public.responder_invitacion(uuid, boolean) to authenticated;
grant execute on function public.cambiar_permisos_miembro(uuid, uuid, boolean, boolean, boolean) to authenticated;
grant execute on function public.lista_es_propietario(uuid) to authenticated;
grant execute on function public.lista_permiso(uuid, text) to authenticated;
grant execute on function public.lista_con_vinculo(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------------------------------
-- Tiempo real: Supabase avisa por websocket de los cambios en estas tablas. Cada persona solo recibe avisos de lo que sus
-- políticas le permiten ver, y la app vuelve a leer los datos con su propia sesión.
-- ---------------------------------------------------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.listas_compras, public.lista_items, public.lista_miembros;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- "Borrar todos mis datos" también borra las listas propias y saca al usuario de las listas ajenas.
-- ---------------------------------------------------------------------------------------------------------------------

create or replace function public.borrar_mis_datos()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Se requiere una sesión activa';
  end if;
  delete from movimientos where user_id = v_user;
  delete from movimientos_historial where user_id = v_user;
  delete from deudas where user_id = v_user;
  delete from recurrentes where user_id = v_user;
  delete from metas where user_id = v_user;
  delete from presupuestos where user_id = v_user;
  delete from saldos_billetera where user_id = v_user;
  delete from notas_mes where user_id = v_user;
  delete from categorias where user_id = v_user;
  delete from billeteras where user_id = v_user;
  delete from lista_miembros where usuario_id = v_user;
  delete from listas_compras where user_id = v_user;
end;
$$;
