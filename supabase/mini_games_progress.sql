-- Mini games persistence, leaderboard, daily challenge, and premium lives.
-- Run in Supabase SQL Editor.

begin;

alter table if exists public.profiles
  add column if not exists is_premium boolean not null default false;

create table if not exists public.mini_game_user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_score integer not null default 0,
  total_attempts integer not null default 0,
  total_correct integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  lives integer not null default 10,
  last_life_refill_at timestamptz not null default timezone('utc', now()),
  daily_challenge_date date,
  daily_challenge_score integer not null default 0,
  daily_challenge_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint mini_game_user_state_lives_check
    check (lives between 0 and 10),
  constraint mini_game_user_state_attempts_check
    check (
      total_attempts >= 0
      and total_correct >= 0
      and total_correct <= total_attempts
    ),
  constraint mini_game_user_state_streak_check
    check (current_streak >= 0 and best_streak >= 0),
  constraint mini_game_user_state_score_check
    check (total_score >= 0 and daily_challenge_score >= 0)
);

create table if not exists public.mini_game_mode_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null,
  total_attempts integer not null default 0,
  total_correct integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, mode),
  constraint mini_game_mode_progress_mode_check
    check (mode in ('article', 'translate', 'sentence', 'chat')),
  constraint mini_game_mode_progress_attempts_check
    check (
      total_attempts >= 0
      and total_correct >= 0
      and total_correct <= total_attempts
    ),
  constraint mini_game_mode_progress_streak_check
    check (current_streak >= 0 and best_streak >= 0)
);

create table if not exists public.mini_game_daily_results (
  challenge_date date not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null,
  level text not null,
  score integer not null default 0,
  correct boolean not null default false,
  completed_at timestamptz not null default timezone('utc', now()),
  primary key (challenge_date, user_id),
  constraint mini_game_daily_results_mode_check
    check (mode in ('article', 'translate', 'sentence', 'chat')),
  constraint mini_game_daily_results_level_check
    check (level in ('A1', 'A2', 'B1')),
  constraint mini_game_daily_results_score_check
    check (score >= 0)
);

alter table if exists public.mini_game_user_state
  drop constraint if exists mini_game_user_state_lives_check;

alter table if exists public.mini_game_user_state
  add constraint mini_game_user_state_lives_check
  check (lives between 0 and 10);

alter table if exists public.mini_game_mode_progress
  drop constraint if exists mini_game_mode_progress_mode_check;

alter table if exists public.mini_game_mode_progress
  add constraint mini_game_mode_progress_mode_check
  check (mode in ('article', 'translate', 'sentence', 'chat', 'story'));

alter table if exists public.mini_game_daily_results
  drop constraint if exists mini_game_daily_results_mode_check;

alter table if exists public.mini_game_daily_results
  add constraint mini_game_daily_results_mode_check
  check (mode in ('article', 'translate', 'sentence', 'chat', 'story'));

create index if not exists mini_game_user_state_score_idx
  on public.mini_game_user_state(total_score desc, updated_at desc);

create index if not exists mini_game_daily_results_score_idx
  on public.mini_game_daily_results(challenge_date desc, score desc, completed_at asc);

alter table if exists public.mini_game_user_state enable row level security;
alter table if exists public.mini_game_mode_progress enable row level security;
alter table if exists public.mini_game_daily_results enable row level security;

grant select on public.mini_game_user_state to anon, authenticated;
grant insert, update on public.mini_game_user_state to authenticated;
grant select on public.mini_game_mode_progress to authenticated;
grant insert, update on public.mini_game_mode_progress to authenticated;
grant select on public.mini_game_daily_results to anon, authenticated;
grant insert, update on public.mini_game_daily_results to authenticated;

drop policy if exists "Mini game state is readable by everyone" on public.mini_game_user_state;
drop policy if exists "Users can insert their own mini game state" on public.mini_game_user_state;
drop policy if exists "Users can update their own mini game state" on public.mini_game_user_state;
drop policy if exists "Users can read their own mini game mode progress" on public.mini_game_mode_progress;
drop policy if exists "Users can insert their own mini game mode progress" on public.mini_game_mode_progress;
drop policy if exists "Users can update their own mini game mode progress" on public.mini_game_mode_progress;
drop policy if exists "Mini game daily results are readable by everyone" on public.mini_game_daily_results;
drop policy if exists "Users can insert their own mini game daily result" on public.mini_game_daily_results;
drop policy if exists "Users can update their own mini game daily result" on public.mini_game_daily_results;

create policy "Mini game state is readable by everyone"
on public.mini_game_user_state
for select
to anon, authenticated
using (true);

create policy "Users can insert their own mini game state"
on public.mini_game_user_state
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own mini game state"
on public.mini_game_user_state
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can read their own mini game mode progress"
on public.mini_game_mode_progress
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own mini game mode progress"
on public.mini_game_mode_progress
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own mini game mode progress"
on public.mini_game_mode_progress
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Mini game daily results are readable by everyone"
on public.mini_game_daily_results
for select
to anon, authenticated
using (true);

create policy "Users can insert their own mini game daily result"
on public.mini_game_daily_results
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own mini game daily result"
on public.mini_game_daily_results
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

commit;
