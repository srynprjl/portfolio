import { createServerFn } from '@tanstack/react-start'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { adminPassword } from './db/config.js'
import { getDb } from './db/index.js'
import { ensureSeeded } from './db/seed.js'
import { decodeRow, resourceByName } from './db/types.js'
import type {
  BlogPost,
  CodeProfile,
  Design,
  EducationItem,
  ExperienceItem,
  Profile,
  Project,
  Row,
  SkillGroups,
  SocialLink,
} from './db/types.js'

export interface SiteContact {
  email: string
  emailUrl: string
  linkedin: string
  github: string
}

export interface SiteContent {
  profile: Profile
  skills: SkillGroups
  codeProfiles: CodeProfile[]
  socials: SocialLink[]
  experience: ExperienceItem[]
  education: EducationItem[]
  projects: Project[]
  designs: Design[]
  blogs: BlogPost[]
  contact: SiteContact
}

export interface BlogPostFull extends BlogPost {
  content: string
}

async function readyDb() {
  const { driver } = await getDb()
  await ensureSeeded(driver)
  return driver
}

function visibleSocials(socials: SocialLink[]): SocialLink[] {
  return socials.filter((s) => s.hide !== true && s.url.trim() !== '')
}

function contactOf(socials: SocialLink[]): SiteContact {
  const url = (id: string): string => {
    const found = visibleSocials(socials).find((s) => s.id === id)
    return found ? found.url : ''
  }
  const emailUrl = url('email')
  return {
    email: emailUrl.replace(/^mailto:/, ''),
    emailUrl,
    linkedin: url('linkedin'),
    github: url('github'),
  }
}

async function fetchSiteContent(): Promise<SiteContent> {
  const driver = await readyDb()
  const getAll = async <T>(name: string): Promise<T[]> => {
    const resource = resourceByName(name)
    if (!resource) throw new Error(`Unknown collection: ${name}`)
    return (await driver.all(resource.table)).map(
      (row) => decodeRow(resource, row) as unknown as T,
    )
  }
  const getOne = async <T>(name: string): Promise<T> => {
    const rows = await getAll<T>(name)
    const first = rows[0]
    if (!first) throw new Error(`${name} is not seeded yet.`)
    return first
  }

  const [profile, skills, codeProfiles, socials, experience, education, projects, designs, blogs] =
    await Promise.all([
      getOne<Profile>('profile'),
      getOne<SkillGroups>('skills'),
      getAll<CodeProfile>('code-profiles'),
      getAll<SocialLink>('socials'),
      getAll<ExperienceItem>('experience'),
      getAll<EducationItem>('education'),
      getAll<Project>('projects'),
      getAll<Design>('designs'),
      getAll<BlogPost>('blogs'),
    ])

  return {
    profile,
    skills,
    codeProfiles,
    socials: visibleSocials(socials),
    experience,
    education,
    projects: projects.filter((p) => p.hideFromPage !== true),
    designs,
    blogs: blogs.filter((p) => p.hide !== true),
    contact: contactOf(socials),
  }
}

async function fetchPost(slug: string): Promise<BlogPostFull | null> {
  const driver = await readyDb()
  const resource = resourceByName('blogs')
  if (!resource) throw new Error('Unknown collection: blogs')
  const rows = await driver.all(resource.table)
  const match = rows
    .map((row) => ({ ...(decodeRow(resource, row) as unknown as BlogPost), content: String(row.content ?? '') }) as BlogPostFull)
    .find((p) => p.id === slug && p.hide !== true)
  return match ?? null
}

/** Everything the public pages render. Auto-seeds a fresh database. */
export const getSiteContent = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SiteContent> => fetchSiteContent(),
)

/** Visible blog posts for the listing page. */
export const getBlogList = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BlogPost[]> => {
    const driver = await readyDb()
    const resource = resourceByName('blogs')
    if (!resource) throw new Error('Unknown collection: blogs')
    const rows = await driver.all(resource.table)
    return rows
      .map((row) => decodeRow(resource, row) as unknown as BlogPost)
      .filter((post) => post.hide !== true)
  },
)

/** Single post with body, or null when missing/hidden. */
export const getPost = createServerFn({ method: 'GET' })
  .validator((slug: unknown) => String(slug ?? ''))
  .handler(async ({ data: slug }): Promise<BlogPostFull | null> => fetchPost(slug))

export interface ResumeData {
  profile: Profile
  skills: SkillGroups
  socials: SocialLink[]
  experience: ExperienceItem[]
  education: EducationItem[]
  projects: Project[]
  contact: SiteContact
}

/** All data the /resume page needs, read from the database. */
export const getResumeData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ResumeData> => {
    const driver = await readyDb()
    const getAll = async <T>(name: string): Promise<T[]> => {
      const resource = resourceByName(name)
      if (!resource) throw new Error(`Unknown collection: ${name}`)
      return (await driver.all(resource.table)).map(
        (row) => decodeRow(resource, row) as unknown as T,
      )
    }
    const getOne = async <T>(name: string): Promise<T> => {
      const rows = await getAll<T>(name)
      const first = rows[0]
      if (!first) throw new Error(`${name} is not seeded yet.`)
      return first
    }

    const [profile, skills, socials, experience, education, projects] =
      await Promise.all([
        getOne<Profile>('profile'),
        getOne<SkillGroups>('skills'),
        getAll<SocialLink>('socials'),
        getAll<ExperienceItem>('experience'),
        getAll<EducationItem>('education'),
        getAll<Project>('projects'),
      ])

    return {
      profile,
      skills,
      socials,
      experience,
      education,
      projects,
      contact: contactOf(socials),
    }
  },
)

/**
 * Write the database back to app/data/*.json (+ blog Markdown), so a
 * static rebuild picks up admin edits. Files for empty tables are
 * left untouched.
 */
export const exportToJson = createServerFn({ method: 'POST' })
  .validator((data: unknown) => (data ?? {}) as Row)
  .handler(async ({ data }): Promise<{ exported: string[] }> => {
    const password = String((data as Row).password ?? '')
    const expected = adminPassword()
    if (!expected || password !== expected) {
      throw new Error('Unauthorized: wrong admin password.')
    }
    const driver = await readyDb()
    const root = process.cwd()
    const exported: string[] = []

    const dump = async (
      resourceName: string,
      file: string,
      shape: (rows: Row[]) => unknown,
    ): Promise<void> => {
      const resource = resourceByName(resourceName)
      if (!resource) return
      const rows = await driver.all(resource.table)
      if (rows.length === 0) return
      writeFileSync(
        join(root, 'app', 'data', file),
        `${JSON.stringify(shape(rows.map((row) => decodeRow(resource, row))), null, 2)}\n`,
      )
      exported.push(file)
    }

    const stripId = (row: Row): Row => {
      const { id: _id, ...rest } = row
      return rest
    }

    await dump('profile', 'profile.json', (rows) => stripId(rows[0] ?? {}))
    await dump('skills', 'skills.json', (rows) => stripId(rows[0] ?? {}))
    await dump('code-profiles', 'codeProfiles.json', (rows) => rows)
    await dump('socials', 'socials.json', (rows) => rows)
    await dump('experience', 'experience.json', (rows) => rows)
    await dump('education', 'education.json', (rows) => rows)
    await dump('projects', 'projects.json', (rows) => rows)
    await dump('designs', 'designs.json', (rows) => rows)
    await dump('blogs', 'blogs.json', (rows) =>
      rows.map((row) => {
        const { content, ...meta } = row as Row & { content?: unknown }
        if (typeof content === 'string' && content !== '') {
          const file = String(meta.file ?? `${meta.id}.md`)
          writeFileSync(join(root, 'app', 'content', 'blog', file), content)
        }
        return meta
      }),
    )
    return { exported }
  })
