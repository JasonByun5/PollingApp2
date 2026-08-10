# Pollify

Pollify is a web app for creating, sharing, and monitoring polls — including custom and image-based polls.

Live demo: [http://pollify-12.vercel.app/](http://pollify-12.vercel.app/)

## Features

- Create custom polls (including image-based polls)
- Share polls via link
- Monitor poll results in real time
- Simple, clean UI

## Tech Stack

- Next.js
- Supabase (database + authentication + storage)
- Vercel (deployment)

## Run locally

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20+ recommended)
- npm (comes with Node)
- A [Supabase](https://supabase.com/) project

### 1. Clone and install

```bash
git clone <your-repo-url>
cd pollify
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com/) and create a project.
2. In **Project Settings → API**, copy:
   - Project URL
   - `anon` / publishable key
   - `service_role` key (keep this secret)

### 3. Set environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

`.env.local` is gitignored — do not commit these keys.

### 4. Set up the database

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

### 5. Create storage for poll images

1. In Supabase, open **Storage**.
2. Create a public bucket named `poll-images`.

### 6. Configure auth redirect URLs

In **Authentication → URL Configuration**, add:

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**`

### 7. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Start local dev server   |
| `npm run build` | Create production build  |
| `npm run start` | Run production server    |
| `npm run lint`  | Run ESLint               |

## Future Improvements

- Additional poll types (ranked choice, weighted voting)
- Enhanced analytics and result breakdowns
- Improved sharing and embeds

## Feedback

Feel free to open an issue or reach out with ideas, feature requests, or bug reports.
