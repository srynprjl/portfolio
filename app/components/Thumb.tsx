/**
 * Card/modal thumbnail with a built-in fallback.
 *
 * Renders the image when `src` is provided, otherwise a template
 * thumbnail: the project's initial set in display type on the
 * panel background. Keeps layout identical in both cases.
 */
export function Thumb({
  src,
  title,
  alt,
  width,
  height,
  className,
  eager = false,
}: {
  src?: string
  title: string
  alt: string
  width: number
  height: number
  className: string
  eager?: boolean
}) {
  if (src && src.trim() !== '') {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? undefined : 'lazy'}
        decoding="async"
        className={className}
      />
    )
  }

  const initial = (title.trim()[0] ?? '•').toUpperCase()

  // NOTE: no `h-full` here on purpose. Percentage heights do not
  // resolve reliably against the aspect-ratio sized wrapper, which
  // collapses the fallback to zero height. A fixed 21/9 ratio (same
  // as every media frame) sizes the div intrinsically instead.
  const fallbackClass = className
    .split(' ')
    .filter((cls) => cls !== 'h-full')
    .join(' ')

  return (
    <div
      aria-hidden="true"
      style={{ aspectRatio: '21 / 9' }}
      className={`flex w-full items-center justify-center bg-(--ink) ${fallbackClass}`}
    >
      <span className="font-display text-[clamp(3rem,8vw,5rem)] leading-none text-(--gray-700)">
        {initial}
      </span>
    </div>
  )
}
