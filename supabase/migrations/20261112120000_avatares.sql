-- Fotos de perfil: un bucket público (las imágenes se muestran por su URL) donde cada usuario solo puede
-- subir, reemplazar o borrar archivos dentro de su propia carpeta (<id del usuario>/...).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatares_ver_propio on storage.objects;
create policy avatares_ver_propio on storage.objects for select to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists avatares_subir_propio on storage.objects;
create policy avatares_subir_propio on storage.objects for insert to authenticated
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists avatares_cambiar_propio on storage.objects;
create policy avatares_cambiar_propio on storage.objects for update to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists avatares_borrar_propio on storage.objects;
create policy avatares_borrar_propio on storage.objects for delete to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);
