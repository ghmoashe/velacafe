-- AI Practice progress and lesson history persistence.
-- Run in Supabase SQL Editor.

begin;

create table if not exists public.ai_practice_user_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  locale text not null,
  turns_completed integer not null default 0,
  focus_areas text[] not null default '{}'::text[],
  saved_phrases text[] not null default '{}'::text[],
  pronunciation_tips text[] not null default '{}'::text[],
  last_practice_mode text not null default 'daily',
  last_practice_topic text,
  last_summary jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, locale),
  constraint ai_practice_user_state_turns_check
    check (turns_completed >= 0),
  constraint ai_practice_user_state_mode_check
    check (last_practice_mode in ('daily', 'roleplay', 'topic'))
);

create table if not exists public.ai_practice_session_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  locale text not null,
  level_range text not null,
  practice_mode text not null,
  practice_topic text,
  user_message text not null,
  assistant_reply text not null,
  quick_correction text,
  better_version text,
  next_question text,
  pronunciation_tip text,
  summary jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint ai_practice_session_history_mode_check
    check (practice_mode in ('daily', 'roleplay', 'topic'))
);

create index if not exists ai_practice_session_history_user_locale_idx
  on public.ai_practice_session_history(user_id, locale, created_at desc);

alter table if exists public.ai_practice_user_state enable row level security;
alter table if exists public.ai_practice_session_history enable row level security;

grant select, insert, update on public.ai_practice_user_state to authenticated;
grant select, insert on public.ai_practice_session_history to authenticated;

drop policy if exists "Users can read their own ai practice state" on public.ai_practice_user_state;
drop policy if exists "Users can insert their own ai practice state" on public.ai_practice_user_state;
drop policy if exists "Users can update their own ai practice state" on public.ai_practice_user_state;
drop policy if exists "Users can read their own ai practice sessions" on public.ai_practice_session_history;
drop policy if exists "Users can insert their own ai practice sessions" on public.ai_practice_session_history;

create policy "Users can read their own ai practice state"
on public.ai_practice_user_state
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own ai practice state"
on public.ai_practice_user_state
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own ai practice state"
on public.ai_practice_user_state
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can read their own ai practice sessions"
on public.ai_practice_session_history
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own ai practice sessions"
on public.ai_practice_session_history
for insert
to authenticated
with check (user_id = auth.uid());

commit;
