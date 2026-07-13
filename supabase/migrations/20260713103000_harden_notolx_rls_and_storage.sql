-- Harden NOTOLX RLS, grants, and storage policies.
-- Prepared locally; apply through Supabase MCP or the Supabase SQL editor.

-- Authenticated users previously had broad table-level UPDATE grants.
-- Keep RLS as the primary row-level guard, but narrow column-level UPDATE
-- privileges so public clients cannot update admin-controlled listing fields.
revoke update on
  public.profiles,
  public.user_roles,
  public.categories,
  public.listings,
  public.listing_photos,
  public.favorites
from authenticated;

grant update (
  display_name,
  phone,
  location,
  avatar_url,
  bio,
  preferred_language
) on public.profiles to authenticated;

grant update (
  role
) on public.user_roles to authenticated;

grant update (
  parent_id,
  name,
  slug,
  description,
  sort_order,
  is_active
) on public.categories to authenticated;

grant update (
  category_id,
  title,
  description,
  price,
  currency,
  condition,
  location,
  contact_phone
) on public.listings to authenticated;

grant update (
  alt_text,
  sort_order,
  is_primary
) on public.listing_photos to authenticated;

-- Narrow listing INSERT privileges and policy checks. Users can create their
-- own active/draft listings, but cannot set admin-only listing flags.
revoke insert on public.listings from authenticated;

grant insert (
  owner_id,
  category_id,
  title,
  description,
  price,
  currency,
  condition,
  status,
  location,
  contact_phone,
  published_at
) on public.listings to authenticated;

drop policy if exists "Users can create their own listings" on public.listings;

create policy "Users can create their own listings"
on public.listings
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and is_featured = false
  and sold_at is null
  and status in ('draft'::public.listing_status, 'active'::public.listing_status)
);

-- Admin status changes go through a checked RPC because browser clients all use
-- the same Postgres role (`authenticated`), while app admin state lives in
-- public.user_roles.
create or replace function public.admin_set_listing_status(
  p_listing_id uuid,
  p_status public.listing_status
)
returns public.listings
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  updated_listing public.listings;
begin
  if not (select private.is_admin()) then
    raise exception 'Only admins can change listing status.'
      using errcode = '42501';
  end if;

  update public.listings
  set
    status = p_status,
    published_at = case
      when p_status = 'active'::public.listing_status and published_at is null then now()
      else published_at
    end,
    sold_at = case
      when p_status = 'sold'::public.listing_status then coalesce(sold_at, now())
      when p_status in (
        'draft'::public.listing_status,
        'active'::public.listing_status,
        'archived'::public.listing_status,
        'removed'::public.listing_status
      ) then null
      else sold_at
    end
  where id = p_listing_id
  returning * into updated_listing;

  if updated_listing.id is null then
    raise exception 'Listing not found.'
      using errcode = 'P0002';
  end if;

  return updated_listing;
end;
$$;

revoke all on function public.admin_set_listing_status(uuid, public.listing_status) from public;
grant execute on function public.admin_set_listing_status(uuid, public.listing_status) to authenticated, service_role;

-- Storage deletion now checks the listing relationship, not only the first path
-- segment. Admins can still clean up any listing photo object.
drop policy if exists "Users can delete photos for their own listings" on storage.objects;

create policy "Users can delete photos for their own listings"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-photos'
  and (
    (select private.is_admin())
    or (
      (storage.foldername(name))[1] = (select auth.uid())::text
      and exists (
        select 1
        from public.listings
        where listings.id::text = (storage.foldername(name))[2]
          and listings.owner_id = (select auth.uid())
      )
    )
  )
);
