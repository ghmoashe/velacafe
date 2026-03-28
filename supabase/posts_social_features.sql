-- Social features for organizer video posts.
-- Run in Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint post_likes_post_user_unique unique (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.post_share_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  channel text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists post_likes_post_id_idx on public.post_likes(post_id);
create index if not exists post_likes_user_id_idx on public.post_likes(user_id);
create index if not exists post_comments_post_id_idx on public.post_comments(post_id);
create index if not exists post_comments_user_id_idx on public.post_comments(user_id);
create index if not exists post_share_events_post_id_idx on public.post_share_events(post_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'post_comments_comment_length'
      and conrelid = 'public.post_comments'::regclass
  ) then
    alter table public.post_comments
      add constraint post_comments_comment_length
      check (char_length(btrim(comment)) between 1 and 500);
  end if;
end $$;

alter table if exists public.post_likes enable row level security;
alter table if exists public.post_comments enable row level security;
alter table if exists public.post_share_events enable row level security;

grant select on public.post_likes to anon, authenticated;
grant select on public.post_comments to anon, authenticated;
grant select on public.post_share_events to anon, authenticated;
grant insert, delete on public.post_likes to authenticated;
grant insert on public.post_comments to authenticated;
grant update, delete on public.post_comments to authenticated;
grant insert on public.post_share_events to anon, authenticated;

drop policy if exists "Post likes are readable by everyone" on public.post_likes;
drop policy if exists "Users can like posts as themselves" on public.post_likes;
drop policy if exists "Users can remove own likes or admins can remove any" on public.post_likes;
drop policy if exists "Post comments are readable by everyone" on public.post_comments;
drop policy if exists "Users can insert comments as themselves" on public.post_comments;
drop policy if exists "Users can update own comments or admins can update any" on public.post_comments;
drop policy if exists "Users can delete own comments or admins can delete any" on public.post_comments;
drop policy if exists "Post share events are readable by everyone" on public.post_share_events;
drop policy if exists "Anyone can insert share events for visible posts" on public.post_share_events;

create policy "Post likes are readable by everyone"
on public.post_likes
for select
to anon, authenticated
using (true);

create policy "Users can like posts as themselves"
on public.post_likes
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can remove own likes or admins can remove any"
on public.post_likes
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.is_current_user_admin()
);

create policy "Post comments are readable by everyone"
on public.post_comments
for select
to anon, authenticated
using (true);

create policy "Users can insert comments as themselves"
on public.post_comments
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own comments or admins can update any"
on public.post_comments
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_current_user_admin()
)
with check (
  user_id = auth.uid()
  or public.is_current_user_admin()
);

create policy "Users can delete own comments or admins can delete any"
on public.post_comments
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.is_current_user_admin()
);

create policy "Post share events are readable by everyone"
on public.post_share_events
for select
to anon, authenticated
using (true);

create policy "Anyone can insert share events for visible posts"
on public.post_share_events
for insert
to anon, authenticated
with check (
  (
    auth.uid() is null
    and user_id is null
  )
  or user_id = auth.uid()
);

commit;
