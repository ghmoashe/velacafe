begin;

alter table public.ai_practice_user_state
  add column if not exists current_streak integer not null default 0,
  add column if not exists longest_streak integer not null default 0,
  add column if not exists weekly_goal_target integer not null default 4,
  add column if not exists weekly_goal_completed integer not null default 0,
  add column if not exists weekly_goal_week_start date,
  add column if not exists last_lesson_day date;

alter table public.ai_practice_user_state
  drop constraint if exists ai_practice_user_state_current_streak_check;

alter table public.ai_practice_user_state
  add constraint ai_practice_user_state_current_streak_check
    check (current_streak >= 0);

alter table public.ai_practice_user_state
  drop constraint if exists ai_practice_user_state_longest_streak_check;

alter table public.ai_practice_user_state
  add constraint ai_practice_user_state_longest_streak_check
    check (longest_streak >= 0);

alter table public.ai_practice_user_state
  drop constraint if exists ai_practice_user_state_weekly_goal_target_check;

alter table public.ai_practice_user_state
  add constraint ai_practice_user_state_weekly_goal_target_check
    check (weekly_goal_target > 0);

alter table public.ai_practice_user_state
  drop constraint if exists ai_practice_user_state_weekly_goal_completed_check;

alter table public.ai_practice_user_state
  add constraint ai_practice_user_state_weekly_goal_completed_check
    check (weekly_goal_completed >= 0);

commit;
