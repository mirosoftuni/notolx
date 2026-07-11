# Migration History

## 20260711201302_initial_notolx_schema.sql

Status: prepared locally, not verified as applied on the remote Supabase project.

Migration file:

`supabase/migrations/20260711201302_initial_notolx_schema.sql`

Purpose:

- Create the initial NOTOLX marketplace schema.
- Add tables, relationships, indexes, enums, triggers, seed categories, RLS policies, storage buckets, and storage policies.

## Supabase MCP Verification

Verification date: July 11, 2026

Supabase project:

- Name: `notolx`
- Project ID/ref: `llmwyhahcaniigjbdlfx`
- Region: `eu-west-1`

MCP checks performed:

- Listed Supabase projects through MCP.
- Listed remote migrations through MCP.
- Queried for app tables through MCP.
- Queried for storage buckets through MCP.
- Queried `public.categories` through MCP.

Verification result:

- Remote migration list returned `[]`.
- `public.categories` was not found on the remote database.
- `listing-photos` and `avatars` buckets were not found.

Conclusion:

The initial migration has **not** been verified as applied through Supabase MCP. Apply the migration through the Supabase MCP flow in VS Code, then rerun verification and update this document with the applied timestamp and verification output.

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
