-- Allow users to remove their own likes (unlike).

begin;

drop policy if exists "feed_post_likes_delete_own" on public.feed_post_likes;
create policy "feed_post_likes_delete_own"
on public.feed_post_likes for delete
to authenticated
using (user_id = auth.uid());

commit;
