import { useState } from 'react'

import { Navbar } from './Navbar'
import { OutlineText } from './OutlineText'
import { Reveal } from './Reveal'
import {
  GitHubIcon,
  LinkedInIcon,
  MailIcon,
  MoonIcon,
  SunIcon,
} from './icons'

const COLORS: Array<{
  name: string
  hex: string
  token: string
  usage: string
}> = [
  { name: 'Pitch', hex: '#060A13', token: 'bg-(--black)', usage: 'Page background' },
  { name: 'Ink', hex: '#0A101D', token: 'bg-(--ink)', usage: 'Frames and hover fill' },
  { name: 'Panel', hex: '#111A2E', token: 'bg-(--panel)', usage: 'Card hover fill' },
  { name: 'Line', hex: '#1B2540', token: 'border-(--line)', usage: 'Quiet dividers' },
  { name: 'Cloud', hex: '#E5E5E5', token: 'border-(--line-light)', usage: 'Visible borders' },
  { name: 'Mist', hex: '#9AA8BC', token: 'text-(--gray-400)', usage: 'Secondary text' },
  { name: 'Fog', hex: '#C8D2E0', token: 'text-(--gray-300)', usage: 'Body copy' },
  { name: 'White', hex: '#FFFFFF', token: 'text-(--white)', usage: 'Primary text' },
]

function Swatch({
  name,
  hex,
  token,
  usage,
}: {
  name: string
  hex: string
  token: string
  usage: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy hex value"
      className="cursor-pointer border-0 bg-transparent p-0 text-left"
    >
      <span
        aria-hidden="true"
        style={{ backgroundColor: hex }}
        className="block aspect-[16/10] w-full rounded-[12px] border border-(--line-light)"
      />
      <span className="font-head mt-3 block text-[0.95rem] font-bold">
        {name}
      </span>
      <code className="mt-1 block font-mono text-[0.78rem] text-(--gray-400)">
        {hex}
      </code>
      <code className="mt-0.5 block font-mono text-[0.78rem] text-(--gray-400)">
        {token}
      </code>
      <span className="mt-1 block text-[0.82rem] text-(--gray-400)">
        {usage} · {copied ? 'Copied' : 'Click to copy'}
      </span>
    </button>
  )
}

function SectionTitle({ children }: { children: string }) {
  const [first, ...rest] = children.split(' ')
  return (
    <h2 className="font-head text-[clamp(1.75rem,4vw,2.75rem)] leading-none font-black tracking-tight uppercase">
      {first}
      {rest.length > 0 ? (
        <>
          {' '}
          <OutlineText
            text={rest.join(' ')}
            fontFamily="Poppins"
            fontWeight={900}
            strokeWidth={1.5}
          />
        </>
      ) : null}
    </h2>
  )
}

export function DesignSystem() {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative scroll-mt-14 border-t border-(--line)">
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <Reveal>
              <h1 className="font-head text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] font-black tracking-tight uppercase">
                Design
                <br />
                <OutlineText
                  text="system"
                  fontFamily="Poppins"
                  fontWeight={900}
                  strokeWidth={2}
                />
              </h1>
              <p className="mt-6 max-w-[60ch] text-[1.02rem] leading-loose text-(--gray-300)">
                The visual language behind this site. Tokens first,
                components second. This page stays out of the navbar.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="relative scroll-mt-14 border-t border-(--line)">
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <Reveal>
              <SectionTitle>Colors</SectionTitle>
            </Reveal>
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {COLORS.map((color) => (
                <Swatch key={color.name} {...color} />
              ))}
            </div>
          </div>
        </section>

        <section className="relative scroll-mt-14 border-t border-(--line)">
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <Reveal>
              <SectionTitle>Typography</SectionTitle>
            </Reveal>
            <div className="mt-10 flex flex-col gap-8">
              <Reveal>
                <p className="font-display text-[clamp(3rem,10vw,7rem)] leading-none">
                  Aa
                </p>
                <p className="font-head mt-3 text-[0.95rem] font-bold">
                  Display / Anton
                </p>
                <code className="font-mono text-[0.82rem] text-(--gray-400)">
                  font-display
                </code>
                <p className="m-0 mt-1 text-[0.9rem] text-(--gray-400)">
                  Hero name only. Always uppercase.
                </p>
              </Reveal>
              <Reveal>
                <p className="font-head text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold tracking-tight">
                  Headings set the rhythm
                </p>
                <p className="font-head mt-3 text-[0.95rem] font-bold">
                  Heading / Poppins
                </p>
                <code className="font-mono text-[0.82rem] text-(--gray-400)">
                  font-head
                </code>
                <p className="m-0 mt-1 text-[0.9rem] text-(--gray-400)">
                  Titles, labels, buttons, navigation.
                </p>
              </Reveal>
              <Reveal>
                <p className="max-w-[60ch] text-[1.02rem] leading-loose text-(--gray-300)">
                  Body copy stays quiet so ideas stay loud. Nunito carries
                  paragraphs, summaries, and notes at a relaxed line height.
                </p>
                <p className="font-head mt-3 text-[0.95rem] font-bold">
                  Body / Nunito
                </p>
                <code className="font-mono text-[0.82rem] text-(--gray-400)">
                  font-sans
                </code>
                <p className="m-0 mt-1 text-[0.9rem] text-(--gray-400)">
                  Paragraphs and long form text.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="relative scroll-mt-14 border-t border-(--line)">
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <Reveal>
              <SectionTitle>Shape</SectionTitle>
            </Reveal>
            <div className="mt-10 flex flex-wrap items-end gap-8">
              <div>
                <span className="block h-20 w-40 rounded-full border border-(--line-light)" />
                <p className="font-head mt-3 text-[0.85rem] font-bold">Pill</p>
                <code className="font-mono text-[0.78rem] text-(--gray-400)">
                  rounded-full
                </code>
              </div>
              <div>
                <span className="block h-20 w-40 rounded-[18px] border border-(--line-light)" />
                <p className="font-head mt-3 text-[0.85rem] font-bold">Card</p>
                <code className="font-mono text-[0.78rem] text-(--gray-400)">
                  rounded-[18px]
                </code>
              </div>
              <div>
                <span className="block h-20 w-20 rounded-full border border-(--line-light)" />
                <p className="font-head mt-3 text-[0.85rem] font-bold">Circle</p>
                <code className="font-mono text-[0.78rem] text-(--gray-400)">
                  rounded-full
                </code>
              </div>
            </div>
          </div>
        </section>

        <section className="relative scroll-mt-14 border-t border-(--line)">
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <Reveal>
              <SectionTitle>Buttons</SectionTitle>
            </Reveal>
            <div className="mt-10 flex flex-wrap gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-(--white) bg-(--white) px-6 py-3.5 font-head text-[0.78rem] font-extrabold tracking-[0.2em] text-(--black) uppercase">
                Solid ↗
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-(--white) bg-transparent px-6 py-3.5 font-head text-[0.78rem] font-extrabold tracking-[0.2em] uppercase">
                Ghost ↗
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-(--black) bg-(--black) px-6 py-3.5 font-head text-[0.78rem] font-extrabold tracking-[0.2em] text-(--white) uppercase">
                Dark ↗
              </span>
            </div>
            <p className="mt-6 max-w-[60ch] text-[0.9rem] leading-relaxed text-(--gray-400)">
              Solid opens the action, ghost supports it, dark lives on
              paper surfaces. Hover inverts each one.
            </p>
          </div>
        </section>

        <section className="relative scroll-mt-14 border-t border-(--line)">
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <Reveal>
              <SectionTitle>Chips and cards</SectionTitle>
            </Reveal>
            <div className="mt-10 flex flex-wrap gap-2">
              {['React.js', 'Golang', 'Figma', 'UI/UX'].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-neutral-700 px-2.5 py-1 font-mono text-[0.68rem] font-semibold text-(--gray-400)"
                >
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-8 max-w-[420px] rounded-[18px] border border-(--line-light) bg-(--black)">
              <div className="flex aspect-[21/9] items-center justify-center overflow-hidden rounded-t-[18px] border-b border-(--line-light) bg-(--ink)">
                <span className="font-mono text-[0.75rem] text-(--gray-400)">
                  21:9 media
                </span>
              </div>
              <div className="p-4">
                <p className="font-head m-0 text-[1.1rem] font-black tracking-tight uppercase">
                  Card title
                </p>
                <p className="m-0 mt-2 text-[0.82rem] leading-relaxed text-(--gray-300)">
                  Media on top, body in the middle, actions in the footer.
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-(--line-light) px-4 pt-3 pb-4">
                <span className="font-head text-[0.72rem] font-extrabold tracking-[0.25em] uppercase">
                  Details →
                </span>
                <span className="font-head text-[0.7rem] font-bold tracking-[0.18em] uppercase opacity-70">
                  Source ↗
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="relative scroll-mt-14 border-t border-(--line)">
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <Reveal>
              <SectionTitle>Icons</SectionTitle>
            </Reveal>
            <div className="mt-10 flex gap-4">
              {[GitHubIcon, LinkedInIcon, MailIcon, SunIcon, MoonIcon].map(
                (Icon, i) => (
                  <span
                    key={i}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-(--line-light) [&>svg]:block [&>svg]:h-6 [&>svg]:w-6"
                  >
                    <Icon />
                  </span>
                ),
              )}
            </div>
            <p className="mt-6 max-w-[60ch] text-[0.9rem] leading-relaxed text-(--gray-400)">
              One stroke weight, current color, no emoji. Icons sit in
              circles at 56 pixels.
            </p>
          </div>
        </section>

        <section className="relative scroll-mt-14 border-t border-(--line)">
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <Reveal>
              <SectionTitle>Motion</SectionTitle>
            </Reveal>
            <div className="mt-10 flex flex-col gap-6">
              <div className="group flex items-center gap-6">
                <span className="block h-10 w-10 rounded-full bg-(--white) transition-transform duration-500 group-hover:translate-x-8" />
                <div>
                  <p className="font-head m-0 text-[0.9rem] font-bold">
                    Ease and slide
                  </p>
                  <code className="font-mono text-[0.78rem] text-(--gray-400)">
                    animate-slide-from-left / animate-fade-up
                  </code>
                  <p className="m-0 mt-1 text-[0.85rem] text-(--gray-400)">
                    Hover the dot. Entrances only, never loops.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  aria-hidden="true"
                  className="h-10 w-10 motion-safe:animate-rotate-slow"
                >
                  <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1" />
                </svg>
                <div>
                  <p className="font-head m-0 text-[0.9rem] font-bold">
                    Slow spin
                  </p>
                  <code className="font-mono text-[0.78rem] text-(--gray-400)">
                    animate-rotate-slow
                  </code>
                  <p className="m-0 mt-1 text-[0.85rem] text-(--gray-400)">
                    Ambient marks only. Paused for reduced motion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative scroll-mt-14 border-t border-(--line)">
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <Reveal>
              <SectionTitle>Rules</SectionTitle>
            </Reveal>
            <ul className="mt-10 flex max-w-[60ch] list-none flex-col gap-4 p-0">
              {[
                'Bluish black and white only. No gradients.',
                'Plain words in copy. No dashes.',
                'Cards use 18 pixel corners. Pills and icon buttons stay round.',
                'One idea per section. Generous spacing.',
              ].map((rule) => (
                <li
                  key={rule}
                  className="rounded-[12px] border border-(--line-light) p-4 text-[0.95rem] leading-relaxed"
                >
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  )
}
