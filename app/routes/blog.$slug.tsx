import { createFileRoute, notFound } from '@tanstack/react-router'

import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { renderMarkdown } from '../content/blog'
import { SITE_URL } from '../data/portfolio'
import { getPost } from '../lib/content'

export const Route = createFileRoute('/blog/$slug')({
  component: Post,
  loader: async ({ params }) => {
    const post = await getPost({ data: params.slug })
    if (!post) throw notFound()
    return { post }
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post
    if (!post) return { meta: [{ title: 'Post not found' }] }
    return {
      meta: [
        { title: `${post.title}: Shreyan Parajuli` },
        { name: 'description', content: post.excerpt },
        { property: 'og:type', content: 'article' },
        { property: 'og:title', content: post.title },
        { property: 'og:description', content: post.excerpt },
        { property: 'og:url', content: `${SITE_URL}/blog/${post.id}` },
        { name: 'author', content: post.author },
      ],
      links: [{ rel: 'canonical', href: `${SITE_URL}/blog/${post.id}` }],
    }
  },
})

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function readingTime(text: string): string {
  const mins = Math.max(1, Math.ceil(wordCount(text) / 200))
  return `${mins} min read`
}

function Post() {
  const { post } = Route.useLoaderData()
  const html = renderMarkdown(post.content)
  const wc = wordCount(post.content)

  return (
    <>
      <Navbar />
      <main>
        <article
          aria-labelledby="post-title"
          className="relative scroll-mt-14 border-t border-(--line)"
        >
          {/* Hero header */}
          <div className="relative overflow-hidden border-b border-(--line-light)">
            {post.coverImage ? (
              <img
                src={`/${post.coverImage}`}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-20"
              />
            ) : null}
            <div className="relative mx-auto max-w-[820px] px-5 py-16">
              <a
                href="/blog"
                className="font-head text-[0.78rem] font-semibold tracking-[0.2em] uppercase no-underline hover:underline hover:underline-offset-4"
              >
                ← All posts
              </a>

              {/* Category badge */}
              {post.category ? (
                <span className="mt-4 inline-block rounded-full border border-(--white) bg-(--white) px-3 py-1 font-head text-[0.6rem] font-bold text-(--black) uppercase tracking-wider">
                  {post.category}
                </span>
              ) : null}

              <h1
                id="post-title"
                className="font-head mt-4 text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] font-black tracking-tight uppercase"
              >
                {post.title}
              </h1>

              {/* Meta row */}
              <div className="mt-5 flex flex-wrap items-center gap-3 text-[0.82rem] text-(--gray-400)">
                <span>By {post.author}</span>
                <span aria-hidden="true">·</span>
                <span>{post.date}</span>
                <span aria-hidden="true">·</span>
                <span>{wc} words</span>
                <span aria-hidden="true">·</span>
                <span>{readingTime(post.content)}</span>
              </div>

              {/* Tags */}
              {Array.isArray(post.tags) && post.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full border border-(--line-light) px-3 py-1 font-mono text-[0.7rem] text-(--gray-400)"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Content */}
          <div className="mx-auto max-w-[820px] px-5 py-12">
            <div
              className="blog-prose"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* Footer nav */}
            <div className="mt-16 border-t border-(--line-light) pt-8">
              <a
                href="/blog"
                className="font-head text-[0.85rem] font-bold tracking-[0.15em] uppercase no-underline hover:underline hover:underline-offset-4"
              >
                ← Back to all posts
              </a>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
