# Database schema

PostgreSQL 18 on Neon. Migrations: `db/migrations/*.sql`, applied in order by `npm run db:migrate` (tracked in `schema_migrations`). Money is integer TZS (`bigint`). Auth tables live in the separate `neon_auth` schema (Neon Auth, managed by Neon); `profiles.auth_user_id` links to them (Phase 3).

## Tables (public schema, 36 required + support tables)
| Area | Tables |
|---|---|
| Identity | `roles`, `profiles`, `customers`, `addresses` |
| Catalog | `categories`, `brands` (product makers), `manufacturers` (vehicle makers), `products`, `product_categories`, `product_images`, `oem_part_numbers`, `part_cross_references` |
| Vehicles | `vehicle_models`, `vehicle_generations`, `vehicle_engines`, `vehicles`, `vehicle_chassis`, `vehicle_compatibility` |
| Stock | `inventory`, `inventory_movements` |
| Commerce | `orders`, `order_items`, `payments`, `quotations`, `quotation_items`, `wishlists`, `saved_vehicles` |
| Operations | `import_jobs`, `import_job_rows`, `image_verification_queue`, `support_requests`, `notifications`, `audit_logs`, `integration_settings` |
| AI | `ai_conversations`, `ai_messages` |
| Extras | `order_status_history`, `search_synonyms`, `search_queries`, `schema_migrations` |

## Rules enforced inside the database
- **Stock:** `inventory.quantity_on_hand` changes only through an `inventory_movements` insert (trigger); negative stock is rejected; movements and audit logs are append-only.
- **Photography:** a product cannot be `published` without an approved, non-`illustrative` photo (`IMAGE REQUIRED`); an `illustrative` image can never be approved; rejecting the last approved photo drops a published product to `image_required`.
- **Compatibility:** customers only ever see `vehicle_compatibility` rows with `verified = true`.
- **Orders:** totals must satisfy `total = subtotal - discount + delivery fee`; line totals equal price × quantity; status changes are written to `order_status_history`; phones must be `+255XXXXXXXXX`.
- **Payments:** `paid` requires `verified_at`; `(provider, provider_reference)` is unique for webhook idempotency.
- **Part numbers:** normalized (upper-case alphanumerics) and unique per product; indexed for exact and prefix search.
- **Roles:** only an `admin`/`owner` session can change `profiles.role`.

## Access model
The app connects as the database owner and runs each request in a transaction under `SET LOCAL ROLE`:
- `app_customer` (visitors and customers): published products only, **no access to `cost_price_tzs`** (column privileges), verified compatibility, own orders/profile/addresses/wishlist/quotations only.
- `app_staff`: full access except quantity edits, audit-log and movement changes.
Identity is passed with `set_config('app.user_id' | 'app.user_role', ..., true)`. See `src/lib/db/index.ts` (`withDb`).

## Seeded reference data (no products, prices or stock)
4 roles; 15 categories; 14 vehicle makers; 3 Swahili search synonyms; integration status rows (all external providers `awaiting_credentials`).

## Tests
`npm test` runs 28 tests in `tests/db/rls.test.ts` against the real database; each test runs in a rolled-back transaction.
