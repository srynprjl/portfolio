import { getRouteApi } from '@tanstack/react-router'

import { useHashPrefix } from './useHashPrefix'

const rootApi = getRouteApi('__root__')

const BASE_LINKS: Array<readonly [string, string]> = [
  ['About', '#about'],
  ['Skills', '#skills'],
  ['Projects', '#projects'],
  ['Contact', '#contact'],
  ['Resume', '/resume'],
]

export function Footer() {
  const year = new Date().getFullYear()
  const prefix = useHashPrefix()
  const { designs, blogs } = rootApi.useLoaderData()

  const links: Array<readonly [string, string]> = [
    ...BASE_LINKS.slice(0, 3),
    ...(designs.length > 0 ? [['Designs', '#designs'] as const] : []),
    ...BASE_LINKS.slice(3),
    ...(blogs.length > 0 ? [['Blog', '/blog'] as const] : []),
  ]

  return (
    <footer className="border-t border-(--line-light) bg-(--black) text-(--white)">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-6 font-head text-[0.7rem] font-semibold tracking-[0.18em] uppercase">
        <span className="text-(--gray-400)">
          © {year} sysnefo
        </span>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-5 gap-y-2"
        >
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href.startsWith('#') ? `${prefix}${href}` : href}
              className="text-(--gray-400) no-underline transition-colors hover:text-(--white)"
            >
              {label}
            </a>
          ))}
        </nav>
        <a
          href={prefix === '' ? '#top' : '/'}
          className="text-(--gray-400) no-underline transition-colors hover:text-(--white)"
        >
          Back to top ↑
        </a>
      </div>
    </footer>
  )
}
