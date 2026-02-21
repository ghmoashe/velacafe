-- Fix: "new row violates row-level security policy" while uploading event images
-- Run in Supabase SQL Editor.

begin;

-- Ensure bucket exists and is public for getPublicUrl links used in frontend
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'events',
  'events',
  true,
  5242880,
  array[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Recreate policies idempotently
drop policy if exists "Events images are publicly readable" on storage.objects;
drop policy if exists "Authenticated can upload event images" on storage.objects;
drop policy if exists "Authenticated can update own event images" on storage.objects;
drop policy if exists "Authenticated can delete own event images" on storage.objects;

create policy "Events images are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'events');

create policy "Authenticated can upload event images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'events'
  and (
    public.is_current_user_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "Authenticated can update own event images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'events'
  and (
    public.is_current_user_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
)
with check (
  bucket_id = 'events'
  and (
    public.is_current_user_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "Authenticated can delete own event images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'events'
  and (
    public.is_current_user_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

commit;
