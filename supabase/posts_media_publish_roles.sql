-- Allow photo/video posts only for organizer/admin accounts.
-- Text posts stay available for regular users.

begin;

alter table if exists public.profiles
  add column if not exists is_teacher boolean not null default false;

create or replace function public.can_user_publish_media_posts(target_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_user_id
      and (
        coalesce(is_organizer, false)
        or coalesce(is_teacher, false)
        or coalesce(is_admin, false)
      )
  );
$$;

create or replace function public.enforce_media_post_publisher_role()
returns trigger
language plpgsql
as $$
declare
  jwt_role text := current_setting('request.jwt.claim.role', true);
  actor_id uuid := auth.uid();
begin
  if new.media_type not in ('image', 'video') then
    return new;
  end if;

  if jwt_role = 'service_role' then
    return new;
  end if;

  if actor_id is null then
    raise exception using
      errcode = 'P0001',
      message = 'Authentication required for media posts';
  end if;

  if new.user_id is distinct from actor_id then
    raise exception using
      errcode = 'P0001',
      message = 'You can publish media posts only as yourself';
  end if;

  if not public.can_user_publish_media_posts(actor_id) then
    raise exception using
      errcode = 'P0001',
      message = 'Only organizer, teacher, or admin accounts can publish photo and video posts';
  end if;

  return new;
end;
$$;

drop trigger if exists posts_media_publish_roles_trigger on public.posts;

create trigger posts_media_publish_roles_trigger
before insert or update of user_id, media_type, media_url on public.posts
for each row
execute function public.enforce_media_post_publisher_role();

commit;
