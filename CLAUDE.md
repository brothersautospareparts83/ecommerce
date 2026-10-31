# Project instructions — Brothers Auto Spare Parts

Read `PROJECT_STATUS.md` first; resume from it. Follow `PROJECT_PLAN.md` phases in order; don't rebuild completed phases.

## Hard rules
- Never invent prices, stock, part numbers, vehicle specs, compatibility, reviews, statistics or product photos. Demo data must be labelled DEMO.
- Never present aftermarket as genuine OEM. Owner decision 2026-10-31 (supersedes the old "no AI images as product photos" rule): AI-generated reference images may be shown on products without a label, as a stand-in until real photos exist. Safeguard: before delivery the customer is sent a real photo of their exact part and must approve it. Never use an AI image to claim a specific brand, part number or vehicle fit.
- No fake integrations. Build adapters, document env vars, report status as operational / configured-untested / awaiting credentials.
- Service-role key is server-only. Enforce auth server-side and with RLS. Customers can never set their own role.
- Every stock change writes an `inventory_movements` row. Never silently overwrite business data; imports preview first.
- Money = integer TZS, formatted `TSh 85,000`. Validate prices/stock server-side.
- All schema changes via migrations in `supabase/migrations`.

## Conventions
TypeScript strict; reusable components; Tailwind with CSS-variable design tokens; zod for validation; Vitest for unit/integration, Playwright for e2e. Update docs and PROJECT_STATUS.md at the end of each phase.
