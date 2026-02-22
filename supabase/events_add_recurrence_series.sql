-- Add recurrence series metadata for events
-- Run in Supabase SQL Editor.

begin;

alter table if exists public.events
  add column if not exists recurrence_group_id uuid,
  add column if not exists recurrence_rule text,
  add column if not exists recurrence_occurrence integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_recurrence_rule_valid'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_recurrence_rule_valid
      check (
        recurrence_rule is null
        or recurrence_rule in ('daily', 'monday', 'wednesday', 'thursday')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_recurrence_occurrence_positive'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_recurrence_occurrence_positive
      check (recurrence_occurrence is null or recurrence_occurrence > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_recurrence_columns_consistent'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_recurrence_columns_consistent
      check (
        (
          recurrence_group_id is null
          and recurrence_rule is null
          and recurrence_occurrence is null
        )
        or (
          recurrence_group_id is not null
          and recurrence_rule is not null
          and recurrence_occurrence is not null
        )
      );
  end if;
end $$;

create index if not exists events_recurrence_group_idx
  on public.events (recurrence_group_id, event_date);

create index if not exists events_recurrence_rule_idx
  on public.events (recurrence_rule, event_date);

commit;
