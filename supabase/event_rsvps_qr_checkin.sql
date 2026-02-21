-- QR check-in for event attendees
-- Run in Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

create table if not exists public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('going', 'interested')),
  check_in_token text,
  checked_in_at timestamptz,
  checked_in_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.event_rsvps
  add column if not exists check_in_token text,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.event_rsvps
set check_in_token = encode(gen_random_bytes(12), 'hex')
where check_in_token is null;

alter table public.event_rsvps
  alter column check_in_token set default encode(gen_random_bytes(12), 'hex');

create unique index if not exists event_rsvps_check_in_token_key
  on public.event_rsvps(check_in_token)
  where check_in_token is not null;

alter table public.event_rsvps enable row level security;

grant select on public.event_rsvps to anon, authenticated;
grant insert, update, delete on public.event_rsvps to authenticated;

create or replace function public.can_manage_event_check_in(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    where e.id = target_event_id
      and e.organizer_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.is_admin, false) = true
  );
$$;

revoke all on function public.can_manage_event_check_in(uuid) from public;
grant execute on function public.can_manage_event_check_in(uuid) to authenticated;

drop policy if exists "RSVP read for everyone" on public.event_rsvps;
drop policy if exists "Users manage own RSVP" on public.event_rsvps;
drop policy if exists "Organizers can update attendee check-in" on public.event_rsvps;

create policy "RSVP read for everyone"
on public.event_rsvps
for select
to anon, authenticated
using (true);

create policy "Users manage own RSVP"
on public.event_rsvps
as permissive
for all
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and status in ('going', 'interested')
);

create policy "Organizers can update attendee check-in"
on public.event_rsvps
for update
to authenticated
using (public.can_manage_event_check_in(event_id))
with check (public.can_manage_event_check_in(event_id));

commit;