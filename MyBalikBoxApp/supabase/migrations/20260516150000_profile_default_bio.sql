-- Default generic bio for new and existing profiles.

begin;

alter table public.profiles
  alter column bio set default 'Sharing balikbayan box moments with family and friends.';

update public.profiles
set bio = 'Sharing balikbayan box moments with family and friends.'
where bio is null or trim(bio) = '';

commit;
