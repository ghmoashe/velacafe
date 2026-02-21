-- Add paid/free and participants fields for events
-- Run in Supabase SQL Editor.

begin;

alter table if exists public.events
  add column if not exists is_paid boolean default false,
  add column if not exists price_amount numeric(10,2),
  add column if not exists max_participants integer;

update public.events
set is_paid = false
where is_paid is null;

alter table if exists public.events
  alter column is_paid set default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_price_amount_non_negative'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_price_amount_non_negative
      check (price_amount is null or price_amount >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_max_participants_positive'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_max_participants_positive
      check (max_participants is null or max_participants > 0);
  end if;
end $$;

commit;
