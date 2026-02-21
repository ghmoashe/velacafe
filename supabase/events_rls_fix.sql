-- Fix: "new row violates row-level security policy" for public.events
-- Run in Supabase SQL Editor.

begin;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.is_admin, false) = true
  );
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

create or replace function public.is_current_user_organizer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.is_organizer, false) = true
  );
$$;

revoke all on function public.is_current_user_organizer() from public;
grant execute on function public.is_current_user_organizer() to authenticated;

alter table if exists public.events enable row level security;

grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;

drop policy if exists "Events are readable by everyone" on public.events;
drop policy if exists "Organizers can insert own events or admin can insert any" on public.events;
drop policy if exists "Organizers can update own events or admin can update any" on public.events;
drop policy if exists "Organizers can delete own events or admin can delete any" on public.events;

create policy "Events are readable by everyone"
on public.events
for select
to anon, authenticated
using (true);

create policy "Organizers can insert own events or admin can insert any"
on public.events
for insert
to authenticated
with check (
  public.is_current_user_admin()
  or (
    organizer_id = auth.uid()
    and public.is_current_user_organizer()
  )
);

create policy "Organizers can update own events or admin can update any"
on public.events
for update
to authenticated
using (
  public.is_current_user_admin()
  or (
    organizer_id = auth.uid()
    and public.is_current_user_organizer()
  )
)
with check (
  public.is_current_user_admin()
  or (
    organizer_id = auth.uid()
    and public.is_current_user_organizer()
  )
);

create policy "Organizers can delete own events or admin can delete any"
on public.events
for delete
to authenticated
using (
  public.is_current_user_admin()
  or (
    organizer_id = auth.uid()
    and public.is_current_user_organizer()
  )
);

commit;
