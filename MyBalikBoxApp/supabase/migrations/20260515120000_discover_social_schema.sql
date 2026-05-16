begin;

create table if not exists public.discover_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  caption text not null,
  shared_with_text text,
  image_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discover_posts_category_check check (category in ('gratitude', 'family', 'culture'))
);

create table if not exists public.discover_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.discover_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.discover_post_likes (
  post_id uuid not null references public.discover_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists discover_posts_created_idx
  on public.discover_posts(created_at desc);

create index if not exists discover_posts_category_created_idx
  on public.discover_posts(category, created_at desc);

create index if not exists discover_comments_post_id_created_idx
  on public.discover_comments(post_id, created_at);

create index if not exists discover_post_likes_post_id_idx
  on public.discover_post_likes(post_id);

create index if not exists discover_post_likes_user_id_idx
  on public.discover_post_likes(user_id);

alter table public.discover_posts enable row level security;
alter table public.discover_comments enable row level security;
alter table public.discover_post_likes enable row level security;

create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

create policy "discover_posts_select_authenticated"
on public.discover_posts for select
to authenticated
using (true);

create policy "discover_posts_insert_self"
on public.discover_posts for insert
to authenticated
with check (author_id = auth.uid());

create policy "discover_posts_update_self"
on public.discover_posts for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "discover_posts_delete_self"
on public.discover_posts for delete
to authenticated
using (author_id = auth.uid());

create policy "discover_comments_select_authenticated"
on public.discover_comments for select
to authenticated
using (true);

create policy "discover_comments_insert_self"
on public.discover_comments for insert
to authenticated
with check (author_id = auth.uid());

create policy "discover_post_likes_select_authenticated"
on public.discover_post_likes for select
to authenticated
using (true);

create policy "discover_post_likes_insert_self"
on public.discover_post_likes for insert
to authenticated
with check (user_id = auth.uid());

create policy "discover_post_likes_delete_self"
on public.discover_post_likes for delete
to authenticated
using (user_id = auth.uid());

commit;
