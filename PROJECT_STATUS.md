# PROJECT_STATUS

**Last updated:** 2026-10-31
**Current phase:** Phase 3 complete (auth + admin shell) → next: Phase 4 (Product catalog and inventory)

## Environment
Node v24.18.0, npm 11.16.0, git 2.55.0, Python 3.14.6, Windows 11. **Not installed:** pnpm, Supabase CLI, Vercel CLI, Docker (no local Supabase; use a hosted Supabase dev project).
Project folder: `C:\Users\user\OneDrive\Documents\Brothers Auto` (synced by OneDrive; `node_modules` and `.next` are large, consider excluding them from OneDrive sync). The folder is not its own git repo; `git` resolves to a repo at the user home folder, so no commits were made.

## Completed
- Phase 0: ARCHITECTURE.md, PROJECT_PLAN.md, README.md, CLAUDE.md, .env.example.
- Phase 1: Next.js 16 (App Router, Turbopack, Cache Components) + React 19 + TypeScript + Tailwind 4.
  - Design tokens as CSS variables (brand palette) in `src/app/globals.css`; light and dark themes; pre-paint script prevents flash; system preference on first visit; saved in localStorage; toggles in desktop and mobile nav.
  - Header, mobile menu (portal drawer), footer, wordmark placeholder logo.
  - Homepage with all 15 requested sections (see caveats).
  - `/shop`, `/categories`, `/categories/[slug]` (15), `/products/[slug]` (12 DEMO), `/finder`, plus honest "not built yet" pages for `ai-assistant, quotation, about, contact, faq, cart, login, register, privacy, terms`.
  - Reusable components: Button/LinkButton, ProductCard, ClassificationBadge, StockStatus, ImagePlaceholder, Section, PartsFinder, ProductTabs, WhatsAppButton.

- Brand update (owner-supplied logo and flyer): palette switched to black/orange/silver; logo in header, footer, hero and favicon; flyer shown in the contact section; owner contact details from the flyer in `src/lib/site.ts` (phones 0627 858827 and 0741 939 264, @brothersautospareparts83 on Instagram/TikTok, Kariakoo). Real `/contact` page. WhatsApp number defaults to 0627 858827 (**owner to confirm which number is WhatsApp**). Instagram/TikTok URLs are inferred from the handle; confirm.
- GitHub: code pushed to https://github.com/brothersautospareparts83/ecommerce (see Next actions for status).

- Phase 2 (Neon): 7 SQL migrations create all 36 required tables plus support tables, enums, indexes, triggers, RLS policies, column privileges and reference seed data (see DATABASE_SCHEMA.md). Applied to the owner's Neon database (`neondb`, Postgres 18, us-east-2; the database already contained the managed `neon_auth` schema). `src/lib/db/index.ts` provides `withDb` (role-scoped transactions over the Neon serverless driver). `/api/health/db` proves the running app reads the DB as `app_customer`.
- Database connection strings are in `.env.local` (git-ignored) as `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED`. The password was pasted in chat, so **rotate it in the Neon console when convenient** and update `.env.local`.

- Phase 3 (Neon Auth): sign-up, sign-in, sign-out, forgot/reset password pages; `/api/auth` proxy; `src/proxy.ts` route protection; `ensure_profile()` provisions a customer profile on first login (migration 0008); customer dashboard (`/account`, orders, profile with +255 validation); admin shell (`/admin` live dashboard figures, `/admin/users` role management, `/admin/audit-logs`, `/admin/login`); audit logging of role changes; `scripts/set-role.mjs` to bootstrap the owner. See SECURITY.md.

- Storefront polish (owner request, using a design mockup for icons and arrangement only): neutral black/orange palette with all blue tints removed; header with utility strip, search and a navigation bar with active highlight and dropdowns; phone bottom bar (Home, Shop, Cart, Account, More) and menu drawer; homepage finder card with four icon tabs next to an AI Parts Expert teaser (marked Coming soon); trust strip; icon category tiles; footer with columns and a disabled newsletter; shop search, category filter, sort and in-stock filter (demo data). No sideways scrolling on any public page at 375px in light or dark. The mockup's photos and claims ("100% Genuine", "Trusted by Thousands", invented phone numbers) were deliberately not copied.

- Phase 4 (in progress, build not yet verified): real catalog from the owner's stock spreadsheet (`JOSEPH 2-6-26 (5).xlsx`, kept out of git). 1,908 rows read -> 1,550 products (310 duplicate rows merged), 1,727 opening-stock movements, 30,866 units, 1,328 part numbers. Imported by `scripts/import-products.mts` (batched, single transaction, adds new products only, never overwrites; re-running creates nothing). Importer logic is in `src/lib/import/parse.ts`.
  - **All imported products are unpublished drafts, classification "unverified", no photos.** Publishing needs a classification, a selling price and an approved real photo (migration 0010). 415 products have no selling price, 409 no category (store 3 sheet has no category column).
  - **Store 3 "PRICE RMB" column = SELLING price (owner confirmed 2026-10-31).** Applied to 389 products that had no selling price (their wrongly-read cost was cleared); importer now reads it as a selling price. 26 products still have no selling price and show "Ask for price".
  - Part numbers: text before "=" is the part number when it has 5+ digits; otherwise (e.g. "FOTON", "BIG/SMALL") it is kept as a supplier reference in the description. Text after "=" and the vehicle-compatibility column are stored as unverified notes, never as verified compatibility.
  - Privacy (owner request): buying price and stock quantities are staff-only. Enforced in the database: customers cannot read `cost_price_tzs` or the inventory table (migration 0011); they get only an in-stock yes/no through `product_in_stock()`. Verified against the real database.
  - Demo data removed: no demo products or DEMO labels remain; `src/lib/categories.ts` holds only category icons and the vehicle brand list. The storefront (home, shop, categories, product pages) now reads the database and shows empty states until products are published.
  - Admin: products list with filters (needs price / type / photo / category, out or low stock) and pagination, product editor (details, prices, stock adjustments with history, part numbers, photos by address with approve/reject), inventory overview with stock value, categories and brands. All writes are audit-logged.
  - Search: name, SKU, exact/partial/alternative/cross-referenced part numbers, Kiswahili synonyms, per-word typo tolerance, filters, sorting, pagination (24 tests).
- **BLOCKER (environment): drive C: is full (0 MB free).** The production build, test cache and git writes can fail. Last verified: type-check and lint clean, 71/72 tests passed (the 72nd was an out-of-date test, fixed but not re-run), production build NOT verified after the last changes.
- **Decision (owner, supersedes "real photos only"): list all parts now, add real photos later.** Migration 0012 removed the classification/price/photo checks on publishing. All 1,550 products were published with `scripts/publish-all.mjs` (audit-logged). The shop shows "No photo yet", "Not yet classified" and "Ask for price" (415 parts have no selling price) instead of guessing. **Image decision (owner, 2026-10-31): AI-generated reference images are shown on products with no label, generated in phases (home page parts, then best sellers, then all). Safeguard: after payment a real photo of the exact part is sent to the customer, who must approve before delivery.** Customers only ever see selling prices; buying prices and quantities stay staff-only. Production build NOT verified (build ran out of memory: disk almost full); type-check, lint and the database tests pass.
## Pending
- Phases 4–14 (see PROJECT_PLAN.md).
- shadcn/ui CLI not run; Button is a hand-written shadcn-style component (cva + tailwind-merge). Add shadcn components as needed (Phase 3/4).
- Kiswahili language switch (planned with i18n setup; Phase 1 UI is English only).
- Accessibility audit and Playwright tests (Phase 13); no automated tests exist yet.

## Known issues / caveats
- **No real product photography.** Products show "IMAGE REQUIRED". The flyer's product image looks AI-generated, so it is used only as a promo image, never attached to products. Real product photos must be supplied or licensed (Phase 6).
- Demo products (`src/lib/demo-data.ts`) have invented placeholder names, SKUs, prices, stock; all labelled DEMO. "Popular / Best Sellers / New Arrivals" tabs are just slices of demo data.
- Newsletter form is disabled (no email provider). Reviews section is an honest empty state.
- WhatsApp buttons fall back to /contact until `NEXT_PUBLIC_WHATSAPP_NUMBER` is set.
- Dev server (`npm run dev`) did not hydrate inside the in-app browser pane (HMR WebSocket issue); production build (`npm run build && npm run start`) hydrates and behaves correctly. Not investigated further.
- Gold-on-light text uses darker token `--accent-text`; full contrast audit still pending.

## Required credentials (none provided yet)
Supabase URL/anon/service-role keys; AI provider key; WhatsApp business number; payment provider credentials; catalog/image provider keys; Vercel account and domain. See `.env.example`.

## Owner decisions needed
1. Supabase project created (or guide me through setup)?
2. Business WhatsApp number, phone, email, shop address.
3. Source of product photos and hero photography.
4. Logo/brand assets, if any.
5. Preferred AI provider; payment providers with merchant accounts.

## Phase 3 notes and open items
- **Nobody is admin yet.** Register on the site, then ask to run `scripts/set-role.mjs <email> owner`.
- Email verification is off and password-reset email delivery is untested (shared Neon SMTP; no inbox available to the build). Enable verification + custom SMTP before launch.
- Admin pages other than Dashboard / Users / Audit logs are labelled placeholders in the sidebar.
- The `changeRole` server action was not exercised through the browser (database rules for it are tested).
- Neon Auth trusted domains: localhost allowed; add the production domain before launch.
- Dev note: `neon login` still fails here; Auth base URL was found by probing the endpoint (`NEON_AUTH_BASE_URL` in `.env.local`).

## Phase 2 notes and open items
- `neon login` (browser OAuth) failed with a CSRF cookie error in this environment, so `neon deploy` was **not** run. `neon init` was run and created `neon.ts` (auth: true) linked to project `sparkling-credit-27790994`; that project could not be verified and may not be the database actually in use. `neon.ts` is not committed. Decide whether to keep Neon CLI-managed config.
- A separate Neon project `brothers-auto-spare-parts` (damp-lab-13541393) was created earlier by mistake of scope; it is empty and unused. Delete it in the Neon console if not wanted.
- Neon Auth is provisioned in the database (`neon_auth` schema); wiring sign-up/login is Phase 3.
- File storage provider for product images is undecided (Phase 6).

## Test results (Phase 3)
- `npm test`: 47/47 pass (28 RLS/constraint tests, 5 profile-provisioning tests, phone normalization).
- `node --env-file=.env.local scripts/e2e-auth.mjs` against the running production build and real Neon Auth: 26/26 checks pass (redirects, sign-up, session restore, role provisioning, customer kept out of admin with no data leaked, staff vs admin access, wrong password rejected, sign-in, sign-out). Test users are deleted afterwards.
- Manual browser check: register, wrong-password message, sign-in to `/account`, profile save (invalid phone rejected, valid saved as +255…), sign-out, protected redirect.

## Test results (Phase 2)
- `npm test`: 28/28 database tests pass against Neon (RLS, column privileges, stock rules, photo-publish rules, order/payment constraints, audit immutability).
- `npm run build`: pass. `GET /api/health/db` on the running app: `{"ok":true,"role":"app_customer","categories":15,"visibleProducts":0}`.

## Test results (Phase 1)
- `npx tsc --noEmit`: pass. `npm run lint`: pass. `npm run build`: pass (47 static pages).
- Manual browser check on production build: homepage renders in light and dark; theme toggle works and persists across navigation; no console errors; no horizontal scroll at 375px; mobile menu opens as full-height drawer with theme toggle; product page renders.
- Not yet checked: every page visually in both themes, tablet width, keyboard-only navigation.

## Next actions
1. Promote the owner account (set-role script), then Phase 4: product CRUD, categories/brands, SKU and OEM numbers, stock movements UI, search/filter/sort.
2. Owner confirms WhatsApp number and photography plan.
