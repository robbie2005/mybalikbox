-- Curated catalog for "Items you might like" (managed in Supabase, not app constants)
begin;

create table public.recommended_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  reference_price numeric not null default 0,
  constraint recommended_items_price_nonneg check (reference_price >= 0),
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recommended_items_category_idx on public.recommended_items(category);
create index recommended_items_active_sort_idx on public.recommended_items(is_active, sort_order);

alter table public.recommended_items enable row level security;

-- Mobile app uses anon key: allow read of active rows
create policy "recommended_items_select_active"
on public.recommended_items for select
to anon, authenticated
using (is_active = true);

alter table public.box_checklist_items
  add column if not exists recommended_item_id uuid references public.recommended_items(id) on delete set null;

create index if not exists box_checklist_items_recommended_item_id_idx
  on public.box_checklist_items(recommended_item_id);

insert into public.recommended_items (slug, name, category, reference_price, sort_order) values
  ('spam-musubi', 'Spam Musubi', 'Food', 1.50, 1),
  ('ube-mochi-pancake-mix', 'Ube Mochi Pancake Mix', 'Food', 9.99, 2),
  ('kirkland-signature-coffee', 'Kirkland Signature Coffee', 'Food', 14.99, 3),
  ('hersheys-giant-bars', 'Hershey''s Giant Bars', 'Food', 4.50, 4);

commit;
