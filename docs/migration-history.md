# Migration History

## 20260711201302_initial_notolx_schema.sql

Status: prepared locally, not verified as applied on the remote Supabase project.

Migration file:

`supabase/migrations/20260711201302_initial_notolx_schema.sql`

Purpose:

- Create the initial NOTOLX marketplace schema.
- Add tables, relationships, indexes, enums, triggers, seed categories, RLS policies, storage buckets, and storage policies.

## Supabase MCP Verification

Verification date: July 12, 2026

Supabase project:

- Name: `notolx`
- Project ID/ref: `llmwyhahcaniigjbdlfx`
- Region: `eu-west-1`

MCP checks performed:

- Listed Supabase projects through MCP.
- Listed remote migrations through MCP.
- Listed public tables through MCP.
- Checked local `.env` Supabase URL.
- Checked REST visibility for expected NOTOLX tables and accidental recipe tables.

Verification result before repair:

- Local `.env` pointed to the `notolx` project ref: `llmwyhahcaniigjbdlfx`.
- Remote migration history for `notolx` contained recipe migrations:
  - `20260712040930_create_bulgarian_recipe_app_schema`
  - `20260712042233_tighten_recipe_security_policies_v2`
- The separate Supabase project named `recipe` had project ref `tlxsvdkoxyywhgmnzbxb` and no remote migrations.
- The `notolx` database contained recipe tables/data such as `recipes`, `recipe_categories`, `reviews`, and recipe-style `favorites`.
- Expected NOTOLX tables `listings` and `listing_photos` were missing on the `notolx` remote database.
- Existing `profiles`, `categories`, and `favorites` tables on `notolx` were not compatible with the prepared NOTOLX schema:
  - `profiles` was missing `phone`, `location`, and `avatar_url`.
  - `categories` used UUID IDs from the recipe schema and was missing `parent_id`, `is_active`, and `updated_at`.
  - `favorites` referenced `recipe_id`, not `listing_id`.

Conclusion:

The local app was configured for the `notolx` Supabase project, but the remote `notolx` database contained the wrong recipe schema. The prepared initial NOTOLX migration could not be applied cleanly on top of that state because several table names already existed with incompatible columns and key types.

Repair applied through Supabase MCP on July 12, 2026:

- `20260712090833_remove_accidental_recipe_schema_from_notolx_v2`
  - Removed accidental recipe public tables from the `notolx` project.
  - Removed accidental recipe storage policies.
  - Did not directly delete storage bucket rows because Supabase protects direct deletion from storage tables.
- `20260712090955_initial_notolx_schema`
  - Applied the NOTOLX schema from `supabase/migrations/20260711201302_initial_notolx_schema.sql`.
- `20260712091214_backfill_notolx_profiles_for_existing_auth_users`
  - Created matching `profiles` and `user_roles` records for auth users that existed before the repair.
- `20260712093023_add_profile_preferred_language`
  - Added `profiles.preferred_language` for persisted UI language preference.
  - Default language is `bg`; allowed values are `bg` and `en`.
  - Updated the auth trigger so new profiles receive the language from auth metadata when provided.

Verification result after repair:

- Remote public tables now exist and have RLS enabled:
  - `profiles`
  - `user_roles`
  - `categories`
  - `listings`
  - `listing_photos`
  - `favorites`
- Seeded categories count: `8`.
- Auth/user backfill:
  - `auth.users`: `3`
  - `profiles`: `3`
  - `user_roles`: `3`
- Language preference:
  - `profiles.preferred_language`: `bg` for all existing profiles after backfill.
- REST checks with the local `.env` key returned `200` for:
  - `categories`
  - `listings`
  - `listing_photos`
  - `favorites`
  - `profiles`
- REST checks returned `404` for accidental recipe tables:
  - `recipes`
  - `recipe_categories`
  - `reviews`
- Storage buckets now include:
  - `avatars`
  - `listing-photos`
- The old `recipe-images` storage bucket still exists because SQL deletion from `storage.buckets` is protected by Supabase, but it is not referenced by the NOTOLX app and the recipe database tables were removed.

## Expected Post-Apply Verification

After applying the migration, verify:

- Remote migration history includes `20260711201302_initial_notolx_schema`.
- Public tables exist:
  - `profiles`
  - `user_roles`
  - `categories`
  - `listings`
  - `listing_photos`
  - `favorites`
- RLS is enabled for every public app table.
- Seeded categories count is `8`.
- Storage buckets exist:
  - `listing-photos`
  - `avatars`
- Security and performance advisors do not report blocking issues.

## 20260713103000_harden_notolx_rls_and_storage.sql

Status: applied through Supabase MCP on July 13, 2026.

Remote migration history entry:

- Version: `20260713041032`
- Name: `harden_notolx_rls_and_storage`

Migration file:

`supabase/migrations/20260713103000_harden_notolx_rls_and_storage.sql`

Purpose:

- Harden table privileges for browser clients by replacing broad `UPDATE` grants with column-specific grants.
- Keep owner listing edits compatible with the frontend while preventing direct client updates to admin-controlled listing fields:
  - `status`
  - `is_featured`
  - `published_at`
  - `sold_at`
- Add `public.admin_set_listing_status(uuid, listing_status)` as a checked RPC for admin status changes.
- Tighten listing photo Storage deletion so users can delete files only when the Storage path maps to a listing they own; admins can still clean up listing photos.
- Keep existing buckets and public read behavior unchanged.

Frontend compatibility notes:

- `src/services/adminService.js` now changes listing status through `admin_set_listing_status`.
- `src/services/adminService.js` updates roles with explicit insert/delete steps instead of `upsert`, so the role flow stays compatible with column-limited grants.
- `src/services/authService.js` updates profiles with explicit update/insert steps instead of `upsert`, so profile saves do not require `UPDATE` on the profile primary key.
- `src/services/listingService.js` still creates listings with `status = active`, which remains allowed by the hardened insert policy.
- Regular listing edits still update only non-admin fields, matching the new column grants.

Verification result after MCP apply on July 13, 2026:

- Public app tables still exist and have RLS enabled:
  - `profiles`
  - `user_roles`
  - `categories`
  - `listings`
  - `listing_photos`
  - `favorites`
- Relationship checks confirmed the expected foreign keys, including:
  - `listings_owner_id_fkey`
  - `listings_category_id_fkey`
  - `listing_photos_listing_id_fkey`
  - `listing_photos_owner_id_fkey`
  - `favorites_user_id_fkey`
  - `favorites_listing_id_fkey`
- Policy counts:
  - `profiles`: `4`
  - `user_roles`: `4`
  - `categories`: `5`
  - `listings`: `5`
  - `listing_photos`: `5`
  - `favorites`: `3`
  - `storage.objects`: `8`
- Storage buckets verified:
  - `avatars`: public, 5 MiB limit, JPG/PNG/WebP allowed.
  - `listing-photos`: public, 10 MiB limit, JPG/PNG/WebP allowed.
- `public.admin_set_listing_status(uuid, listing_status)` exists with `SECURITY DEFINER`.
- Authenticated listing grants remain hardened:
  - no direct authenticated `UPDATE` grant for `status`, `is_featured`, `published_at`, or `sold_at`.
  - no direct authenticated `INSERT` grant for `is_featured` or `sold_at`.
- Supabase advisors:
  - Security: WARN only. Current warnings are for broad public storage SELECT policies, the intentionally checked `SECURITY DEFINER` admin RPC, and leaked-password protection being disabled.
  - Performance: INFO only for unused indexes, expected on a new/low-traffic demo database.

Reference Supabase MCP verification queries:

1. Confirm RLS is enabled for every public app table:

```sql
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'user_roles',
    'categories',
    'listings',
    'listing_photos',
    'favorites'
  )
order by tablename;
```

Expected: every `rowsecurity` value is `true`.

2. Confirm policies are present on all app tables and Storage objects:

```sql
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where (schemaname = 'public' and tablename in (
    'profiles',
    'user_roles',
    'categories',
    'listings',
    'listing_photos',
    'favorites'
  ))
  or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;
```

Expected: public table policies are present, and Storage policies include:

- `Public can read listing photo files`
- `Users can upload photos for their own listings`
- `Users can update photos for their own listings`
- `Users can delete photos for their own listings`
- `Public can read avatar files`
- `Users can upload their own avatar`
- `Users can update their own avatar`
- `Users can delete their own avatar`

3. Confirm required Storage buckets are present:

```sql
select
  id,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id in ('listing-photos', 'avatars')
order by id;
```

Expected:

- `avatars`: public bucket, 5 MiB limit, JPG/PNG/WebP allowed.
- `listing-photos`: public bucket, 10 MiB limit, JPG/PNG/WebP allowed.

4. Confirm hardened listing grants and admin status RPC:

```sql
select
  table_name,
  privilege_type,
  column_name
from information_schema.column_privileges
where table_schema = 'public'
  and grantee = 'authenticated'
  and table_name in ('profiles', 'listings', 'listing_photos', 'categories', 'user_roles')
  and privilege_type in ('UPDATE', 'INSERT')
order by table_name, privilege_type, column_name;
```

Expected:

- `listings` has no authenticated `UPDATE` privilege for `status`, `is_featured`, `published_at`, or `sold_at`.
- `listings` has no authenticated `INSERT` privilege for `is_featured` or `sold_at`.

```sql
select
  routine_schema,
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'admin_set_listing_status';
```

Expected: `security_type` is `DEFINER`.

5. Run Supabase MCP advisors:

- `get_advisors` with `type = security`
- `get_advisors` with `type = performance`

Expected: no blocking RLS, policy, function exposure, or storage policy issues. Review any advisory remediation URLs before marking the migration as verified.

## 20260713071643_address_security_advisor_warnings.sql

Status: prepared locally, not applied automatically.

Migration file:

`supabase/migrations/20260713071643_address_security_advisor_warnings.sql`

Purpose:

- Remove broad public `SELECT` policies on `storage.objects` for the public `avatars` and `listing-photos` buckets. Public file URLs remain usable, but clients should no longer be able to list every object in those buckets through the Storage API.
- Revoke anonymous `EXECUTE` access from `public.admin_set_listing_status(uuid, listing_status)`.
- Keep `authenticated` and `service_role` execute access for the admin panel flow. The function still performs its internal `private.is_admin()` check before changing listing status.

Supabase MCP security advisors on July 13, 2026:

- WARN: `public_bucket_allows_listing` for `avatars`.
- WARN: `public_bucket_allows_listing` for `listing-photos`.
- WARN: `anon_security_definer_function_executable` for `public.admin_set_listing_status`.
- WARN: `authenticated_security_definer_function_executable` for `public.admin_set_listing_status`.
- WARN: `auth_leaked_password_protection` disabled.

Notes:

- The new migration addresses the two bucket listing warnings and the anonymous RPC execute warning.
- The authenticated `SECURITY DEFINER` warning is expected while the admin panel uses this checked RPC from the browser. Removing authenticated execute access would break admin status changes unless the admin workflow is moved to a server-side function.
- Leaked password protection is an Auth project setting and should be enabled from the Supabase dashboard, not through a schema migration.
