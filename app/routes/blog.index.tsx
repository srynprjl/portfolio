import { createFileRoute } from '@tanstack/react-router'

import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { Reveal } from '../components/Reveal'
import { SplitTitle } from '../components/SplitTitle'
import { SITE_URL } from '../data/portfolio'
import { getBlogList } from '../lib/content'
import type { BlogPost } from '../lib/db/types'

export const Route = createFileRoute('/blog/')({
  component: Blog,
  loader: async () => {
    const posts = await getBlogList({ data: undefined })
    return { posts }
  },
  head: () => ({
    meta: [
      { title: 'Blog: Shreyan Parajuli' },
      {
        name: 'description',
        content:
          'Notes on building interfaces, design details, and lessons from shipping side projects.',
      },
      { property: 'og:url', content: `${SITE_URL}/blog` },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/blog` }],
  }),
})

function Blog() {
  const { posts } = Route.useLoaderData()

  return (
    <>
      <Navbar />
      <main>
        <section
          aria-labelledby="blog-title"
          className="relative scroll-mt-14 border-t border-(--line) [contain-intrinsic-size:auto_800px] [content-visibility:auto]"
        >
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <Reveal>
              <SplitTitle
                id="blog-title"
                first="My"
                rest="blog"
                className="text-[clamp(2.25rem,5vw,4rem)]"
              />
              <p className="mt-4 max-w-[60ch] text-[0.95rem] leading-relaxed text-(--gray-400)">
                Thoughts on building interfaces, design details, and lessons from shipping side projects.
              </p>
            </Reveal>
            {posts.length === 0 ? (
              <p className="mt-12 text-[0.95rem] text-(--gray-400)">
                No posts yet. New notes are on the way.
              </p>
            ) : (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post: BlogPost, i: number) => (
                    <Reveal key={post.id} delay={Math.min(i, 3) * 80}>
                      <a
                        href={`/blog/${post.id}`}
                        className="group flex h-full flex-col rounded-xl border border-(--line-light) overflow-hidden transition-colors duration-200 hover:border-(--white) no-underline"
                      >
                        {/* Cover or placeholder */}
                        {post.coverImage ? (
                          <img
                            src={`/${post.coverImage}`}
                            alt=""
                            className="h-40 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-40 items-center justify-center bg-(--ink)">
                            <span className="font-display text-5xl font-black text-(--gray-700) uppercase">
                              {post.title[0]}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-1 flex-col p-5">
                          {/* Category + date row */}
                          <div className="flex items-center gap-2 mb-2">
                            {post.category ? (
                              <span className="rounded-full border border-(--white) bg-(--white) px-2.5 py-0.5 font-head text-[0.6rem] font-bold text-(--black) uppercase tracking-wider">
                                {post.category}
                              </span>
                            ) : null}
                            <span className="text-[0.7rem] tracking-[0.12em] text-(--gray-500) uppercase">
                              {post.date}
                            </span>
                          </div>

                          {/* Title */}
                          <h2 className="font-head text-[1.1rem] font-extrabold tracking-tight leading-snug group-hover:underline group-hover:underline-offset-4">
                            {post.title}
                          </h2>

                          {/* Excerpt */}
                          <p className="mt-2 flex-1 text-[0.82rem] leading-relaxed text-(--gray-400) line-clamp-3">
                            {post.excerpt}
                          </p>

                          {/* Footer: author + reading time */}
                          <div className="mt-4 flex items-center justify-between border-t border-(--line-light) pt-3">
                            <span className="text-[0.72rem] text-(--gray-500)">
                              By {post.author}
                            </span>
                            <span className="font-head text-[0.65rem] font-semibold tracking-[0.1em] text-(--gray-400) uppercase">
                              Read →
                            </span>
                          </div>
                        </div>
                      </a>
                    </Reveal>
                  )
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
