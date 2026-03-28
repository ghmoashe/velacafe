-- Add optional Mux metadata columns for video posts.
-- Run in Supabase SQL Editor.

begin;

alter table if exists public.posts
  add column if not exists mux_upload_id text,
  add column if not exists mux_asset_id text,
  add column if not exists mux_playback_id text;

create index if not exists posts_mux_asset_id_idx on public.posts(mux_asset_id);
create index if not exists posts_mux_playback_id_idx on public.posts(mux_playback_id);

commit;
