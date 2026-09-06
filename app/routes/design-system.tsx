import { createFileRoute } from '@tanstack/react-router'

import { DesignSystem } from '../components/DesignSystem'
import { SITE_URL } from '../data/portfolio'

export const Route = createFileRoute('/design-system')({
  component: DesignSystem,
  head: () => ({
    meta: [
      { title: 'Design System: Shreyan Parajuli' },
      {
        name: 'description',
        content:
          'Color tokens, typography, components, and motion rules used across this portfolio.',
      },
      { name: 'robots', content: 'noindex, nofollow' },
      { property: 'og:url', content: `${SITE_URL}/design-system` },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/design-system` }],
  }),
})
