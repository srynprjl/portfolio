import { useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'

const rootApi = getRouteApi('__root__')

function LiveClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <span suppressHydrationWarning>
      {new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kathmandu',
      }).format(now)}
    </span>
  )
}

export function Hero() {
  const { profile } = rootApi.useLoaderData()
  return (
    <header
      id="top"
      className="relative flex min-h-svh flex-col justify-center overflow-hidden px-5 py-16"
    >
      <h1
        aria-label={`${profile.firstName} ${profile.lastName}`}
        className="font-display text-[clamp(3.5rem,17vw,24rem)] leading-[0.95] tracking-[0.005em] whitespace-nowrap uppercase"
      >
        <span
          aria-hidden="true"
          className="block motion-safe:animate-slide-from-left"
        >
          {profile.firstName}
        </span>
        <span
          aria-hidden="true"
          className="mt-[clamp(0.5rem,1.5vw,1.5rem)] block motion-safe:animate-slide-from-right"
        >
          {/* Vector outline: SVG strokes scale crisply at every zoom,
              unlike -webkit-text-stroke which rasterizes unevenly. */}
          <svg
            viewBox="0 0 600 130"
            preserveAspectRatio="xMinYMid meet"
            className="block h-auto w-full"
            aria-hidden="true"
            focusable="false"
          >
            <text
              x="0"
              y="100"
              fontFamily="Anton, 'Arial Narrow', sans-serif"
              fontWeight="400"
              fontSize="100"
              letterSpacing="0.5"
              fill="none"
              className="[stroke:var(--white)]"
              strokeWidth="1"
            >
              {profile.lastName.toUpperCase()}
            </text>
          </svg>
        </span>
      </h1>
      <div className="mt-14 flex flex-wrap items-baseline gap-x-6 gap-y-2 motion-safe:animate-fade-up">
        <span className="font-head text-[clamp(0.85rem,2vw,1.1rem)] font-bold">
          {profile.title}
        </span>
        <span className="text-[0.8rem] tracking-[0.2em] text-(--gray-400) uppercase">
          {profile.location}
        </span>
        <a
          href="/resume"
          className="text-[0.85rem] font-bold tracking-[0.2em] uppercase underline underline-offset-4 hover:decoration-2"
        >
          Resume →
        </a>
      </div>
      <p
        className="mt-5 text-[0.9rem] text-(--gray-400) motion-safe:animate-fade-up"
        style={{ animationDelay: '1.1s' }}
      >
        Open to internships and collaborations.
      </p>

      <a
        href="#contact"
        aria-label="Open to internships. Go to contact."
        className="group absolute right-6 bottom-20 hidden h-28 w-28 items-center justify-center text-(--white) sm:flex"
      >
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full motion-safe:animate-rotate-slow"
        >
          <defs>
            <path
              id="badge-circle"
              d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
              fill="none"
            />
          </defs>
          <text
            fill="currentColor"
            fontSize="10"
            letterSpacing="2.2"
            className="font-head uppercase"
          >
            <textPath href="#badge-circle">
              Open to internships · Let us talk ·
            </textPath>
          </text>
        </svg>
        <span
          aria-hidden="true"
          className="text-xl transition-transform duration-300 group-hover:rotate-45"
        >
          ↗
        </span>
      </a>

      <div className="pointer-events-none absolute inset-x-5 bottom-6 flex items-end justify-between font-mono text-[0.68rem] tracking-[0.2em] text-(--gray-400) uppercase sm:inset-x-8">
        <span>27.7172° N, 85.3240° E</span>
        <span>
          KTM <LiveClock />
        </span>
      </div>
    </header>
  )
}
