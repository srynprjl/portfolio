import { useEffect, useState } from 'react'

/**
 * Vector outline text. HTML -webkit-text-stroke rasterizes unevenly
 * (ghosted edges at 100% zoom, clean when zoomed), so display
 * outlines render as SVG geometry instead: crisp at every scale.
 *
 * Width is measured (canvas, re-measured once webfonts arrive) so
 * inline flow matches the surrounding text size.
 */
export function OutlineText({
  text,
  fontFamily,
  fontWeight,
  stroke = 'var(--white)',
  strokeWidth = 1.5,
  className = '',
}: {
  text: string
  fontFamily: string
  fontWeight: number
  stroke?: string
  strokeWidth?: number
  className?: string
}) {
  const display = text.toUpperCase()
  const [width, setWidth] = useState(display.length * 70)

  useEffect(() => {
    let live = true
    const run = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.font = `${fontWeight} 100px ${fontFamily}`
        const w = ctx.measureText(display).width
        if (live && w > 0) setWidth(w)
      } catch {
        /* canvas unavailable, keep estimate */
      }
    }
    run()
    document.fonts
      ?.load(`${fontWeight} 100px ${fontFamily}`)
      .then(run)
      .catch(() => {})
    return () => {
      live = false
    }
  }, [display, fontFamily, fontWeight])

  return (
    <svg
      viewBox={`0 0 ${width} 100`}
      preserveAspectRatio="xMinYMid meet"
      focusable="false"
      className={`inline-block h-[1em] w-auto align-[-0.22em] ${className}`}
    >
      <text
        x="0"
        y="76"
        fontFamily={`${fontFamily}, sans-serif`}
        fontWeight={fontWeight}
        fontSize="100"
        fill="none"
        style={{ stroke }}
        strokeWidth={strokeWidth}
      >
        {display}
      </text>
    </svg>
  )
}
