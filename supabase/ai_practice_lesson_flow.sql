begin;

alter table public.ai_practice_user_state
  add column if not exists last_lesson_result jsonb,
  add column if not exists last_lesson_template text,
  add column if not exists last_lesson_completed_at timestamptz;

alter table public.ai_practice_session_history
  add column if not exists lesson_template text,
  add column if not exists lesson_turn_index integer,
  add column if not exists lesson_turn_target integer,
  add column if not exists lesson_score jsonb;

commit;
