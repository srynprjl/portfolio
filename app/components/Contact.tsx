import { useState } from 'react'
import type { FormEvent } from 'react'
import { getRouteApi } from '@tanstack/react-router'

import { emailAddress } from '../data/portfolio'
import { socialIconFor } from './icons'
import { OutlineText } from './OutlineText'
import { Reveal } from './Reveal'
import { submitMessage, logVisitor } from '../lib/admin'

const rootApi = getRouteApi('__root__')

const SOCIAL_BUTTON =
  'flex h-14 w-14 items-center justify-center rounded-full border border-(--white) text-(--white) no-underline transition-all duration-200 hover:-translate-y-1 hover:bg-(--white) hover:text-(--black) [&>svg]:block [&>svg]:h-6 [&>svg]:w-6'

function isMailto(url: string): boolean {
  return url.startsWith('mailto:')
}

export function Contact() {
  const { contact, socials } = rootApi.useLoaderData()
  const visibleSocials = socials.filter(
    (social) => social.hide !== true && social.url.trim() !== '',
  )

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      let ip = ''
      let country = ''
      try {
        const res = await fetch('https://ipapi.co/json/')
        if (res.ok) {
          const data = await res.json()
          ip = data.ip ?? ''
          country = data.country_name ?? ''
        }
      } catch { /* ignore */ }

      await submitMessage({
        data: {
          name: anonymous ? 'Anonymous' : name,
          email,
          subject,
          body,
          ip,
          country,
          anonymous,
        },
      })

      await logVisitor({
        data: { ip, country, path: '/#contact', userAgent: navigator.userAgent },
      })

      setSent(true)
      setName('')
      setEmail('')
      setSubject('')
      setBody('')
      setAnonymous(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send.')
    }
    setSending(false)
  }

  const inputClass =
    'w-full rounded-xl border border-transparent bg-(--ink) px-4 py-3 text-sm text-(--white) outline-none focus:border-(--white) transition-colors placeholder:text-(--gray-500)'

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="relative scroll-mt-14 border-t border-(--line) bg-(--black) text-(--white) [contain-intrinsic-size:auto_800px] [content-visibility:auto]"
    >
      <div className="mx-auto max-w-[1200px] px-5 py-16">
        <Reveal>
          <h2
            id="contact-title"
            className="font-head text-[clamp(3rem,9vw,8rem)] leading-[0.9] font-black tracking-tight uppercase"
          >
            Contact
            <span className="mt-2 block">
              <OutlineText
                text="me"
                fontFamily="Poppins"
                fontWeight={900}
                strokeWidth={2}
              />{' '}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                aria-hidden="true"
                className="inline-block h-[0.72em] w-[0.72em] motion-safe:animate-rotate-slow"
              >
                <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1" />
              </svg>
            </span>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            {/* Left: socials + email */}
            <div>
              <div className="flex flex-wrap gap-4">
                {visibleSocials.map((social) => {
                  const Icon = socialIconFor(social.icon)
                  const external = !isMailto(social.url)
                  return (
                    <a
                      key={social.id}
                      href={social.url}
                      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                      aria-label={social.label}
                      title={social.label}
                      className={SOCIAL_BUTTON}
                    >
                      <Icon />
                    </a>
                  )
                })}
              </div>
              {contact.email !== '' && (
                <a
                  href={contact.emailUrl}
                  className="mt-8 block text-[clamp(1.25rem,3.5vw,2rem)] font-extrabold tracking-tight break-all no-underline hover:underline hover:underline-offset-8"
                >
                  {emailAddress(socials)}
                </a>
              )}
              <p className="m-0 mt-3 text-[0.95rem] text-(--gray-400)">
                Open to internships and collaborations. I reply fast.
              </p>
            </div>

            {/* Right: contact form */}
            <div className="rounded-2xl border border-(--line-light) p-6 sm:p-8">
            <h3 className="font-head text-[1.1rem] font-extrabold tracking-tight">
              Send me a message
            </h3>
            <p className="mt-1 text-[0.85rem] text-(--gray-400)">
              Fill out the form below and I'll get back to you.
            </p>

            {sent ? (
              <div className="mt-8 flex flex-col items-center py-8 text-center">
                <span className="material-symbols-outlined text-[2.5rem] text-(--gray-400)">
                  check_circle
                </span>
                <p className="mt-3 font-head text-sm font-bold">
                  Message sent!
                </p>
                <p className="mt-1 text-[0.8rem] text-(--gray-400)">
                  Thanks for reaching out. I'll get back to you soon.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-4 cursor-pointer rounded-full border border-(--line-light) bg-transparent px-5 py-2 font-head text-[0.7rem] font-semibold tracking-[0.15em] text-(--gray-400) uppercase transition-colors hover:border-(--white) hover:text-(--white)"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block font-head text-[0.65rem] tracking-[0.18em] text-(--gray-400) uppercase">
                      Name
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!anonymous}
                      disabled={anonymous}
                      placeholder="Your name"
                      className={`${inputClass} disabled:opacity-40`}
                    />
                  </label>
                  <label>
                    <span className="mb-1.5 block font-head text-[0.65rem] tracking-[0.18em] text-(--gray-400) uppercase">
                      Email *
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </label>
                </div>
                <label>
                  <span className="mb-1.5 block font-head text-[0.65rem] tracking-[0.18em] text-(--gray-400) uppercase">
                    Subject
                  </span>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What's this about?"
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className="mb-1.5 block font-head text-[0.65rem] tracking-[0.18em] text-(--gray-400) uppercase">
                    Message *
                  </span>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    rows={5}
                    placeholder="Your message…"
                    className={`${inputClass} resize-y`}
                  />
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="h-5 w-5 accent-white"
                  />
                  <span className="text-[0.8rem] text-(--gray-400)">
                    Send anonymously
                  </span>
                </label>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full cursor-pointer rounded-full border border-white bg-white px-6 py-3 font-head text-[0.75rem] font-semibold tracking-[0.18em] text-black uppercase transition-all hover:bg-transparent hover:text-white disabled:opacity-50 sm:w-auto sm:self-start"
                >
                  {sending ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
