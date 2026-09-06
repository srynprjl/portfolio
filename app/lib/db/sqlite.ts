import Database from 'better-sqlite3'
import type { Driver, Row } from './types.js'

function ident(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

export function createSqliteDriver(dbPath: string): Driver {
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  return {
    name: 'sqlite',

    async init(schemaSql: string): Promise<void> {
      db.exec(schemaSql)
    },

    async close(): Promise<void> {
      db.close()
    },

    async all(table: string): Promise<Row[]> {
      return db.prepare(`SELECT * FROM ${ident(table)}`).all() as Row[]
    },

    async get(table: string, pk: string, id: string | number): Promise<Row | null> {
      const row = db
        .prepare(`SELECT * FROM ${ident(table)} WHERE ${ident(pk)} = ?`)
        .get(id) as Row | undefined
      return row ?? null
    },

    async count(table: string): Promise<number> {
      const row = db.prepare(`SELECT COUNT(*) AS n FROM ${ident(table)}`).get() as {
        n: number
      }
      return row.n
    },

    async insert(
      table: string,
      pk: string,
      pkAuto: boolean,
      row: Row,
    ): Promise<string | number> {
      const cols = Object.keys(row).filter((c) => !(pkAuto && c === pk))
      const placeholders = cols.map(() => '?').join(', ')
      const info = db
        .prepare(
          `INSERT INTO ${ident(table)} (${cols.map(ident).join(', ')}) VALUES (${placeholders})`,
        )
        .run(...cols.map((c) => row[c]))
      if (pkAuto) return Number(info.lastInsertRowid)
      return row[pk] as string
    },

    async replace(table: string, row: Row): Promise<void> {
      const cols = Object.keys(row)
      const placeholders = cols.map(() => '?').join(', ')
      db.prepare(
        `INSERT OR REPLACE INTO ${ident(table)} (${cols.map(ident).join(', ')}) VALUES (${placeholders})`,
      ).run(...cols.map((c) => row[c]))
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
      const info = db
        .prepare(`UPDATE ${ident(table)} SET ${sets} WHERE ${ident(pk)} = ?`)
        .run(...cols.map((c) => patch[c]), id)
      return info.changes > 0
    },

    async remove(table: string, pk: string, id: string | number): Promise<boolean> {
      const info = db
        .prepare(`DELETE FROM ${ident(table)} WHERE ${ident(pk)} = ?`)
        .run(id)
      return info.changes > 0
    },
  }
}
