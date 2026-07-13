# NOTOLX

## Български

NOTOLX е marketplace приложение с vanilla JavaScript, изградено с Vite, Bootstrap и Supabase. Проектът използва отделни HTML страници с page-specific controllers, а Supabase осигурява Auth, Database и Storage.

### Tech Stack

- Vite
- Vanilla JavaScript
- HTML и CSS
- Bootstrap
- Supabase Auth, Postgres, RLS и Storage

### Local Setup

Инсталиране на dependencies:

```bash
npm install
```

Създайте `.env` файл от `.env.example` и добавете стойностите за вашия Supabase project:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

Стартиране на приложението:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Локален preview на production build:

```bash
npm run preview
```

### Supabase

Database schema файловете са в `supabase/migrations`. Migrations се прилагат през Supabase MCP или Supabase SQL editor, след което се изпълняват verification checks, описани в `docs/migration-history.md`.

Важни файлове:

- `docs/database.md`: документация на schema-та и ER diagram.
- `docs/migration-history.md`: migration history и verification notes.
- `docs/demo-data.sql`: optional demo seed data.

### Demo Data

Demo seed data е подготвена в:

```text
docs/demo-data.sql
```

Прилага се ръчно през Supabase MCP с `_execute_sql` към NOTOLX Supabase project. Не трябва да се прилага автоматично като production migration.

Demo seed-ът създава sample auth users, profiles, roles, categories, listings, listing photos и favorites.

### Netlify Deployment

Live URL:

```text
https://your-notolx-site.netlify.app
```

Netlify build configuration е в `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`

#### Required Environment Variables

Добавете тези променливи в Netlify от Site configuration > Environment variables:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

За frontend deployment използвайте само public anon/publishable key. Не добавяйте Supabase service role key в Netlify.

#### Deploy Steps

1. Push-нете проекта в GitHub.
2. В Netlify създайте new site от repository-то.
3. Потвърдете, че build command е `npm run build`.
4. Потвърдете, че publish directory е `dist`.
5. Добавете `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
6. Deploy-нете сайта.
7. Заменете live URL placeholder-а по-горе с production URL-а от Netlify.

#### Final Local Verification

Преди deployment изпълнете:

```bash
npm install
npm run build
npm run preview
```

След това проверете локално:

- Home page зарежда listings и categories.
- Register/login работят със Supabase Auth.
- Listing create/edit работи за authenticated users.
- Profile page зарежда, запазва profile data и качва avatar.
- Admin page е блокирана за normal users и работи за admin users.
- Browser console няма Supabase configuration errors.

### Security Notes

- Не commit-вайте `.env` или Supabase service role keys.
- Frontend code трябва да използва само publishable/anon keys.
- RLS и Storage policies са част от Supabase schema-та и трябва да се проверяват след schema changes.
- Demo credentials трябва да бъдат изтрити или сменени преди public deployment.

---

## English

NOTOLX is a vanilla JavaScript marketplace app built with Vite, Bootstrap, and Supabase. It uses separate HTML pages with page-specific controllers, while Supabase provides Auth, Database, and Storage.

### Tech Stack

- Vite
- Vanilla JavaScript
- HTML and CSS
- Bootstrap
- Supabase Auth, Postgres, RLS, and Storage

### Local Setup

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

Preview the production build locally:

```bash
npm run preview
```

### Supabase

The database schema files are in `supabase/migrations`. Apply migrations through Supabase MCP or the Supabase SQL editor, then run the verification checks documented in `docs/migration-history.md`.

Important files:

- `docs/database.md`: schema documentation and ER diagram.
- `docs/migration-history.md`: migration history and verification notes.
- `docs/demo-data.sql`: optional demo seed data.

### Demo Data

Demo seed data is prepared in:

```text
docs/demo-data.sql
```

Apply it manually through Supabase MCP using `_execute_sql` against the NOTOLX Supabase project. Do not apply it automatically as a production migration.

The demo seed creates sample auth users, profiles, roles, categories, listings, listing photos, and favorites.

### Netlify Deployment

Live URL:

```text
https://your-notolx-site.netlify.app
```

The Netlify build configuration is in `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`

#### Required Environment Variables

Set these in Netlify under Site configuration > Environment variables:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

Use only the public anon/publishable key for frontend deployment. Do not add a Supabase service role key to Netlify.

#### Deploy Steps

1. Push the project to GitHub.
2. In Netlify, create a new site from the repository.
3. Confirm the build command is `npm run build`.
4. Confirm the publish directory is `dist`.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. Deploy the site.
7. Replace the live URL placeholder above with the Netlify production URL.

#### Final Local Verification

Before deploying, run:

```bash
npm install
npm run build
npm run preview
```

Then verify locally:

- Home page loads listings and categories.
- Register/login work with Supabase Auth.
- Listing create/edit works for authenticated users.
- Profile page loads, saves profile data, and uploads avatar.
- Admin page is blocked for normal users and works for admin users.
- Browser console has no Supabase configuration errors.

### Security Notes

- Do not commit `.env` or Supabase service role keys.
- Frontend code must use only publishable/anon keys.
- RLS and Storage policies are part of the Supabase schema and should be verified after schema changes.
- Demo credentials should be deleted or changed before any public deployment.
