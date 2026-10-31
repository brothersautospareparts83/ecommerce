# Security

## Authentication
- **Neon Auth (Managed Better Auth)** hosts users, sessions and password hashing in the `neon_auth` schema. The app never stores or sees passwords.
- Browser talks to the app's same-origin proxy `/api/auth/*` (`src/app/api/auth/[...path]/route.ts`); session cookies are signed with `NEON_AUTH_COOKIE_SECRET`.
- `src/proxy.ts` sends signed-out visitors from `/account/*` and `/admin/*` to `/login` (`/admin/login` is public).
- Pages and server actions re-check the session on the server: `requireUser`, `requireStaff`, `requireAdmin` (`src/lib/auth/session.ts`). Roles come from our `profiles.role`, never from the browser.

## Authorization (defence in depth)
1. App layer: role guards above; server actions validate input with zod.
2. Database layer: each request runs under `app_customer` or `app_staff` (`withDb`), so Row Level Security and column privileges apply. Customers cannot read cost prices, other customers' data, audit logs or settings.
3. Role assignment: customers cannot change `profiles.role` (column privilege). Staff sessions can only change it when `app.user_role` is `admin` or `owner` (trigger). In the UI, admins manage Customer/Staff and only the owner grants Admin/Owner; nobody changes their own role. Every change is written to `audit_logs`.
4. First owner: register on the site, then run `node --env-file=.env.local scripts/set-role.mjs <email> owner` with database access. There is deliberately no "first user becomes admin" shortcut.

## Secrets
- `.env.local` holds `DATABASE_URL*`, `NEON_AUTH_*`; it is git-ignored. Never use `NEXT_PUBLIC_` for secrets. `.env.example` lists names only.
- Rotate the database password if it was ever pasted into chat or email.

## Known gaps (tracked for Phase 13)
- No rate limiting on sign-in/sign-up/search yet (Neon Auth applies its own limits).
- Email verification at sign-up is off (Neon default). Enable it and configure custom SMTP before launch; password-reset emails use Neon's shared sender until then and delivery has not been verified end to end.
- Production domain must be added to Neon Auth trusted domains.
- Redirects for signed-in customers visiting `/admin` are delivered inside the streamed page (HTTP 200 + client redirect). No admin content is sent; verified by `scripts/e2e-auth.mjs`.
- CSP/security headers, file-upload validation, webhook signature checks arrive with their features.
