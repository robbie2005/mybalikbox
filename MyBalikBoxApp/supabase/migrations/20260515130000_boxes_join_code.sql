-- Shareable join code shown on the home widget (generated at box creation).
begin;

alter table public.boxes
  add column if not exists join_code text;

create unique index if not exists boxes_join_code_unique_idx
  on public.boxes(join_code)
  where join_code is not null;

comment on column public.boxes.join_code is 'Short code family uses to join this box (e.g. GF2026).';

commit;
