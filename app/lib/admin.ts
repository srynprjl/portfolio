import { createServerFn } from '@tanstack/react-start'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { adminPassword } from './db/config.js'
import { getDb } from './db/index.js'
import { seedFromFiles } from './db/seed.js'
import {
  decodeRow,
  encodeRow,
  resourceByName,
  RESOURCES,
} from './db/types.js'
import type { Row } from './db/types.js'

function check(password: string): void {
  const expected = adminPassword()
  if (!expected || password !== expected) {
    throw new Error('Unauthorized: wrong admin password.')
  }
}

function needResource(name: string) {
  const resource = resourceByName(name)
  if (!resource) throw new Error(`Unknown collection: ${name}`)
  return resource
}

const asRecord = (data: unknown): Row => (data ?? {}) as Row

export const checkAdmin = createServerFn({ method: 'POST' })
  .validator((data: unknown) => asRecord(data))
  .handler(async ({ data }) => {
    try {
      check(String(data.password ?? ''))
      return { ok: true as const }
    } catch {
      return { ok: false as const }
    }
  })

export const resourceMeta = createServerFn({ method: 'POST' })
  .validator((data: unknown) => asRecord(data))
  .handler(async ({ data }) => {
    check(String(data.password ?? ''))
    return RESOURCES
  })

export const listResource = createServerFn({ method: 'POST' })
  .validator((data: unknown) => asRecord(data))
  .handler(async ({ data }) => {
    check(String(data.password ?? ''))
    const resource = needResource(String(data.resource ?? ''))
    const { driver } = await getDb()
    const rows = await driver.all(resource.table)
    return rows.map((row) => {
      const decoded = decodeRow(resource, row)
      if (resource.listOmit) {
        for (const col of resource.listOmit) delete decoded[col]
      }
      return decoded
    })
  })

export const getResource = createServerFn({ method: 'POST' })
  .validator((data: unknown) => asRecord(data))
  .handler(async ({ data }) => {
    check(String(data.password ?? ''))
    const resource = needResource(String(data.resource ?? ''))
    if (resource.singleton) throw new Error('Singletons use listResource.')
    const { driver } = await getDb()
    const row = await driver.get(resource.table, resource.pk, String(data.id ?? ''))
    if (!row) throw new Error(`${resource.name} "${data.id}" not found.`)
    return decodeRow(resource, row)
  })

export const createResource = createServerFn({ method: 'POST' })
  .validator((data: unknown) => asRecord(data))
  .handler(async ({ data }) => {
    check(String(data.password ?? ''))
    const resource = needResource(String(data.resource ?? ''))
    if (resource.singleton) throw new Error('Singletons use putSingleton.')
    const body = asRecord(data.body)
    for (const col of resource.required ?? []) {
      const value = body[col]
      if (value === undefined || value === null || String(value).trim() === '') {
        throw new Error(`Missing required field: ${col}`)
      }
    }
    const { driver } = await getDb()
    try {
      const id = await driver.insert(
        resource.table,
        resource.pk,
        resource.pkAuto ?? false,
        encodeRow(resource, body, true),
      )
      const created = await driver.get(resource.table, resource.pk, id)
      return decodeRow(resource, created ?? { ...body, [resource.pk]: id })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Insert failed.'
      if (/UNIQUE|Duplicate entry|PRIMARY/i.test(message)) {
        throw new Error(`Duplicate id: "${body[resource.pk]}" already exists.`)
      }
      throw err instanceof Error ? err : new Error(message)
    }
  })

export const updateResource = createServerFn({ method: 'POST' })
  .validator((data: unknown) => asRecord(data))
  .handler(async ({ data }) => {
    check(String(data.password ?? ''))
    const resource = needResource(String(data.resource ?? ''))
    if (resource.singleton) throw new Error('Singletons use putSingleton.')
    const id = String(data.id ?? '')
    const { driver } = await getDb()
    const existing = await driver.get(resource.table, resource.pk, id)
    if (!existing) throw new Error(`${resource.name} "${id}" not found.`)
    const merged = { ...decodeRow(resource, existing), ...asRecord(data.patch) }
    await driver.update(resource.table, resource.pk, id, encodeRow(resource, merged, true))
    const row = await driver.get(resource.table, resource.pk, id)
    return decodeRow(resource, row ?? {})
  })

export const deleteResource = createServerFn({ method: 'POST' })
  .validator((data: unknown) => asRecord(data))
  .handler(async ({ data }) => {
    check(String(data.password ?? ''))
    const resource = needResource(String(data.resource ?? ''))
    if (resource.singleton) throw new Error('Singletons cannot be deleted.')
    const id = String(data.id ?? '')
    const { driver } = await getDb()
    const ok = await driver.remove(resource.table, resource.pk, id)
    if (!ok) throw new Error(`${resource.name} "${id}" not found.`)
    return { ok: true as const }
  })

export const putSingleton = createServerFn({ method: 'POST' })
  .validator((data: unknown) => asRecord(data))
  .handler(async ({ data }) => {
    check(String(data.password ?? ''))
    const resource = needResource(String(data.resource ?? ''))
    if (!resource.singleton) throw new Error('Only singletons use putSingleton.')
    const { driver } = await getDb()
    const body = asRecord(data.body)
    await driver.replace(
      resource.table,
      encodeRow(resource, { ...body, [resource.pk]: 'main' }, true),
    )
    const row = await driver.get(resource.table, resource.pk, 'main')
    const decoded = decodeRow(resource, row ?? {})
    delete decoded[resource.pk]
    return decoded
  })

export const seedStatus = createServerFn({ method: 'POST' })
  .validator((data: unknown) => asRecord(data))
  .handler(async ({ data }) => {
    check(String(data.password ?? ''))
    const { driver } = await getDb()
    const status: Array<{ resource: string; table: string; count: number }> = []
    for (const resource of RESOURCES) {
      status.push({
        resource: resource.name,
        table: resource.table,
        count: await driver.count(resource.table),
      })
    }
    return { driver: driver.name, status }
  })

export const seedFromJson = createServerFn({ method: 'POST' })
  .validator((data: unknown) => asRecord(data))
  .handler(async ({ data }) => {
    check(String(data.password ?? ''))
    const { driver } = await getDb()
    const results = await seedFromFiles(driver)
    return { driver: driver.name, results }
  })

/** Upload an image to public/assets/ and return the relative path. */
export const uploadImage = createServerFn({ method: 'POST' })
  .validator((data: unknown) => asRecord(data))
  .handler(async ({ data }) => {
    check(String(data.password ?? ''))
    const filename = String(data.filename ?? '')
    const base64 = String(data.base64 ?? '')
    if (!filename || !base64) throw new Error('filename and base64 are required.')
    const ext = extname(filename).toLowerCase()
    if (!['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
      throw new Error('Unsupported image type.')
    }
    // Sanitize: strip path separators, keep only the filename
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const dir = join(process.cwd(), 'public', 'assets')
    mkdirSync(dir, { recursive: true })
    const buffer = Buffer.from(base64, 'base64')
    writeFileSync(join(dir, safeName), buffer)
    return { path: `assets/${safeName}` }
  })

/** Log a visitor page view (called from contact form / page tracking). */
export const logVisitor = createServerFn({ method: 'POST' })
  .validator((data: unknown) => asRecord(data))
  .handler(async ({ data }) => {
    const { driver } = await getDb()
    await driver.insert('visitors', 'id', true, {
      ip: String(data.ip ?? ''),
      country: String(data.country ?? ''),
      city: String(data.city ?? ''),
      path: String(data.path ?? '/'),
      userAgent: String(data.userAgent ?? ''),
      referrer: String(data.referrer ?? ''),
      duration: Number(data.duration ?? 0),
    })
    return { ok: true as const }
  })

/** Submit a contact message (public, no password required). */
export const submitMessage = createServerFn({ method: 'POST' })
  .validator((data: unknown) => asRecord(data))
  .handler(async ({ data }) => {
    const name = String(data.name ?? '').trim()
    const email = String(data.email ?? '').trim()
    const subject = String(data.subject ?? '').trim()
    const body = String(data.body ?? '').trim()
    if (!name || !email || !body) throw new Error('Name, email, and message are required.')
    const { driver } = await getDb()
    await driver.insert('messages', 'id', true, {
      name,
      email,
      subject,
      body,
      ip: String(data.ip ?? ''),
      country: String(data.country ?? ''),
      anonymous: data.anonymous ? 1 : 0,
      read: 0,
    })
    return { ok: true as const }
  })

/** Get analytics dashboard data. */
export const getAnalytics = createServerFn({ method: 'POST' })
  .validator((data: unknown) => asRecord(data))
  .handler(async ({ data }) => {
    check(String(data.password ?? ''))
    const { driver } = await getDb()

    // Total visitors
    const totalVisitors = await driver.count('visitors')

    // Unique IPs
    const allVisitors = await driver.all('visitors')
    const uniqueIps = new Set(allVisitors.map((v) => String(v.ip))).size

    // Top countries
    const countryCounts: Record<string, number> = {}
    for (const v of allVisitors) {
      const c = String(v.country || 'Unknown')
      countryCounts[c] = (countryCounts[c] ?? 0) + 1
    }
    const topCountries = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }))

    // Top pages
    const pageCounts: Record<string, number> = {}
    for (const v of allVisitors) {
      const p = String(v.path || '/')
      pageCounts[p] = (pageCounts[p] ?? 0) + 1
    }
    const topPages = Object.entries(pageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }))

    // Total time on site (seconds)
    const totalDuration = allVisitors.reduce((sum, v) => sum + Number(v.duration ?? 0), 0)

    // Unread messages
    const allMessages = await driver.all('messages')
    const unreadMessages = allMessages.filter((m) => m.read === 0 || m.read === false).length
    const totalMessages = allMessages.length

    // Visits per day (last 30 days)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dailyVisits: Record<string, number> = {}
    for (const v of allVisitors) {
      const d = String(v.createdAt ?? '').slice(0, 10)
      if (d && new Date(d) >= thirtyDaysAgo) {
        dailyVisits[d] = (dailyVisits[d] ?? 0) + 1
      }
    }

    return {
      totalVisitors,
      uniqueIps,
      topCountries,
      topPages,
      totalDuration,
      unreadMessages,
      totalMessages,
      dailyVisits,
    }
  })
