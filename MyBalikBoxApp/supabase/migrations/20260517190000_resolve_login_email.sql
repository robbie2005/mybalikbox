-- Resolve email or username to auth email for password sign-in.

begin;

create or replace function public.resolve_login_email(login_identifier text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized text := lower(trim(login_identifier));
  found_email text;
begin
  if normalized is null or normalized = '' then
    return null;
  end if;

  if position('@' in normalized) > 0 then
    return normalized;
  end if;

  select lower(trim(u.email))
  into found_email
  from public.profiles p
  inner join auth.users u on u.id = p.id
  where lower(trim(p.username)) = normalized
  limit 1;

  if found_email is not null then
    return found_email;
  end if;

  select lower(trim(u.email))
  into found_email
  from public.profiles p
  inner join auth.users u on u.id = p.id
  where lower(trim(p.display_name)) = normalized
  limit 1;

  return found_email;
end;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

commit;
