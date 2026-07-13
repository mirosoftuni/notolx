# NOTOLX

NOTOLX is a vanilla JavaScript marketplace app built with Vite, Bootstrap, and Supabase. It uses separate HTML pages with page-specific controllers and Supabase for Auth, Database, and Storage.

## Tech Stack

- Vite
- Vanilla JavaScript
- HTML and CSS
- Bootstrap
- Supabase Auth, Postgres, RLS, and Storage

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example` and add your Supabase project values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

Start the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Supabase

The schema lives in `supabase/migrations`. Apply migrations through Supabase MCP or the Supabase SQL editor, then run the verification checks documented in `docs/migration-history.md`.

Important files:

- `docs/database.md`: schema documentation and ER diagram.
- `docs/migration-history.md`: migration history and verification notes.
- `docs/demo-data.sql`: optional demo seed data.

## Demo Data

Demo seed data is prepared in:

```text
docs/demo-data.sql
```

Apply it manually through Supabase MCP using `_execute_sql` against the NOTOLX Supabase project. Do not apply it automatically as a production migration.

The demo seed creates sample auth users, profiles, roles, categories, listings, and favorites.

### Demo Accounts

These credentials are public demo credentials for local/project demonstration only. They are not secrets and must not be reused for production accounts.

| Role | Email | Password |
| --- | --- | --- |
| User | `demo@example.com` | `Demo123!` |
| Admin | `admin@example.com` | `Admin123!` |
| User | `test@test.com` | `Test123!` |

After applying demo data, use `admin@example.com` to test the admin panel and the other accounts to test listing ownership, profile editing, and favorites.

## Security Notes

- Do not commit `.env` or Supabase service role keys.
- Frontend code must use only publishable/anon keys.
- RLS and Storage policies are part of the Supabase schema and should be verified after schema changes.
- Demo credentials should be deleted or changed before any public deployment.
