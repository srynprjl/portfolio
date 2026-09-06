# Deployment Guide

This portfolio runs on **TanStack Start** — a full-stack React framework that can deploy as a Node.js server (with a database) or as a static site (SSG). The backend (admin panel, API, CRUD operations) **requires a running Node.js server** with database access.

## Architecture Overview

```
Frontend (React components)
    ↓ reads from
Root Loader → getSiteContent() → Database (SQLite or MariaDB)
    ↑ writes to
Admin Panel → Server Functions → Database
```

- **All pages** read content from the database via server functions
- **Admin panel** (`/admin`) writes content to the database
- **Edits are instant** — no rebuild needed after admin changes (just refresh)
- The database auto-seeds from `app/data/*.json` on first run

---

## Platform-Specific Guides

### 1. Railway (Recommended — Easiest)

Railway supports Node.js with persistent storage, making it ideal for SQLite.

**Steps:**

1. **Push your code to GitHub**

2. **Create a Railway project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Set environment variables** in Railway dashboard:
   ```
   ADMIN_PASSWORD=your-secure-password-here
   DB_DRIVER=sqlite
   SQLITE_PATH=./data/portfolio.db
   ```

4. **Add a volume** (persistent storage for SQLite):
   - In Railway dashboard, go to your service → "Settings" → "Volumes"
   - Add a volume mounted at `/data`
   - This ensures your database persists across deploys

5. **Configure build and start commands:**
   - Build: `npm install && npm run build`
   - Start: `node dist/server/server.js`

6. **Set the port:**
   Railway sets `PORT` automatically. The server listens on it.

**That's it.** Railway handles everything. Your site will be at `https://your-project.up.railway.app`.

**Custom domain:** Go to Settings → Networking → Custom Domain.

---

### 2. Render

Render supports Node.js web services with persistent disks.

**Steps:**

1. **Push to GitHub**

2. **Create a Render service:**
   - Go to [render.com](https://render.com)
   - "New" → "Web Service"
   - Connect your GitHub repo

3. **Configure:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/server/server.js`
   - **Node Version:** 20 or later

4. **Set environment variables:**
   ```
   ADMIN_PASSWORD=your-secure-password-here
   DB_DRIVER=sqlite
   SQLITE_PATH=./data/portfolio.db
   ```

5. **Add a persistent disk** (for SQLite):
   - Go to "Settings" → "Disks"
   - Mount path: `/data`
   - Size: 1 GB (minimum)

**Custom domain:** Go to Settings → "Custom Domains" → add your domain.

---

### 3. VPS / cPanel / Traditional Hosting

For a VPS (DigitalOcean, Linode, Vultr, etc.) or cPanel with Node.js support.

**Requirements:**
- Node.js 20+ installed
- SSH access (for VPS) or Node.js app support (for cPanel)

**Steps:**

1. **Clone your repo on the server:**
   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings:
   # ADMIN_PASSWORD=your-secure-password
   # DB_DRIVER=sqlite
   # SQLITE_PATH=./data/portfolio.db
   ```

4. **Build:**
   ```bash
   npm run build
   ```

5. **Run with PM2** (process manager, keeps it alive):
   ```bash
   npm install -g pm2
   pm2 start dist/server/server.js --name portfolio
   pm2 save
   pm2 startup  # follows the prompt to auto-start on boot
   ```

6. **Set up nginx reverse proxy** (recommended):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **SSL with Certbot:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

**cPanel:** If your host supports Node.js apps (via cPanel → "Setup Node.js App"), create an app pointing to `dist/server/server.js`. Set environment variables in the app's configuration panel.

---

### 4. Vercel (Serverless — Uses Turso)

Vercel runs as serverless functions. SQLite files don't persist, so you use **Turso** — an edge-hosted SQLite database with a free tier.

**Steps:**

1. **Create a Turso account** at [turso.tech](https://turso.tech)

2. **Install the Turso CLI:**
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth login
   ```

3. **Create a database and get credentials:**
   ```bash
   turso db create portfolio
   turso db show portfolio --url        # TURSO_DATABASE_URL
   turso db tokens create portfolio     # TURSO_AUTH_TOKEN
   ```

4. **Deploy to Vercel:**
   ```bash
   npm i -g vercel
   vercel
   ```
   Or connect your GitHub repo in the Vercel dashboard.

5. **Set environment variables** in Vercel dashboard:
   ```
   DB_DRIVER=turso
   TURSO_DATABASE_URL=libsql://your-db.turso.io
   TURSO_AUTH_TOKEN=your-token-here
   ADMIN_PASSWORD=your-secure-password
   ```

6. **First deploy — seed the database:**
   After the first deploy, open `https://your-domain.vercel.app/admin`,
   enter your password, and click **Import from JSON**.

**How it works:** The Turso driver uses `@libsql/client` (HTTP-based,
zero native deps) so it runs perfectly in Vercel's serverless functions.
Edits via admin take effect instantly — no rebuild needed.

**Option B: PlanetScale (MySQL-compatible)**

1. Create a PlanetScale database
2. Set environment variables for MySQL connection
3. Use the MariaDB driver with PlanetScale's connection string

---

### 5. Netlify (Serverless — Uses Turso)

Netlify Functions have the same constraints as Vercel — no persistent file system.

**Same approach as Vercel:** Use Turso as the database.

**Steps:**

1. **Create a Turso database** (see Vercel steps 1-3 above)
2. **Connect your repo to Netlify**
3. **Set build settings:**
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `dist/client`
4. **Set environment variables** in Netlify dashboard:
   ```
   DB_DRIVER=turso
   TURSO_DATABASE_URL=libsql://your-db.turso.io
   TURSO_AUTH_TOKEN=your-token-here
   ADMIN_PASSWORD=your-secure-password
   ```
5. **First deploy — seed the database** via `/admin`

---

### 6. Cloudflare Workers (Advanced — Requires D1)

Cloudflare Workers run on V8 isolates — no Node.js, no SQLite. You need **Cloudflare D1** (SQLite-compatible edge database) and significant code changes.

**This is the most complex option.** Only recommended if you specifically need Cloudflare's edge network.

**Steps:**

1. **Create a D1 database:**
   ```bash
   wrangler d1 create portfolio
   ```

2. **Update your `.env`:**
   ```
   DB_DRIVER=d1
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_D1_DATABASE_ID=your-database-id
   CLOUDFLARE_API_TOKEN=your-api-token
   ADMIN_PASSWORD=your-secure-password
   ```

3. **You'll need to:**
   - Replace `better-sqlite3` with Cloudflare D1 bindings
   - Update the driver in `app/lib/db/index.ts`
   - Deploy with `wrangler`

**Note:** This requires significant refactoring of the database layer. Consider Railway or Render instead for simplicity.

---

## Database Options

| Driver | Best For | Persistent | Cost |
|--------|----------|------------|------|
| **SQLite** (default) | Railway, Render, VPS | With volume/disk | Free |
| **MariaDB** | VPS with MariaDB server | Yes | Free (self-hosted) |
| **Turso** (recommended for serverless) | Vercel, Netlify, edge | Yes | Free tier (500 DBs, 9GB storage) |
| **PlanetScale** | Vercel, Netlify | Yes | Free tier available |
| **Cloudflare D1** | Cloudflare Workers | Yes | Free tier available |

### Switching to MariaDB

1. Set up a MariaDB server (or use a managed service)
2. Update `.env`:
   ```
   DB_DRIVER=mariadb
   MARIADB_HOST=your-host
   MARIADB_PORT=3306
   MARIADB_USER=portfolio
   MARIADB_PASSWORD=your-password
   MARIADB_DATABASE=portfolio
   ```
3. The schema auto-creates tables on first run

---

## Admin Panel

Once deployed, access the admin panel at `https://your-domain.com/admin`.

1. Enter the `ADMIN_PASSWORD` you set in environment variables
2. Click **"Import from JSON"** to seed the database with your `app/data/*.json` content
3. Edit any section — changes take effect immediately (no rebuild needed)
4. Use **"Export to JSON"** to save database content back to JSON files (for backup)

**Security notes:**
- The admin panel is `noindex` (excluded from search engines)
- The password gate is minimal — add IP restrictions or real auth for production
- Never expose the admin panel without authentication

---

## Quick Start (Local Development)

```bash
# Clone and install
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install

# Set up environment
cp .env.example .env
# Edit .env: set ADMIN_PASSWORD and DB_DRIVER

# Run development server
npm run dev
# Open http://localhost:3000/admin to set up data
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_PASSWORD` | Yes | (empty = locked) | Password for `/admin` panel |
| `DB_DRIVER` | No | `sqlite` | `sqlite` or `mariadb` |
| `SQLITE_PATH` | No | `./data/portfolio.db` | SQLite file path (relative to project root) |
| `MARIADB_HOST` | If MariaDB | `127.0.0.1` | MariaDB host |
| `MARIADB_PORT` | If MariaDB | `3306` | MariaDB port |
| `MARIADB_USER` | If MariaDB | `portfolio` | MariaDB username |
| `MARIADB_PASSWORD` | If MariaDB | (empty) | MariaDB password |
| `MARIADB_DATABASE` | If MariaDB | `portfolio` | MariaDB database name |

---

## Troubleshooting

**"skills is not seeded yet" error:**
- Go to `/admin`, enter your password, and click "Import from JSON"

**Database locked (SQLite):**
- Only one process can write to SQLite at a time. Make sure you're not running multiple instances.

**Build fails during prerendering:**
- Ensure `data/portfolio.db` exists and has been seeded
- Or temporarily set `prerender.enabled: false` in `app.config.ts`

**Admin panel shows "locked":**
- Set `ADMIN_PASSWORD` in your `.env` file and restart the server
