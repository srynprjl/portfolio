import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface DropdownItem {
  key: string
  label: string
  href: string
}

/**
 * Minimal click-to-open dropdown menu. Closes on outside click or Escape.
 * Styling is passed in so it works on both dark and light surfaces.
 */
export function Dropdown({
  label,
  title,
  button,
  buttonClassName,
  items,
  panelClassName,
  itemClassName,
  labelClassName,
  arrowClassName,
}: {
  label: string
  title?: string
  button: ReactNode
  buttonClassName: string
  items: DropdownItem[]
  panelClassName: string
  itemClassName: string
  labelClassName?: string
  arrowClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open ])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={title ?? label}
        className={buttonClassName}
      >
        {button}
      </button>
      <div
        role="menu"
        aria-label={label}
        className={`absolute z-50 transition-all duration-200 ${
          open ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0'
        } ${panelClassName}`}
      >
        {items.map((item) => (
          <a
            key={item.key}
            role="menuitem"
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className={itemClassName}
          >
            <span className={labelClassName}>{item.label}</span>
            <span aria-hidden="true" className={arrowClassName}>
              ↗
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
