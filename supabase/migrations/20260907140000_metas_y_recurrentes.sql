create table public.recurrentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('Ingreso', 'Egreso')),
  categoria_id uuid not null references public.categorias (id) on delete cascade,
  concepto text not null default '',
  valor numeric(14, 2) not null check (valor > 0),
  dia smallint not null check (dia between 1 and 31),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table public.recurrentes_omitidos (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recurrente_id uuid not null references public.recurrentes (id) on delete cascade,
  anio integer not null,
  mes smallint not null check (mes between 1 and 12),
  primary key (user_id, recurrente_id, anio, mes)
);

alter table public.movimientos
  add column recurrente_id uuid references public.recurrentes (id) on delete set null;

create table public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  objetivo numeric(14, 2) not null check (objetivo > 0),
  categoria_id uuid not null references public.categorias (id) on delete cascade,
  fecha_inicio date not null default current_date,
  fecha_limite date,
  creado_en timestamptz not null default now()
);

create index recurrentes_user_idx on public.recurrentes (user_id);
create index recurrentes_categoria_idx on public.recurrentes (categoria_id);
create index recurrentes_omitidos_recurrente_idx on public.recurrentes_omitidos (recurrente_id);
create index movimientos_recurrente_idx on public.movimientos (recurrente_id);
create index metas_user_idx on public.metas (user_id);
create index metas_categoria_idx on public.metas (categoria_id);

alter table public.recurrentes enable row level security;
alter table public.recurrentes_omitidos enable row level security;
alter table public.metas enable row level security;

create policy "propietario" on public.recurrentes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "propietario" on public.recurrentes_omitidos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "propietario" on public.metas for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
