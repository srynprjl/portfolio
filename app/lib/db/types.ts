export type DriverName = 'sqlite' | 'mariadb' | 'turso'

/** Domain types shared by the database layer, loaders, and components. */
export interface BlogPost {
  id: string
  title: string
  author: string
  date: string
  excerpt: string
  file: string
  category?: string
  tags?: string[]
  coverImage?: string
  hide?: boolean
}

export interface Profile {
  firstName: string
  lastName: string
  title: string
  location: string
  bio: string
}

export interface SocialLink {
  id: string
  label: string
  url: string
  icon: string
  hide?: boolean
}

export interface SkillGroup {
  key: string
  label: string
  icon: string
  color: string
}

export interface SkillGroups {
  languages: string[]
  frameworks: string[]
  tools: string[]
  traits: string[]
  custom?: SkillGroup[]
}

export interface ExperienceItem {
  role: string
  organization: string
  location?: string
  startDate: string
  endDate: string
  period: string
  summary: string
}

export interface EducationItem {
  institution: string
  location: string
  degree: string
  expected?: string
  completed?: string
}

export interface CodeProfile {
  id: string
  label: string
  url: string
}

export interface ProjectSource {
  label: string
  url: string
}

export interface DesignFile {
  label: string
  url: string
}

export interface Design {
  id: string
  title: string
  date: string
  summary: string
  description: string
  image?: string
  tags: string[]
  files: DesignFile[]
  sources: ProjectSource[]
  liveUrl: string
}

export interface Project {
  id: string
  title: string
  date: string
  summary: string
  motivation: string
  image?: string
  chips: string[]
  sources: ProjectSource[]
  liveUrl: string
  hideFromPage?: boolean
  hideFromResume?: boolean
}

/** JSON-safe values only: server functions must return serializable data. */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

export type Row = Record<string, Json>

/**
 * Minimal storage contract both drivers implement.
 * Table/column names always come from the internal resource map,
 * never from user input, so interpolated identifiers are safe.
 */
export interface Driver {
  readonly name: DriverName
  /** Create tables if missing. */
  init(schemaSql: string): Promise<void>
  close(): Promise<void>
  all(table: string): Promise<Row[]>
  get(table: string, pk: string, id: string | number): Promise<Row | null>
  count(table: string): Promise<number>
  /** Insert a row. Returns the id (generated for autoincrement tables). */
  insert(table: string, pk: string, pkAuto: boolean, row: Row): Promise<string | number>
  /** Replace a full row (singletons). Returns true when a row exists afterwards. */
  replace(table: string, row: Row): Promise<void>
  /** Partial update. Returns false when no row matched. */
  update(table: string, pk: string, id: string | number, patch: Row): Promise<boolean>
  /** Returns false when no row matched. */
  remove(table: string, pk: string, id: string | number): Promise<boolean>
}

/** Per-collection storage rules shared by both drivers. */
export interface Resource {
  /** URL segment, e.g. `code-profiles`. */
  name: string
  table: string
  pk: string
  /** Integer autoincrement id (experience, education). */
  pkAuto?: boolean
  /** Writable columns, excluding an autoincrement pk. */
  columns: string[]
  /** Columns persisted as JSON text. */
  json?: string[]
  /** Columns persisted as 0/1 integers. */
  bools?: string[]
  /** Singleton object (profile, skills): no POST/DELETE, PUT replaces. */
  singleton?: boolean
  /** Columns required on create. */
  required?: string[]
  /** Columns stripped from list responses. */
  listOmit?: string[]
}

export const RESOURCES: Resource[] = [
  {
    name: 'profile',
    table: 'profile',
    pk: 'id',
    columns: ['id', 'firstName', 'lastName', 'title', 'location', 'bio'],
    singleton: true,
  },
  {
    name: 'skills',
    table: 'skills',
    pk: 'id',
    columns: ['id', 'languages', 'frameworks', 'tools', 'traits', 'custom'],
    json: ['languages', 'frameworks', 'tools', 'traits', 'custom'],
    singleton: true,
  },
  {
    name: 'code-profiles',
    table: 'code_profiles',
    pk: 'id',
    columns: ['id', 'label', 'url'],
    required: ['id', 'label'],
  },
  {
    name: 'socials',
    table: 'socials',
    pk: 'id',
    columns: ['id', 'label', 'url', 'icon', 'hide'],
    bools: ['hide'],
    required: ['id', 'label'],
  },
  {
    name: 'experience',
    table: 'experience',
    pk: 'id',
    pkAuto: true,
    columns: ['role', 'organization', 'location', 'startDate', 'endDate', 'period', 'summary'],
    required: ['role', 'organization', 'period', 'summary'],
  },
  {
    name: 'education',
    table: 'education',
    pk: 'id',
    pkAuto: true,
    columns: ['institution', 'location', 'degree', 'expected', 'completed'],
    required: ['institution', 'degree'],
  },
  {
    name: 'projects',
    table: 'projects',
    pk: 'id',
    columns: [
      'id',
      'title',
      'date',
      'summary',
      'motivation',
      'image',
      'chips',
      'sources',
      'liveUrl',
      'hideFromPage',
      'hideFromResume',
    ],
    json: ['chips', 'sources'],
    bools: ['hideFromPage', 'hideFromResume'],
    required: ['id', 'title'],
  },
  {
    name: 'designs',
    table: 'designs',
    pk: 'id',
    columns: [
      'id',
      'title',
      'date',
      'summary',
      'description',
      'image',
      'tags',
      'files',
      'sources',
      'liveUrl',
    ],
    json: ['tags', 'files', 'sources'],
    required: ['id', 'title'],
  },
  {
    name: 'blogs',
    table: 'blogs',
    pk: 'id',
    columns: ['id', 'title', 'author', 'date', 'excerpt', 'file', 'category', 'tags', 'coverImage', 'content', 'hide'],
    json: ['tags'],
    bools: ['hide'],
    required: ['id', 'title'],
    listOmit: ['content'],
  },
  {
    name: 'messages',
    table: 'messages',
    pk: 'id',
    pkAuto: true,
    columns: ['id', 'name', 'email', 'subject', 'body', 'ip', 'country', 'anonymous', 'read', 'createdAt'],
    bools: ['anonymous', 'read'],
    required: ['name', 'email', 'subject', 'body'],
  },
]

export function resourceByName(name: string): Resource | undefined {
  return RESOURCES.find((r) => r.name === name)
}

/** JS values -> storage values. With `fillDefaults`, missing columns
 * get storage-safe defaults (used on create); otherwise only the
 * provided keys are encoded (used on patch). */
export function encodeRow(res: Resource, input: Row, fillDefaults = false): Row {
  const row: Row = {}
  for (const col of res.columns) {
    if (!(col in input) || input[col] === undefined) {
      if (!fillDefaults) continue
      row[col] = res.json?.includes(col) ? '[]' : res.bools?.includes(col) ? 0 : ''
      continue
    }
    const value = input[col]
    if (res.json?.includes(col)) {
      row[col] = JSON.stringify(value ?? [])
      continue
    }
    if (res.bools?.includes(col)) {
      row[col] = value ? 1 : 0
      continue
    }
    row[col] = value === null ? '' : value
  }
  return row
}

/** Storage values -> JS values. */
export function decodeRow(res: Resource, row: Row): Row {
  const out: Row = { ...row }
  for (const col of res.json ?? []) {
    const raw = row[col]
    if (typeof raw === 'string') {
      try {
        out[col] = JSON.parse(raw) as Json
      } catch {
        out[col] = []
      }
    }
  }
  for (const col of res.bools ?? []) {
    out[col] = row[col] === 1 || row[col] === true
  }
  return out
}
