import { useCallback, useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'

/* ─── Markdown ↔ HTML helpers (lightweight, no extra deps) ─── */

function markdownToHtml(md: string): string {
  if (!md) return ''
  let html = md
  // Fenced code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')
  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')
  // Headings
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>')
  html = html.replace(/^\*\*\*$/gm, '<hr>')
  // Blockquote
  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
  // Task lists
  html = html.replace(/^- \[x\] (.+)$/gm, '<li data-type="taskItem" data-checked="true">$1</li>')
  html = html.replace(/^- \[ \] (.+)$/gm, '<li data-type="taskItem" data-checked="false">$1</li>')
  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>')
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
  // Paragraphs: wrap remaining plain text lines
  html = html
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      if (/^<[a-z]/.test(trimmed)) return trimmed
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`
    })
    .join('\n')
  return html
}

function htmlToMarkdown(html: string): string {
  if (!html) return ''
  let md = html
  // Remove outer <p> wrapping from single paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '$1\n\n')
  // Headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, '# $1\n\n')
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '## $1\n\n')
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, '### $1\n\n')
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/g, '#### $1\n\n')
  md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/g, '##### $1\n\n')
  md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/g, '###### $1\n\n')
  // Bold / italic / strikethrough
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, '**$1**')
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/g, '*$1*')
  md = md.replace(/<del[^>]*>([\s\S]*?)<\/del>/g, '~~$1~~')
  md = md.replace(/<s[^>]*>([\s\S]*?)<\/s>/g, '~~$1~~')
  // Code blocks
  md = md.replace(/<pre[^>]*><code[^>]*class="language-(\w*)"[^>]*>([\s\S]*?)<\/code><\/pre>/g, '```$1\n$2\n```\n')
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```\n')
  // Inline code
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/g, '`$1`')
  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)')
  // Images
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/g, '![$2]($1)')
  md = md.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/g, '![$1]($2)')
  // Blockquote
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/g, (_m, inner) =>
    inner.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '> $1\n').trim() + '\n',
  )
  // Horizontal rule
  md = md.replace(/<hr[^>]*\/?>/g, '---\n')
  // Lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, (_m, inner) =>
    inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, '- $1\n').trim() + '\n',
  )
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, (_m, inner) =>
    inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (_: string, t: string, i: number) => `${i + 1}. ${t}\n`).trim() + '\n',
  )
  // Task lists
  md = md.replace(/<li[^>]*data-type="taskItem"[^>]*data-checked="true"[^>]*>([\s\S]*?)<\/li>/g, '- [x] $1\n')
  md = md.replace(/<li[^>]*data-type="taskItem"[^>]*data-checked="false"[^>]*>([\s\S]*?)<\/li>/g, '- [ ] $1\n')
  // Line breaks
  md = md.replace(/<br\s*\/?>/g, '\n')
  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, '')
  // Decode common entities
  md = md.replace(/&amp;/g, '&')
  md = md.replace(/&lt;/g, '<')
  md = md.replace(/&gt;/g, '>')
  md = md.replace(/&quot;/g, '"')
  // Clean up excessive newlines
  md = md.replace(/\n{3,}/g, '\n\n')
  return md.trim()
}

/* ─── Toolbar button ─────────────────────────────────────────── */

function ToolbarBtn({
  onClick,
  active = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded border-0 text-[0.8rem] transition-colors ${
        active ? 'bg-white text-black' : 'bg-transparent text-(--gray-400) hover:bg-(--ink) hover:text-(--white)'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  )
}

function ToolbarSep() {
  return <div className="mx-1 h-5 w-px bg-(--line-light)" />
}

/* ─── Main editor component ──────────────────────────────────── */

interface BlogEditorProps {
  markdown: string
  onChange: (markdown: string) => void
}

export function BlogEditor({ markdown, onChange }: BlogEditorProps) {
  const [mode, setMode] = useState<'visual' | 'markdown'>('visual')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Placeholder.configure({ placeholder: 'Start writing your post…' }),
      Underline,
      Link.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image,
    ],
    content: markdownToHtml(markdown),
    onUpdate: ({ editor: e }) => {
      const md = htmlToMarkdown(e.getHTML())
      onChange(md)
    },
    editorProps: {
      attributes: {
        class: 'prose-editor',
      },
    },
  })

  // Sync external markdown changes into the editor
  useEffect(() => {
    if (editor && mode === 'visual') {
      const currentMd = htmlToMarkdown(editor.getHTML())
      if (currentMd !== markdown) {
        editor.commands.setContent(markdownToHtml(markdown), { emitUpdate: false })
      }
    }
  }, [markdown]) // eslint-disable-line react-hooks/exhaustive-deps

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addLink = useCallback(() => {
    const url = window.prompt('Link URL:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className="rounded-lg border border-(--line-light) overflow-hidden">
      {/* Mode toggle + toolbar */}
      <div className="flex items-center justify-between border-b border-(--line-light) bg-(--ink) px-3 py-2">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setMode('visual')}
            className={`cursor-pointer rounded border-0 px-3 py-1 text-[0.65rem] font-semibold uppercase transition-colors ${mode === 'visual' ? 'bg-white text-black' : 'bg-transparent text-(--gray-400)'}`}>
            Visual
          </button>
          <button type="button" onClick={() => setMode('markdown')}
            className={`cursor-pointer rounded border-0 px-3 py-1 text-[0.65rem] font-semibold uppercase transition-colors ${mode === 'markdown' ? 'bg-white text-black' : 'bg-transparent text-(--gray-400)'}`}>
            Markdown
          </button>
        </div>
        {mode === 'visual' && (
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
              <b>B</b>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
              <i>I</i>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
              <u>U</u>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
              <s>S</s>
            </ToolbarBtn>
            <ToolbarSep />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
              H1
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
              H2
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
              H3
            </ToolbarBtn>
            <ToolbarSep />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
              <span className="material-symbols-outlined text-[1rem]">format_list_bulleted</span>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
              <span className="material-symbols-outlined text-[1rem]">format_list_numbered</span>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Task list">
              <span className="material-symbols-outlined text-[1rem]">checklist</span>
            </ToolbarBtn>
            <ToolbarSep />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
              <span className="material-symbols-outlined text-[1rem]">format_quote</span>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
              <span className="material-symbols-outlined text-[1rem]">code</span>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
              <span className="material-symbols-outlined text-[1rem]">horizontal_rule</span>
            </ToolbarBtn>
            <ToolbarSep />
            <ToolbarBtn onClick={addLink} active={editor.isActive('link')} title="Add link">
              <span className="material-symbols-outlined text-[1rem]">link</span>
            </ToolbarBtn>
            <ToolbarBtn onClick={addImage} title="Add image">
              <span className="material-symbols-outlined text-[1rem]">image</span>
            </ToolbarBtn>
          </div>
        )}
      </div>

      {/* Editor area */}
      {mode === 'visual' ? (
        <div className="min-h-[400px] max-h-[600px] overflow-y-auto bg-transparent p-4">
          <EditorContent editor={editor} />
        </div>
      ) : (
        <textarea
          value={markdown}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[400px] w-full resize-y border-0 bg-transparent p-4 font-mono text-sm leading-relaxed text-(--gray-300) outline-none"
          spellCheck={false}
        />
      )}
    </div>
  )
}
