# data Guide

Site content lives in small per-section JSON files under `app/data/`,
one file per section for easy management. They are the single source of
truth: the homepage, the `/resume` page, the downloadable resume files,
and the SEO tags are all generated from them. Edit a file, rebuild
(`npm run build`), and everything updates together.

A ready to fill in copy is at `app/data/template_data.json`. To use it:

```bash
cp app/data/template_data.json app/data/data.json
```

Then search for `SAMPLE` and `yourhandle` / `you@example.com` and replace
them with real content. Delete any `SAMPLE` entries you do not need.
Copy each top level section from the template into its matching file
under `app/data/` (e.g. the template's `"projects"` array goes into
`app/data/projects.json`).

> Plain JSON has no comments, so keep every file comment free and
> validate after editing, e.g.:
> `for f in app/data/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" && echo "OK $f"; done`.
> A rebuild also catches mistakes, since the site is prerendered (SSG).

## Files

| File                      | Key            | Required | What it drives                                              |
| ------------------------- | -------------- | -------- | ----------------------------------------------------------- |
| `app/data/profile.json`      | `profile`      | yes      | Hero, About, Contact, footer, resume, SEO tags              |
| `app/data/codeProfiles.json` | `codeProfiles` | yes      | Navbar forge dropdown (GitHub, Codeberg, …)                 |
| `app/data/socials.json`      | `socials`      | yes      | Extra contact icons (Instagram, Discord, …). May be `[]`. See below |
| `app/data/skills.json`       | `skills`       | yes      | Skills grid (4 fixed groups)                                |
| `app/data/experience.json`   | `experience`   | yes      | Journey section; may be `[]` (see below)                    |
| `app/data/education.json`    | `education`    | yes      | Journey section                                             |
| `app/data/projects.json`     | `projects`     | yes      | Projects grid, cards, modals, resume                        |
| `app/data/designs.json`      | `designs`      | yes      | Designs section; may be `[]` (see below)                    |
| `app/data/blogs.json`        | `blogs`        | yes      | Blog index + posts; may be `[]`. Bodies live in `app/content/blog/*.md` |

All sections are combined in `app/data/portfolio.ts`, which exports
only types and utility helpers. **Content is now read from the database**
via server functions (`app/lib/content.ts`). The root route loader
fetches all data and passes it to components. You never need to edit
`portfolio.ts` to change content — use the admin panel or edit the
JSON files and re-import.

## profile (`profile.json`)

| Field       | Type   | Notes                                                        |
| ----------- | ------ | ------------------------------------------------------------ |
| `firstName` | string | Hero line 1 (slides in from the left)                        |
| `lastName`  | string | Hero line 2 (outlined, slides in from the right)             |
| `title`     | string | Role shown in hero, tab title, SEO, resume                   |
| `location`  | string | Shown in hero, About, footer                                 |
| `bio`       | string | 2 to 4 sentences. About section + resume + meta description. Plain words, no dashes. |

Contact details (email, LinkedIn, GitHub, …) live in
`app/data/socials.json`, not in the profile.

## codeProfiles (`codeProfiles.json`)

Navbar forge menu. Each entry: `{ "id", "label", "url" }`.

- One entry with a URL renders as a plain `Label ↗` link.
- Several entries render a `Source ↓` picker dropdown.
- An entry with `"url": ""` is hidden (useful as a placeholder until
  you have the link). `id` must be unique.

## socials (`socials.json`)

Contact icons, including Email, LinkedIn, and GitHub (they live here,
not in the profile). Each entry:
`{ "id", "label", "url", "icon", "hide" }`.

```json
{ "id": "instagram", "label": "Instagram", "url": "https://instagram.com/yourhandle", "icon": "instagram", "hide": false }
```

- `"hide": true` keeps the entry stored in `data.json` but hides it
  from the site. Flip to `false` (with a filled `url`) to show it.
- An entry with `"url": ""` is always hidden, even with `"hide": false`.
- `id` must be unique. `label` is the tooltip + screen reader text.
- `icon` picks the glyph (case insensitive). Supported keys:

  `instagram`, `discord`, `reddit`, `facebook`, `twitter` (X mark),
  `mastodon`, `bluesky`, `steam`, `xbox`, `playstation`, `twitch`,
  `youtube`, `telegram`, `github`, `linkedin`, `mail`, `globe`

  Any other value falls back to the generic globe icon, so custom
  entries like `{ "id": "blog", "label": "Blog", "url": "https://…",
  "icon": "globe", "hide": false }` work without code changes.

## skills (`skills.json`)

Exactly four fixed groups, each a string array. Counts render as
`05`, `07`, … automatically:

```json
"skills": {
  "languages": ["Python", "JavaScript"],
  "frameworks": ["React.js", "Django"],
  "tools": ["Figma", "Git"],
  "traits": ["RESTful APIs"]
}
```

## experience (`experience.json`)

Empty array `[]` is valid: the Journey section then shows education
only, plus a short availability note. Add entries to switch it to
`Experience & Education` mode.

| Field          | Type   | Required | Notes                        |
| -------------- | ------ | -------- | ---------------------------- |
| `role`         | string | yes      | Job title                    |
| `organization` | string | yes      | Company / studio             |
| `location`     | string | no       | Omit the key or use `""` to hide it |
| `period`       | string | yes      | Free text, e.g. `"Jun 2025 to Sep 2025"` |
| `summary`      | string | yes      | One or two sentences. Also printed in the resume files |

## education (`education.json`)

| Field         | Type   | Required | Notes                                              |
| ------------- | ------ | -------- | -------------------------------------------------- |
| `institution` | string | yes      | School / college                                   |
| `location`    | string | yes      | City, Country                                      |
| `degree`      | string | yes      | Program name                                       |
| `expected`    | string | *        | For ongoing study, e.g. `"Dec 2027"`               |
| `completed`   | string | *        | For finished study, e.g. `"June 2023"`             |

\* Use exactly one of `expected` / `completed` per entry.

## projects (`projects.json`)

| Field        | Type     | Required | Notes                                                        |
| ------------ | -------- | -------- | ------------------------------------------------------------ |
| `id`         | string   | yes      | Unique slug, e.g. `"kazumi"`                                 |
| `title`      | string   | yes      | Card + modal heading                                         |
| `date`       | string   | yes      | Free text, e.g. `"May 2026"`                                 |
| `summary`    | string   | yes      | One sentence on the card                                     |
| `motivation` | string   | yes      | Modal body under “Why it was built”                          |
| `image`      | string   | no       | Path relative to `public/`, e.g. `"assets/kazumi-mockup.svg"`. Omit or use `""` and the card + modal show a template thumbnail with the title initial instead |
| `chips`      | string[] | yes      | Tech pills on card + modal                                   |
| `sources`    | array    | yes      | `{ "label", "url" }` entries. One → direct `Label ↗` link; several → `Source ↓` dropdown; `[]` → no source button |
| `liveUrl`    | string   | yes      | Full URL, or `""` → card omits it and the modal shows a disabled “Website soon” pill |
| `hideFromPage` | boolean | no      | `true` hides the project from the homepage grid (it still appears in the resume). Omit or `false` to show it |
| `hideFromResume` | boolean | no    | `true` hides the project from the resume page + PDF/DOCX (it still appears in the homepage grid). Omit or `false` to show it |

Put images in `public/assets/` and reference them as
`"assets/your-file.svg"`. SVG, JPG, and PNG all work.

## designs (`designs.json`)

Same shape as projects, except `motivation` is called `description`
(shown under “About this design”) and `chips` is called `tags`.
Extra field:

| Field   | Type  | Notes                                                              |
| ------- | ----- | ------------------------------------------------------------------ |
| `files` | array | `{ "label", "url" }` design file links (Figma, Penpot). One → direct link; several → `Files ↓` dropdown; `[]` → hidden. Shown in its own “Design files” modal region. |

**Empty array hides everything:** `"designs": []` removes the section
and its navbar + footer links automatically.

## blogs (`blogs.json` + `app/content/blog/*.md`)

Each entry points at a Markdown file holding the post body:

| Field     | Type    | Required | Notes                                                        |
| --------- | ------- | -------- | ------------------------------------------------------------ |
| `id`      | string  | yes      | Unique slug, also the URL: `/blog/<id>`                      |
| `title`   | string  | yes      | List heading + post `<h1>` + tab title                       |
| `author`  | string  | yes      | Shown under the title as “By …”                              |
| `date`    | string  | yes      | Free text, e.g. `"September 2026"`                           |
| `excerpt` | string  | yes      | One or two sentences on the list + post meta description     |
| `file`    | string  | yes      | Markdown filename inside `app/content/blog/`, e.g. `"hello-world.md"` |
| `hide`    | boolean | no       | `true` hides the post from the list, direct URL, sitemap, and nav links. Omit or `false` to publish it |

To publish a post: add `app/content/blog/<slug>.md` (standard Markdown:
headings, lists, quotes, inline code, fenced code blocks, links,
images) and append its entry to `blogs.json`. An empty array is valid:
`/blog` then shows a “no posts yet” note and the nav/footer links
disappear automatically. Rebuild to prerender new pages.

## Database + admin panel (production mode)

Content lives in a real database (SQLite or MariaDB), managed from
an admin UI — all inside this one TanStack Start codebase, no
separate server. **All pages read from the database**, so admin
edits take effect instantly without rebuilding.

| File                     | Purpose                                                  |
| ------------------------ | -------------------------------------------------------- |
| `app/lib/db/types.ts`    | Driver contract + per-collection rules (columns, JSON/bool fields, required fields) |
| `app/lib/db/schema.ts`   | `CREATE TABLE` statements for SQLite and MariaDB         |
| `app/lib/db/sqlite.ts`   | `better-sqlite3` driver                                  |
| `app/lib/db/mariadb.ts`  | `mysql2` connection-pool driver                          |
| `app/lib/db/index.ts`    | Driver factory (picks by `DB_DRIVER`) + lazy init        |
| `app/lib/db/config.ts`   | Env loading (server-side only, never sent to the client) |
| `app/lib/admin.ts`       | CRUD + seed + password gate, as server functions         |
| `app/routes/admin.tsx`   | The `/admin` UI (login, tables, editor, JSON import)     |

Nested values (skill lists, chips, sources, …) are stored as JSON text
and booleans as `0`/`1` on both drivers, so rows read back identically.

**Setup** (copy `.env.example` to `.env` first):

| Variable           | Meaning                                              |
| ------------------ | ---------------------------------------------------- |
| `ADMIN_PASSWORD`   | Password for `/admin` and every mutation. Empty = everything locked |
| `DB_DRIVER`        | `sqlite` (default) or `mariadb`                      |
| `SQLITE_PATH`      | SQLite file, relative to project root (default `./data/portfolio.db`) |
| `MARIADB_HOST` / `MARIADB_PORT` / `MARIADB_USER` / `MARIADB_PASSWORD` / `MARIADB_DATABASE` | MariaDB connection (database must exist; tables are created) |

```bash
npm run dev   # http://localhost:3000/admin
```

Unlock with `ADMIN_PASSWORD`, then **Import from JSON** once to copy
`app/data/*.json` (+ blog Markdown) into empty tables. Re-importing is
safe — non-empty tables are skipped. Afterwards add, edit (merge-patch),
and delete rows per collection; `profile`/`skills` are edited whole.

**Important limits:**

- Dynamic features only run while the TanStack Start **node server**
  is running (`npm run dev`, or a Node deployment). The static files
  in `dist/client` served from a plain static host cannot execute
  server functions — `/admin` there only shows the locked login gate.
- The password gate is minimal protection for local use. Do not expose
  a running instance publicly without putting real auth (or IP rules)
  in front of it. The page is `noindex` and excluded from the sitemap.
- For cloud deployments (Vercel, Netlify, Cloudflare Workers) you
  need an external database (Turso, PlanetScale, or D1). See DEPLOY.md
  for platform-specific instructions.
- MariaDB support is code-complete but only exercised against SQLite
  here — point it at a real server and import to verify your instance.
