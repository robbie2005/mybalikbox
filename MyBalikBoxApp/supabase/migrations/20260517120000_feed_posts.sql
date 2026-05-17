-- Public feed posts and media storage.

begin;

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  image_url text not null,
  caption text not null default '',
  category text not null check (category in ('Family', 'Culture', 'Gratitude')),
  media_type text not null default 'photo' check (media_type in ('photo', 'video')),
  created_at timestamptz not null default now()
);

create index if not exists feed_posts_created_at_idx on public.feed_posts (created_at desc);
create index if not exists feed_posts_author_id_idx on public.feed_posts (author_id);

alter table public.feed_posts enable row level security;

drop policy if exists "feed_posts_select_authenticated" on public.feed_posts;
create policy "feed_posts_select_authenticated"
on public.feed_posts for select
to authenticated
using (true);

drop policy if exists "feed_posts_insert_own" on public.feed_posts;
create policy "feed_posts_insert_own"
on public.feed_posts for insert
to authenticated
with check (author_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

drop policy if exists "post_media_public_read" on storage.objects;
create policy "post_media_public_read"
on storage.objects for select
using (bucket_id = 'post-media');

drop policy if exists "post_media_insert_own" on storage.objects;
create policy "post_media_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'post-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "post_media_update_own" on storage.objects;
create policy "post_media_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'post-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'post-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "post_media_delete_own" on storage.objects;
create policy "post_media_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'post-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
