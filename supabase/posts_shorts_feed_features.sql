-- Cover upload, moderation, analytics, and pinning support for Shorts feed.
-- Run in Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

alter table if exists public.posts
  add column if not exists cover_url text,
  add column if not exists mux_asset_status text,
  add column if not exists mux_thumbnail_url text,
  add column if not exists mux_duration_seconds double precision,
  add column if not exists mux_aspect_ratio double precision,
  add column if not exists shorts_visibility text default 'public',
  add column if not exists shorts_hidden boolean not null default false,
  add column if not exists shorts_hidden_reason text,
  add column if not exists shorts_deleted_at timestamptz,
  add column if not exists shorts_deleted_by uuid references auth.users(id) on delete set null;

alter table if exists public.profiles
  add column if not exists pinned_short_post_id uuid references public.posts(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_shorts_visibility_check'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_shorts_visibility_check
      check (shorts_visibility in ('public', 'followers', 'hidden'));
  end if;
end $$;

create table if not exists public.post_view_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  viewer_key text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint post_view_events_post_viewer_unique unique (post_id, viewer_key)
);

create table if not exists public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  viewer_key text not null,
  reason text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint post_reports_post_viewer_unique unique (post_id, viewer_key)
);

create table if not exists public.post_watch_sessions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  viewer_key text not null,
  watched_seconds double precision not null default 0,
  completion_ratio double precision not null default 0,
  completed boolean not null default false,
  source text not null default 'shorts',
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz not null default timezone('utc', now())
);

create index if not exists post_view_events_post_id_idx
  on public.post_view_events(post_id);

create index if not exists post_view_events_user_id_idx
  on public.post_view_events(user_id);

create index if not exists post_reports_post_id_idx
  on public.post_reports(post_id);

create index if not exists post_reports_user_id_idx
  on public.post_reports(user_id);

create index if not exists post_watch_sessions_post_id_idx
  on public.post_watch_sessions(post_id);

create index if not exists post_watch_sessions_user_id_idx
  on public.post_watch_sessions(user_id);

create index if not exists posts_shorts_hidden_idx
  on public.posts(shorts_hidden, shorts_visibility, created_at desc);

alter table if exists public.post_view_events enable row level security;
alter table if exists public.post_reports enable row level security;
alter table if exists public.post_watch_sessions enable row level security;

grant select on public.post_view_events to anon, authenticated;
grant insert on public.post_view_events to anon, authenticated;
grant select on public.post_reports to anon, authenticated;
grant insert on public.post_reports to anon, authenticated;
grant select on public.post_watch_sessions to authenticated;
grant insert on public.post_watch_sessions to anon, authenticated;

drop policy if exists "Post views are readable by everyone" on public.post_view_events;
drop policy if exists "Anyone can insert post views with their own identity" on public.post_view_events;
drop policy if exists "Post reports are readable by everyone" on public.post_reports;
drop policy if exists "Anyone can insert post reports with their own identity" on public.post_reports;
drop policy if exists "Admins can read post watch sessions" on public.post_watch_sessions;
drop policy if exists "Anyone can insert post watch sessions with their own identity" on public.post_watch_sessions;

create policy "Post views are readable by everyone"
on public.post_view_events
for select
to anon, authenticated
using (true);

create policy "Anyone can insert post views with their own identity"
on public.post_view_events
for insert
to anon, authenticated
with check (
  viewer_key is not null
  and btrim(viewer_key) <> ''
  and (
    (auth.uid() is null and user_id is null)
    or user_id = auth.uid()
  )
);

create policy "Post reports are readable by everyone"
on public.post_reports
for select
to anon, authenticated
using (true);

create policy "Anyone can insert post reports with their own identity"
on public.post_reports
for insert
to anon, authenticated
with check (
  viewer_key is not null
  and btrim(viewer_key) <> ''
  and (
    (auth.uid() is null and user_id is null)
    or user_id = auth.uid()
  )
);

create policy "Admins can read post watch sessions"
on public.post_watch_sessions
for select
to authenticated
using (public.is_current_user_admin());

create policy "Anyone can insert post watch sessions with their own identity"
on public.post_watch_sessions
for insert
to anon, authenticated
with check (
  viewer_key is not null
  and btrim(viewer_key) <> ''
  and watched_seconds >= 0
  and completion_ratio >= 0
  and completion_ratio <= 1
  and (
    (auth.uid() is null and user_id is null)
    or user_id = auth.uid()
  )
);

commit;
