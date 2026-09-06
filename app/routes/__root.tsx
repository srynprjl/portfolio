import {
  HeadContent,
  Scripts,
  createRootRoute,
  getRouteApi,
} from '@tanstack/react-router'

import '../styles.css'
import { SITE_URL } from '../data/portfolio'
import { getSiteContent } from '../lib/content'

const rootApi = getRouteApi('__root__')

const SITE_TITLE = 'Shreyan Parajuli'
const SITE_DESCRIPTION =
  'Portfolio of Shreyan Parajuli, a frontend developer and UI/UX designer based in Kathmandu, Nepal, focused on React interfaces, design systems, and polished user experiences, with solid backend instincts.'

export const Route = createRootRoute({
  loader: () => getSiteContent(),
  head: ({ loaderData }) => {
    const profile = loaderData?.profile
    const fullName = profile ? `${profile.firstName} ${profile.lastName}` : SITE_TITLE
    return {
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: SITE_TITLE },
      { name: 'description', content: SITE_DESCRIPTION },
      {
        name: 'keywords',
        content:
          'Shreyan Parajuli, frontend developer, UI UX designer, React, Django, Kathmandu, Nepal',
      },
      { name: 'author', content: fullName },
      { name: 'theme-color', content: '#000000' },
      { name: 'robots', content: 'index, follow' },

      // Open Graph (og:url is overridden per route; canonical links
      // are declared per route so each page has exactly one)
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: fullName },
      { property: 'og:title', content: SITE_TITLE },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:url', content: SITE_URL },
      { property: 'og:image', content: `${SITE_URL}/assets/nefo.jpeg` },
      { property: 'og:image:alt', content: `${fullName}, ${profile?.title ?? ''}` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:locale', content: 'en_US' },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: SITE_TITLE },
      { name: 'twitter:description', content: SITE_DESCRIPTION },
      { name: 'twitter:image', content: `${SITE_URL}/assets/nefo.jpeg` },
      { name: 'twitter:image:alt', content: `${fullName}, ${profile?.title ?? ''}` },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/assets/favicon.svg' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Anton&family=Nunito:wght@400;600;700&family=Poppins:wght@500;600;700;800&display=swap',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
      },
    ],
    }
  },
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  let jsonLd = ''
  try {
    const data = rootApi.useLoaderData()
    jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: `${data.profile.firstName} ${data.profile.lastName}`,
      jobTitle: data.profile.title,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      email: data.contact.emailUrl,
    })
  } catch {
    jsonLd = ''
  }
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <HeadContent />
        {/* Apply saved theme before paint to avoid a flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('sp-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}`,
          }}
        />
        {/* Structured data: indexed by crawlers straight from the prerendered HTML */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-svh flex-col bg-(--black) font-sans text-(--white) antialiased overflow-x-hidden">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
