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
