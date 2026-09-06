import {
  Children,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

const AUTO_ADVANCE_MS = 4500

function perPage() {
  if (typeof window === 'undefined') return 4
  if (window.innerWidth <= 640) return 1
  if (window.innerWidth <= 1024) return 2
  return 4
}

/**
 * Circular auto-playing carousel. Slides never remount, so switching
 * pages is a smooth transform with no reload flash; card images keep
 * `loading="lazy"`, so offscreen slides stay unloaded until paged in.
 * A short last page borrows items from the front, then wraps around.
 */
export function PagedGrid({
  count,
  children,
}: {
  count: number
  children: ReactNode
}) {
  const raw = Children.toArray(children)
  const [page, setPage] = useState(0)
  const [slots, setSlots] = useState(4)
  const [paused, setPaused] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const compute = () => setSlots(perPage())
    compute()
    setReduceMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    )
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  const basePages = Math.max(1, Math.ceil(count / slots))
  const safePage = ((page % basePages) + basePages) % basePages

  // Exact slices: a short last page keeps its own single row.
  const slides = Array.from({ length: basePages }, (_, p) =>
    raw.slice(p * slots, p * slots + slots),
  )

  useEffect(() => {
    if (paused || reduceMotion || basePages <= 1) return
    const timer = setInterval(() => {
      setPage((value) => (value + 1) % basePages)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [paused, reduceMotion, basePages, slots])

  const goTo = useCallback(
    (next: number) => {
      setPage(((next % basePages) + basePages) % basePages)
    },
    [basePages],
  )

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden" style={{ marginTop: '2rem' }}>
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${safePage * 100}%)` }}
        >
          {slides.map((items, p) => (
            <div
              key={p}
              aria-hidden={p !== safePage}
              inert={p !== safePage}
              className="grid min-w-0 max-w-full flex-[0_0_100%] grid-cols-2 gap-6 max-[860px]:grid-cols-1"
            >
              {items}
            </div>
          ))}
        </div>
      </div>
      {basePages > 1 && (
        <div className="mt-7 flex items-center gap-4">
          <button
            type="button"
            onClick={() => goTo(safePage - 1)}
            aria-label="Previous page"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-(--line-light) text-[0.85rem] transition-colors duration-200 hover:bg-(--white) hover:text-(--black) disabled:cursor-default disabled:opacity-30"
          >
            ←
          </button>
          <div
            className="flex flex-1 items-center justify-center gap-2.5"
            role="tablist"
            aria-label="Pages"
          >
            {Array.from({ length: basePages }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === safePage}
                aria-label={`Go to page ${i + 1}`}
                onClick={() => goTo(i)}
                className="h-1.5 w-1.5 rounded-full border-0 bg-(--gray-700) p-0 transition-all duration-200 hover:bg-(--gray-400) aria-selected:scale-125 aria-selected:bg-(--white)"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(safePage + 1)}
            aria-label="Next page"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-(--line-light) text-[0.85rem] transition-colors duration-200 hover:bg-(--white) hover:text-(--black) disabled:cursor-default disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
