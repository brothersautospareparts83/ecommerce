# PROJECT_STATUS

**Last updated:** 2026-10-31
**Current phase:** Phase 1 complete (with caveats below) → next: Phase 2 (Supabase and database)

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

## Pending
- Phases 2–14 (see PROJECT_PLAN.md).
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

## Test results (Phase 1)
- `npx tsc --noEmit`: pass. `npm run lint`: pass. `npm run build`: pass (47 static pages).
- Manual browser check on production build: homepage renders in light and dark; theme toggle works and persists across navigation; no console errors; no horizontal scroll at 375px; mobile menu opens as full-height drawer with theme toggle; product page renders.
- Not yet checked: every page visually in both themes, tablet width, keyboard-only navigation.

## Next actions
1. Phase 2: create Supabase project, add `supabase/migrations` for all 36 entities, RLS, storage buckets, RLS tests.
2. Owner supplies contact details and photography plan.
