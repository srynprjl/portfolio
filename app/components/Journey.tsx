import { getRouteApi } from '@tanstack/react-router'

import { Reveal } from './Reveal'
import { SplitTitle } from './SplitTitle'

const rootApi = getRouteApi('__root__')

/**
 * Journey section — adapts gracefully:
 * - If `experience` entries exist in `app/data/experience.json` they render first.
 * - If the list is empty, the section blends into an
 *   education-forward layout, so the page stays clean until
 *   real experience data is added.
 */
export function Journey() {
  const { education, experience } = rootApi.useLoaderData()
  const hasExperience = experience.length > 0

  return (
    <section
      id="journey"
      aria-labelledby="journey-title"
      className="relative scroll-mt-14 border-t border-(--line) [contain-intrinsic-size:auto_800px] [content-visibility:auto]"
    >
      <div className="mx-auto max-w-[1200px] px-5 py-16">
        <Reveal>
          <SplitTitle
            id="journey-title"
            first={hasExperience ? 'Experience &' : 'Education'}
            rest={hasExperience ? 'Education' : undefined}
            className="text-[clamp(2.25rem,5vw,4rem)]"
          />
        </Reveal>

        <div className="mt-12">
          {hasExperience && (
            <Reveal>
              <div
                aria-label="Experience"
                className="flex flex-col divide-y divide-(--line-light) overflow-hidden rounded-[18px] border border-(--line-light)"
              >
                {experience.map((item, i) => (
                  <article
                    key={`${item.role}-${item.organization}`}
                    className="grid grid-cols-[56px_1fr_auto] items-baseline gap-5 p-5 transition-colors duration-200 hover:bg-(--ink) max-sm:grid-cols-1 max-sm:gap-2"
                  >
                    <span className="font-head text-[0.85rem] font-extrabold tracking-[0.1em] text-(--gray-700)">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="font-head text-[1.15rem] font-extrabold tracking-tight">
                        {item.role}
                      </h3>
                      <p className="mb-1 font-bold">{item.organization}</p>
                      {item.location ? (
                        <span className="text-[0.92rem] text-(--gray-400)">
                          {item.location}
                        </span>
                      ) : null}
                    </div>
                    <span className="font-head text-[0.78rem] font-bold tracking-[0.12em] text-(--gray-400) uppercase">
                      {item.period}
                    </span>
                  </article>
                ))}
              </div>
            </Reveal>
          )}

          <Reveal delay={hasExperience ? 100 : 0}>
            <div
              aria-label="Education"
              className={`flex flex-col divide-y divide-(--line-light) overflow-hidden rounded-[18px] border border-(--line-light) ${hasExperience ? 'mt-6' : ''}`}
            >
              {education.map((item, i) => (
                <article
                  key={item.institution}
                  className="grid grid-cols-[56px_1fr_auto] items-baseline gap-5 p-5 transition-colors duration-200 hover:bg-(--ink) max-sm:grid-cols-1 max-sm:gap-2"
                >
                  <span className="font-head text-[0.85rem] font-extrabold tracking-[0.1em] text-(--gray-700)">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-head text-[1.15rem] font-extrabold tracking-tight">
                      {item.institution}
                    </h3>
                    <p className="mb-1 font-bold">{item.degree}</p>
                    <span className="text-[0.92rem] text-(--gray-400)">
                      {item.location}
                    </span>
                  </div>
                  <span className="font-head text-[0.78rem] font-bold tracking-[0.12em] text-(--gray-400) uppercase">
                    {item.expected ?? item.completed ?? ''}
                  </span>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
