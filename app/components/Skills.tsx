import { getRouteApi } from '@tanstack/react-router'

import { Reveal } from './Reveal'
import { SplitTitle } from './SplitTitle'

const rootApi = getRouteApi('__root__')

const BUILTIN_GROUPS = [
  { key: 'languages', label: 'Languages' },
  { key: 'frameworks', label: 'Frameworks & Tools' },
  { key: 'tools', label: 'Applications' },
  { key: 'traits', label: 'Developer Traits' },
]

export function Skills() {
  const { skills } = rootApi.useLoaderData()
  const s = skills as unknown as Record<string, unknown>

  const customGroups = (Array.isArray(s.custom) ? s.custom : []) as Array<{ key: string; label: string }>
  const allGroups = [
    ...BUILTIN_GROUPS,
    ...customGroups.map((g) => ({ key: g.key, label: g.label })),
  ].filter((g) => {
    const items = s[g.key]
    return Array.isArray(items) && items.length > 0
  })

  return (
    <section
      id="skills"
      aria-labelledby="skills-title"
      className="relative scroll-mt-14 border-t border-(--line) [contain-intrinsic-size:auto_800px] [content-visibility:auto]"
    >
      <div className="mx-auto max-w-[1200px] px-5 py-16">
        <Reveal>
          <SplitTitle
            id="skills-title"
            first="My"
            rest="skills"
            className="text-[clamp(2.25rem,5vw,4rem)]"
          />
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-(--line-light) bg-(--line) max-md:grid-cols-1">
          {allGroups.map((group, i) => {
            const items = (Array.isArray(s[group.key]) ? s[group.key] : []) as string[]
            return (
              <Reveal
                key={group.key}
                delay={(i % 2) * 100}
                className="flex flex-col"
              >
                <article className="flex-1 bg-(--black) p-6 transition-colors duration-200 hover:bg-(--panel)">
                  <h3 className="font-head text-[0.75rem] font-semibold tracking-[0.3em] text-neutral-500 uppercase">
                    {group.label}
                  </h3>
                  <div className="font-head mt-1 mb-5 text-[2rem] font-black tracking-tight">
                    {String(items.length).padStart(2, '0')}
                  </div>
                  <ul className="m-0 flex flex-wrap gap-2 p-0">
                    {items.map((skill) => (
                      <li
                        key={skill}
                        className="rounded-full border border-current px-3.5 py-1.5 text-[0.82rem] font-semibold opacity-90 transition-all duration-200 hover:-translate-y-0.5 hover:border-(--white) hover:bg-(--white) hover:text-(--black) hover:opacity-100"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
