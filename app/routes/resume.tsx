import { createFileRoute } from '@tanstack/react-router'

import { SITE_URL, socialUrl } from '../data/portfolio'
import { getResumeData } from '../lib/content'

export const Route = createFileRoute('/resume')({
  component: Resume,
  loader: async () => {
    const data = await getResumeData({ data: undefined })
    return data
  },
  head: ({ loaderData }) => {
    const profile = loaderData?.profile
    const fullName = profile ? `${profile.firstName} ${profile.lastName}` : 'Resume'
    return {
      meta: [
        { title: `Resume: ${fullName}` },
        {
          name: 'description',
          content: `Resume of ${fullName}, ${profile?.title ?? ''} based in ${profile?.location ?? ''}. Download as PDF or DOCX.`,
        },
        { property: 'og:url', content: `${SITE_URL}/resume` },
      ],
      links: [{ rel: 'canonical', href: `${SITE_URL}/resume` }],
    }
  },
})

function Resume() {
  const { profile, skills, experience, education, projects, socials } = Route.useLoaderData()

  const skillGroups: Array<[string, string[]]> = [
    ['Languages', skills.languages],
    ['Frameworks & Tools', skills.frameworks],
    ['Applications', skills.tools],
    ['Practices', skills.traits],
    ...((skills as unknown as Record<string, unknown>).custom != null
      ? ((skills as unknown as Record<string, unknown>).custom as Array<{ key: string; label: string }>).map(
          (g) => [g.label, ((skills as unknown as Record<string, string[]>)[g.key] ?? [])] as [string, string[]]
        )
      : []),
  ].filter((pair): pair is [string, string[]] => pair.length === 2 && Array.isArray(pair[1]) && pair[1].length > 0)

  // Sort experience by start date (newest first)
  const sortedExperience = [...experience].sort((a, b) => {
    const da = a.startDate ? new Date(a.startDate).getTime() : 0
    const db = b.startDate ? new Date(b.startDate).getTime() : 0
    return db - da
  })

  // Sort education by expected/completed date (newest first)
  const sortedEducation = [...education].sort((a, b) => {
    const da = a.expected || a.completed ? new Date(a.expected || a.completed || '').getTime() : 0
    const db = b.expected || b.completed ? new Date(b.expected || b.completed || '').getTime() : 0
    return db - da
  })

  // Sort projects by date (newest first)
  const sortedProjects = [...projects].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0
    const db = b.date ? new Date(b.date).getTime() : 0
    return db - da
  })

  function fmtDate(d: string) {
    if (!d) return ''
    const date = new Date(d)
    return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const contactParts = [
    profile.location,
    socialUrl(socials, 'email').replace(/^mailto:/, ''),
    socialUrl(socials, 'linkedin'),
    socialUrl(socials, 'github'),
  ].filter((part) => part.trim() !== '')

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4 print:hidden">
        <a
          href="/"
          className="font-head text-[0.78rem] font-semibold tracking-[0.2em] uppercase no-underline hover:underline hover:underline-offset-4"
        >
          ← Back
        </a>
        <div className="flex gap-3">
          <a
            href="../resume.pdf"
            download
            className="inline-flex items-center gap-2 rounded-full border border-black bg-black px-6 py-3.5 font-head text-[0.78rem] font-extrabold tracking-[0.2em] text-white uppercase no-underline transition-colors duration-200 hover:bg-transparent hover:text-black"
          >
            PDF ↓
          </a>
          <a
            href="../resume.docx"
            download
            className="inline-flex items-center gap-2 rounded-full border border-black bg-transparent px-6 py-3.5 font-head text-[0.78rem] font-extrabold tracking-[0.2em] uppercase no-underline transition-colors duration-200 hover:bg-black hover:text-white"
          >
            DOCX ↓
          </a>
        </div>
      </div>

      <article className="mx-auto max-w-[820px] px-6 pt-14 pb-20 print:max-w-none print:p-0">
        <header className="mb-8 border-b-2 border-black pb-6">
          <h1 className="font-head m-0 mb-1 text-[clamp(2.25rem,6vw,3.5rem)] font-extrabold tracking-tight uppercase">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="m-0 mb-2 text-[1.05rem] font-bold">{profile.title}</p>
          <p className="m-0 text-[0.85rem] break-all text-neutral-600">
            {contactParts.join(' · ')}
          </p>
        </header>

        <section className="mb-8">
          <h2 className="font-head mt-0 mb-4 border-b border-black pb-2 text-[0.8rem] font-bold tracking-[0.3em] uppercase">
            Summary
          </h2>
          <p className="m-0 text-[0.95rem] leading-loose text-neutral-800">
            {profile.bio}
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-head mt-0 mb-4 border-b border-black pb-2 text-[0.8rem] font-bold tracking-[0.3em] uppercase">
            Skills
          </h2>
          {skillGroups.map(([label, items]) => (
            <p
              key={label}
              className="m-0 mb-1.5 text-[0.95rem] leading-loose text-neutral-800"
            >
              <strong>{label}:</strong> {items.join(', ')}
            </p>
          ))}
        </section>

        {sortedExperience.length > 0 && (
          <section className="mb-8">
            <h2 className="font-head mt-0 mb-4 border-b border-black pb-2 text-[0.8rem] font-bold tracking-[0.3em] uppercase">
              Experience
            </h2>
            {sortedExperience.map((item) => (
              <div
                key={`${item.role}-${item.organization}`}
                className="mb-5"
              >
                <div className="mb-1 flex flex-wrap justify-between gap-x-4 gap-y-1">
                  <strong>
                    {item.role}, {item.organization}
                  </strong>
                  <span className="text-[0.85rem] font-semibold text-neutral-600">
                    {item.period || `${fmtDate(item.startDate)} – ${item.endDate ? fmtDate(item.endDate) : 'Present'}`}
                  </span>
                </div>
                <p className="m-0 text-[0.95rem] leading-loose text-neutral-800">
                  {item.summary}
                </p>
              </div>
            ))}
          </section>
        )}

        <section className="mb-8">
          <h2 className="font-head mt-0 mb-4 border-b border-black pb-2 text-[0.8rem] font-bold tracking-[0.3em] uppercase">
            Education
          </h2>
          {sortedEducation.map((item) => (
            <div key={item.institution} className="mb-5">
              <div className="mb-1 flex flex-wrap justify-between gap-x-4 gap-y-1">
                <strong>{item.institution}</strong>
                <span className="text-[0.85rem] font-semibold text-neutral-600">
                  {item.expected ?? item.completed ?? ''}
                </span>
              </div>
              <p className="m-0 text-[0.95rem] leading-loose text-neutral-800">
                {item.degree}, {item.location}
              </p>
            </div>
          ))}
        </section>

        <section className="mb-8">
          <h2 className="font-head mt-0 mb-4 border-b border-black pb-2 text-[0.8rem] font-bold tracking-[0.3em] uppercase">
            Projects
          </h2>
          {sortedProjects
            .filter((project) => project.hideFromResume !== true)
            .map((project) => (
            <div key={project.id} className="mb-5">
              <div className="mb-1 flex flex-wrap justify-between gap-x-4 gap-y-1">
                <strong>{project.title}</strong>
                <span className="text-[0.85rem] font-semibold text-neutral-600">
                  {project.date}
                </span>
              </div>
              <p className="m-0 text-[0.95rem] leading-loose text-neutral-800">
                {project.summary}
              </p>
              <p className="m-0 text-[0.85rem] leading-loose text-neutral-600">
                Built with: {project.chips.join(', ')}
              </p>
            </div>
          ))}
        </section>
      </article>
    </main>
  )
}
