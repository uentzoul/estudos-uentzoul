-- Public read-only access to the educational catalog and published guides.
grant select on public.uentzoul_study_guides to anon;
create policy "Visitors read published study guides" on public.uentzoul_study_guides for select to anon using (published);
grant select on public.uentzoul_book_catalog to anon;
create policy "Visitors read book catalog" on public.uentzoul_book_catalog for select to anon using (true);
create policy "Visitors read registered study documents" on storage.objects for select to anon using (
 bucket_id = 'uentzoul-library-files' and (
 exists (select 1 from public.uentzoul_library_uploads u where u.storage_path=objects.name and (u.publish_at is null or u.publish_at<=now() or u.library_public))
 or exists (select 1 from public.uentzoul_library_uploads u where u.preview_path=objects.name and u.library_public and (u.publish_at is null or u.publish_at<=now()))
 or exists (select 1 from public.uentzoul_book_catalog b where b.storage_path=objects.name or b.cover_path=objects.name)
 or name = any (array['materials/scheduled/711e0e4a-cf52-4229-8042-75b950fba6b2.pdf','materials/scheduled/7a66839d-e75d-4dfe-af73-e5a09d6a0323.pdf','materials/scheduled/d27048a1-049d-4e5a-b315-47a764818ff4.pdf','materials/scheduled/5502d9ef-c67a-4994-a81d-e75f430beae8.pdf'])
 ));
