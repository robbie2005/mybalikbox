-- Amazon product metadata for curated recommended rows
alter table public.recommended_items
  add column if not exists amazon_url text;

alter table public.recommended_items
  add column if not exists asin text;

create index if not exists recommended_items_asin_idx on public.recommended_items(asin);

comment on column public.recommended_items.amazon_url is 'Amazon PDP URL for the product';
comment on column public.recommended_items.asin is 'Amazon ASIN when available';
