import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { dbConfig } from './config.js'
import { createMariaDbDriver } from './mariadb.js'
import { MARIADB_SCHEMA, SQLITE_SCHEMA } from './schema.js'
import { createSqliteDriver } from './sqlite.js'
import { createTursoDriver } from './turso.js'
import type { Driver } from './types.js'

let cached: Promise<{ driver: Driver; schema: string }> | null = null

/** Lazily create (and init) the configured driver, once per server. */
export function getDb(): Promise<{ driver: Driver; schema: string }> {
  if (!cached) {
    cached = (async () => {
      if (dbConfig.driver === 'turso') {
        if (!dbConfig.turso.url) {
          throw new Error(
            'TURSO_DATABASE_URL is required when DB_DRIVER=turso.',
          )
        }
        const driver = createTursoDriver(dbConfig.turso)
        await driver.init(SQLITE_SCHEMA)
        return { driver, schema: SQLITE_SCHEMA }
      }
      if (dbConfig.driver === 'mariadb') {
        const driver = createMariaDbDriver(dbConfig.mariadb)
        await driver.init(MARIADB_SCHEMA)
        return { driver, schema: MARIADB_SCHEMA }
      }
      if (dbConfig.driver !== 'sqlite') {
        throw new Error(
          `Unknown DB_DRIVER "${dbConfig.driver}". Use "sqlite", "mariadb", or "turso".`,
        )
      }
      const dbPath = resolve(process.cwd(), dbConfig.sqlitePath)
      mkdirSync(dirname(dbPath), { recursive: true })
      const driver = createSqliteDriver(dbPath)
      await driver.init(SQLITE_SCHEMA)
      return { driver, schema: SQLITE_SCHEMA }
    })()
  }
  return cached
}
