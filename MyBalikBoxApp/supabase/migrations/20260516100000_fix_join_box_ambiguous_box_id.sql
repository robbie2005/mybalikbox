-- Fix join_box_with_code: RETURNS TABLE column names shadow box_members.box_id in ON CONFLICT.

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

  insert into public.box_members as bm (box_id, user_id, role)
  values (v_box.id, v_uid, 'contributor')
  on conflict on constraint box_members_pkey do update
    set role = case
      when bm.role = 'builder' then bm.role
      else 'contributor'
    end;

  box_id := v_box.id;
  title := v_box.title;
  join_code := v_box.join_code;
  return next;
end;
$$;

revoke all on function public.join_box_with_code(text) from public;
grant execute on function public.join_box_with_code(text) to authenticated;

commit;
