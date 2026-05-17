-- Allow authors to delete their own feed posts.

begin;

drop policy if exists "feed_posts_delete_own" on public.feed_posts;
create policy "feed_posts_delete_own"
on public.feed_posts for delete
to authenticated
using (author_id = auth.uid());

commit;
