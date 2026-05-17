-- Separate immutable username (@handle) from editable display name.

begin;

alter table public.profiles
  add column if not exists username text;

update public.profiles p
set username = lower(trim(coalesce(
  (select u.raw_user_meta_data->>'display_name'
   from auth.users u
   where u.id = p.id),
  p.display_name
)))
where username is null or trim(username) = '';

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null and trim(username) <> '';

commit;
