-- Box-level caps and per-item weight; allow members of the same box to read each other's profiles for contributor UI.

begin;

alter table public.boxes
  add column if not exists budget_cap_usd numeric,
  add column if not exists weight_cap_kg numeric;

comment on column public.boxes.budget_cap_usd is 'Optional spending cap/target for the box (USD).';
comment on column public.boxes.weight_cap_kg is 'Optional weight cap/target for the box (kg).';

alter table public.box_checklist_items
  add column if not exists weight_kg numeric;

comment on column public.box_checklist_items.weight_kg is 'Optional per-unit or line weight (kg) for packing estimates.';

-- Peers in the same box can see display names for contributor lists.
drop policy if exists "profiles_select_box_peers" on public.profiles;
create policy "profiles_select_box_peers"
on public.profiles for select
to authenticated
using (
  exists (
    select 1
    from public.box_members a
    join public.box_members b on a.box_id = b.box_id
    where a.user_id = auth.uid()
      and b.user_id = profiles.id
  )
);

commit;
