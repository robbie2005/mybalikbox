-- Allow authenticated users to read post media (required for signed URLs).

begin;

drop policy if exists "post_media_select_authenticated" on storage.objects;
create policy "post_media_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'post-media');

commit;
