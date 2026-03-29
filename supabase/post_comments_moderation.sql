-- Comment moderation backstop for post_comments.
-- Run in Supabase SQL Editor after posts_social_features.sql.

begin;

create or replace function public.comment_contains_blocked_terms(comment_text text)
returns boolean
language plpgsql
immutable
as $$
declare
  normalized_text text;
  compact_text text;
  blocked_terms text[] := array[
    'бля',
    'бляд',
    'сук',
    'хуй',
    'хуе',
    'пизд',
    'еба',
    'ебл',
    'fuck',
    'shit',
    'bitch',
    'asshole',
    'motherf',
    'dick',
    'porn',
    'escort',
    'casino'
  ];
  term text;
begin
  normalized_text := lower(coalesce(comment_text, ''));
  normalized_text := translate(normalized_text, '013457@$!|', 'oieastasii');
  compact_text := regexp_replace(normalized_text, '[^a-zA-Zа-яА-ЯёЁ0-9]+', '', 'g');

  foreach term in array blocked_terms loop
    if compact_text like '%' || term || '%' then
      return true;
    end if;
  end loop;

  return false;
end;
$$;

create or replace function public.enforce_post_comment_moderation()
returns trigger
language plpgsql
as $$
begin
  if public.comment_contains_blocked_terms(new.comment) then
    raise exception using
      errcode = 'P0001',
      message = 'Comment contains blocked language';
  end if;

  return new;
end;
$$;

drop trigger if exists post_comments_moderation_trigger on public.post_comments;

create trigger post_comments_moderation_trigger
before insert or update of comment on public.post_comments
for each row
execute function public.enforce_post_comment_moderation();

commit;
