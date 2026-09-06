import { getRouteApi } from '@tanstack/react-router'

import { Reveal } from './Reveal'
import { SplitTitle } from './SplitTitle'

const rootApi = getRouteApi('__root__')

export function About() {
  const { profile } = rootApi.useLoaderData()
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="relative scroll-mt-14 border-t border-(--line) [contain-intrinsic-size:auto_800px] [content-visibility:auto]"
    >
      <div className="mx-auto max-w-[1200px] px-5 py-16">
        <Reveal>
          <SplitTitle
            id="about-title"
            first="About"
            rest="me"
            className="text-[clamp(2.25rem,5vw,4rem)]"
          />
        </Reveal>
        <div className="mt-12 grid grid-cols-[5fr_7fr] items-start gap-8 max-[860px]:grid-cols-1">
          <Reveal>
            <figure className="m-0 overflow-hidden rounded-[18px] border border-(--line-light) bg-(--ink) p-3">
              <img
                src="assets/nefo.jpeg"
                alt={`Portrait of ${profile.firstName} ${profile.lastName}`}
                width={533}
                height={799}
                loading="lazy"
                decoding="async"
                className="h-auto w-full rounded-[10px] grayscale contrast-[1.05] transition-transform duration-500 hover:scale-[1.02]"
              />
              <figcaption className="px-1 pt-3 font-head text-[0.68rem] font-medium tracking-[0.25em] text-(--gray-400) uppercase">
                {profile.firstName} {profile.lastName}, {profile.location}
              </figcaption>
            </figure>
          </Reveal>
          <Reveal delay={120}>
            <p className="font-head text-[clamp(1.25rem,2.4vw,1.75rem)] leading-snug font-semibold tracking-tight">
              I build <strong className="bg-(--white) px-1.5 text-(--black)">interfaces</strong> people
              love to use, backed by solid{' '}
              <strong className="bg-(--white) px-1.5 text-(--black)">systems thinking</strong>,
              from the first wireframe down to the last pixel.
            </p>
            <p className="mt-6 max-w-[60ch] text-[1.02rem] leading-loose text-(--gray-300)">
              {profile.bio}
            </p>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-(--line-light) pt-6">
              <div className="flex flex-col gap-1">
                <dt className="text-[0.65rem] tracking-[0.3em] text-neutral-500 uppercase">
                  Focus
                </dt>
                <dd className="m-0 font-head font-bold">
                  Frontend development · UI/UX design
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-[0.65rem] tracking-[0.3em] text-neutral-500 uppercase">
                  Also
                </dt>
                <dd className="m-0 font-head font-bold">
                  Backend development · Android apps
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-[0.65rem] tracking-[0.3em] text-neutral-500 uppercase">
                  Based in
                </dt>
                <dd className="m-0 font-head font-bold">{profile.location}</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
