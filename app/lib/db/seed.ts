import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Driver, Row } from './types.js'
import { encodeRow, resourceByName } from './types.js'

export interface SeedResult {
  resource: string
  inserted: number
  skipped: boolean
}

/**
 * Import ../app/data/*.json (+ blog Markdown bodies) into empty
 * tables. Non-empty tables are left untouched, so re-running is safe.
 */
export async function seedFromFiles(driver: Driver): Promise<SeedResult[]> {
  const root = process.cwd()
  const readJson = (name: string): unknown =>
    JSON.parse(readFileSync(join(root, 'app', 'data', `${name}.json`), 'utf8'))
  const readMarkdown = (file: string): string => {
    try {
      return readFileSync(join(root, 'app', 'content', 'blog', file), 'utf8')
    } catch {
      return ''
    }
  }

  const sources: Record<string, Row[]> = {
    profile: [{ ...((readJson('profile') as Row) ?? {}), id: 'main' }],
    skills: [{ ...((readJson('skills') as Row) ?? {}), id: 'main' }],
    'code-profiles': (readJson('codeProfiles') as Row[]) ?? [],
    socials: (readJson('socials') as Row[]) ?? [],
    experience: (readJson('experience') as Row[]) ?? [],
    education: (readJson('education') as Row[]) ?? [],
    projects: (readJson('projects') as Row[]) ?? [],
    designs: (readJson('designs') as Row[]) ?? [],
    blogs: (((readJson('blogs') as Row[]) ?? []) as Row[]).map((row) => ({
      ...row,
      content: readMarkdown(String(row.file ?? '')),
    })),
  }

  const results: SeedResult[] = []
  // Import order matters for no reason other than stable logs.
  for (const name of [
    'profile',
    'skills',
    'code-profiles',
    'socials',
    'experience',
    'education',
    'projects',
    'designs',
    'blogs',
  ]) {
    const resource = resourceByName(name)
    if (!resource) continue
    if ((await driver.count(resource.table)) > 0) {
      results.push({ resource: resource.name, inserted: 0, skipped: true })
      continue
    }
    let inserted = 0
    for (const raw of sources[resource.name] ?? []) {
      await driver.insert(
        resource.table,
        resource.pk,
        resource.pkAuto ?? false,
        encodeRow(resource, raw, true),
      )
      inserted += 1
    }
    results.push({ resource: resource.name, inserted, skipped: false })
  }
  return results
}

/** Seed only when the whole database is empty (fresh deploys). */
export async function ensureSeeded(driver: Driver): Promise<void> {
  for (const name of [
    'profile',
    'skills',
    'code-profiles',
    'socials',
    'experience',
    'education',
    'projects',
    'designs',
    'blogs',
  ]) {
    const resource = resourceByName(name)
    if (!resource) continue
    if ((await driver.count(resource.table)) > 0) return
  }
  await seedFromFiles(driver)
}
