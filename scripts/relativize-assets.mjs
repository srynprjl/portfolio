/**
 * Post-build step: rewrite root-absolute build-asset URLs (`/assets/...`)
 * to relative ones (`./assets/...`) so the prerendered site works from
 * any base path (domain root, GitHub Pages subpath, plain static server).
 *
 * Only the bundler-emitted `/assets/` prefix is rewritten — absolute
 * site URLs (sitemap, OG tags, canonical) are intentionally left alone.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const clientDir = new URL('../dist/client/', import.meta.url)
const assetsDir = new URL('./assets/', clientDir)

let changed = 0

function rewrite(file, replacements) {
  const before = readFileSync(file, 'utf8')
  let after = before
  for (const [from, to] of replacements) {
    after = after.split(from).join(to)
  }
  if (after !== before) {
    writeFileSync(file, after)
    changed++
    console.log(`[relativize] ${file}`)
  }
}

// Prerendered HTML (index.html at root -> `./assets/...` resolves correctly,
// including from a subpath deployment).
for (const entry of readdirSync(clientDir)) {
  if (entry.endsWith('.html')) {
    rewrite(join(clientDir.pathname, entry), [['/assets/', './assets/']])
  }
}

// Client bundles: route `head()` state (favicon href, OG image) is
// serialized into the JS for client-side nav — keep it consistent.
for (const entry of readdirSync(assetsDir)) {
  if (entry.endsWith('.js')) {
    rewrite(join(assetsDir.pathname, entry), [['/assets/', './assets/']])
  }
}

// Sitemap: drop fragment URLs (`/#about`, …). Fragments are not
// separate pages and must not appear in sitemaps.
{
  const file = join(clientDir.pathname, 'sitemap.xml')
  const before = readFileSync(file, 'utf8')
  const after = before.replace(/<url>\s*<loc>[^<]*#[^<]*<\/loc>[\s\S]*?<\/url>\s*/g, '')
  if (after !== before) {
    writeFileSync(file, after)
    changed++
    console.log(`[relativize] ${file} (fragments removed)`)
  }
}

console.log(`[relativize] done (${changed} file(s) updated)`)
