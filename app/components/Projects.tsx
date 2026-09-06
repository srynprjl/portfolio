import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getRouteApi } from '@tanstack/react-router'

import type { Project, ProjectSource } from '../data/portfolio'
import { Dropdown } from './Dropdown'
import { PagedGrid } from './PagedGrid'
import { Reveal } from './Reveal'
import { SplitTitle } from './SplitTitle'
import { Thumb } from './Thumb'

const rootApi = getRouteApi('__root__')

function fmtDate(d: string): string {
  if (!d) return ''
  const date = new Date(d)
  return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function Projects() {
  const { projects } = rootApi.useLoaderData()
  const [active, setActive] = useState<Project | null>(null)
  const close = useCallback(() => setActive(null), [])
  const visibleProjects = projects.filter(
    (project) => project.hideFromPage !== true,
  )
  const scrollable = visibleProjects.length > 4

  const cards = (list: Project[]) =>
    list.map((project, i) => (
      <ProjectCard
        key={project.id}
        project={project}
        index={i}
        onOpen={() => setActive(project)}
      />
    ))

  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="relative scroll-mt-14 border-t border-(--line) [contain-intrinsic-size:auto_800px] [content-visibility:auto]"
    >
      <div className="mx-auto max-w-[1200px] px-5 py-16">
        <Reveal>
          <SplitTitle
            id="projects-title"
            first="My"
            rest="projects"
            className="text-[clamp(2.25rem,5vw,4rem)]"
          />
        </Reveal>
        {scrollable ? (
          <PagedGrid count={visibleProjects.length}>{cards(visibleProjects)}</PagedGrid>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-6 max-[860px]:grid-cols-1">
            {cards(visibleProjects)}
          </div>
        )}
      </div>
      {active && <ProjectModal project={active} onClose={close} />}
    </section>
  )
}

function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: Project
  index: number
  onOpen: () => void
}) {
  return (
    <Reveal delay={(index % 2) * 100}>
      <article className="flex h-full flex-col rounded-md border border-(--line-light) bg-(--black) transition-colors duration-200 hover:border-(--white) hover:bg-(--panel)">
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          aria-label={`Open details for ${project.title}`}
          className="block w-full cursor-pointer border-0 bg-transparent p-0 focus-visible:rounded-t-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--white)"
        >
          <span
            aria-hidden="true"
            className="block aspect-[21/9] overflow-hidden rounded-t-md border-b border-(--line-light) bg-(--ink)"
          >
            <Thumb
              src={project.image}
              title={project.title}
              alt=""
              width={800}
              height={450}
              className="h-full w-full rounded-t-md object-cover"
            />
          </span>
        </button>
        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-head text-[1.1rem] font-black tracking-tight uppercase">
              {project.title}
            </h3>
            <span className="text-[0.7rem] tracking-[0.15em] whitespace-nowrap text-neutral-500 uppercase">
              {fmtDate(project.date)}
            </span>
          </div>
          <p className="m-0 text-[0.82rem] leading-relaxed text-(--gray-300) line-clamp-3">
            {project.summary}
          </p>
          <ul
            aria-label="Technologies used"
            className="m-0 flex list-none flex-wrap gap-2 p-0"
          >
            {project.chips.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-neutral-700 px-2.5 py-1 font-mono text-[0.68rem] font-semibold text-(--gray-400)"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-(--line-light) px-4 pt-3 pb-4">
          <button
            type="button"
            onClick={onOpen}
            className="group inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 font-head text-[0.72rem] font-extrabold tracking-[0.25em] uppercase transition-opacity duration-200 hover:opacity-65"
          >
            View details{' '}
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200 group-hover:translate-x-1.5"
            >
              →
            </span>
          </button>
          <span className="flex items-center gap-4">
            <CardSource title={project.title} sources={project.sources} />
            <CardWebsite url={project.liveUrl} />
          </span>
        </div>
      </article>
    </Reveal>
  )
}

function ProjectModal({
  project,
  onClose,
}: {
  project: Project
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector('button')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  // Portaled to document.body: cards live inside transformed ancestors
  // (scroll reveals, carousel track), which would otherwise hijack
  // `position: fixed` and knock the modal off center.
  return createPortal(
    <div
      onClick={onClose}
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm motion-safe:animate-backdrop-in"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`modal-title-${project.id}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90svh] w-full max-w-[760px] overflow-y-auto rounded-md border border-(--white) bg-(--black) motion-safe:animate-modal-up"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close project details"
          className="float-right flex h-12 w-12 cursor-pointer items-center justify-center border-0 border-b border-l border-(--line-light) bg-(--black) text-xl text-(--white) hover:bg-(--white) hover:text-(--black)"
        >
          ✕
        </button>
        <div className="border-b border-(--line-light)">
          <Thumb
            src={project.image}
            title={project.title}
            alt={`${project.title} project mockup`}
            width={1200}
            height={514}
            eager
            className="aspect-[21/9] w-full rounded-t-[20px] object-cover"
          />
        </div>
        <div className="p-6">
          <p className="font-head text-[0.72rem] font-semibold tracking-[0.28em] text-neutral-500 uppercase">
            {fmtDate(project.date)}
          </p>
          <h2
            id={`modal-title-${project.id}`}
            className="font-head mt-4 text-[clamp(2rem,5vw,3rem)] font-black tracking-tight uppercase"
          >
            {project.title}
          </h2>
          <ul
            aria-label="Technologies used"
            className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0"
          >
            {project.chips.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-neutral-700 px-2.5 py-1 font-mono text-[0.68rem] font-semibold text-(--gray-400)"
              >
                {chip}
              </li>
            ))}
          </ul>
          <p className="font-head mt-5 mb-2.5 text-[0.7rem] font-extrabold tracking-[0.3em] text-neutral-500 uppercase">
            Why it was built
          </p>
          <p className="m-0 text-[1rem] leading-loose text-(--gray-300)">
            {project.motivation}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <SourceLinks title={project.title} sources={project.sources} />
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-(--white) bg-transparent px-6 py-3.5 font-head text-[0.78rem] font-extrabold tracking-[0.2em] uppercase no-underline transition-colors duration-200 hover:bg-(--white) hover:text-(--black)"
              >
                Website ↗
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex items-center gap-2 rounded-full border border-(--white) bg-transparent px-6 py-3.5 font-head text-[0.78rem] font-extrabold tracking-[0.2em] uppercase opacity-35 pointer-events-none"
              >
                Website soon
              </span>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function SourceLinks({
  title,
  sources: rawSources,
}: {
  title: string
  sources: ProjectSource[]
}) {
  const sources = rawSources.filter((source) => source.url.trim() !== '')

  if (sources.length === 0) return null

  if (sources.length === 1) {
    const [source] = sources
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-(--white) bg-(--white) px-6 py-3.5 font-head text-[0.78rem] font-extrabold tracking-[0.2em] uppercase no-underline text-(--black) transition-colors duration-200 hover:bg-transparent hover:text-(--white)"
      >
        {source.label} ↗
      </a>
    )
  }

  return (
    <Dropdown
      label={`Source code for ${title}`}
      button={<>Source ↓</>}
      buttonClassName="inline-flex cursor-pointer items-center gap-2 rounded-full border border-(--white) bg-(--white) px-6 py-3.5 font-head text-[0.78rem] font-extrabold tracking-[0.2em] uppercase text-(--black) transition-colors duration-200 hover:bg-transparent hover:text-(--white)"
      items={sources.map((source) => ({
        key: source.label,
        label: source.label,
        href: source.url,
      }))}
      panelClassName="bottom-full left-0 mb-3 w-56 origin-bottom-left overflow-hidden rounded-md border border-white bg-black py-1 text-left"
      itemClassName="group flex items-center justify-between gap-8 border-b border-white/10 px-4 py-3 font-head text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white no-underline transition-colors duration-150 last:border-b-0 hover:bg-white hover:text-black"
      arrowClassName="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
    />
  )
}

export function CardSource({
  title,
  sources: rawSources,
}: {
  title: string
  sources: ProjectSource[]
}) {
  const sources = rawSources.filter((source) => source.url.trim() !== '')

  if (sources.length === 0) return null

  if (sources.length === 1) {
    const [source] = sources
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noreferrer"
        className="font-head inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[0.7rem] font-bold tracking-[0.18em] uppercase opacity-70 no-underline transition-opacity duration-200 hover:opacity-100"
      >
        {source.label} <span aria-hidden="true">↗</span>
      </a>
    )
  }

  return (
    <Dropdown
      label={`Source code for ${title}`}
      button={
        <>
          Source <span aria-hidden="true">↓</span>
        </>
      }
      buttonClassName="font-head inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[0.7rem] font-bold tracking-[0.18em] uppercase opacity-70 transition-opacity duration-200 hover:opacity-100"
      items={sources.map((source) => ({
        key: source.label,
        label: source.label,
        href: source.url,
      }))}
      panelClassName="bottom-full left-0 mb-2 w-48 origin-bottom-left overflow-hidden rounded-md border border-white bg-black py-1 text-left"
      itemClassName="group flex items-center justify-between gap-8 border-b border-white/10 px-4 py-3 font-head text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white no-underline transition-colors duration-150 last:border-b-0 hover:bg-white hover:text-black"
      arrowClassName="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
    />
  )
}

export function CardWebsite({ url }: { url: string }) {
  if (!url || url.trim() === '') return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="font-head inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[0.7rem] font-bold tracking-[0.18em] uppercase opacity-70 no-underline transition-opacity duration-200 hover:opacity-100"
    >
      Website <span aria-hidden="true">↗</span>
    </a>
  )
}
