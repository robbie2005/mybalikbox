-- Join: ensure contributor role on re-join; members can see peer rows for contributor lists.

begin;

create or replace function public.join_box_with_code(p_code text)
returns table (box_id uuid, title text, join_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_box public.boxes%rowtype;
  v_uid uuid := auth.uid();
  v_code text := upper(trim(p_code));
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if length(v_code) < 4 then
    raise exception 'Enter a valid box code';
  end if;

  select * into v_box
  from public.boxes b
  where upper(b.join_code) = v_code
    and b.status = 'active'
  limit 1;

  if not found then
    raise exception 'No box found with that code';
  end if;

  insert into public.profiles (id)
  values (v_uid)
  on conflict (id) do nothing;

  insert into public.box_members (box_id, user_id, role)
  values (v_box.id, v_uid, 'contributor')
  on conflict (box_id, user_id) do update
    set role = case
      when public.box_members.role = 'builder' then public.box_members.role
      else 'contributor'
    end;

  return query
  select v_box.id, v_box.title, v_box.join_code;
end;
$$;

revoke all on function public.join_box_with_code(text) from public;
grant execute on function public.join_box_with_code(text) to authenticated;

drop policy if exists "box_members_select_visible" on public.box_members;
create policy "box_members_select_visible"
on public.box_members for select
to authenticated
using (public.is_box_member(box_id, auth.uid()));

commit;
