import { marked } from 'marked'

/**
 * Blog post bodies live as Markdown files next to this loader and
 * are bundled as raw strings, so posts prerender to static HTML.
 */
const modules = import.meta.glob('./blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function getPostMarkdown(file: string): string | undefined {
  return modules[`./blog/${file}`]
}

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string
}
