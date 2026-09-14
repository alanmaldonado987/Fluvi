-- Tabla de deudas (préstamos por cobrar)
create table public.deudas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  persona text not null check (persona <> ''),
  valor numeric(14, 2) not null check (valor > 0),
  billetera_id uuid not null references public.billeteras (id) on delete restrict,
  concepto text not null default '',
  fecha date not null,
  pagada boolean not null default false,
  billetera_pago_id uuid references public.billeteras (id) on delete set null,
  fecha_pago date,
  creado_en timestamptz not null default now()
);

create index deudas_user_idx on public.deudas (user_id);
alter table public.deudas enable row level security;
create policy "propietario" on public.deudas for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Enlace movimientos → deuda (para los egresos/ingresos automáticos)
alter table public.movimientos add column deuda_id uuid references public.deudas (id) on delete cascade;
create index movimientos_deuda_idx on public.movimientos (deuda_id);

-- Relajar el constraint: categoría puede ser null si hay deuda_id
alter table public.movimientos drop constraint movimientos_categoria_check;
alter table public.movimientos add constraint movimientos_categoria_check check (
  categoria_id is not null or tipo = 'Transferencia' or deuda_id is not null
);

-- Agregar deudas al borrado total
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
end;
$$;
