-- La foto de perfil (y el nombre) de cada persona se copia a las tablas de listas compartidas, igual que ya pasaba con el
-- nombre y el correo, para que las demás personas puedan verla. Un disparador sobre auth.users la mantiene al día cuando
-- alguien cambia su foto o su nombre.

alter table public.listas_compras add column if not exists propietario_avatar text;
alter table public.lista_miembros add column if not exists avatar text;

-- Datos que ya existen
update public.listas_compras l
   set propietario_avatar = u.raw_user_meta_data ->> 'avatar',
       propietario_nombre = coalesce(u.raw_user_meta_data ->> 'nombre', l.propietario_nombre)
  from auth.users u
 where u.id = l.user_id;

update public.lista_miembros m
   set avatar = u.raw_user_meta_data ->> 'avatar',
       nombre = coalesce(u.raw_user_meta_data ->> 'nombre', m.nombre)
  from auth.users u
 where u.id = m.usuario_id;

-- Al crear una lista se copia también la foto del propietario.
create or replace function public.listas_propietario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select coalesce(u.email, ''), coalesce(u.raw_user_meta_data ->> 'nombre', ''), u.raw_user_meta_data ->> 'avatar'
    into new.propietario_email, new.propietario_nombre, new.propietario_avatar
    from auth.users u
   where u.id = new.user_id;
  return new;
end;
$$;

-- Al invitar se copia también la foto de la persona invitada.
create or replace function public.invitar_a_lista(p_lista uuid, p_email text)
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
  insert into lista_miembros (lista_id, usuario_id, email, nombre, avatar, invitado_por)
  values (p_lista, v_destino.id, v_destino.email, coalesce(v_destino.raw_user_meta_data ->> 'nombre', ''), v_destino.raw_user_meta_data ->> 'avatar', v_user)
  on conflict (lista_id, usuario_id) do nothing;
end;
$$;

-- Cuando alguien cambia su foto o su nombre, se actualiza en todas sus listas.
create or replace function public.sincronizar_perfil_en_listas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.raw_user_meta_data ->> 'avatar') is distinct from (old.raw_user_meta_data ->> 'avatar')
     or (new.raw_user_meta_data ->> 'nombre') is distinct from (old.raw_user_meta_data ->> 'nombre') then
    update public.listas_compras
       set propietario_avatar = new.raw_user_meta_data ->> 'avatar',
           propietario_nombre = coalesce(new.raw_user_meta_data ->> 'nombre', propietario_nombre)
     where user_id = new.id;
    update public.lista_miembros
       set avatar = new.raw_user_meta_data ->> 'avatar',
           nombre = coalesce(new.raw_user_meta_data ->> 'nombre', nombre)
     where usuario_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sincronizar_perfil_en_listas on auth.users;
create trigger sincronizar_perfil_en_listas
  after update of raw_user_meta_data on auth.users
  for each row execute function public.sincronizar_perfil_en_listas();
