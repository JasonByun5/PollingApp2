# Pollify

Internal polling tool for creating, sharing, and collecting feedback — including image-based and multi-type polls.

**Live demo:** [http://pollify-12.vercel.app/](http://pollify-12.vercel.app/)

<!-- SCREENSHOT: hero / landing or dashboard overview
     Suggested file: docs/screenshots/01-overview.png
     Tip: show the logged-in dashboard with a few polls, desktop width -->
![Overview — add screenshot](docs/screenshots/01-overview.png)

## Origin

Pollify started during my first internship at a new private equity firm. A team of ~20 interns built it as the firm’s first software product — partly to learn how to ship together, and partly as a real tool for voting on product features and gathering customer feedback.

The initial build was collaborative. Ownership of the codebase has since moved to me: I maintain it, fix real issues, and keep hardening it as a practice product (auth, API safety, UX, tests, and CI).

I am careful not to overclaim: this began as a team internship project. What I own today is the continued engineering — turning an early internal tool into something I’d be comfortable putting in front of recruiters and using as a sandbox for production-minded habits.

## What it does

- Create polls (custom text, image options, yes/no/maybe, ranked, multi-select)
- Share a public link so teammates or customers can vote without an admin account
- Monitor results from a personal dashboard
- Auth-gated create/delete with author checks on the API

<!-- SCREENSHOT: create-poll flow
     Suggested file: docs/screenshots/02-create.png
     Tip: show the create form with options / image upload if possible -->
![Create poll — add screenshot](docs/screenshots/02-create.png)

<!-- SCREENSHOT: public voting page
     Suggested file: docs/screenshots/03-vote.png
     Tip: show a filled poll from a voter’s perspective -->
![Public vote — add screenshot](docs/screenshots/03-vote.png)

<!-- SCREENSHOT: results / dashboard detail
     Suggested file: docs/screenshots/04-results.png
     Tip: show results or a single poll’s management view -->
![Results — add screenshot](docs/screenshots/04-results.png)

## What I’ve improved since taking ownership

Work that shows up in the recent history of this repo:

- **Auth & authorization** — auth gate for protected flows; create/delete no longer public; author-based deletion and route-level checks
- **API robustness** — form validation and type constraints at the route layer; image upload size limits; safer error redirects
- **Correctness & UX** — race-condition fix on poll creation; pagination; empty states; loading skeletons; mobile-friendly layout; theme toggle
- **Engineering practice** — Vitest unit tests for validation/uploads; Playwright smoke e2e; GitHub Actions CI (lint, typecheck, unit tests, build) on PRs

## Tech stack

| Layer | Choice |
|-------|--------|
| App | Next.js (App Router), React, TypeScript, Tailwind |
| Backend / data | Supabase (Auth, Postgres, Storage) |
| Deploy | Vercel |
| Quality | ESLint, `tsc`, Vitest, Playwright, GitHub Actions |

## Architecture (high level)

```
Browser
  → Next.js pages (app/, auth, public vote)
  → API routes (app/api/…) with validation + session checks
  → Supabase (Auth, Postgres, poll-images storage)
```

**Folder rule of thumb:** UI in `components/…` by feature; domain logic (types, validation, DB, uploads) in `lib/…`; `app/` stays focused on pages and API wiring.

```
app/                  # Routes only (Next.js App Router)
  (app)/              # Logged-in pages: create, dashboard
  (auth)/             # Login, sign-up, password flows
  (public)/           # Public vote pages
  api/                # HTTP API routes

components/
  auth/               # Auth UI (forms, gate, buttons)
  layout/             # Shell UI (header, page-shell)
  polls/              # Poll-specific UI (header, voting/)
  shared/             # Empty states, skeletons
  ui/                 # Low-level primitives (shadcn)

lib/
  polls/              # Types, validation, DB helpers, uploads
  supabase/           # Clients + session helper

hooks/                # React hooks
e2e/                  # Playwright tests
```

## Design notes (tradeoffs)

- **Supabase over a custom backend** — Auth, Postgres, and storage in one place so a small team (and later a solo maintainer) could ship without standing up separate services.
- **Validation at the route layer** — Keep domain rules close to the API so bad clients can’t bypass the UI.
- **Public vote links, private management** — Anyone with the link can vote; create/delete and dashboard stay behind auth and author checks.

## Run locally

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20+ recommended)
- npm
- A [Supabase](https://supabase.com/) project

### 1. Clone and install

```bash
git clone <your-repo-url>
cd pollify
npm install
```

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com/).
2. In **Project Settings → API**, copy:
   - Project URL
   - `anon` / publishable key
   - `service_role` key (keep this secret)

### 3. Environment variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

`.env.local` is gitignored — do not commit these keys.

### 4. Database

In the Supabase SQL Editor, run:

```sql
create table polls (
  id uuid primary key default gen_random_uuid(),
  poll_id integer unique not null,
  author text not null,
  title text not null,
  description text,
  type text not null,
  created_at timestamptz default now()
);

create table poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id integer not null references polls(poll_id) on delete cascade,
  title text not null,
  description text,
  vote_count integer default 0,
  yes_votes integer default 0,
  no_votes integer default 0,
  maybe_votes integer default 0,
  image_url text default '',
  created_at timestamptz default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  poll_id integer not null references polls(poll_id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  user_id text not null,
  vote_type text,
  created_at timestamptz default now()
);
```

### 5. Storage for poll images

1. In Supabase → **Storage**, create a public bucket named `poll-images`.

### 6. Auth redirect URLs

In **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**`

### 7. Start

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright e2e (needs env / running app) |

### Tests

- **Unit (Vitest):** `npm test` — create-poll validation and image upload checks; runs in CI.
- **E2E (Playwright):** with the app running (and `.env.local` set), `npm run test:e2e`. Or `PLAYWRIGHT_BASE_URL=https://… npm run test:e2e`. Without those, e2e skips so CI stays green without secrets.

### CI

On push/PR to `main`/`master`, GitHub Actions runs lint → typecheck → unit tests → build.

## Screenshots checklist

Drop images into `docs/screenshots/` (create the folder if needed) using these names, or update the paths above:

| File | What to capture |
|------|-----------------|
| `01-overview.png` | Dashboard / home with polls listed |
| `02-create.png` | Create-poll form |
| `03-vote.png` | Public voting page |
| `04-results.png` | Results or poll detail |
| *(optional)* `05-mobile.png` | Same flow on a phone-width viewport |

Until those files exist, GitHub will show broken image icons — that’s expected.

## Next on the roadmap

Engineering next (not vaporware feature ideas):

- Docker / Compose for a reproducible local environment
- Versioned DB migrations (and RLS) instead of README SQL
- Stronger authz tests and optional e2e in CI
- Health check + tighter API error shape

## Feedback

Issues and PRs welcome — especially bug reports from anyone trying the demo or local setup.
