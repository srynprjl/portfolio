import mysql from 'mysql2/promise'
import type { Pool } from 'mysql2/promise'
import type { Driver, Row } from './types.js'

export interface MariaDbOptions {
  host: string
  port: number
  user: string
  password: string
  database: string
}

function ident(name: string): string {
  return `\`${name.replace(/`/g, '``')}\``
}

type MysqlValue = string | number | null

/** Narrow structural type: our encoded rows only ever hold these. */
interface ExecPool {
  execute(sql: string, values?: MysqlValue[]): Promise<[unknown, unknown]>
  end(): Promise<void>
}

export function createMariaDbDriver(options: MariaDbOptions): Driver {
  let pool: Pool | null = null

  const getPool = (): ExecPool => {
    if (!pool) {
      pool = mysql.createPool({
        host: options.host,
        port: options.port,
        user: options.user,
        password: options.password,
        database: options.database,
        waitForConnections: true,
        connectionLimit: 10,
        // Return TINYINT(1) as numbers so bool decoding stays uniform.
        supportBigNumbers: false,
      })
    }
    return pool as unknown as ExecPool
  }

  const val = (value: unknown): MysqlValue => {
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return value
    return String(value)
  }

  return {
    name: 'mariadb',

    async init(schemaSql: string): Promise<void> {
      const statements = schemaSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
      for (const statement of statements) {
        await getPool().execute(statement)
      }
    },

    async close(): Promise<void> {
      await pool?.end()
      pool = null
    },

    async all(table: string): Promise<Row[]> {
      const [rows] = await getPool().execute(`SELECT * FROM ${ident(table)}`)
      return rows as Row[]
    },

    async get(table: string, pk: string, id: string | number): Promise<Row | null> {
      const [rows] = await getPool().execute(
        `SELECT * FROM ${ident(table)} WHERE ${ident(pk)} = ? LIMIT 1`,
        [id],
      )
      const list = rows as Row[]
      return list[0] ?? null
    },

    async count(table: string): Promise<number> {
      const [rows] = await getPool().execute(
        `SELECT COUNT(*) AS n FROM ${ident(table)}`,
      )
      return Number((rows as Array<{ n: number }>)[0].n)
    },

    async insert(
      table: string,
      pk: string,
      pkAuto: boolean,
      row: Row,
    ): Promise<string | number> {
      const cols = Object.keys(row).filter((c) => !(pkAuto && c === pk))
      const placeholders = cols.map(() => '?').join(', ')
      const [result] = await getPool().execute(
        `INSERT INTO ${ident(table)} (${cols.map(ident).join(', ')}) VALUES (${placeholders})`,
        cols.map((c) => val(row[c])),
      )
      const info = result as { insertId?: number | string }
      if (pkAuto) return Number(info.insertId)
      return String(row[pk] ?? '')
    },

    async replace(table: string, row: Row): Promise<void> {
      const cols = Object.keys(row)
      const placeholders = cols.map(() => '?').join(', ')
      await getPool().execute(
        `REPLACE INTO ${ident(table)} (${cols.map(ident).join(', ')}) VALUES (${placeholders})`,
        cols.map((c) => val(row[c])),
      )
    },

    async update(
      table: string,
      pk: string,
      id: string | number,
      patch: Row,
    ): Promise<boolean> {
      const cols = Object.keys(patch).filter((c) => c !== pk)
      if (cols.length === 0) {
        return (await this.get(table, pk, id)) !== null
      }
      const sets = cols.map((c) => `${ident(c)} = ?`).join(', ')
      const [result] = await getPool().execute(
        `UPDATE ${ident(table)} SET ${sets} WHERE ${ident(pk)} = ?`,
        [...cols.map((c) => val(patch[c])), val(id)],
      )
      return Number((result as { affectedRows?: number }).affectedRows ?? 0) > 0
    },

    async remove(table: string, pk: string, id: string | number): Promise<boolean> {
      const [result] = await getPool().execute(
        `DELETE FROM ${ident(table)} WHERE ${ident(pk)} = ?`,
        [val(id)],
      )
      return Number((result as { affectedRows?: number }).affectedRows ?? 0) > 0
    },
  }
}
