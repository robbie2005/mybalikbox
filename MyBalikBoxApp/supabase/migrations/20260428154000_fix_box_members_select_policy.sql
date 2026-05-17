-- Fix recursive RLS on box_members:
-- The original select policy queried public.box_members inside its own USING clause,
-- which triggers "infinite recursion detected in policy for relation box_members" (42P17).

drop policy if exists "box_members_select_self_boxes" on public.box_members;

create policy "box_members_select_visible"
on public.box_members for select
to authenticated
using (
  -- Members can read their own membership rows.
  user_id = auth.uid()
  or
  -- Box owners can read all membership rows for boxes they own.
  exists (
    select 1
    from public.boxes b
    where b.id = box_members.box_id
      and b.owner_id = auth.uid()
  )
);
