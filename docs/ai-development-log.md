# AI Development Log

NOTOLX was built with an AI-assisted development loop using Codex as the coding agent. The work was split into small implementation steps, and each step followed the same practical cycle.

## Development Loop

1. Prompt Codex with one focused task.
2. Inspect the current project files and Supabase schema.
3. Implement the requested feature in small, related files.
4. Run local verification, usually `npm run build`.
5. Review the result and refine errors, missing states, or RLS compatibility issues.
6. Commit and push successful changes to GitHub.

## Main Iterations

| Iteration | Prompt Goal | Result |
| --- | --- | --- |
| Project setup | Create a Vite vanilla JavaScript project without React, Vue, or TypeScript. | Added initial project files, npm scripts, `.gitignore`, `.env.example`, Vite config, and source folders. |
| Multi-page structure | Add separate app pages and shared navigation. | Added HTML pages and page controllers for home, auth, listings, profile, and admin. |
| Shared UI | Implement marketplace-focused responsive design. | Added Bootstrap import, `src/styles/main.css`, navbar, hero, cards, forms, and mobile spacing. |
| Supabase schema | Prepare NOTOLX database migrations. | Added tables, relationships, indexes, enums, RLS policies, Storage buckets, and docs. |
| Auth | Implement Supabase client and auth services. | Added register, login, logout, session/user/profile, role, and admin helpers. |
| Listings | Implement browsing, details, create/edit, and uploads. | Added listing services, filters, details page, listing form, photo uploads, and owner checks. |
| Profile | Implement authenticated profile page. | Added profile editing, avatar upload, own listings, edit/delete actions. |
| Admin | Implement role-protected admin panel. | Added admin service and UI for listings, statuses, categories, and user roles. |
| Security | Review RLS/storage compatibility and harden policies. | Added hardening migration and Supabase MCP verification notes. |
| Demo/deploy/docs | Prepare assessment-ready documentation. | Added demo seed SQL, README deployment steps, Netlify config, checklist, and this log. |

## Verification Used

- `npm run build` after major frontend/service changes.
- Supabase MCP for project/schema checks, migration history, RLS verification, and security/performance advisors.
- Manual review of changed files with `git diff --check`.
- Local dev/preview server checks for important pages when needed.

## Refinement Examples

- Replaced ambiguous Supabase relationship embeds with explicit foreign key names.
- Moved admin listing status changes to a checked RPC after column-level grant hardening.
- Reworked profile and role saves to avoid `upsert()` issues with stricter grants.
- Added Bulgarian as the default UI language with English as optional.
- Repaired the accidental recipe schema mismatch and documented the recovery.

## Git Workflow

After each successful feature or fix:

```bash
git status
git diff
npm run build
git add .
git commit -m "Short meaningful message"
git push
```

The final repository history should show incremental progress across multiple days, not one large final commit.
