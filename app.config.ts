import type { TanStackStartViteInputConfig } from '@tanstack/start-plugin-core/vite'

/**
 * app.config.ts — TanStack Start application configuration.
 *
 * Static prerendering (SSG) is enabled here: at `vite build` time every
 * route is crawled and compiled down to pre-rendered static HTML in
 * `dist/client`, ready to be deployed to any static host.
 *
 * The sitemap is generated automatically from the route manifest
 * (`sitemap.enabled`), with `public/sitemap.xml` + `public/robots.txt`
 * shipped as a fallback for hosts that serve the folder verbatim.
 */
const appConfig = {
  // File-based routing lives under `app/` instead of the default `src/`.
  srcDirectory: 'app',

  // ---- Static prerendering (SSG) -------------------------------------
  prerender: {
    enabled: true,
    crawlLinks: true,
    autoSubfolderIndex: true,
  },

  // ---- Automatic sitemap generation ----------------------------------
  sitemap: {
    enabled: true,
    host: 'https://shreyanparajuli.com',
    outputPath: 'sitemap.xml',
  },

  pages: [
    { path: '/', sitemap: { priority: 1, changefreq: 'monthly' } },
    { path: '/resume', sitemap: { priority: 0.8, changefreq: 'monthly' } },
    { path: '/blog', sitemap: { priority: 0.7, changefreq: 'weekly' } },
    { path: '/design-system', sitemap: { exclude: true } },
    { path: '/admin', sitemap: { exclude: true } },
  ],
} satisfies TanStackStartViteInputConfig

export default appConfig
