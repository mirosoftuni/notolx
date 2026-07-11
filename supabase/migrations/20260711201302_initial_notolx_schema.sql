-- Initial NOTOLX marketplace schema.
-- Prepared for Supabase Postgres; do not apply automatically from this file.

create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('user', 'admin');
create type public.listing_status as enum ('draft', 'active', 'sold', 'archived', 'removed');
create type public.listing_condition as enum ('new', 'like_new', 'good', 'fair', 'poor');

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  phone text,
  location text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(trim(display_name)) between 2 and 80),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 500)
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.categories (
  id bigint primary key generated always as identity,
  parent_id bigint references public.categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_unique unique (name),
  constraint categories_slug_unique unique (slug),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  category_id bigint not null references public.categories(id) on delete restrict,
  title text not null,
  description text not null,
  price numeric(12, 2) not null,
  currency char(3) not null default 'BGN',
  condition public.listing_condition not null default 'good',
  status public.listing_status not null default 'draft',
  location text not null,
  contact_phone text,
  is_featured boolean not null default false,
  published_at timestamptz,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listings_title_length check (char_length(trim(title)) between 3 and 120),
  constraint listings_description_length check (char_length(trim(description)) between 10 and 5000),
  constraint listings_price_non_negative check (price >= 0),
  constraint listings_currency_format check (currency ~ '^[A-Z]{3}$')
);

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  bucket_id text not null default 'listing-photos',
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_photos_bucket_check check (bucket_id = 'listing-photos'),
  constraint listing_photos_storage_path_unique unique (storage_path),
  constraint listing_photos_alt_text_length check (alt_text is null or char_length(alt_text) <= 160)
);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index user_roles_role_idx on public.user_roles(role);

create index categories_parent_id_idx on public.categories(parent_id);
create index categories_active_sort_idx on public.categories(is_active, sort_order, name);

create index listings_seller_id_idx on public.listings(seller_id);
create index listings_category_id_idx on public.listings(category_id);
create index listings_status_created_at_idx on public.listings(status, created_at desc);
create index listings_active_category_price_idx on public.listings(category_id, price)
  where status = 'active';
create index listings_search_idx on public.listings using gin (
  to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(location, ''))
);

create index listing_photos_listing_id_idx on public.listing_photos(listing_id);
create index listing_photos_owner_id_idx on public.listing_photos(owner_id);
create unique index listing_photos_one_primary_per_listing_idx
  on public.listing_photos(listing_id)
  where is_primary;

create index favorites_listing_id_idx on public.favorites(listing_id);
create index favorites_user_created_at_idx on public.favorites(user_id, created_at desc);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger set_listings_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

create trigger set_listing_photos_updated_at
before update on public.listing_photos
for each row execute function public.set_updated_at();

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.user_roles
      where user_id = (select auth.uid())
        and role = 'admin'::public.app_role
    );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated, service_role;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  fallback_name text;
begin
  fallback_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'New user'
  );

  if char_length(trim(fallback_name)) < 2 then
    fallback_name := 'New user';
  end if;

  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, left(fallback_name, 80), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.favorites enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant usage on type public.app_role to anon, authenticated, service_role;
grant usage on type public.listing_status to anon, authenticated, service_role;
grant usage on type public.listing_condition to anon, authenticated, service_role;

grant select on public.profiles, public.categories, public.listings, public.listing_photos to anon;
grant select, insert, update, delete on
  public.profiles,
  public.user_roles,
  public.categories,
  public.listings,
  public.listing_photos,
  public.favorites
to authenticated;
grant all on
  public.profiles,
  public.user_roles,
  public.categories,
  public.listings,
  public.listing_photos,
  public.favorites
to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

create policy "Profiles are publicly readable"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id or (select private.is_admin()))
with check ((select auth.uid()) = id or (select private.is_admin()));

create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id or (select private.is_admin()));

create policy "Users can read their own roles"
on public.user_roles
for select
to authenticated
using ((select auth.uid()) = user_id or (select private.is_admin()));

create policy "Admins can insert roles"
on public.user_roles
for insert
to authenticated
with check ((select private.is_admin()));

create policy "Admins can update roles"
on public.user_roles
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admins can delete roles"
on public.user_roles
for delete
to authenticated
using ((select private.is_admin()));

create policy "Anyone can read active categories"
on public.categories
for select
to anon
using (is_active);

create policy "Authenticated users can read categories"
on public.categories
for select
to authenticated
using (is_active or (select private.is_admin()));

create policy "Admins can insert categories"
on public.categories
for insert
to authenticated
with check ((select private.is_admin()));

create policy "Admins can update categories"
on public.categories
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admins can delete categories"
on public.categories
for delete
to authenticated
using ((select private.is_admin()));

create policy "Anyone can read active listings"
on public.listings
for select
to anon
using (status = 'active');

create policy "Authenticated users can read visible listings"
on public.listings
for select
to authenticated
using (
  status = 'active'
  or seller_id = (select auth.uid())
  or (select private.is_admin())
);

create policy "Users can create their own listings"
on public.listings
for insert
to authenticated
with check (seller_id = (select auth.uid()));

create policy "Users can update their own listings"
on public.listings
for update
to authenticated
using (seller_id = (select auth.uid()) or (select private.is_admin()))
with check (seller_id = (select auth.uid()) or (select private.is_admin()));

create policy "Users can delete their own listings"
on public.listings
for delete
to authenticated
using (seller_id = (select auth.uid()) or (select private.is_admin()));

create policy "Anyone can read active listing photos"
on public.listing_photos
for select
to anon
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_photos.listing_id
      and listings.status = 'active'
  )
);

create policy "Authenticated users can read visible listing photos"
on public.listing_photos
for select
to authenticated
using (
  owner_id = (select auth.uid())
  or (select private.is_admin())
  or exists (
    select 1
    from public.listings
    where listings.id = listing_photos.listing_id
      and listings.status = 'active'
  )
);

create policy "Users can add photos to their own listings"
on public.listing_photos
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.listings
    where listings.id = listing_photos.listing_id
      and listings.seller_id = (select auth.uid())
  )
);

create policy "Users can update photos on their own listings"
on public.listing_photos
for update
to authenticated
using (owner_id = (select auth.uid()) or (select private.is_admin()))
with check (
  (owner_id = (select auth.uid()) or (select private.is_admin()))
  and exists (
    select 1
    from public.listings
    where listings.id = listing_photos.listing_id
      and (listings.seller_id = (select auth.uid()) or (select private.is_admin()))
  )
);

create policy "Users can delete photos on their own listings"
on public.listing_photos
for delete
to authenticated
using (owner_id = (select auth.uid()) or (select private.is_admin()));

create policy "Users can read their own favorites"
on public.favorites
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can favorite active listings"
on public.favorites
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.listings
    where listings.id = favorites.listing_id
      and listings.status = 'active'
  )
);

create policy "Users can remove their own favorites"
on public.favorites
for delete
to authenticated
using (user_id = (select auth.uid()));

insert into public.categories (name, slug, description, sort_order)
values
  ('Phones', 'phones', 'Mobile phones, accessories, and smart devices.', 10),
  ('Cars', 'cars', 'Cars, parts, and vehicle accessories.', 20),
  ('Home', 'home', 'Furniture, appliances, and home goods.', 30),
  ('Electronics', 'electronics', 'Computers, audio, cameras, and gadgets.', 40),
  ('Fashion', 'fashion', 'Clothing, shoes, bags, and accessories.', 50),
  ('Sports', 'sports', 'Sports gear, bikes, and outdoor equipment.', 60),
  ('Jobs', 'jobs', 'Local jobs, gigs, and services.', 70),
  ('Pets', 'pets', 'Pet supplies and local pet-related offers.', 80)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('listing-photos', 'listing-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can read listing photo files"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'listing-photos');

create policy "Users can upload photos for their own listings"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.listings
    where listings.id::text = (storage.foldername(name))[2]
      and listings.seller_id = (select auth.uid())
  )
);

create policy "Users can update photos for their own listings"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-photos'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_admin())
  )
)
with check (
  bucket_id = 'listing-photos'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_admin())
  )
  and (
    (select private.is_admin())
    or exists (
      select 1
      from public.listings
      where listings.id::text = (storage.foldername(name))[2]
        and listings.seller_id = (select auth.uid())
    )
  )
);

create policy "Users can delete photos for their own listings"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-photos'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_admin())
  )
);

create policy "Public can read avatar files"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
