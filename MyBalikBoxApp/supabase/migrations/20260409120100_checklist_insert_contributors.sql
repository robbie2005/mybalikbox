-- Allow contributors to add checklist rows (e.g. from Add Items) in addition to builders
create policy "checklist_insert_contributors"
on public.box_checklist_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.box_members bm
    where bm.box_id = box_checklist_items.box_id
      and bm.user_id = auth.uid()
      and bm.role = 'contributor'
  )
);
