# Shreyan Parajuli — Portfolio

Modern, high-performance, SEO-optimized personal portfolio built with
**TanStack Start** (React + Vite). Content lives in a database
(SQLite or MariaDB) and is managed through a built-in admin panel.

## Tech

- TanStack Start with file-based routing (`app/routes/`)
- Tailwind CSS v4 (`@tailwindcss/vite`) with `@theme` design tokens
  (ink/line/mist/fog colors, Poppins/Nunito/Anton fonts, float/rotate
  animations); bespoke components live in `@layer components`
  so utilities always win
- Dark mode by default with a light mode toggle (persisted, applied
  before paint, `theme-color` synced)
- **Database-backed content** — SQLite (default) or MariaDB, auto-seeded
  from `app/data/*.json` on first run; admin panel for live CRUD
- Static prerendering (SSG) — `prerender: { enabled: true, crawlLinks: true }`
  in `app.config.ts`; `vite build` emits crawler-ready HTML into `dist/client`
- Relative asset paths — a post-build step (`scripts/relativize-assets.mjs`)
  rewrites `/assets/...` to `./assets/...`
- SEO via route `head()` (title, description, Open Graph, Twitter Cards) plus
  a JSON-LD `Person` schema and auto-generated sitemap

## Quick Start

```bash
npm install
cp .env.example .env    # set ADMIN_PASSWORD
npm run dev              # http://localhost:3000
```

Open `/admin`, enter your password, and click **Import from JSON** to seed
the database. All pages read from the database, so admin edits are instant.

## Customize

- **Admin panel** (`/admin`): Add, edit, and delete all content. Changes
  take effect immediately — no rebuild needed.
- **JSON files** (`app/data/*.json`): Edit directly and re-import via admin,
  or as seed data for fresh deployments.
- `/resume` is rendered from the database; `npm run build` regenerates
  `public/resume.pdf` + `public/resume.docx` (`scripts/build-resume.mjs`)
  so the downloads always match the site.
- `/design-system` documents the tokens and components. It is `noindex`.
- Blog posts: Add Markdown files to `app/content/blog/` and create entries
  in the blogs collection via admin.

## Deployment

See [DEPLOY.md](DEPLOY.md) for platform-specific guides:
- **Railway** (recommended — easiest)
- **Render** (persistent disk)
- **VPS / cPanel** (full control)
- **Vercel / Netlify** (serverless — requires Turso or PlanetScale)
- **Cloudflare Workers** (advanced — requires D1)
