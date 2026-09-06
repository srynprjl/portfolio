import { createFileRoute } from '@tanstack/react-router'

import { About } from '../components/About'
import { Contact } from '../components/Contact'
import { Designs } from '../components/Designs'
import { Footer } from '../components/Footer'
import { Hero } from '../components/Hero'
import { Journey } from '../components/Journey'
import { Navbar } from '../components/Navbar'
import { Projects } from '../components/Projects'
import { Skills } from '../components/Skills'
import { SITE_URL } from '../data/portfolio'

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({
    meta: [{ property: 'og:url', content: SITE_URL }],
    links: [{ rel: 'canonical', href: SITE_URL }],
  }),
})

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Journey />
        <Projects />
        <Designs />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
