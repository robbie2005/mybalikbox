-- Break indirect RLS recursion between boxes and box_members.
-- Previous policies referenced each other across tables:
-- boxes_select_members -> box_members, and box_members_* -> boxes.
-- This migration moves cross-table checks into SECURITY DEFINER helpers.

begin;

create or replace function public.is_box_member(target_box_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.box_members bm
    where bm.box_id = target_box_id
      and bm.user_id = target_user_id
  );
$$;

create or replace function public.is_box_owner(target_box_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.boxes b
    where b.id = target_box_id
      and b.owner_id = target_user_id
  );
$$;

revoke all on function public.is_box_member(uuid, uuid) from public;
grant execute on function public.is_box_member(uuid, uuid) to authenticated;

revoke all on function public.is_box_owner(uuid, uuid) from public;
grant execute on function public.is_box_owner(uuid, uuid) to authenticated;

drop policy if exists "boxes_select_members" on public.boxes;
create policy "boxes_select_members"
on public.boxes for select
to authenticated
using (
  owner_id = auth.uid()
  or public.is_box_member(id, auth.uid())
);

drop policy if exists "box_members_select_visible" on public.box_members;
create policy "box_members_select_visible"
on public.box_members for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_box_owner(box_id, auth.uid())
);

drop policy if exists "box_members_owner_manage" on public.box_members;

drop policy if exists "box_members_owner_insert" on public.box_members;
create policy "box_members_owner_insert"
on public.box_members for insert
to authenticated
with check (public.is_box_owner(box_id, auth.uid()));

drop policy if exists "box_members_owner_update" on public.box_members;
create policy "box_members_owner_update"
on public.box_members for update
to authenticated
using (public.is_box_owner(box_id, auth.uid()))
with check (public.is_box_owner(box_id, auth.uid()));

drop policy if exists "box_members_owner_delete" on public.box_members;
create policy "box_members_owner_delete"
on public.box_members for delete
to authenticated
using (public.is_box_owner(box_id, auth.uid()));

commit;
