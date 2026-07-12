-- Repair migration for the remote NOTOLX project.
-- Supabase CLI was not available locally, so this file records the MCP-applied
-- cleanup migration. It is guarded so it is a no-op on a clean NOTOLX database.

do $$
begin
  if to_regclass('public.recipes') is not null then
    drop policy if exists "avatars_user_update" on storage.objects;
    drop policy if exists "avatars_user_upload" on storage.objects;
    drop policy if exists "recipe_images_user_update" on storage.objects;
    drop policy if exists "recipe_images_user_upload" on storage.objects;
    drop policy if exists "user_file_delete" on storage.objects;
    drop policy if exists "Public can read listing photo files" on storage.objects;
    drop policy if exists "Users can upload photos for their own listings" on storage.objects;
    drop policy if exists "Users can update photos for their own listings" on storage.objects;
    drop policy if exists "Users can delete photos for their own listings" on storage.objects;
    drop policy if exists "Public can read avatar files" on storage.objects;
    drop policy if exists "Users can upload their own avatar" on storage.objects;
    drop policy if exists "Users can update their own avatar" on storage.objects;
    drop policy if exists "Users can delete their own avatar" on storage.objects;

    drop table if exists public.reviews cascade;
    drop table if exists public.recipe_categories cascade;
    drop table if exists public.favorites cascade;
    drop table if exists public.recipes cascade;
    drop table if exists public.listing_photos cascade;
    drop table if exists public.listings cascade;
    drop table if exists public.categories cascade;
    drop table if exists public.user_roles cascade;
    drop table if exists public.profiles cascade;

    drop function if exists public.touch_updated_at() cascade;
    drop function if exists public.set_updated_at() cascade;
    drop schema if exists private cascade;

    drop type if exists public.listing_condition cascade;
    drop type if exists public.listing_status cascade;
    drop type if exists public.app_role cascade;
  end if;
end;
$$;
