create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  tipo text not null check (tipo in ('Ingreso', 'Egreso')),
  padre_id uuid references public.categorias (id) on delete cascade,
  creado_en timestamptz not null default now()
);

create table public.billeteras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  creado_en timestamptz not null default now()
);

create table public.movimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  consecutivo integer not null,
  fecha date not null,
  tipo text not null check (tipo in ('Ingreso', 'Egreso')),
  categoria_id uuid not null references public.categorias (id) on delete restrict,
  concepto text not null default '',
  valor numeric(14, 2) not null check (valor > 0),
  observacion text not null default '',
  creado_en timestamptz not null default now(),
  unique (user_id, consecutivo)
);

create table public.presupuestos (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  anio integer not null,
  mes smallint not null check (mes between 1 and 12),
  categoria_id uuid not null references public.categorias (id) on delete cascade,
  valor numeric(14, 2) not null default 0,
  primary key (user_id, anio, mes, categoria_id)
);

create table public.saldos_billetera (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  anio integer not null,
  mes smallint not null check (mes between 1 and 12),
  billetera_id uuid not null references public.billeteras (id) on delete cascade,
  saldo numeric(14, 2) not null default 0,
  primary key (user_id, anio, mes, billetera_id)
);

create index categorias_user_idx on public.categorias (user_id);
create index categorias_padre_idx on public.categorias (padre_id);
create index billeteras_user_idx on public.billeteras (user_id);
create index movimientos_user_fecha_idx on public.movimientos (user_id, fecha);
create index movimientos_categoria_idx on public.movimientos (categoria_id);
create index presupuestos_categoria_idx on public.presupuestos (categoria_id);
create index saldos_billetera_idx on public.saldos_billetera (billetera_id);

alter table public.categorias enable row level security;
alter table public.billeteras enable row level security;
alter table public.movimientos enable row level security;
alter table public.presupuestos enable row level security;
alter table public.saldos_billetera enable row level security;

create policy "propietario" on public.categorias for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "propietario" on public.billeteras for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "propietario" on public.movimientos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "propietario" on public.presupuestos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "propietario" on public.saldos_billetera for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
