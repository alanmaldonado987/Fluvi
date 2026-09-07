-- Opción A: borrar los datos de TODAS las cuentas (las cuentas siguen existiendo, solo quedan vacías).
truncate table
  public.movimientos_historial,
  public.movimientos,
  public.recurrentes_omitidos,
  public.recurrentes,
  public.metas,
  public.presupuestos,
  public.saldos_billetera,
  public.notas_mes,
  public.categorias,
  public.billeteras;

-- Opción B: borrar solo los datos de una cuenta. Cambia el correo antes de ejecutar.
do $$
declare
  uid uuid := (select id from auth.users where email = 'tu@correo.com');
begin
  delete from public.movimientos where user_id = uid;
  delete from public.movimientos_historial where user_id = uid;
  delete from public.recurrentes where user_id = uid;
  delete from public.metas where user_id = uid;
  delete from public.presupuestos where user_id = uid;
  delete from public.saldos_billetera where user_id = uid;
  delete from public.notas_mes where user_id = uid;
  delete from public.categorias where user_id = uid;
  delete from public.billeteras where user_id = uid;
end $$;

-- Después de eliminar cuentas de prueba desde Authentication > Users, limpia el historial que quedó sin dueño.
delete from public.movimientos_historial where user_id not in (select id from auth.users);
