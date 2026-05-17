-- Likes and comments on feed posts.

begin;

create table if not exists public.feed_post_likes (
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists feed_post_likes_post_id_idx on public.feed_post_likes (post_id);

create table if not exists public.feed_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists feed_post_comments_post_id_idx on public.feed_post_comments (post_id);
create index if not exists feed_post_comments_created_at_idx on public.feed_post_comments (created_at desc);

alter table public.feed_post_likes enable row level security;
alter table public.feed_post_comments enable row level security;

drop policy if exists "feed_post_likes_select_authenticated" on public.feed_post_likes;
create policy "feed_post_likes_select_authenticated"
on public.feed_post_likes for select
to authenticated
using (true);

drop policy if exists "feed_post_likes_insert_own" on public.feed_post_likes;
create policy "feed_post_likes_insert_own"
on public.feed_post_likes for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "feed_post_comments_select_authenticated" on public.feed_post_comments;
create policy "feed_post_comments_select_authenticated"
on public.feed_post_comments for select
to authenticated
using (true);

drop policy if exists "feed_post_comments_insert_own" on public.feed_post_comments;
create policy "feed_post_comments_insert_own"
on public.feed_post_comments for insert
to authenticated
with check (author_id = auth.uid());

commit;
