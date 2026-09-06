import { useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'

import { Dropdown } from './Dropdown'
import { GitHubIcon, MoonIcon, SunIcon } from './icons'
import { useHashPrefix } from './useHashPrefix'

const rootApi = getRouteApi('__root__')

const BASE_LINKS: Array<readonly [string, string]> = [
  ['About', '#about'],
  ['Skills', '#skills'],
  ['Education', '#journey'],
  ['Projects', '#projects'],
  ['Contact', '#contact'],
]

/** Forge profiles from the database. Entries with an empty URL are skipped. */
function useForges() {
  const { codeProfiles } = rootApi.useLoaderData()
  return codeProfiles
    .filter((forge) => forge.url.trim() !== '')
    .map((forge) => ({ key: forge.id, label: forge.label, href: forge.url }))
}

export function Navbar() {
  const [atTop, setAtTop] = useState(true)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY <= 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const visible = atTop || hovering
  const prefix = useHashPrefix()
  const { designs, blogs } = rootApi.useLoaderData()
  const forges = useForges()

  const links: Array<readonly [string, string]> = [
    ...BASE_LINKS.slice(0, 4),
    ...(designs.length > 0 ? [['Designs', '#designs'] as const] : []),
    ...BASE_LINKS.slice(4),
    ...(blogs.length > 0 ? [['Blog', '/blog'] as const] : []),
  ]

  return (
    <>
    <nav
      aria-label="Primary"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 py-4 text-white mix-blend-difference transition-transform duration-300 sm:px-6 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <a
        href={prefix === '' ? '#top' : '/'}
        className="font-head text-xs font-extrabold tracking-[0.22em] no-underline"
      >
        SP
      </a>
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="hidden items-center gap-6 lg:flex">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href.startsWith('#') ? `${prefix}${href}` : href}
              className="inline-block font-head text-[0.7rem] font-semibold uppercase tracking-[0.18em] opacity-75 transition-all duration-200 hover:scale-105 hover:opacity-100"
            >
              {label}
            </a>
          ))}
        </div>
        <a
          href="/resume"
          className="inline-block rounded-full border border-white px-3 py-1.5 font-head text-[0.7rem] font-semibold uppercase tracking-[0.18em] no-underline opacity-90 transition-all duration-200 hover:scale-105 hover:bg-white hover:text-black hover:opacity-100"
        >
          Resume
        </a>
        <Dropdown
          label="Code profiles"
          title="Code"
          button={<GitHubIcon />}
          buttonClassName="block opacity-75 transition-all duration-200 hover:-translate-y-px hover:opacity-100 [&>svg]:block [&>svg]:h-[19px] [&>svg]:w-[19px]"
          items={forges}
          panelClassName="top-full right-0 mt-3 w-52 origin-top-right overflow-hidden rounded-xl border border-white bg-black py-1"
          itemClassName="group flex items-center justify-between gap-8 border-b border-white/10 px-4 py-3 font-head text-[0.7rem] font-semibold uppercase tracking-[0.18em] no-underline transition-colors duration-150 last:border-b-0 hover:bg-white hover:text-black"
          arrowClassName="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
        <ThemeToggle />
      </div>
    </nav>
      {!atTop && (
        <div
          aria-hidden="true"
          onMouseEnter={() => setHovering(true)}
          className="fixed inset-x-0 top-0 z-40 h-3"
        />
      )}
    </>
  )
}

function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('sp-theme')
      if (saved === 'light' || saved === 'dark') setTheme(saved)
    } catch {
      /* storage unavailable — stay dark */
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light')
    } else {
      root.removeAttribute('data-theme')
    }
    try {
      window.localStorage.setItem('sp-theme', theme)
    } catch {
      /* ignore */
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#ffffff' : '#000000')
  }, [theme])

  const isLight = theme === 'light'
  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Dark mode' : 'Light mode'}
      className="block opacity-75 transition-all duration-200 hover:-translate-y-px hover:opacity-100 [&>svg]:block [&>svg]:h-[19px] [&>svg]:w-[19px]"
    >
      {isLight ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}
