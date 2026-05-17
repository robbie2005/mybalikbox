-- Feed is visible to all authenticated users; allow reading basic profile fields
-- (display name, avatar) for anyone who has posted or commented on the feed.

begin;

drop policy if exists "profiles_select_feed_participants" on public.profiles;
create policy "profiles_select_feed_participants"
on public.profiles for select
to authenticated
using (
  exists (
    select 1
    from public.feed_posts fp
    where fp.author_id = profiles.id
  )
  or exists (
    select 1
    from public.feed_post_comments fc
    where fc.author_id = profiles.id
  )
);

commit;
