-- Add teacher/organizer language targeting for profile-based Shorts matching.
-- Run in Supabase SQL Editor.

begin;

alter table if exists public.profiles
  add column if not exists teaches_languages text[];

commit;
