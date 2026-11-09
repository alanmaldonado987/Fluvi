-- Prioridad opcional de cada ítem de las listas de compras: alta, media o baja (null = sin prioridad).
alter table public.lista_items
  add column if not exists prioridad text
  check (prioridad is null or prioridad in ('alta', 'media', 'baja'));
