import type { ReactNode } from 'react'

import { OutlineText } from './OutlineText'

/**
 * Section title with the hero treatment: first word filled,
 * remainder outlined, optional ghost index number.
 */
export function SplitTitle({
  id,
  first,
  rest,
  index,
  className = '',
  children,
}: {
  id?: string
  first: string
  rest?: string
  index?: string
  className?: string
  children?: ReactNode
}) {
  const title = (
    <h2
      id={id}
      className={`font-head leading-none font-black tracking-tight uppercase ${className}`}
    >
      {first}
      {rest ? (
        <>
          {' '}
          <OutlineText
            text={rest}
            fontFamily="Poppins"
            fontWeight={900}
            strokeWidth={1.5}
          />
        </>
      ) : null}
      {children}
    </h2>
  )

  if (!index) return title

  return (
    <div className="flex items-end justify-between gap-6">
      {title}
      <span
        aria-hidden="true"
        className="font-display text-[clamp(3rem,8vw,7rem)] leading-none"
      >
        <OutlineText
          text={index}
          fontFamily="Anton"
          fontWeight={400}
          stroke="var(--gray-700)"
          strokeWidth={1}
        />
      </span>
    </div>
  )
}
