-- Comment likes and threaded replies.

begin;

alter table public.feed_post_comments
  add column if not exists parent_id uuid references public.feed_post_comments (id) on delete cascade;

create index if not exists feed_post_comments_parent_id_idx on public.feed_post_comments (parent_id);

create table if not exists public.feed_post_comment_likes (
  comment_id uuid not null references public.feed_post_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists feed_post_comment_likes_comment_id_idx
  on public.feed_post_comment_likes (comment_id);

alter table public.feed_post_comment_likes enable row level security;

drop policy if exists "feed_post_comment_likes_select_authenticated" on public.feed_post_comment_likes;
create policy "feed_post_comment_likes_select_authenticated"
on public.feed_post_comment_likes for select
to authenticated
using (true);

drop policy if exists "feed_post_comment_likes_insert_own" on public.feed_post_comment_likes;
create policy "feed_post_comment_likes_insert_own"
on public.feed_post_comment_likes for insert
to authenticated
with check (user_id = auth.uid());

commit;
