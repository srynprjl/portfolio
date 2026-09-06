/**
 * Server-side config. Values come from the environment (root `.env`
 * file — see `.env.example`). Only ever read inside server functions,
 * never bundled to the client.
 */
function required(name: string, fallback = ''): string {
  return process.env[name] ?? fallback
}

export const dbConfig = {
  driver: (process.env.DB_DRIVER ?? 'sqlite').toLowerCase(),
  sqlitePath: process.env.SQLITE_PATH ?? './data/portfolio.db',
  mariadb: {
    host: required('MARIADB_HOST', '127.0.0.1'),
    port: Number(process.env.MARIADB_PORT ?? 3306),
    user: required('MARIADB_USER', 'portfolio'),
    password: required('MARIADB_PASSWORD', ''),
    database: required('MARIADB_DATABASE', 'portfolio'),
  },
  turso: {
    url: required('TURSO_DATABASE_URL'),
    authToken: required('TURSO_AUTH_TOKEN'),
  },
} as const

/** Password gate for the /admin mutations. Set ADMIN_PASSWORD in .env. */
export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? ''
}
