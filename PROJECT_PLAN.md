# Project Plan — Brothers Auto Spare Parts

Phases run in order. Each ends with: tests passing, docs updated, completion report, blockers listed, `PROJECT_STATUS.md` updated.

| Phase | Scope | Exit criteria | External dependency |
|---|---|---|---|
| 0 | Discovery, architecture, plan, docs | Docs exist, env checked | none |
| 1 | Next.js + Tailwind + shadcn, design system, themes, nav/footer, homepage, category/product layouts | Both themes work, responsive, no console errors | none (real photos must be supplied/licensed) |
| 2 | Supabase project, migrations (36 entities), indexes, RLS, buckets | Migrations apply; RLS tests pass | Supabase project + keys |
| 3 | Auth, roles, admin shell, customer dashboard, audit log | Customers blocked from admin; own-data only | Supabase Auth |
| 4 | Product CRUD, categories, brands, SKU/OEM, inventory + movements, search/filter/sort | Admin manages products; movements recorded | — |
| 5 | XLSX/CSV import with preview, dedupe, modes, reports | Multi-row import; no silent overwrite | — |
| 6 | Image engine: adapters, review queue, upload, sharp pipeline, gallery | No unverified image auto-published | Image source licenses/APIs |
| 7 | Vehicle catalog, VIN validation, OEM + cross-refs, compatibility, finder, adapters | Manual search works without API keys | Licensed catalog API (optional) |
| 8 | AI Parts Expert (EN/SW), tools over real inventory, vision/OCR, quotes, support, usage limits | AI never invents stock/price; setup message w/o key | AI provider key |
| 9 | Cart, checkout, server price validation, orders, tracking | Secure totals; unavailable items rejected | — |
| 10 | WhatsApp ordering, payment adapters, webhooks, manual payments | Payment only "paid" after verification | WhatsApp number; payment credentials |
| 11 | Garage/wholesale accounts, price lists, bulk quotes, repeat orders | Discounts follow admin rules | — |
| 12 | Business intelligence + reports | Metrics from real records | — |
| 13 | SEO, a11y, security, test sweep, perf, prod build | No critical issues | — |
| 14 | Vercel/Supabase prod, domain, backups, monitoring, admin guide | Production URL verified | Vercel, domain, Supabase prod |

## Phase 0 checklist
- [x] Inspect environment and tools
- [x] Check existing files (workspace empty)
- [x] Architecture document
- [x] Project plan + checklist
- [x] Integration/credential requirements (`.env.example`, below)
- [x] README, CLAUDE.md, PROJECT_STATUS.md
- [ ] Decide project folder (workspace currently a temporary session folder)
- [ ] Owner decisions listed in PROJECT_STATUS.md

## Documents to be created in later phases
DATABASE_SCHEMA.md (P2), SECURITY.md (P3/P13), API_DOCUMENTATION.md (P4+), IMPORT_GUIDE.md (P5), AUTOMOTIVE_CATALOG_GUIDE.md (P7), AI_INTEGRATION_GUIDE.md (P8), ADMIN_GUIDE.md and DEPLOYMENT.md (P14).

## Integration requirements
| Integration | Needed for | Cost | Credentials | Status |
|---|---|---|---|---|
| Supabase | DB, auth, storage | Free tier OK to start | project URL, anon key, service-role key | awaiting credentials |
| Vercel | hosting | Free hobby tier (commercial use may need Pro) | account | awaiting |
| AI provider (e.g. Anthropic) | AI Parts Expert | Paid per use | API key | awaiting |
| Automotive catalog API (VIN, diagrams) | VIN decode, exploded views | Paid/licensed | API key + license | awaiting; manual catalog fallback |
| Product image source | image discovery | varies by license | API key / supplier agreement | awaiting; manual upload fallback |
| WhatsApp | ordering | `wa.me` links free; Business API paid | business number | number needed from owner |
| Payments (M-Pesa, Airtel, Tigo, bank) | online payment | per-transaction fees | merchant credentials | awaiting; manual workflow |
| Email (e.g. Resend) | order emails | free tier | API key | optional |
| Analytics / Search Console | marketing | free | IDs | optional |

## Risks
- Photography rule (every published part has a verified real photo) depends on licensed sources or the owner's own photos; plan assumes a manual-upload path is always available.
- VIN decode/diagrams cannot be built without a licensed provider; manual path is the guaranteed baseline.
- Scope is large; phases will be delivered incrementally across sessions using `PROJECT_STATUS.md`.
