create table public.movimientos_historial (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  movimiento_id uuid not null,
  accion text not null check (accion in ('creado', 'editado', 'eliminado')),
  antes jsonb,
  despues jsonb,
  creado_en timestamptz not null default now()
);

create index movimientos_historial_movimiento_idx on public.movimientos_historial (movimiento_id, creado_en);
create index movimientos_historial_user_idx on public.movimientos_historial (user_id, creado_en desc);

alter table public.movimientos_historial enable row level security;

create policy "propietario_lee" on public.movimientos_historial for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.registrar_historial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into movimientos_historial (user_id, movimiento_id, accion, despues) values (new.user_id, new.id, 'creado', to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    if (to_jsonb(old) - 'creado_en') is distinct from (to_jsonb(new) - 'creado_en') then
      insert into movimientos_historial (user_id, movimiento_id, accion, antes, despues) values (new.user_id, new.id, 'editado', to_jsonb(old), to_jsonb(new));
    end if;
    return new;
  else
    insert into movimientos_historial (user_id, movimiento_id, accion, antes) values (old.user_id, old.id, 'eliminado', to_jsonb(old));
    return old;
  end if;
end;
$$;

create trigger movimientos_historial
  after insert or update or delete on public.movimientos
  for each row execute function public.registrar_historial();

create table public.notas_mes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  anio integer not null,
  mes smallint not null check (mes between 1 and 12),
  texto text not null default '',
  actualizado_en timestamptz not null default now(),
  primary key (user_id, anio, mes)
);

alter table public.notas_mes enable row level security;

create policy "propietario" on public.notas_mes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
