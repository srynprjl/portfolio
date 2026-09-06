import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'
import type { Driver, Json, Row } from './types.js'

type TursoArg = string | number | boolean | null | bigint | ArrayBuffer

/**
 * Convert Json values to libSQL-compatible args.
 * encodeRow already flattens complex types to JSON strings,
 * but the TS types don't know that — this helper bridges the gap.
 */
function toArgs(values: Json[]): TursoArg[] {
  return values.map((v) => {
    if (v === null || v === undefined) return null
    if (typeof v === 'string') return v
    if (typeof v === 'number') return v
    if (typeof v === 'boolean') return v ? 1 : 0
    // Arrays/objects: encodeRow already JSON.stringify'd them,
    // but if they somehow slip through as raw values, stringify.
    return JSON.stringify(v)
  })
}

function ident(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

export interface TursoOptions {
  url: string
  authToken?: string
}

/**
 * Turso (libSQL) driver — uses the @libsql/client HTTP driver so it
 * works in serverless environments (Vercel, Netlify, Cloudflare Workers)
 * with zero native dependencies.
 *
 * The API is fully async and the result sets map cleanly to our Driver
 * contract.
 */
export function createTursoDriver(options: TursoOptions): Driver {
  let client: Client | null = null

  const getClient = (): Client => {
    if (!client) {
      client = createClient({
        url: options.url,
        authToken: options.authToken,
      })
    }
    return client
  }

  const rowToObject = (row: Record<string, unknown>): Row => {
    const obj: Row = {}
    for (const [key, value] of Object.entries(row)) {
      if (value === null || value === undefined) {
        obj[key] = null
      } else if (typeof value === 'bigint') {
        obj[key] = Number(value)
      } else {
        obj[key] = value as string | number | boolean
      }
    }
    return obj
  }

  return {
    name: 'turso',

    async init(schemaSql: string): Promise<void> {
      const statements = schemaSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
      for (const statement of statements) {
        await getClient().execute(statement)
      }
    },

    async close(): Promise<void> {
      if (client) {
        client.close()
        client = null
      }
    },

    async all(table: string): Promise<Row[]> {
      const result = await getClient().execute(
        `SELECT * FROM ${ident(table)}`,
      )
      return result.rows.map((row) => rowToObject(row as Record<string, unknown>))
    },

    async get(
      table: string,
      pk: string,
      id: string | number,
    ): Promise<Row | null> {
      const result = await getClient().execute({
        sql: `SELECT * FROM ${ident(table)} WHERE ${ident(pk)} = ?`,
        args: toArgs([id as unknown as Json]),
      })
      const first = result.rows[0]
      return first ? rowToObject(first as Record<string, unknown>) : null
    },

    async count(table: string): Promise<number> {
      const result = await getClient().execute(
        `SELECT COUNT(*) AS n FROM ${ident(table)}`,
      )
      const row = result.rows[0] as Record<string, unknown> | undefined
      return row ? Number(row.n ?? 0) : 0
    },

    async insert(
      table: string,
      pk: string,
      pkAuto: boolean,
      row: Row,
    ): Promise<string | number> {
      const cols = Object.keys(row).filter((c) => !(pkAuto && c === pk))
      const placeholders = cols.map(() => '?').join(', ')
      const result = await getClient().execute({
        sql: `INSERT INTO ${ident(table)} (${cols.map(ident).join(', ')}) VALUES (${placeholders})`,
        args: toArgs(cols.map((c) => row[c])),
      })
      if (pkAuto) {
        return Number(result.lastInsertRowid ?? 0)
      }
      return row[pk] as string
    },

    async replace(table: string, row: Row): Promise<void> {
      const cols = Object.keys(row)
      const placeholders = cols.map(() => '?').join(', ')
      await getClient().execute({
        sql: `REPLACE INTO ${ident(table)} (${cols.map(ident).join(', ')}) VALUES (${placeholders})`,
        args: toArgs(cols.map((c) => row[c])),
      })
    },

    async update(
      table: string,
      pk: string,
      id: string | number,
      patch: Row,
    ): Promise<boolean> {
      const cols = Object.keys(patch).filter((c) => c !== pk)
      if (cols.length === 0) {
        const existing = await this.get(table, pk, id)
        return existing !== null
      }
      const sets = cols.map((c) => `${ident(c)} = ?`).join(', ')
      const result = await getClient().execute({
        sql: `UPDATE ${ident(table)} SET ${sets} WHERE ${ident(pk)} = ?`,
        args: toArgs([...cols.map((c) => patch[c]), id as unknown as Json]),
      })
      return result.rowsAffected > 0
    },

    async remove(
      table: string,
      pk: string,
      id: string | number,
    ): Promise<boolean> {
      const result = await getClient().execute({
        sql: `DELETE FROM ${ident(table)} WHERE ${ident(pk)} = ?`,
        args: toArgs([id as unknown as Json]),
      })
      return result.rowsAffected > 0
    },
  }
}
