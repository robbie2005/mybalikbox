-- Allow box builders and contributors to accept/decline pending checklist rows (status updates).
begin;

create policy "checklist_update_members"
on public.box_checklist_items for update
to authenticated
using (
  exists (
    select 1
    from public.box_members bm
    where bm.box_id = box_checklist_items.box_id
      and bm.user_id = auth.uid()
      and bm.role in ('builder', 'contributor')
  )
)
with check (
  exists (
    select 1
    from public.box_members bm
    where bm.box_id = box_checklist_items.box_id
      and bm.user_id = auth.uid()
      and bm.role in ('builder', 'contributor')
  )
);

commit;
