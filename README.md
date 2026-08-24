# MiST Café & Lounge — Digital Menu ☕

A mobile-first digital menu and table-ordering experience for MiST Café & Lounge, Eskişehir.
Built as an Apple-inspired **"Liquid Glass"** progressive web app, backed by an ASP.NET Core
service with live order and service-call events.

## Status

Pass 1 (in progress): design system, TypeScript migration, unified menu data, the customer
app, and the backend it talks to. Admin KDS, POS analytics, the menu CMS and the QR manager
land in pass 2 — the entities, hubs and API surface are already shaped for them.

## Tech stack

**Frontend** — Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Motion ·
Radix UI primitives · Lucide icons · Zustand · Fuse.js

**Backend** — ASP.NET Core 10 (Clean Architecture + CQRS) · Entity Framework Core · PostgreSQL ·
Redis · SignalR

## The menu

31 categories across 6 groups — breakfast, mains, desserts, hot drinks, cold drinks and hookah —
totalling 251 items, each with Turkish and English name and description. The canonical dataset
lives in `data/menu.source.json` and is consumed by **both** the frontend and the database
seeder, so mock data and production data cannot drift apart.

## Getting started

```bash
npm install
npm run dev            # http://localhost:3000 — redirects to /tr
```

The frontend runs standalone with no backend: with `NEXT_PUBLIC_API_URL` unset it reads the
static menu and simulates order state locally. Point it at a running API to go live:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5080 npm run dev
```

### Backend

```bash
docker compose up -d                                   # postgres + redis
dotnet ef database update -p backend/src/Mist.Infrastructure -s backend/src/Mist.Api
dotnet run --project backend/src/Mist.Api -- seed
dotnet run --project backend/src/Mist.Api              # http://localhost:5080
```

## Project structure

```
src/app/[lang]/       Localized routes (tr | en)
src/components/       glass · layout · menu · tray · actions · system
src/lib/              api adapters · i18n · search · formatting
src/stores/           Zustand: cart, table, ui
data/                 menu.source.json · photo-manifest.json
scripts/              One-shot data codemods, retained for auditability
backend/src/          Mist.Domain · Mist.Application · Mist.Infrastructure · Mist.Api
```

## Localization

Turkish is the default locale; `/en` serves English. Both the UI strings and the full menu are
translated. Note that Turkish casing is handled explicitly — `"İ".toLowerCase()` produces
`i` + U+0307 rather than `i`, which silently breaks naive search. See `src/lib/i18n/fold.ts`.

## Photography

Item and category imagery is MiST's own photography, catalogued in `data/photo-manifest.json`;
categories without a house photo fall back to licensed stock. Allergen and calorie information
is **not** present in the source data and is never fabricated — badges render only where real
values exist.
