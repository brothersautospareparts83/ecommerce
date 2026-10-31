# Architecture — Brothers Auto Spare Parts

## 1. Principles
- Real functionality only: no fake integrations, prices, stock, photos, reviews or catalog data. Demo data is labelled `DEMO`.
- Every external service sits behind an **adapter interface**; missing credentials degrade gracefully (clear setup message, manual fallback).
- Authorization is enforced twice: server-side checks in Next.js **and** Postgres Row Level Security.
- Service-role key is server-only (`import "server-only"`), never in client bundles.
- Money is stored as integer TZS. Prices/stock are re-validated server-side at order time.
- Every stock change writes an `inventory_movements` row (DB trigger/RPC, not app discipline alone).

## 2. Stack
| Layer | Choice | Notes |
|---|---|---|
| Web | Next.js (App Router), React, TypeScript | Server Components + Server Actions + Route Handlers |
| UI | Tailwind CSS, shadcn/ui, Lucide | Design tokens as CSS variables; light/dark |
| Data | Neon Postgres (`@neondatabase/serverless`) | SQL migrations in `db/migrations`, applied by `npm run db:migrate` |
| Auth | Neon Auth (Managed Better Auth, `neon_auth` schema) — Phase 3 | Roles in `profiles.role` + `roles` table; never client-assignable |
| Files | Neon Object Storage or S3-compatible store (decided in Phase 6, behind an adapter) | Buckets: product images (public read), imports (private), AI uploads (private) |
| Hosting | Vercel + Neon | Free tiers first |
| i18n | `next-intl` (en default, sw) | Locale prefix routing |
| Import | `exceljs`/`xlsx` + `papaparse`, `zod` | Parsing in server route; batch inserts |
| Images | `sharp` | WebP/AVIF, thumbnails, responsive sizes |
| Tests | Vitest (unit/integration), Playwright (e2e), pgTAP/SQL scripts for RLS | |

## 3. Directory structure (target)
```
/
├─ src/
│  ├─ app/
│  │  ├─ [locale]/(public)/        # home, shop, categories, product, finder, vehicles, ai, cart, checkout, track, about, contact, faq, legal
│  │  ├─ [locale]/(account)/       # login, register, dashboard, orders, quotations, wishlist
│  │  ├─ admin/                    # protected admin app (middleware + server role check)
│  │  └─ api/                      # webhooks (payments, whatsapp), import, ai, search
│  ├─ components/ (ui, layout, product, finder, admin, ai)
│  ├─ lib/
│  │  ├─ db/ (withDb: role-scoped transactions)
│  │  ├─ adapters/
│  │  │  ├─ catalog/   # CatalogProvider: vin decode, parts by vehicle, diagrams
│  │  │  ├─ images/    # ImageSourceProvider: find by part number
│  │  │  ├─ payments/  # PaymentProvider: initiate, verify, webhook, refund
│  │  │  ├─ ai/        # AIProvider: chat, vision, ocr
│  │  │  ├─ messaging/ # WhatsApp link builder / Business API
│  │  │  └─ email/
│  │  ├─ search/ import/ inventory/ pricing/ orders/ vin/ i18n/ validation/
│  ├─ messages/ (en.json, sw.json)
│  └─ types/
├─ db/migrations/ (SQL)   scripts/migrate.mjs
├─ tests/ (unit, integration, e2e)
├─ docs/ (guides)
└─ *.md
```

## 4. Adapter contracts (summary)
Each adapter exports `isConfigured(): boolean` and `describeRequirements()` so the admin Integration page can report **operational / configured-untested / awaiting credentials** truthfully.
- `CatalogProvider`: `decodeVin`, `listPartsForVehicle`, `getDiagram?`. Default `ManualCatalogProvider` reads our own DB (always available).
- `ImageSourceProvider`: `findByPartNumber(pn, brand?) → candidates{url, source, license, width, height, confidence}`. Candidates never auto-publish; they enter `image_verification_queue`.
- `PaymentProvider`: `initiate`, `verify`, `handleWebhook (signature-checked)`, `refund`. Default `ManualPaymentProvider` (admin-recorded cash / bank / mobile-money reference).
- `AIProvider`: `chat(tools)`, `vision`, `ocr`. AI gets **tools** (`search_products`, `get_compatibility`, `get_price`) so answers come from DB records; no tool result → no claim.

## 5. Key data flows
**Compatibility:** only rows in `vehicle_compatibility` (with `verified` flag + source) count as compatible. Unverified → shown as "needs confirmation" and offered for human escalation.
**Order:** cart (client) → server action recomputes prices/stock from DB → transactional RPC creates order + items + reserves/decrements stock + movements → order reference → optional WhatsApp message built from stored order.
**Import:** upload → store in `imports` bucket → parse + column detection (EN/SW synonyms) → validate (zod) → duplicate check (SKU/OEM) → preview (`import_job_rows`) → admin picks mode (add / update / prices only / stock only / skip) → batched apply → report CSV. No silent overwrite; images and stock untouched unless mode says so.
**Images:** import row → image adapters → candidates → `image_verification_queue` → admin approve/reject/replace/upload → `sharp` pipeline → Storage. Products without an approved image are `IMAGE REQUIRED` and not published as verified.
**Search:** Postgres `pg_trgm` + `tsvector` (english/simple), synonym table for Swahili/mechanic terms, exact+prefix OEM matching on normalized part numbers; designed so `pgvector` can be added later.

## 6. Security model
- Roles: `customer`, `mechanic`, `garage`, `dealer`, `fleet`, `wholesale` (customer types) and `staff`, `admin`, `owner` (admin roles). Admin role changes only via service role / owner action, audited.
- RLS: customers read/write only own rows (profiles, addresses, orders, quotations, wishlists, saved_vehicles, support_requests, ai_conversations). Cost price lives in an admin-only table/column view; never exposed to anon.
- Rate limiting on auth, search, AI, upload endpoints; file type/size validation; webhook signature verification; audit_logs for admin writes.

## 7. Theming
CSS variables from the owner's official brand (logo and flyer in `public/brand/`): black `#0A0C10`, orange `#F47B20`, silver `#C0C7D1`. This replaces the navy/gold palette in the original brief. Header, hero and footer stay black in both themes to match the logo artwork; page content switches between light (`#F4F5F7`) and dark (`#0A0C10`). Orange used as text on light backgrounds is darkened to `#C2410C` for contrast. Inline pre-hydration script sets `data-theme` from localStorage/system preference to prevent flash. Both themes verified for WCAG AA contrast.

## 8. Known constraints and decisions
- Licensed catalog data (VIN decode, diagrams, OEM images) requires commercial agreements; PartSouq data must not be scraped. Phase 7 ships a manual catalog + admin-verified compatibility; API providers are added only after license verification.
- Payments: no provider is claimed live until credentials exist and a successful sandbox test is recorded.
- **Database is Neon, not Supabase** (owner decision). Supabase-specific features are replaced: RLS uses Postgres roles `app_customer` / `app_staff` plus `app.user_id` session settings instead of `auth.uid()`; auth is Neon Auth; file storage is chosen in Phase 6.
