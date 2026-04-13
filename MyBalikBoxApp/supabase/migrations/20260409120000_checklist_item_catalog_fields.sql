-- Optional fields for recommended / catalog-style checklist rows
alter table public.box_checklist_items
  add column if not exists category text;

alter table public.box_checklist_items
  add column if not exists reference_price numeric;

comment on column public.box_checklist_items.category is 'Loose category for filtering (e.g. Food)';
comment on column public.box_checklist_items.reference_price is 'Suggested retail price for recommended items';
