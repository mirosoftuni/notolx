# NOTOLX AI Agent Instructions

## Project Context

NOTOLX is a multi-page marketplace app.

The app uses:

- HTML, CSS, vanilla JavaScript
- Bootstrap
- Vite
- Supabase Auth, Postgres, RLS, and Storage

Do not introduce React, Vue, TypeScript, or a single-page-app framework.

## Architecture

- Keep every screen as a separate HTML page.
- Keep page-specific logic in `src/pages`.
- Keep Supabase data access in `src/services`.
- Keep shared UI helpers in `src/shared`.
- Keep shared styling in `src/styles/main.css`.
- Prefer small, focused modules instead of large monolithic files.

Current main pages:

- `index.html`: home and listing browsing
- `login.html`: login
- `register.html`: registration
- `listing.html`: listing details
- `listing-form.html`: create/edit listing
- `profile.html`: profile and own listings
- `admin.html`: admin panel

## Supabase Rules

- Use `src/services/supabaseClient.js` for Supabase client initialization.
- Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Never expose or commit service role keys.
- Keep schema changes in `supabase/migrations`.
- Do not edit the live database without also creating or updating a local SQL migration when schema, RLS, or Storage policies change.
- Use explicit Supabase relationship names when a table has potentially ambiguous relationships.
- Keep RLS-compatible frontend queries.

Important tables:

- `profiles`
- `user_roles`
- `categories`
- `listings`
- `listing_photos`
- `favorites`

Important Storage buckets:

- `listing-photos`
- `avatars`

## Authentication And Authorization

- Use Supabase Auth for register, login, logout, session, and current user checks.
- Use `user_roles` for normal/admin role checks.
- Admin-only behavior must be enforced by RLS policies or controlled RPC functions, not only by hidden frontend UI.
- Normal users can manage only their own profile, listings, photos, and favorites.

## UI And UX

- Bulgarian is the default language.
- English is optional through the language switcher.
- Keep marketplace-focused copy and avoid technical marketing text in the user-facing UI.
- Keep responsive behavior for desktop and mobile.
- Use Bootstrap components and existing project CSS patterns before adding new styles.
- Keep empty, loading, and error states user-friendly.

## Code Style

- Use vanilla JavaScript modules.
- Keep functions small and descriptive.
- Reuse existing helpers from `src/shared` before adding new utilities.
- Avoid duplicating DOM/form logic.
- Prefer clear Bulgarian user-facing messages with English translations in `src/shared/i18n.js`.

## Verification

Before considering a change complete, run:

```bash
npm run build
```

For Supabase-related changes, also verify the relevant behavior through Supabase MCP or the Supabase dashboard:

- RLS enabled
- policies present
- Storage buckets present
- demo data still compatible when applicable
