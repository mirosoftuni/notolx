# Assessment Checklist

This checklist maps the SoftUni capstone assessment criteria to the implemented NOTOLX files and features.

| Criterion | Score Range | Implementation Evidence | Status |
| --- | ---: | --- | --- |
| GitHub Commits | 0-15 | Commit history in the public GitHub repository. The project should have at least 15 meaningful commits. | To verify in GitHub |
| GitHub Commit Days | 0-15 | Commit dates in the public GitHub repository. The project should include commits on at least 3 different days. | To verify in GitHub |
| Architecture | 0-10 | Vite project with npm scripts in `package.json`; multi-page HTML files: `index.html`, `login.html`, `register.html`, `listing.html`, `listing-form.html`, `profile.html`, `admin.html`; modular JS in `src/pages`, `src/services`, `src/shared`; shared styling in `src/styles/main.css`. | Implemented |
| App Screens | 0-10 | More than 5 responsive screens: home browsing, login, register, listing details, listing create/edit, profile, admin. Bootstrap and responsive layout are used across pages. | Implemented |
| Database | 0-12 | Supabase schema has more than 4 related tables: `profiles`, `user_roles`, `categories`, `listings`, `listing_photos`, `favorites`. See `supabase/migrations/20260711201302_initial_notolx_schema.sql` and `docs/database.md`. | Implemented |
| Admin Panel | 0-10 | Admin role is stored in `user_roles`; admin page requires admin access; admins can view listings, change listing status, manage categories, and update user roles. See `src/pages/admin.js` and `src/services/adminService.js`. | Implemented |
| File Storage | 0-10 | Supabase Storage buckets `listing-photos` and `avatars`; listing photo upload in `src/pages/listing-form.js`; avatar upload in `src/pages/profile.js`; upload helpers in `src/services/storageService.js`. | Implemented |
| Deployment | 0-8 | Netlify configuration in `netlify.toml`; deployment steps and required environment variables in `README.md`. Live URL placeholder must be replaced after deployment. | Prepared |
| Auth and Security | 0-5 | Supabase Auth login/register/logout in `src/services/authService.js`; RLS policies in migrations; role-based admin checks; hardening migration in `supabase/migrations/20260713103000_harden_notolx_rls_and_storage.sql`; verification notes in `docs/migration-history.md`. | Implemented |
| Documentation | 0-5 | Main setup and deployment docs in `README.md`; schema docs in `docs/database.md`; migration verification in `docs/migration-history.md`; demo seed in `docs/demo-data.sql`; this assessment checklist; AI workflow log in `docs/ai-development-log.md`. | Implemented |

## Requirement Coverage Notes

- Frontend stack: HTML, CSS, JavaScript, Bootstrap, Vite.
- No React, Vue, or TypeScript are used.
- Backend: Supabase Database, Auth, Storage, RLS policies.
- Demo accounts and seed data are documented in `README.md` and `docs/demo-data.sql`.
- Final grading checks that depend on external systems should be verified in GitHub and Netlify:
  - commit count
  - commit dates
  - live deployed URL
  - production environment variables
