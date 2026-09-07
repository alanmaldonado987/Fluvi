create or replace function public.importar_anio(p_anio integer, p_datos jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_siguiente integer;
  v_cats integer := 0;
  v_bills integer := 0;
  v_movs integer := 0;
  v_esperados integer;
  v_cat uuid;
  v_padre uuid;
  r record;
begin
  if v_user is null then
    raise exception 'sin_sesion';
  end if;

  if exists (select 1 from movimientos where user_id = v_user and extract(year from fecha) = p_anio)
     or exists (select 1 from presupuestos where user_id = v_user and anio = p_anio)
     or exists (select 1 from saldos_billetera where user_id = v_user and anio = p_anio) then
    raise exception 'anio_con_datos';
  end if;

  for r in select * from jsonb_to_recordset(p_datos->'categorias') as x(nombre text, tipo text, padre text) where padre is null loop
    select id into v_cat from categorias
      where user_id = v_user and padre_id is null and tipo = r.tipo and lower(trim(nombre)) = lower(trim(r.nombre));
    if v_cat is null then
      insert into categorias (nombre, tipo) values (trim(r.nombre), r.tipo);
      v_cats := v_cats + 1;
    end if;
  end loop;

  for r in select * from jsonb_to_recordset(p_datos->'categorias') as x(nombre text, tipo text, padre text) where padre is not null loop
    select id into v_padre from categorias
      where user_id = v_user and padre_id is null and tipo = r.tipo and lower(trim(nombre)) = lower(trim(r.padre));
    if v_padre is null then
      raise exception 'padre_no_encontrado: %', r.padre;
    end if;
    select id into v_cat from categorias
      where user_id = v_user and padre_id = v_padre and lower(trim(nombre)) = lower(trim(r.nombre));
    if v_cat is null then
      insert into categorias (nombre, tipo, padre_id) values (trim(r.nombre), r.tipo, v_padre);
      v_cats := v_cats + 1;
    end if;
  end loop;

  for r in select value as nombre from jsonb_array_elements_text(p_datos->'billeteras') loop
    if not exists (select 1 from billeteras where user_id = v_user and lower(trim(nombre)) = lower(trim(r.nombre))) then
      insert into billeteras (nombre) values (trim(r.nombre));
      v_bills := v_bills + 1;
    end if;
  end loop;

  insert into presupuestos (anio, mes, categoria_id, valor)
  select p_anio, x.mes, c.id, x.valor
  from jsonb_to_recordset(p_datos->'presupuestos') as x(categoria text, tipo text, mes smallint, valor numeric)
  join categorias c on c.user_id = v_user and c.padre_id is null and c.tipo = x.tipo and lower(trim(c.nombre)) = lower(trim(x.categoria))
  on conflict (user_id, anio, mes, categoria_id) do update set valor = excluded.valor;

  insert into saldos_billetera (anio, mes, billetera_id, saldo)
  select p_anio, x.mes, b.id, x.saldo
  from jsonb_to_recordset(p_datos->'saldos') as x(billetera text, mes smallint, saldo numeric)
  join billeteras b on b.user_id = v_user and lower(trim(b.nombre)) = lower(trim(x.billetera))
  on conflict (user_id, anio, mes, billetera_id) do update set saldo = excluded.saldo;

  select count(*) into v_esperados
  from jsonb_to_recordset(p_datos->'movimientos') as x(fecha date)
  where extract(year from x.fecha) = p_anio;

  select coalesce(max(consecutivo), 0) into v_siguiente from movimientos where user_id = v_user;

  insert into movimientos (consecutivo, fecha, tipo, categoria_id, concepto, valor, observacion)
  select v_siguiente + row_number() over (order by x.fecha, x.orden), x.fecha, x.tipo, coalesce(s.id, c.id),
         coalesce(x.concepto, ''), x.valor, coalesce(x.observacion, '')
  from jsonb_to_recordset(p_datos->'movimientos')
       as x(orden integer, fecha date, tipo text, categoria text, subcategoria text, concepto text, valor numeric, observacion text)
  join categorias c on c.user_id = v_user and c.padre_id is null and c.tipo = x.tipo and lower(trim(c.nombre)) = lower(trim(x.categoria))
  left join categorias s on s.user_id = v_user and s.padre_id = c.id and x.subcategoria is not null and lower(trim(s.nombre)) = lower(trim(x.subcategoria))
  where extract(year from x.fecha) = p_anio;
  get diagnostics v_movs = row_count;

  if v_movs <> v_esperados then
    raise exception 'categoria_desconocida';
  end if;

  return jsonb_build_object('categorias', v_cats, 'billeteras', v_bills, 'movimientos', v_movs);
end;
$$;

revoke all on function public.importar_anio(integer, jsonb) from public;
grant execute on function public.importar_anio(integer, jsonb) to authenticated;
