-- Allow users to delete checklist rows they added (e.g. Undo after custom item insert)
create policy "checklist_delete_own_added"
on public.box_checklist_items for delete
to authenticated
using (added_by = auth.uid());
