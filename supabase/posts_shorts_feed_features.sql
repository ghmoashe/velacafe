-- Cover upload + view tracking for Shorts feed.
-- Run in Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

alter table if exists public.posts
  add column if not exists cover_url text;

create table if not exists public.post_view_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  viewer_key text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint post_view_events_post_viewer_unique unique (post_id, viewer_key)
);

create index if not exists post_view_events_post_id_idx
  on public.post_view_events(post_id);

create index if not exists post_view_events_user_id_idx
  on public.post_view_events(user_id);

alter table if exists public.post_view_events enable row level security;

grant select on public.post_view_events to anon, authenticated;
grant insert on public.post_view_events to anon, authenticated;

drop policy if exists "Post views are readable by everyone" on public.post_view_events;
drop policy if exists "Anyone can insert post views with their own identity" on public.post_view_events;

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

commit;
