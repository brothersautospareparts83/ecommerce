# Brothers Auto Spare Parts

E-commerce and AI parts-intelligence platform for Brothers Auto Spare Parts, Kariakoo, Dar es Salaam, Tanzania. Currency TZS; languages English (default) and Kiswahili.

**Status:** Phase 1 (frontend foundation) complete. Catalog data is DEMO only; no backend yet. See [PROJECT_STATUS.md](PROJECT_STATUS.md).

## Stack
Next.js (App Router) · React · TypeScript · Tailwind · shadcn/ui · Supabase (Postgres, Auth, Storage, RLS) · Vercel.

## Documents
- [ARCHITECTURE.md](ARCHITECTURE.md) — design, adapters, data flows, security
- [PROJECT_PLAN.md](PROJECT_PLAN.md) — phases, integrations, risks
- [PROJECT_STATUS.md](PROJECT_STATUS.md) — live progress, blockers, next actions
- [CLAUDE.md](CLAUDE.md) — rules for AI-assisted development
- [.env.example](.env.example) — required configuration

## Getting started
```bash
npm install
cp .env.example .env.local
npm run build && npm run start
```
`npm run dev` also works in a normal browser.

## Integration honesty
Each external integration is reported as **operational**, **configured-but-untested**, or **awaiting credentials**. Nothing is claimed live until tested.
