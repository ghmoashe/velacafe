-- Public aggregate watch metrics for Shorts ranking.
-- Run in Supabase SQL Editor after posts_shorts_feed_features.sql.

begin;

create or replace function public.get_shorts_watch_metrics(post_ids uuid[])
returns table (
  post_id uuid,
  watch_sessions bigint,
  unique_viewers bigint,
  total_watched_seconds double precision,
  avg_watched_seconds double precision,
  avg_completion_ratio double precision,
  completed_views bigint,
  completion_rate double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sessions.post_id,
    count(*)::bigint as watch_sessions,
    count(distinct sessions.viewer_key)::bigint as unique_viewers,
    coalesce(sum(sessions.watched_seconds), 0)::double precision as total_watched_seconds,
    coalesce(avg(sessions.watched_seconds), 0)::double precision as avg_watched_seconds,
    coalesce(avg(sessions.completion_ratio), 0)::double precision as avg_completion_ratio,
    count(*) filter (where sessions.completed)::bigint as completed_views,
    coalesce(
      (
        count(*) filter (where sessions.completed)::double precision
        / nullif(count(*)::double precision, 0)
      ),
      0
    ) as completion_rate
  from public.post_watch_sessions as sessions
  where sessions.source = 'shorts'
    and sessions.post_id = any(coalesce(post_ids, '{}'::uuid[]))
  group by sessions.post_id;
$$;

grant execute on function public.get_shorts_watch_metrics(uuid[]) to anon, authenticated;

commit;
