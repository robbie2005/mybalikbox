-- Reliable primary box lookup for home widget (bypasses RLS edge cases).

begin;

create or replace function public.get_user_primary_box()
returns table (box_id uuid, title text, join_code text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;

  return query
  select b.id, b.title, b.join_code
  from public.boxes b
  where b.status = 'active'
    and (
      b.owner_id = v_uid
      or exists (
        select 1
        from public.box_members bm
        where bm.box_id = b.id
          and bm.user_id = v_uid
          and bm.role in ('builder', 'contributor')
      )
    )
  order by b.created_at desc
  limit 1;
end;
$$;

revoke all on function public.get_user_primary_box() from public;
grant execute on function public.get_user_primary_box() to authenticated;

commit;
