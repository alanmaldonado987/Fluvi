alter table public.movimientos
  alter column categoria_id drop not null,
  add column billetera_id uuid references public.billeteras (id) on delete set null,
  add column billetera_destino_id uuid references public.billeteras (id) on delete set null;

alter table public.movimientos drop constraint movimientos_tipo_check;
alter table public.movimientos
  add constraint movimientos_tipo_check check (tipo in ('Ingreso', 'Egreso', 'Transferencia')),
  add constraint movimientos_categoria_check check ((tipo = 'Transferencia') = (categoria_id is null)),
  add constraint movimientos_transferencia_check check (
    tipo <> 'Transferencia' or (billetera_id is not null and billetera_destino_id is not null and billetera_id <> billetera_destino_id)
  );

create index movimientos_billetera_idx on public.movimientos (billetera_id);
create index movimientos_destino_idx on public.movimientos (billetera_destino_id);

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
  delete from recurrentes where user_id = v_user;
  delete from metas where user_id = v_user;
  delete from presupuestos where user_id = v_user;
  delete from saldos_billetera where user_id = v_user;
  delete from notas_mes where user_id = v_user;
  delete from categorias where user_id = v_user;
  delete from billeteras where user_id = v_user;
end;
$$;

revoke execute on function public.borrar_mis_datos() from public, anon;
grant execute on function public.borrar_mis_datos() to authenticated;
