-- Checklist schema for MyBalikBox (boxes, membership, checklist items, suggestions)
-- Notes:
-- - Uses auth.users for identity and RLS auth.uid()
-- - Keeps item name as text for MVP; catalog/recommendations can be added later

begin;

-- Extensions (gen_random_uuid)
create extension if not exists pgcrypto;

-- Profiles: 1:1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Boxes: a box plan
create table if not exists public.boxes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  status text not null default 'draft', -- draft|active|shipped|archived
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint boxes_status_check check (status in ('draft','active','shipped','archived'))
);

create index if not exists boxes_owner_id_idx on public.boxes(owner_id);

alter table public.boxes enable row level security;

-- Box members: sharing + roles
create table if not exists public.box_members (
  box_id uuid not null references public.boxes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null, -- builder|contributor|viewer
  created_at timestamptz not null default now(),
  primary key (box_id, user_id),
  constraint box_members_role_check check (role in ('builder','contributor','viewer'))
);

create index if not exists box_members_user_id_idx on public.box_members(user_id, box_id);

alter table public.box_members enable row level security;

-- Checklist items: curated list for a box
create table if not exists public.box_checklist_items (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,

  name text not null,
  quantity numeric not null default 1,
  unit text,

  status text not null default 'planned', -- planned|purchased|packed|removed
  priority int not null default 0,
  sort_order int not null default 0,

  note text,
  added_by uuid references public.profiles(id),
  source text not null default 'manual', -- manual|suggestion|recommendation

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint checklist_quantity_positive check (quantity > 0),
  constraint checklist_status_check check (status in ('planned','purchased','packed','removed')),
  constraint checklist_source_check check (source in ('manual','suggestion','recommendation'))
);

create index if not exists checklist_box_id_sort_idx on public.box_checklist_items(box_id, sort_order);
create index if not exists checklist_box_id_status_idx on public.box_checklist_items(box_id, status);

alter table public.box_checklist_items enable row level security;

-- Suggestions: recipient-submitted suggestions for a box
create table if not exists public.box_item_suggestions (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,

  suggested_by uuid not null references public.profiles(id) on delete cascade,

  name text not null,
  quantity numeric not null default 1,
  unit text,
  note text,

  status text not null default 'submitted', -- submitted|under_consideration|included|not_included

  decided_by uuid references public.profiles(id),
  decided_at timestamptz,

  included_checklist_item_id uuid references public.box_checklist_items(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint suggestion_quantity_positive check (quantity > 0),
  constraint suggestion_status_check check (status in ('submitted','under_consideration','included','not_included'))
);

create index if not exists suggestions_box_id_status_idx on public.box_item_suggestions(box_id, status);
create index if not exists suggestions_box_id_suggested_by_idx on public.box_item_suggestions(box_id, suggested_by);

alter table public.box_item_suggestions enable row level security;

-- --------
-- RLS POLICIES
-- --------

-- PROFILES
create policy "profiles_select_self"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_insert_self"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- BOXES
create policy "boxes_select_members"
on public.boxes for select
to authenticated
using (
  exists (
    select 1
    from public.box_members bm
    where bm.box_id = boxes.id
      and bm.user_id = auth.uid()
  )
);

create policy "boxes_insert_owner"
on public.boxes for insert
to authenticated
with check (owner_id = auth.uid());

create policy "boxes_update_owner"
on public.boxes for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "boxes_delete_owner"
on public.boxes for delete
to authenticated
using (owner_id = auth.uid());

-- BOX MEMBERS
create policy "box_members_select_self_boxes"
on public.box_members for select
to authenticated
using (
  exists (
    select 1
    from public.box_members bm
    where bm.box_id = box_members.box_id
      and bm.user_id = auth.uid()
  )
);

create policy "box_members_owner_manage"
on public.box_members for all
to authenticated
using (
  exists (
    select 1
    from public.boxes b
    where b.id = box_members.box_id
      and b.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.boxes b
    where b.id = box_members.box_id
      and b.owner_id = auth.uid()
  )
);

-- CHECKLIST ITEMS
create policy "checklist_select_members"
on public.box_checklist_items for select
to authenticated
using (
  exists (
    select 1
    from public.box_members bm
    where bm.box_id = box_checklist_items.box_id
      and bm.user_id = auth.uid()
  )
);

create policy "checklist_insert_builders"
on public.box_checklist_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.box_members bm
    where bm.box_id = box_checklist_items.box_id
      and bm.user_id = auth.uid()
      and bm.role = 'builder'
  )
);

create policy "checklist_update_builders"
on public.box_checklist_items for update
to authenticated
using (
  exists (
    select 1
    from public.box_members bm
    where bm.box_id = box_checklist_items.box_id
      and bm.user_id = auth.uid()
      and bm.role = 'builder'
  )
)
with check (
  exists (
    select 1
    from public.box_members bm
    where bm.box_id = box_checklist_items.box_id
      and bm.user_id = auth.uid()
      and bm.role = 'builder'
  )
);

create policy "checklist_delete_builders"
on public.box_checklist_items for delete
to authenticated
using (
  exists (
    select 1
    from public.box_members bm
    where bm.box_id = box_checklist_items.box_id
      and bm.user_id = auth.uid()
      and bm.role = 'builder'
  )
);

-- SUGGESTIONS
create policy "suggestions_select_members"
on public.box_item_suggestions for select
to authenticated
using (
  exists (
    select 1
    from public.box_members bm
    where bm.box_id = box_item_suggestions.box_id
      and bm.user_id = auth.uid()
  )
);

create policy "suggestions_insert_contributors"
on public.box_item_suggestions for insert
to authenticated
with check (
  suggested_by = auth.uid()
  and exists (
    select 1
    from public.box_members bm
    where bm.box_id = box_item_suggestions.box_id
      and bm.user_id = auth.uid()
      and bm.role in ('contributor','builder')
  )
);

create policy "suggestions_update_own_submitted"
on public.box_item_suggestions for update
to authenticated
using (
  suggested_by = auth.uid()
  and status = 'submitted'
)
with check (
  suggested_by = auth.uid()
  and status = 'submitted'
);

create policy "suggestions_update_builders"
on public.box_item_suggestions for update
to authenticated
using (
  exists (
    select 1
    from public.box_members bm
    where bm.box_id = box_item_suggestions.box_id
      and bm.user_id = auth.uid()
      and bm.role = 'builder'
  )
)
with check (
  exists (
    select 1
    from public.box_members bm
    where bm.box_id = box_item_suggestions.box_id
      and bm.user_id = auth.uid()
      and bm.role = 'builder'
  )
);

commit;
