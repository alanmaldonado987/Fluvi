-- Orden manual de los ítems de una lista, para poder arrastrarlos. Ejecutar una sola vez en el SQL Editor,
-- después de 20261109120000_listas_compras.sql.
--
-- El orden es un número decimal: para mover un ítem entre otros dos se le pone el punto medio de sus vecinos y no hace falta
-- reescribir el resto. Los ítems nuevos nacen con la hora actual (en segundos), así quedan al final.

alter table public.lista_items add column orden double precision;

update public.lista_items set orden = extract(epoch from creado_en)::double precision;

alter table public.lista_items
  alter column orden set default (extract(epoch from clock_timestamp())::double precision),
  alter column orden set not null;
