import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { marked } from 'marked'

import { Navbar } from '../components/Navbar'
import { BlogEditor } from '../components/BlogEditor'
import { socialIconFor } from '../components/icons'
import type { Row } from '../lib/db/types'
import {
  createResource,
  deleteResource,
  listResource,
  putSingleton,
  seedFromJson,
  checkAdmin,
  updateResource,
  uploadImage,
  resourceMeta,
  getAnalytics,
} from '../lib/admin'

export const Route = createFileRoute('/admin')({
  component: Admin,
  head: () => ({
    meta: [
      { title: 'Admin: Shreyan Parajuli' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
})

const SESSION_KEY = 'sp-admin-unlocked'
const ADMIN_NAV = [
  { id: 'dashboard', label: 'Dashboard', materialIcon: 'dashboard' },
  { id: 'messages', label: 'Messages', materialIcon: 'mail' },
  { id: 'profile', label: 'Profile', materialIcon: 'person' },
  { id: 'skills', label: 'Skills', materialIcon: 'construction' },
  { id: 'projects', label: 'Projects', materialIcon: 'folder' },
  { id: 'designs', label: 'Designs', materialIcon: 'palette' },
  { id: 'experience', label: 'Experience', materialIcon: 'work' },
  { id: 'education', label: 'Education', materialIcon: 'school' },
  { id: 'socials', label: 'Socials', materialIcon: 'link' },
  { id: 'code-profiles', label: 'Source Repositories', materialIcon: 'code' },
  { id: 'blogs', label: 'Blog Posts', materialIcon: 'article' },
] as const

function pw(): string {
  return sessionStorage.getItem(SESSION_KEY + '-pw') ?? ''
}

/* ─── Utilities ──────────────────────────────────────────────── */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = parseDate(dateStr)
  if (!d) return dateStr
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function sortByDate<T extends Record<string, unknown>>(items: T[], dateKey: string): T[] {
  return [...items].sort((a, b) => {
    const da = parseDate(String(a[dateKey] ?? ''))?.getTime() ?? 0
    const db = parseDate(String(b[dateKey] ?? ''))?.getTime() ?? 0
    return db - da // newest first
  })
}

/* ─── Shared UI Components ───────────────────────────────────── */

const INPUT =
  'w-full rounded-xl border border-transparent bg-(--ink) px-4 py-3 text-sm outline-none focus:border-(--white) transition-colors placeholder:text-(--gray-500)'
const LABEL = 'mb-1.5 block font-head text-[0.65rem] tracking-[0.18em] text-(--gray-400) uppercase'

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <span className={LABEL}>{children}</span>
      {hint && <span className="ml-2 text-[0.6rem] text-(--gray-500) normal-case">{hint}</span>}
    </div>
  )
}

/* ─── Date Input ─────────────────────────────────────────────── */

function DateInput({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  placeholder?: string
}) {
  return (
    <label>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT} [color-scheme:dark]`}
      />
    </label>
  )
}

/* ─── Auto-ID Input ──────────────────────────────────────────── */

function AutoIdInput({
  value,
  onChange,
  sourceTitle,
  existingIds,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  sourceTitle: string
  existingIds: string[]
  disabled?: boolean
}) {
  const [manual, setManual] = useState(value !== slugify(sourceTitle))
  const generated = slugify(sourceTitle)
  const isTaken = !disabled && value && existingIds.includes(value) && value !== slugify(sourceTitle)

  useEffect(() => {
    if (!manual && sourceTitle) {
      onChange(slugify(sourceTitle))
    }
  }, [sourceTitle, manual]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <label>
      <FieldLabel hint="Auto-generated from title">
        Slug (URL) *
      </FieldLabel>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => {
            setManual(true)
            onChange(e.target.value)
          }}
          disabled={disabled}
          className={`${INPUT} ${isTaken ? 'border-red-500' : ''} ${disabled ? 'opacity-50' : ''}`}
        />
        {!disabled && (
          <button
            type="button"
            onClick={() => {
              setManual(!manual)
              if (manual) onChange(slugify(sourceTitle))
            }}
            className="shrink-0 cursor-pointer rounded-xl border border-(--line-light) bg-transparent px-3 text-[0.65rem] font-semibold text-(--gray-400) uppercase transition-colors hover:border-(--white) hover:text-(--white)"
            title={manual ? 'Auto-generate from title' : 'Edit manually'}
          >
            {manual ? 'Auto' : 'Manual'}
          </button>
        )}
      </div>
      {isTaken && (
        <p className="mt-1 text-[0.7rem] text-red-400">This slug is already taken.</p>
      )}
      {!isTaken && generated && !disabled && (
        <p className="mt-1 text-[0.65rem] text-(--gray-500)">
          Preview: /{generated}
        </p>
      )}
    </label>
  )
}

/* ─── Image Upload (upload + remove only) ────────────────────── */

function ImageUpload({
  value,
  onChange,
}: {
  value: string
  onChange: (path: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1]
        const result = await uploadImage({
          data: { password: pw(), filename: file.name, base64 },
        })
        onChange(result.path)
      } catch { /* ignore */ }
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  return (
    <label className="sm:col-span-2">
      <FieldLabel>Image</FieldLabel>
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-(--line-light)">
          <img src={`/${value}`} alt="Preview" className="h-40 w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="cursor-pointer rounded-full border border-white bg-white px-4 py-2 font-head text-[0.65rem] font-semibold text-black uppercase transition-colors hover:bg-transparent hover:text-white"
            >
              {uploading ? 'Uploading…' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="cursor-pointer rounded-full border border-red-400 bg-transparent px-4 py-2 font-head text-[0.65rem] font-semibold text-red-400 uppercase transition-colors hover:bg-red-500 hover:text-white"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-(--line-light) bg-transparent py-10 text-[0.8rem] font-semibold text-(--gray-400) transition-colors hover:border-(--white) hover:text-(--white)"
        >
          <span className="material-symbols-outlined text-[1.2rem]">cloud_upload</span>
          {uploading ? 'Uploading…' : 'Click to upload image'}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
    </label>
  )
}

/* ─── Draggable Source Editor ────────────────────────────────── */

interface SourceEntry {
  label: string
  url: string
}

function DraggableSourceEditor({
  label,
  items,
  onChange,
}: {
  label: string
  items: SourceEntry[]
  onChange: (items: SourceEntry[]) => void
}) {
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const add = () => onChange([...items, { label: '', url: '' }])
  const update = (i: number, field: keyof SourceEntry, val: string) => {
    onChange(items.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)))
  }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))

  const handleDragStart = (i: number) => { dragItem.current = i }
  const handleDragEnter = (i: number) => { dragOverItem.current = i }
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    const copy = [...items]
    const dragged = copy.splice(dragItem.current, 1)[0]
    copy.splice(dragOverItem.current, 0, dragged)
    dragItem.current = null
    dragOverItem.current = null
    onChange(copy)
  }

  return (
    <label className="sm:col-span-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className="group flex items-center gap-2 rounded-xl border border-(--line-light) bg-(--ink) px-3 py-2 transition-colors hover:border-(--white)"
          >
            <span className="cursor-grab text-[0.8rem] text-(--gray-500) active:cursor-grabbing material-symbols-outlined text-[1rem]">
              drag_indicator
            </span>
            <span className="text-[0.7rem] text-(--gray-600) font-mono">{i + 1}</span>
            <input
              value={item.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              placeholder="Label"
              className="w-1/3 border-0 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-(--gray-500)"
            />
            <input
              value={item.url}
              onChange={(e) => update(i, 'url', e.target.value)}
              placeholder="https://..."
              className="flex-1 border-0 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-(--gray-500)"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="cursor-pointer border-0 bg-transparent text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="w-full cursor-pointer rounded-xl border border-dashed border-(--line-light) bg-transparent py-2.5 text-[0.75rem] font-semibold tracking-[0.1em] text-(--gray-400) uppercase transition-colors hover:border-(--white) hover:text-(--white)"
        >
          + Add {label.toLowerCase()}
        </button>
      </div>
    </label>
  )
}

/* ─── Chip Input (fixed) ─────────────────────────────────────── */

function ChipInput({
  label,
  items,
  onChange,
  accentColor,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  accentColor?: string
}) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const color = accentColor ?? 'var(--white)'

  const add = () => {
    const t = value.trim()
    if (t && !items.includes(t)) {
      onChange([...items, t])
      setValue('')
    }
  }

  return (
    <div className="sm:col-span-2">
      <FieldLabel>{label}</FieldLabel>
      <div
        onClick={() => inputRef.current?.focus()}
        className={`flex min-h-[48px] flex-wrap items-center gap-2 rounded-xl border bg-transparent px-3 py-2 transition-colors ${
          focused ? 'border-(--white)' : 'border-(--line-light)'
        }`}
      >
        {items.map((item) => (
          <span
            key={item}
            className="group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.78rem] font-semibold"
            style={{ borderColor: `${color}40`, color }}
          >
            {item}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(items.filter((x) => x !== item))
              }}
              className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-0 bg-(--black) text-[0.55rem] text-(--white) opacity-0 transition-all hover:bg-red-500 group-hover:opacity-50 hover:!opacity-100"
              aria-label={`Remove ${item}`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add() }
            if (e.key === 'Backspace' && value === '' && items.length > 0) {
              onChange(items.slice(0, -1))
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={items.length === 0 ? 'Type and press Enter…' : 'Add more…'}
          className="min-w-[120px] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-(--gray-500)"
        />
      </div>
    </div>
  )
}

/* ─── Section: Profile ───────────────────────────────────────── */

function ProfileSection() {
  const [data, setData] = useState<Row>({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    listResource({ data: { password: pw(), resource: 'profile' } }).then((r) => {
      const list = Array.isArray(r) ? r : [r]
      if (list.length > 0) setData(list[0])
    })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await putSingleton({ data: { password: pw(), resource: 'profile', body: data } })
      setNotice('Saved.')
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
    setSaving(false)
  }

  const field = (key: string, label: string, multiline = false) => (
    <label key={key}>
      <FieldLabel>{label}</FieldLabel>
      {multiline ? (
        <textarea value={String(data[key] ?? '')} onChange={(e) => setData({ ...data, [key]: e.target.value })} rows={4} className={`${INPUT} resize-y`} />
      ) : (
        <input value={String(data[key] ?? '')} onChange={(e) => setData({ ...data, [key]: e.target.value })} className={INPUT} />
      )}
    </label>
  )

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-head text-lg font-extrabold tracking-tight uppercase">Profile</h2>
          <p className="mt-1 text-[0.85rem] text-(--gray-400)">Edit directly — changes are local until saved.</p>
        </div>
        <button type="button" onClick={save} disabled={saving}
          className="cursor-pointer rounded-full border border-white bg-white px-6 py-2.5 font-head text-[0.65rem] font-semibold tracking-[0.18em] text-black uppercase transition-all hover:bg-transparent hover:text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
      {notice && <p className={`mt-3 text-sm ${notice === 'Saved.' ? 'text-green-400' : 'text-red-400'}`}>{notice}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {field('firstName', 'First Name')}
        {field('lastName', 'Last Name')}
        {field('title', 'Title')}
        {field('location', 'Location')}
        {field('bio', 'Bio', true)}
      </div>
    </div>
  )
}

/* ─── Section: Skills (dynamic categories) ───────────────────── */

const DEFAULT_SKILL_GROUPS = [
  { key: 'languages', label: 'Languages', icon: 'code', color: '#60a5fa' },
  { key: 'frameworks', label: 'Frameworks & Tools', icon: 'build', color: '#a78bfa' },
  { key: 'tools', label: 'Applications', icon: 'apps', color: '#34d399' },
  { key: 'traits', label: 'Developer Traits', icon: 'psychology', color: '#fbbf24' },
]

function SkillGroupCard({
  group,
  items,
  onChange,
  onRemove,
  canRemove,
}: {
  group: { key: string; label: string; icon: string; color: string }
  items: string[]
  onChange: (items: string[]) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const add = () => {
    const t = value.trim()
    if (t && !items.includes(t)) { onChange([...items, t]); setValue('') }
  }

  return (
    <div className="rounded-2xl border border-(--line-light) overflow-hidden transition-colors hover:border-(--white)">
      <div className="flex items-center justify-between px-5 py-4 border-b border-(--line-light)">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--ink)">
            <span className="material-symbols-outlined text-[1.2rem] text-(--gray-400)">{group.icon}</span>
          </div>
          <div>
            <h3 className="font-head text-sm font-bold tracking-tight">{group.label}</h3>
            <p className="text-[0.65rem] text-(--gray-500)">{items.length} skill{items.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full font-head text-lg font-black text-(--gray-400)">
            {String(items.length).padStart(2, '0')}
          </div>
          {canRemove && (
            <button type="button" onClick={onRemove}
              className="cursor-pointer border-0 bg-transparent text-red-400 opacity-50 hover:opacity-100 material-symbols-outlined text-[1.1rem]">
              delete
            </button>
          )}
        </div>
      </div>
      <div className="px-5 py-4">
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <span key={item} className="group inline-flex items-center gap-1.5 rounded-full border border-(--line-light) px-3 py-1.5 text-[0.78rem] font-semibold text-(--gray-300)">
                {item}
                <button type="button" onClick={() => onChange(items.filter((x) => x !== item))}
                  className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[0.55rem] opacity-0 transition-all hover:bg-red-500 hover:text-white hover:opacity-100 group-hover:opacity-50">✕</button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[0.8rem] text-(--gray-500)">No skills yet.</p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <input ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } if (e.key === 'Backspace' && value === '' && items.length > 0) onChange(items.slice(0, -1)) }}
            onBlur={() => { if (value.trim()) add(); setValue('') }}
            placeholder="Type a skill…"
            className="flex-1 border-0 bg-transparent px-0 py-2 text-sm outline-none placeholder:text-(--gray-500)"
            style={{ borderBottom: '2px solid var(--line-light)' }} />
        </div>
      </div>
    </div>
  )
}

function SkillsSection() {
  const [data, setData] = useState<Row>({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [newGroupLabel, setNewGroupLabel] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)

  useEffect(() => {
    listResource({ data: { password: pw(), resource: 'skills' } }).then((r) => {
      const list = Array.isArray(r) ? r : [r]
      if (list.length > 0) setData(list[0])
    })
  }, [])

  const customGroups: Array<{ key: string; label: string; icon: string; color: string }> =
    (data.custom as unknown as Array<{ key: string; label: string; icon: string; color: string }>) ?? []

  const allGroups = [...DEFAULT_SKILL_GROUPS, ...customGroups]

  const totalSkills = allGroups.reduce((sum, g) => sum + ((data[g.key] as string[]) ?? []).length, 0)

  const save = async () => {
    setSaving(true)
    try {
      await putSingleton({ data: { password: pw(), resource: 'skills', body: data } })
      setNotice('Saved.')
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
    setSaving(false)
  }

  const addGroup = () => {
    const label = newGroupLabel.trim()
    if (!label) return
    const key = slugify(label) || `group-${Date.now()}`
    if (allGroups.some((g) => g.key === key)) return
    const colors = ['#f472b6', '#818cf8', '#fb923c', '#2dd4bf', '#e879f9', '#38bdf8']
    const newGroup = { key, label, icon: 'category', color: colors[customGroups.length % colors.length] }
    const updated = [...customGroups, newGroup]
    setData({ ...data, custom: updated, [key]: [] })
    setNewGroupLabel('')
    setAddingGroup(false)
  }

  const removeGroup = (key: string) => {
    if (!window.confirm('Delete this skill category and all its skills?')) return
    const updated = customGroups.filter((g) => g.key !== key)
    const next = { ...data, custom: updated } as Row
    delete next[key]
    setData(next)
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-head text-lg font-extrabold tracking-tight uppercase">Skills</h2>
          <p className="mt-1 text-[0.85rem] text-(--gray-400)">{totalSkills} total across {allGroups.length} groups</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setAddingGroup(!addingGroup)}
            className="cursor-pointer rounded-full border border-(--line-light) bg-transparent px-4 py-2 font-head text-[0.65rem] font-semibold tracking-[0.18em] text-(--gray-400) uppercase transition-colors hover:border-(--white) hover:text-(--white)">
            + Category
          </button>
          <button type="button" onClick={save} disabled={saving}
            className="cursor-pointer rounded-full border border-white bg-white px-6 py-2.5 font-head text-[0.65rem] font-semibold tracking-[0.18em] text-black uppercase transition-all hover:bg-transparent hover:text-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save All'}
          </button>
        </div>
      </div>
      {notice && <p className={`mt-3 text-sm ${notice === 'Saved.' ? 'text-green-400' : 'text-red-400'}`}>{notice}</p>}

      {/* Add group form */}
      {addingGroup && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-(--line-light) p-3">
          <input value={newGroupLabel} onChange={(e) => setNewGroupLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addGroup() }}
            placeholder="Category name…" autoFocus
            className="flex-1 border-0 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-(--gray-500)" />
          <button type="button" onClick={addGroup}
            className="cursor-pointer rounded-full border border-white bg-white px-4 py-1.5 font-head text-[0.6rem] font-semibold text-black uppercase hover:bg-transparent hover:text-white">Add</button>
          <button type="button" onClick={() => setAddingGroup(false)}
            className="cursor-pointer border-0 bg-transparent text-[0.7rem] text-(--gray-500) hover:text-(--white)">Cancel</button>
        </div>
      )}

      {/* Summary bar */}
      <div className="mt-5 flex h-1.5 overflow-hidden rounded-full bg-(--ink)">
        {allGroups.map((g, i) => {
          const count = ((data[g.key] as string[]) ?? []).length
          const pct = totalSkills > 0 ? (count / totalSkills) * 100 : 0
          return count > 0 ? (
            <div key={g.key} style={{ width: `${pct}%` }} className={`h-full transition-all duration-500 ${i % 2 === 0 ? 'bg-white' : 'bg-(--gray-400)'}`} title={`${g.label}: ${count}`} />
          ) : null
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {allGroups.map((g) => (
          <SkillGroupCard
            key={g.key}
            group={g}
            items={(data[g.key] as string[]) ?? []}
            onChange={(items) => setData({ ...data, [g.key]: items as unknown as Row[] })}
            onRemove={() => removeGroup(g.key)}
            canRemove={customGroups.some((cg) => cg.key === g.key)}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Section: Projects (split view + auto ID + date picker) ─── */

function ProjectsSection() {
  const [rows, setRows] = useState<Row[]>([])
  const [editing, setEditing] = useState<Row | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [notice, setNotice] = useState('')
  const [view, setView] = useState<'cards' | 'table'>('cards')

  const refresh = useCallback(async () => {
    try {
      const list = await listResource({ data: { password: pw(), resource: 'projects' } })
      setRows(Array.isArray(list) ? list : [list])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const existingIds = rows.map((r) => String(r.id)).filter(Boolean)

  const blank = { id: '', title: '', date: '', summary: '', motivation: '', image: '', chips: [], sources: [], liveUrl: '', hideFromPage: false, hideFromResume: false }
  const startNew = () => { setEditing({ ...blank }); setIsNew(true) }

  const save = async () => {
    if (!editing) return
    setNotice('')
    try {
      if (isNew) { await createResource({ data: { password: pw(), resource: 'projects', body: editing } }); setNotice('Created.') }
      else { await updateResource({ data: { password: pw(), resource: 'projects', id: editing.id, patch: editing } }); setNotice('Saved.') }
      setEditing(null); await refresh()
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete?')) return
    try { await deleteResource({ data: { password: pw(), resource: 'projects', id } }); await refresh() }
    catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  /* Live preview */
  const Preview = ({ data }: { data: Row }) => (
    <div className="rounded-2xl border border-(--line-light) overflow-hidden bg-(--ink)">
      {data.image ? (
        <img src={`/${String(data.image)}`} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center font-display text-5xl font-black text-(--gray-700) uppercase">
          {String(data.title ?? '?')[0]?.toUpperCase()}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-head text-base font-extrabold tracking-tight">{String(data.title || 'Project Title')}</h3>
          <span className="text-[0.65rem] text-(--gray-500)">{String(data.date)}</span>
        </div>
        <p className="mt-1 text-[0.78rem] text-(--gray-400) line-clamp-2">{String(data.summary || 'Summary goes here…')}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {((data.chips as string[]) ?? []).map((c) => (
            <span key={c} className="rounded-full border border-neutral-700 px-2.5 py-0.5 font-mono text-[0.6rem] text-(--gray-400)">{c}</span>
          ))}
        </div>
        {data.motivation ? (
          <p className="mt-3 text-[0.75rem] text-(--gray-500) line-clamp-3">{String(data.motivation)}</p>
        ) : null}
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-head text-lg font-extrabold tracking-tight uppercase">Projects</h2>
        <div className="flex items-center gap-3">
          {!editing && (
            <div className="flex gap-1 rounded-lg border border-(--line-light) p-0.5">
              <button type="button" onClick={() => setView('cards')} className={`cursor-pointer rounded-md border-0 px-3 py-1 text-[0.65rem] font-semibold uppercase transition-colors ${view === 'cards' ? 'bg-white text-black' : 'bg-transparent text-(--gray-400)'}`}>▦ Cards</button>
              <button type="button" onClick={() => setView('table')} className={`cursor-pointer rounded-md border-0 px-3 py-1 text-[0.65rem] font-semibold uppercase transition-colors ${view === 'table' ? 'bg-white text-black' : 'bg-transparent text-(--gray-400)'}`}>≡ Table</button>
            </div>
          )}
          <button type="button" onClick={startNew} className="cursor-pointer rounded-full border border-white bg-white px-5 py-2 font-head text-[0.65rem] font-semibold tracking-[0.18em] text-black uppercase transition-all hover:bg-transparent hover:text-white">+ Add</button>
        </div>
      </div>
      {notice && <p className={`mt-3 text-sm ${notice.includes('Created') || notice.includes('Saved') ? 'text-green-400' : 'text-red-400'}`}>{notice}</p>}

      {/* Card view */}
      {!editing && view === 'cards' && rows.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div key={String(row.id)} className="flex flex-col rounded-xl border border-(--line-light) overflow-hidden transition-colors hover:border-(--white)">
              {row.image ? <img src={`/${String(row.image)}`} alt="" className="h-28 w-full object-cover" />
                : <div className="flex h-28 items-center justify-center bg-(--ink) font-head text-3xl font-black text-(--gray-500)">{String(row.title ?? '?')[0]?.toUpperCase()}</div>}
              <div className="flex-1 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="truncate font-head text-sm font-bold">{String(row.title)}</h3>
                  <span className="shrink-0 text-[0.65rem] text-(--gray-500)">{formatDate(String(row.date))}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[0.75rem] text-(--gray-400)">{String(row.summary)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {((row.chips as string[]) ?? []).slice(0, 3).map((c) => (
                    <span key={c} className="rounded-full border border-neutral-700 px-2 py-0.5 font-mono text-[0.55rem] text-(--gray-400)">{c}</span>
                  ))}
                </div>
              </div>
              <div className="flex border-t border-(--line-light)">
                <button type="button" onClick={() => { setEditing({ ...row }); setIsNew(false) }} className="flex-1 cursor-pointer border-0 bg-transparent py-2.5 flex items-center justify-center gap-1 text-[0.65rem] font-semibold uppercase transition-colors hover:bg-(--ink)"><span className="material-symbols-outlined text-[0.9rem]">edit</span></button>
                <button type="button" onClick={() => remove(String(row.id))} className="flex-1 cursor-pointer border-0 bg-transparent py-2.5 flex items-center justify-center gap-1 text-[0.65rem] font-semibold uppercase text-red-400 transition-colors hover:bg-(--ink)"><span className="material-symbols-outlined text-[0.9rem]">delete</span></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table view */}
      {!editing && view === 'table' && rows.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-(--line-light)">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead><tr className="border-b border-(--line-light) font-head text-[0.65rem] tracking-[0.18em] text-(--gray-400) uppercase">
              <th className="px-4 py-3">Title</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Chips</th><th className="px-4 py-3" />
            </tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)} className="border-b border-(--line) last:border-0 hover:bg-(--panel)">
                  <td className="px-4 py-3 font-bold">{String(row.title)}</td>
                  <td className="px-4 py-3 text-(--gray-400)">{formatDate(String(row.date))}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-[0.75rem] text-(--gray-400)">{((row.chips as string[]) ?? []).join(', ')}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button type="button" onClick={() => { setEditing({ ...row }); setIsNew(false) }} className="mr-2 cursor-pointer border-0 bg-transparent text-(--gray-400) hover:text-(--white) material-symbols-outlined text-[1rem]">edit</button>
                    <button type="button" onClick={() => remove(String(row.id))} className="cursor-pointer border-0 bg-transparent text-red-400 hover:text-red-300 material-symbols-outlined text-[1rem]">delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!editing && rows.length === 0 && <p className="mt-6 text-[0.85rem] text-(--gray-500)">No projects yet.</p>}

      {/* Split-view editor */}
      {editing && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Form */}
          <div className="rounded-xl border border-(--line-light) p-6">
            <h3 className="font-head text-sm font-extrabold tracking-[0.18em] uppercase">{isNew ? 'Add Project' : 'Edit Project'}</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <AutoIdInput value={String(editing.id ?? '')} onChange={(v) => setEditing({ ...editing, id: v })} sourceTitle={String(editing.title ?? '')} existingIds={existingIds} disabled={!isNew} />
              <label><FieldLabel>Title *</FieldLabel>
                <input value={String(editing.title ?? '')} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={INPUT} /></label>
              <DateInput value={String(editing.date ?? '')} onChange={(v) => setEditing({ ...editing, date: v })} label="Date" />
              <label><FieldLabel>Live URL</FieldLabel>
                <input value={String(editing.liveUrl ?? '')} onChange={(e) => setEditing({ ...editing, liveUrl: e.target.value })} className={INPUT} /></label>
              <label className="sm:col-span-2"><FieldLabel>Summary</FieldLabel>
                <input value={String(editing.summary ?? '')} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} className={INPUT} /></label>
              <label className="sm:col-span-2"><FieldLabel>Motivation / Description</FieldLabel>
                <textarea value={String(editing.motivation ?? '')} onChange={(e) => setEditing({ ...editing, motivation: e.target.value })} rows={4} className={`${INPUT} resize-y`} /></label>
              <ImageUpload value={String(editing.image ?? '')} onChange={(path) => setEditing({ ...editing, image: path })} />
              <ChipInput label="Technologies" items={(editing.chips as string[]) ?? []} onChange={(items) => setEditing({ ...editing, chips: items })} />
              <DraggableSourceEditor label="Sources" items={((editing.sources as unknown as SourceEntry[]) ?? [])} onChange={(items) => setEditing({ ...editing, sources: items as unknown as Row[] })} />
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={editing.hideFromPage === true} onChange={(e) => setEditing({ ...editing, hideFromPage: e.target.checked })} className="h-5 w-5 accent-white" />
                <span className={LABEL}>Hide from homepage</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={editing.hideFromResume === true} onChange={(e) => setEditing({ ...editing, hideFromResume: e.target.checked })} className="h-5 w-5 accent-white" />
                <span className={LABEL}>Hide from resume</span>
              </label>
            </div>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={save} className="cursor-pointer rounded-full border border-white bg-white px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] text-black uppercase transition-all hover:bg-transparent hover:text-white">{isNew ? 'Create' : 'Save'}</button>
              <button type="button" onClick={() => setEditing(null)} className="cursor-pointer rounded-full border border-(--line-light) px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] uppercase transition-colors hover:border-(--white)">Cancel</button>
            </div>
          </div>

          {/* Live preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-2 font-head text-[0.65rem] tracking-[0.18em] text-(--gray-400) uppercase">Preview</p>
            <Preview data={editing} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Section: Designs (same split view) ─────────────────────── */

function DesignsSection() {
  const [rows, setRows] = useState<Row[]>([])
  const [editing, setEditing] = useState<Row | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [notice, setNotice] = useState('')
  const [view, setView] = useState<'cards' | 'table'>('cards')

  const refresh = useCallback(async () => {
    try { const list = await listResource({ data: { password: pw(), resource: 'designs' } }); setRows(Array.isArray(list) ? list : [list]) } catch { /* */ }
  }, [])
  useEffect(() => { refresh() }, [refresh])

  const existingIds = rows.map((r) => String(r.id)).filter(Boolean)
  const blank = { id: '', title: '', date: '', summary: '', description: '', image: '', tags: [], files: [], sources: [], liveUrl: '' }
  const startNew = () => { setEditing({ ...blank }); setIsNew(true) }

  const save = async () => {
    if (!editing) return
    try {
      if (isNew) { await createResource({ data: { password: pw(), resource: 'designs', body: editing } }); setNotice('Created.') }
      else { await updateResource({ data: { password: pw(), resource: 'designs', id: editing.id, patch: editing } }); setNotice('Saved.') }
      setEditing(null); await refresh()
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete?')) return
    try { await deleteResource({ data: { password: pw(), resource: 'designs', id } }); await refresh() } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  const Preview = ({ data }: { data: Row }) => (
    <div className="rounded-2xl border border-(--line-light) overflow-hidden bg-(--ink)">
      {data.image ? <img src={`/${String(data.image)}`} alt="" className="h-40 w-full object-cover" />
        : <div className="flex h-40 items-center justify-center font-display text-5xl font-black text-(--gray-700) uppercase">{String(data.title ?? '?')[0]?.toUpperCase()}</div>}
      <div className="p-4">
        <h3 className="font-head text-base font-extrabold tracking-tight">{String(data.title || 'Design Title')}</h3>
        <p className="mt-1 text-[0.78rem] text-(--gray-400)">{String(data.summary || 'Summary…')}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {((data.tags as string[]) ?? []).map((t) => (
            <span key={t} className="rounded-full border border-neutral-700 px-2.5 py-0.5 font-mono text-[0.6rem] text-(--gray-400)">{t}</span>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-head text-lg font-extrabold tracking-tight uppercase">Designs</h2>
        <div className="flex items-center gap-3">
          {!editing && (
            <div className="flex gap-1 rounded-lg border border-(--line-light) p-0.5">
              <button type="button" onClick={() => setView('cards')} className={`cursor-pointer rounded-md border-0 px-3 py-1 text-[0.65rem] font-semibold uppercase transition-colors ${view === 'cards' ? 'bg-white text-black' : 'bg-transparent text-(--gray-400)'}`}>▦ Cards</button>
              <button type="button" onClick={() => setView('table')} className={`cursor-pointer rounded-md border-0 px-3 py-1 text-[0.65rem] font-semibold uppercase transition-colors ${view === 'table' ? 'bg-white text-black' : 'bg-transparent text-(--gray-400)'}`}>≡ Table</button>
            </div>
          )}
          <button type="button" onClick={startNew} className="cursor-pointer rounded-full border border-white bg-white px-5 py-2 font-head text-[0.65rem] font-semibold tracking-[0.18em] text-black uppercase transition-all hover:bg-transparent hover:text-white">+ Add</button>
        </div>
      </div>
      {notice && <p className={`mt-3 text-sm ${notice.includes('Created') || notice.includes('Saved') ? 'text-green-400' : 'text-red-400'}`}>{notice}</p>}

      {!editing && view === 'cards' && rows.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div key={String(row.id)} className="flex flex-col rounded-xl border border-(--line-light) overflow-hidden transition-colors hover:border-(--white)">
              {row.image ? <img src={`/${String(row.image)}`} alt="" className="h-28 w-full object-cover" />
                : <div className="flex h-28 items-center justify-center bg-(--ink) font-head text-3xl font-black text-(--gray-500)">{String(row.title ?? '?')[0]?.toUpperCase()}</div>}
              <div className="flex-1 p-3"><h3 className="font-head text-sm font-bold">{String(row.title)}</h3><p className="mt-1 text-[0.75rem] text-(--gray-400)">{formatDate(String(row.date))}</p></div>
              <div className="flex border-t border-(--line-light)">
                <button type="button" onClick={() => { setEditing({ ...row }); setIsNew(false) }} className="flex-1 cursor-pointer border-0 bg-transparent py-2.5 flex items-center justify-center text-(--gray-400) hover:text-(--white) hover:bg-(--ink) material-symbols-outlined text-[1rem]">edit</button>
                <button type="button" onClick={() => remove(String(row.id))} className="flex-1 cursor-pointer border-0 bg-transparent py-2.5 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-(--ink) material-symbols-outlined text-[1rem]">delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!editing && view === 'table' && rows.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-(--line-light)">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead><tr className="border-b border-(--line-light) font-head text-[0.65rem] tracking-[0.18em] text-(--gray-400) uppercase">
              <th className="px-4 py-3">Title</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Tags</th><th className="px-4 py-3" />
            </tr></thead>
            <tbody>{rows.map((row) => (
              <tr key={String(row.id)} className="border-b border-(--line) last:border-0 hover:bg-(--panel)">
                <td className="px-4 py-3 font-bold">{String(row.title)}</td>
                <td className="px-4 py-3 text-(--gray-400)">{formatDate(String(row.date))}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-[0.75rem] text-(--gray-400)">{((row.tags as string[]) ?? []).join(', ')}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button type="button" onClick={() => { setEditing({ ...row }); setIsNew(false) }} className="cursor-pointer border-0 bg-transparent text-(--gray-400) hover:text-(--white) material-symbols-outlined text-[1rem]">edit</button>
                  <button type="button" onClick={() => remove(String(row.id))} className="cursor-pointer border-0 bg-transparent text-red-400 hover:text-red-300 material-symbols-outlined text-[1rem]">delete</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {!editing && rows.length === 0 && <p className="mt-6 text-[0.85rem] text-(--gray-500)">No designs yet.</p>}

      {editing && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-xl border border-(--line-light) p-6">
            <h3 className="font-head text-sm font-extrabold tracking-[0.18em] uppercase">{isNew ? 'Add Design' : 'Edit Design'}</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <AutoIdInput value={String(editing.id ?? '')} onChange={(v) => setEditing({ ...editing, id: v })} sourceTitle={String(editing.title ?? '')} existingIds={existingIds} disabled={!isNew} />
              <label><FieldLabel>Title *</FieldLabel><input value={String(editing.title ?? '')} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={INPUT} /></label>
              <DateInput value={String(editing.date ?? '')} onChange={(v) => setEditing({ ...editing, date: v })} label="Date" />
              <label><FieldLabel>Live URL</FieldLabel><input value={String(editing.liveUrl ?? '')} onChange={(e) => setEditing({ ...editing, liveUrl: e.target.value })} className={INPUT} /></label>
              <label className="sm:col-span-2"><FieldLabel>Summary</FieldLabel><input value={String(editing.summary ?? '')} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} className={INPUT} /></label>
              <label className="sm:col-span-2"><FieldLabel>Description</FieldLabel><textarea value={String(editing.description ?? '')} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={4} className={`${INPUT} resize-y`} /></label>
              <ImageUpload value={String(editing.image ?? '')} onChange={(path) => setEditing({ ...editing, image: path })} />
              <ChipInput label="Tags" items={(editing.tags as string[]) ?? []} onChange={(items) => setEditing({ ...editing, tags: items })} />
              <DraggableSourceEditor label="Files" items={((editing.files as unknown as SourceEntry[]) ?? [])} onChange={(items) => setEditing({ ...editing, files: items as unknown as Row[] })} />
              <DraggableSourceEditor label="Sources" items={((editing.sources as unknown as SourceEntry[]) ?? [])} onChange={(items) => setEditing({ ...editing, sources: items as unknown as Row[] })} />
            </div>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={save} className="cursor-pointer rounded-full border border-white bg-white px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] text-black uppercase transition-all hover:bg-transparent hover:text-white">{isNew ? 'Create' : 'Save'}</button>
              <button type="button" onClick={() => setEditing(null)} className="cursor-pointer rounded-full border border-(--line-light) px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] uppercase hover:border-(--white)">Cancel</button>
            </div>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-2 font-head text-[0.65rem] tracking-[0.18em] text-(--gray-400) uppercase">Preview</p>
            <Preview data={editing} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Section: Experience (with dates + sorting) ─────────────── */

function ExperienceSection() {
  const [rows, setRows] = useState<Row[]>([])
  const [editing, setEditing] = useState<Row | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    try { const list = await listResource({ data: { password: pw(), resource: 'experience' } }); setRows(sortByDate(Array.isArray(list) ? list : [], 'startDate')) } catch { /* */ }
  }, [])
  useEffect(() => { refresh() }, [refresh])

  const blank = { role: '', organization: '', location: '', startDate: '', endDate: '', period: '', summary: '' }
  const startNew = () => { setEditing({ ...blank }); setIsNew(true) }

  const save = async () => {
    if (!editing) return
    // Auto-generate period from dates
    const start = formatDate(String(editing.startDate ?? ''))
    const end = editing.endDate ? formatDate(String(editing.endDate)) : 'Present'
    const period = start ? `${start} – ${end}` : String(editing.period ?? '')
    const body = { ...editing, period }
    try {
      if (isNew) { await createResource({ data: { password: pw(), resource: 'experience', body } }); setNotice('Created.') }
      else { await updateResource({ data: { password: pw(), resource: 'experience', id: editing.id, patch: body } }); setNotice('Saved.') }
      setEditing(null); await refresh()
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  const remove = async (id: string | number) => {
    if (!window.confirm('Delete?')) return
    try { await deleteResource({ data: { password: pw(), resource: 'experience', id } }); await refresh() } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-head text-lg font-extrabold tracking-tight uppercase">Experience</h2>
        <button type="button" onClick={startNew} className="cursor-pointer rounded-full border border-white bg-white px-5 py-2 font-head text-[0.65rem] font-semibold tracking-[0.18em] text-black uppercase transition-all hover:bg-transparent hover:text-white">+ Add</button>
      </div>
      {notice && <p className={`mt-3 text-sm ${notice.includes('Created') || notice.includes('Saved') ? 'text-green-400' : 'text-red-400'}`}>{notice}</p>}

      {!editing && rows.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {rows.map((row) => (
            <div key={String(row.id)} className="flex items-center justify-between gap-4 rounded-xl border border-(--line-light) px-5 py-4 transition-colors hover:border-(--white)">
              <div className="min-w-0 flex-1">
                <p className="font-head text-sm font-bold">{String(row.role)} · {String(row.organization)}</p>
                <p className="mt-0.5 text-[0.75rem] text-(--gray-400)">{String(row.period)}</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setEditing({ ...row }); setIsNew(false) }} className="cursor-pointer border-0 bg-transparent text-(--gray-400) hover:text-(--white) material-symbols-outlined text-[1rem]">edit</button>
                <button type="button" onClick={() => remove(String(row.id ?? 0))} className="cursor-pointer border-0 bg-transparent text-red-400 hover:text-red-300 material-symbols-outlined text-[1rem]">delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!editing && rows.length === 0 && <p className="mt-6 text-[0.85rem] text-(--gray-500)">No experience yet.</p>}

      {editing && (
        <div className="mt-6 rounded-xl border border-(--line-light) p-6">
          <h3 className="font-head text-sm font-extrabold tracking-[0.18em] uppercase">{isNew ? 'Add' : 'Edit'} Experience</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label><FieldLabel>Role *</FieldLabel><input value={String(editing.role ?? '')} onChange={(e) => setEditing({ ...editing, role: e.target.value })} className={INPUT} /></label>
            <label><FieldLabel>Organization *</FieldLabel><input value={String(editing.organization ?? '')} onChange={(e) => setEditing({ ...editing, organization: e.target.value })} className={INPUT} /></label>
            <label><FieldLabel>Location</FieldLabel><input value={String(editing.location ?? '')} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className={INPUT} /></label>
            <label><FieldLabel>Period (fallback)</FieldLabel><input value={String(editing.period ?? '')} onChange={(e) => setEditing({ ...editing, period: e.target.value })} placeholder="Jun 2025 – Sep 2025" className={INPUT} /></label>
            <DateInput value={String(editing.startDate ?? '')} onChange={(v) => setEditing({ ...editing, startDate: v })} label="Start Date" />
            <DateInput value={String(editing.endDate ?? '')} onChange={(v) => setEditing({ ...editing, endDate: v })} label="End Date (leave empty = Present)" />
            <label className="sm:col-span-2"><FieldLabel>Summary</FieldLabel><textarea value={String(editing.summary ?? '')} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} rows={3} className={`${INPUT} resize-y`} /></label>
          </div>
          <div className="mt-6 flex gap-2">
            <button type="button" onClick={save} className="cursor-pointer rounded-full border border-white bg-white px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] text-black uppercase hover:bg-transparent hover:text-white">{isNew ? 'Create' : 'Save'}</button>
            <button type="button" onClick={() => setEditing(null)} className="cursor-pointer rounded-full border border-(--line-light) px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] uppercase hover:border-(--white)">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Generic CRUD Section ───────────────────────────────────── */

function CrudSection({
  resourceName, title, fields, boolFields = [],
}: {
  resourceName: string; title: string
  fields: Array<{ key: string; label: string; multiline?: boolean }>
  boolFields?: Array<{ key: string; label: string }>
}) {
  const [rows, setRows] = useState<Row[]>([])
  const [editing, setEditing] = useState<Row | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    try { const list = await listResource({ data: { password: pw(), resource: resourceName } }); setRows(Array.isArray(list) ? list : [list]) } catch { /* */ }
  }, [resourceName])
  useEffect(() => { refresh() }, [refresh])

  const startNew = () => { const b: Row = {}; for (const f of fields) b[f.key] = ''; for (const f of boolFields) b[f.key] = false; setEditing(b); setIsNew(true) }

  const save = async () => {
    if (!editing) return
    try {
      if (isNew) { await createResource({ data: { password: pw(), resource: resourceName, body: editing } }); setNotice('Created.') }
      else { await updateResource({ data: { password: pw(), resource: resourceName, id: editing.id ?? 0, patch: editing } }); setNotice('Saved.') }
      setEditing(null); await refresh()
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  const remove = async (id: string | number) => {
    if (!window.confirm('Delete?')) return
    try { await deleteResource({ data: { password: pw(), resource: resourceName, id } }); await refresh() } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-head text-lg font-extrabold tracking-tight uppercase">{title}</h2>
        <button type="button" onClick={startNew} className="cursor-pointer rounded-full border border-white bg-white px-5 py-2 font-head text-[0.65rem] font-semibold tracking-[0.18em] text-black uppercase transition-all hover:bg-transparent hover:text-white">+ Add</button>
      </div>
      {notice && <p className={`mt-3 text-sm ${notice.includes('Created') || notice.includes('Saved') ? 'text-green-400' : 'text-red-400'}`}>{notice}</p>}
      {!editing && rows.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {rows.map((row, i) => {
            const display = fields.slice(0, 3).map((f) => String(row[f.key] ?? '')).filter(Boolean).join(' · ')
            return (
              <div key={String(row.id ?? i)} className="flex items-center justify-between gap-4 rounded-xl border border-(--line-light) px-5 py-4 transition-colors hover:border-(--white)">
                <p className="min-w-0 flex-1 truncate font-head text-sm font-bold">{display || '(empty)'}</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setEditing({ ...row }); setIsNew(false) }} className="cursor-pointer border-0 bg-transparent text-(--gray-400) hover:text-(--white) material-symbols-outlined text-[1rem]">edit</button>
                  <button type="button" onClick={() => remove(String(row.id ?? i))} className="cursor-pointer border-0 bg-transparent text-red-400 hover:text-red-300 material-symbols-outlined text-[1rem]">delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {!editing && rows.length === 0 && <p className="mt-6 text-[0.85rem] text-(--gray-500)">No items yet.</p>}
      {editing && (
        <div className="mt-6 rounded-xl border border-(--line-light) p-6">
          <h3 className="font-head text-sm font-extrabold tracking-[0.18em] uppercase">{isNew ? 'Add' : 'Edit'} {title}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <label key={f.key} className={f.multiline ? 'sm:col-span-2' : ''}>
                <FieldLabel>{f.label}</FieldLabel>
                {f.multiline ? (
                  <textarea value={String(editing[f.key] ?? '')} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} rows={3} className={`${INPUT} resize-y`} />
                ) : (
                  <input value={String(editing[f.key] ?? '')} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} className={INPUT} />
                )}
              </label>
            ))}
            {boolFields.map((f) => (
              <label key={f.key} className="flex items-center gap-3">
                <input type="checkbox" checked={editing[f.key] === true} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.checked })} className="h-5 w-5 accent-white" />
                <span className={LABEL}>{f.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <button type="button" onClick={save} className="cursor-pointer rounded-full border border-white bg-white px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] text-black uppercase hover:bg-transparent hover:text-white">{isNew ? 'Create' : 'Save'}</button>
            <button type="button" onClick={() => setEditing(null)} className="cursor-pointer rounded-full border border-(--line-light) px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] uppercase hover:border-(--white)">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Section: Education ─────────────────────────────────────── */

function EducationSection() {
  const [rows, setRows] = useState<Row[]>([])
  const [editing, setEditing] = useState<Row | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    try { const list = await listResource({ data: { password: pw(), resource: 'education' } }); setRows(sortByDate(Array.isArray(list) ? list : [], 'expected')) } catch { /* */ }
  }, [])
  useEffect(() => { refresh() }, [refresh])

  const blank = { institution: '', location: '', degree: '', expected: '', completed: '' }
  const startNew = () => { setEditing({ ...blank }); setIsNew(true) }

  const save = async () => {
    if (!editing) return
    try {
      if (isNew) { await createResource({ data: { password: pw(), resource: 'education', body: editing } }); setNotice('Created.') }
      else { await updateResource({ data: { password: pw(), resource: 'education', id: editing.id, patch: editing } }); setNotice('Saved.') }
      setEditing(null); await refresh()
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  const remove = async (id: string | number) => {
    if (!window.confirm('Delete?')) return
    try { await deleteResource({ data: { password: pw(), resource: 'education', id } }); await refresh() } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-head text-lg font-extrabold tracking-tight uppercase">Education</h2>
        <button type="button" onClick={startNew} className="cursor-pointer rounded-full border border-white bg-white px-5 py-2 font-head text-[0.65rem] font-semibold tracking-[0.18em] text-black uppercase transition-all hover:bg-transparent hover:text-white">+ Add</button>
      </div>
      {notice && <p className={`mt-3 text-sm ${notice.includes('Created') || notice.includes('Saved') ? 'text-green-400' : 'text-red-400'}`}>{notice}</p>}
      {!editing && rows.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {rows.map((row) => (
            <div key={String(row.id)} className="flex items-center justify-between gap-4 rounded-xl border border-(--line-light) px-5 py-4 transition-colors hover:border-(--white)">
              <div className="min-w-0 flex-1">
                <p className="font-head text-sm font-bold">{String(row.institution)} · {String(row.degree)}</p>
                <p className="mt-0.5 text-[0.75rem] text-(--gray-400)">{String(row.location)} · {String(row.expected || row.completed)}</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setEditing({ ...row }); setIsNew(false) }} className="cursor-pointer border-0 bg-transparent text-(--gray-400) hover:text-(--white) material-symbols-outlined text-[1rem]">edit</button>
                <button type="button" onClick={() => remove(String(row.id ?? 0))} className="cursor-pointer border-0 bg-transparent text-red-400 hover:text-red-300 material-symbols-outlined text-[1rem]">delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!editing && rows.length === 0 && <p className="mt-6 text-[0.85rem] text-(--gray-500)">No education yet.</p>}
      {editing && (
        <div className="mt-6 rounded-xl border border-(--line-light) p-6">
          <h3 className="font-head text-sm font-extrabold tracking-[0.18em] uppercase">{isNew ? 'Add' : 'Edit'} Education</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label><FieldLabel>Institution *</FieldLabel><input value={String(editing.institution ?? '')} onChange={(e) => setEditing({ ...editing, institution: e.target.value })} className={INPUT} /></label>
            <label><FieldLabel>Degree *</FieldLabel><input value={String(editing.degree ?? '')} onChange={(e) => setEditing({ ...editing, degree: e.target.value })} className={INPUT} /></label>
            <label><FieldLabel>Location</FieldLabel><input value={String(editing.location ?? '')} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className={INPUT} /></label>
            <DateInput value={String(editing.expected ?? '')} onChange={(v) => setEditing({ ...editing, expected: v })} label="Expected Graduation" />
            <DateInput value={String(editing.completed ?? '')} onChange={(v) => setEditing({ ...editing, completed: v })} label="Completed" />
          </div>
          <div className="mt-6 flex gap-2">
            <button type="button" onClick={save} className="cursor-pointer rounded-full border border-white bg-white px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] text-black uppercase hover:bg-transparent hover:text-white">{isNew ? 'Create' : 'Save'}</button>
            <button type="button" onClick={() => setEditing(null)} className="cursor-pointer rounded-full border border-(--line-light) px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] uppercase hover:border-(--white)">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Section: Socials ───────────────────────────────────────── */

function SocialsSection() {
  const [rows, setRows] = useState<Row[]>([])
  const [editing, setEditing] = useState<Row | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    try { const list = await listResource({ data: { password: pw(), resource: 'socials' } }); setRows(Array.isArray(list) ? list : [list]) } catch { /* */ }
  }, [])
  useEffect(() => { refresh() }, [refresh])

  const iconOptions = ['instagram', 'discord', 'reddit', 'facebook', 'twitter', 'mastodon', 'bluesky', 'steam', 'xbox', 'playstation', 'twitch', 'youtube', 'telegram', 'github', 'linkedin', 'mail', 'globe']
  const startNew = () => { setEditing({ id: '', label: '', url: '', icon: 'globe', hide: false }); setIsNew(true) }

  const save = async () => {
    if (!editing) return
    try {
      if (isNew) { await createResource({ data: { password: pw(), resource: 'socials', body: editing } }); setNotice('Created.') }
      else { await updateResource({ data: { password: pw(), resource: 'socials', id: editing.id, patch: editing } }); setNotice('Saved.') }
      setEditing(null); await refresh()
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete?')) return
    try { await deleteResource({ data: { password: pw(), resource: 'socials', id } }); await refresh() } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-head text-lg font-extrabold tracking-tight uppercase">Social Links</h2>
        <button type="button" onClick={startNew} className="cursor-pointer rounded-full border border-white bg-white px-5 py-2 font-head text-[0.65rem] font-semibold tracking-[0.18em] text-black uppercase transition-all hover:bg-transparent hover:text-white">+ Add</button>
      </div>
      {notice && <p className={`mt-3 text-sm ${notice.includes('Created') || notice.includes('Saved') ? 'text-green-400' : 'text-red-400'}`}>{notice}</p>}
      {!editing && rows.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const IC = socialIconFor(String(row.icon ?? ''))
            return (
              <div key={String(row.id)} className="flex items-center gap-3 rounded-xl border border-(--line-light) px-4 py-3 transition-colors hover:border-(--white)">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-(--line-light) bg-(--ink)"><IC /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-head text-sm font-bold">{String(row.label)}</p>
                  <p className="truncate text-[0.7rem] text-(--gray-500)">{String(row.url || '(no url)')}</p>
                </div>
                {row.hide ? <span className="shrink-0 rounded-full border border-(--gray-600) px-2 py-0.5 text-[0.55rem] text-(--gray-500) uppercase">hidden</span>
                  : <span className="shrink-0 rounded-full border border-green-600 px-2 py-0.5 text-[0.55rem] font-semibold text-green-400 uppercase">live</span>}
                <div className="flex gap-2">
                <button type="button" onClick={() => { setEditing({ ...row }); setIsNew(false) }} className="cursor-pointer border-0 bg-transparent text-(--gray-400) hover:text-(--white) material-symbols-outlined text-[1rem]">edit</button>
                <button type="button" onClick={() => remove(String(row.id))} className="cursor-pointer border-0 bg-transparent text-red-400 hover:text-red-300 material-symbols-outlined text-[1rem]">delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {!editing && rows.length === 0 && <p className="mt-6 text-[0.85rem] text-(--gray-500)">No social links yet.</p>}
      {editing && (
        <div className="mt-6 rounded-xl border border-(--line-light) p-6">
          <h3 className="font-head text-sm font-extrabold tracking-[0.18em] uppercase">{isNew ? 'Add' : 'Edit'} Social Link</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label><FieldLabel>ID *</FieldLabel><input value={String(editing.id ?? '')} onChange={(e) => setEditing({ ...editing, id: e.target.value })} disabled={!isNew} placeholder="github" className={`${INPUT} disabled:opacity-50`} /></label>
            <label><FieldLabel>Label</FieldLabel><input value={String(editing.label ?? '')} onChange={(e) => setEditing({ ...editing, label: e.target.value })} className={INPUT} /></label>
            <label className="sm:col-span-2"><FieldLabel>URL</FieldLabel><input value={String(editing.url ?? '')} onChange={(e) => setEditing({ ...editing, url: e.target.value })} className={INPUT} /></label>
            <label className="sm:col-span-2">
              <FieldLabel>Icon</FieldLabel>
              <div className="flex flex-wrap gap-2 rounded-xl border border-(--line-light) p-3">
                {iconOptions.map((opt) => {
                  const IC = socialIconFor(opt)
                  return (
                    <button key={opt} type="button" onClick={() => setEditing({ ...editing, icon: opt })}
                      className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-colors ${editing.icon === opt ? 'border-white bg-white text-black' : 'border-(--line-light) bg-(--ink) hover:border-(--white)'}`} title={opt}><IC /></button>
                  )
                })}
              </div>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={editing.hide === true} onChange={(e) => setEditing({ ...editing, hide: e.target.checked })} className="h-5 w-5 accent-white" />
              <span className={LABEL}>Hidden</span>
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-(--line-light) p-3">
            <span className="text-[0.7rem] text-(--gray-500) uppercase">Preview:</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-(--white)">{(() => { const IC = socialIconFor(String(editing.icon ?? '')); return <IC /> })()}</div>
            <span className="font-head text-sm font-bold">{String(editing.label || editing.id || '?')}</span>
          </div>
          <div className="mt-6 flex gap-2">
            <button type="button" onClick={save} className="cursor-pointer rounded-full border border-white bg-white px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] text-black uppercase hover:bg-transparent hover:text-white">{isNew ? 'Create' : 'Save'}</button>
            <button type="button" onClick={() => setEditing(null)} className="cursor-pointer rounded-full border border-(--line-light) px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] uppercase hover:border-(--white)">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Section: Blog Posts ────────────────────────────────────── */

const BLOG_CATEGORIES = ['Tutorial', 'Opinion', 'Case Study', 'News', 'Personal', 'Tech', 'Design', 'Life']
function wordCount(t: string) { return t.trim().split(/\s+/).filter(Boolean).length }
function readTime(t: string) { return `${Math.max(1, Math.ceil(wordCount(t) / 200))} min read` }

function BlogsSection() {
  const [rows, setRows] = useState<Row[]>([])
  const [editing, setEditing] = useState<Row | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    try { const list = await listResource({ data: { password: pw(), resource: 'blogs' } }); setRows(Array.isArray(list) ? list : [list]) } catch { /* */ }
  }, [])
  useEffect(() => { refresh() }, [refresh])

  const blank = { id: '', title: '', author: '', date: '', excerpt: '', file: '', category: '', tags: [] as string[], coverImage: '', content: '', hide: false }
  const startNew = () => { setEditing({ ...blank }); setIsNew(true) }

  const save = async () => {
    if (!editing) return
    try {
      if (isNew) { await createResource({ data: { password: pw(), resource: 'blogs', body: editing } }); setNotice('Created.') }
      else { await updateResource({ data: { password: pw(), resource: 'blogs', id: editing.id, patch: editing } }); setNotice('Saved.') }
      setEditing(null); await refresh()
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete?')) return
    try { await deleteResource({ data: { password: pw(), resource: 'blogs', id } }); await refresh() } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  const renderedPreview = editing ? (marked.parse(String(editing.content ?? ''), { async: false }) as string) : ''
  const contentStr = String(editing?.content ?? '')
  const existingIds = rows.map((r) => String(r.id)).filter(Boolean)

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-head text-lg font-extrabold tracking-tight uppercase">Blog Posts</h2>
        <button type="button" onClick={startNew} className="cursor-pointer rounded-full border border-white bg-white px-5 py-2 font-head text-[0.65rem] font-semibold tracking-[0.18em] text-black uppercase transition-all hover:bg-transparent hover:text-white">+ New Post</button>
      </div>
      {notice && <p className={`mt-3 text-sm ${notice.includes('Created') || notice.includes('Saved') ? 'text-green-400' : 'text-red-400'}`}>{notice}</p>}

      {!editing && rows.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {rows.map((row) => (
            <div key={String(row.id)} className="flex items-center gap-4 rounded-xl border border-(--line-light) px-5 py-4 transition-colors hover:border-(--white)">
              {row.coverImage ? <img src={`/${String(row.coverImage)}`} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover" />
                : <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md bg-(--ink) font-head text-lg font-black text-(--gray-500)">{String(row.title ?? '?')[0]?.toUpperCase()}</div>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-head text-sm font-bold">{String(row.title)}</p>
                  {row.hide ? <span className="shrink-0 rounded-full border border-(--gray-600) px-2 py-0.5 text-[0.55rem] text-(--gray-500) uppercase">hidden</span> : ''}
                  {row.category ? <span className="shrink-0 rounded-full border border-(--white) px-2 py-0.5 text-[0.55rem] font-semibold uppercase">{String(row.category)}</span> : ''}
                </div>
                <p className="mt-0.5 text-[0.75rem] text-(--gray-400)">{String(row.date)} · {String(row.author)} · {wordCount(String(row.content ?? ''))} words · {readTime(String(row.content ?? ''))}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setEditing({ ...row }); setIsNew(false) }} className="cursor-pointer border-0 bg-transparent text-(--gray-400) hover:text-(--white) material-symbols-outlined text-[1rem]">edit</button>
                <button type="button" onClick={() => remove(String(row.id))} className="cursor-pointer border-0 bg-transparent text-red-400 hover:text-red-300 material-symbols-outlined text-[1rem]">delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!editing && rows.length === 0 && <p className="mt-6 text-[0.85rem] text-(--gray-500)">No posts yet.</p>}

      {editing && (
        <div className="mt-6 rounded-xl border border-(--line-light) p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-head text-sm font-extrabold tracking-[0.18em] uppercase">{isNew ? 'New Post' : 'Edit Post'}</h3>
            <span className="text-[0.7rem] text-(--gray-500)">{wordCount(contentStr)} words · {readTime(contentStr)}</span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <AutoIdInput value={String(editing.id ?? '')} onChange={(v) => setEditing({ ...editing, id: v })} sourceTitle={String(editing.title ?? '')} existingIds={existingIds} disabled={!isNew} />
            <label><FieldLabel>Title *</FieldLabel><input value={String(editing.title ?? '')} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={INPUT} /></label>
            <label><FieldLabel>Author</FieldLabel><input value={String(editing.author ?? '')} onChange={(e) => setEditing({ ...editing, author: e.target.value })} className={INPUT} /></label>
            <DateInput value={String(editing.date ?? '')} onChange={(v) => setEditing({ ...editing, date: v })} label="Date" />
            <label>
              <FieldLabel>Category</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {BLOG_CATEGORIES.map((cat) => (
                  <button key={cat} type="button" onClick={() => setEditing({ ...editing, category: editing.category === cat ? '' : cat })}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase transition-colors ${editing.category === cat ? 'border-white bg-white text-black' : 'border-(--line-light) bg-transparent text-(--gray-400) hover:border-(--white)'}`}>{cat}</button>
                ))}
              </div>
            </label>
            <ChipInput label="Tags" items={(editing.tags as string[]) ?? []} onChange={(items) => setEditing({ ...editing, tags: items })} />
            <ImageUpload value={String(editing.coverImage ?? '')} onChange={(path) => setEditing({ ...editing, coverImage: path })} />
            <label><FieldLabel>Legacy File</FieldLabel>
              <input value={String(editing.file ?? '')} onChange={(e) => setEditing({ ...editing, file: e.target.value })} placeholder="hello-world.md" className={INPUT} />
              <span className="mt-1 block text-[0.65rem] text-(--gray-500)">Optional. Points to a Markdown file in app/content/blog/.</span>
            </label>
            <label className="sm:col-span-2"><FieldLabel>Excerpt</FieldLabel><input value={String(editing.excerpt ?? '')} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} placeholder="One or two sentences…" className={INPUT} /></label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={editing.hide === true} onChange={(e) => setEditing({ ...editing, hide: e.target.checked })} className="h-5 w-5 accent-white" />
              <span className={LABEL}>Hidden (draft mode)</span>
            </label>
          </div>
          <div className="mt-6">
            <FieldLabel>Content</FieldLabel>
            <BlogEditor markdown={contentStr} onChange={(md) => setEditing({ ...editing, content: md })} />
          </div>
          <div className="mt-4">
            <FieldLabel>Preview</FieldLabel>
            <div className="blog-prose max-h-[400px] overflow-y-auto rounded-xl border border-(--line-light) bg-(--ink) p-6" dangerouslySetInnerHTML={{ __html: renderedPreview }} />
          </div>
          <div className="mt-6 flex gap-2">
            <button type="button" onClick={save} className="cursor-pointer rounded-full border border-white bg-white px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] text-black uppercase hover:bg-transparent hover:text-white">{isNew ? 'Create' : 'Save'}</button>
            <button type="button" onClick={() => setEditing(null)} className="cursor-pointer rounded-full border border-(--line-light) px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] uppercase hover:border-(--white)">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Section: Dashboard (analytics) ─────────────────────────── */

function DashboardSection() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics({ data: { password: pw() } })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-[0.85rem] text-(--gray-500)">Loading analytics…</p>
  if (!data) return <p className="text-[0.85rem] text-(--gray-500)">Failed to load analytics.</p>

  const d = data as Record<string, number>
  const countries = (data.topCountries ?? []) as Array<{ country: string; count: number }>
  const pages = (data.topPages ?? []) as Array<{ page: string; count: number }>
  const dailyVisits = (data.dailyVisits ?? {}) as Record<string, number>
  const avgDuration = d.totalVisitors > 0 ? Math.round(d.totalDuration / d.totalVisitors) : 0

  const stat = (label: string, value: string | number, icon: string) => (
    <div className="rounded-xl border border-(--line-light) p-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[1.2rem] text-(--gray-400)">{icon}</span>
        <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-(--gray-400) uppercase">{label}</span>
      </div>
      <p className="mt-2 font-head text-2xl font-black tracking-tight">{value}</p>
    </div>
  )

  return (
    <div>
      <h2 className="font-head text-lg font-extrabold tracking-tight uppercase">Dashboard</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stat('Total Visits', d.totalVisitors, 'visibility')}
        {stat('Unique Visitors', d.uniqueIps, 'person')}
        {stat('Avg. Time', `${avgDuration}s`, 'schedule')}
        {stat('Messages', d.totalMessages, 'mail')}
      </div>

      {/* Countries */}
      {countries.length > 0 && (
        <div className="mt-6 rounded-xl border border-(--line-light) p-5">
          <h3 className="font-head text-sm font-extrabold tracking-[0.18em] uppercase">Top Countries</h3>
          <div className="mt-3 flex flex-col gap-2">
            {countries.map((c) => (
              <div key={c.country} className="flex items-center gap-3">
                <span className="min-w-[120px] text-[0.8rem] text-(--gray-300)">{c.country}</span>
                <div className="flex-1 h-2 rounded-full bg-(--ink)">
                  <div className="h-full rounded-full bg-white" style={{ width: `${(c.count / (countries[0]?.count ?? 1)) * 100}%` }} />
                </div>
                <span className="font-head text-[0.7rem] font-bold text-(--gray-400)">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Pages */}
      {pages.length > 0 && (
        <div className="mt-6 rounded-xl border border-(--line-light) p-5">
          <h3 className="font-head text-sm font-extrabold tracking-[0.18em] uppercase">Top Pages</h3>
          <div className="mt-3 flex flex-col gap-2">
            {pages.map((p) => (
              <div key={p.page} className="flex items-center gap-3">
                <span className="min-w-[120px] truncate text-[0.8rem] font-mono text-(--gray-300)">{p.page}</span>
                <div className="flex-1 h-2 rounded-full bg-(--ink)">
                  <div className="h-full rounded-full bg-white" style={{ width: `${(p.count / (pages[0]?.count ?? 1)) * 100}%` }} />
                </div>
                <span className="font-head text-[0.7rem] font-bold text-(--gray-400)">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily visits chart */}
      {Object.keys(dailyVisits).length > 0 && (
        <div className="mt-6 rounded-xl border border-(--line-light) p-5">
          <h3 className="font-head text-sm font-extrabold tracking-[0.18em] uppercase">Visits (Last 30 Days)</h3>
          <div className="mt-3 flex items-end gap-1 h-32">
            {Object.entries(dailyVisits).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => {
              const maxCount = Math.max(...Object.values(dailyVisits))
              const height = maxCount > 0 ? (count / maxCount) * 100 : 0
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1" title={`${date}: ${count} visits`}>
                  <div className="w-full bg-white rounded-t" style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }} />
                  <span className="text-[0.5rem] text-(--gray-500) rotate-45 origin-left">{date.slice(5)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Section: Messages ──────────────────────────────────────── */

function MessagesSection() {
  const [rows, setRows] = useState<Row[]>([])
  const [selected, setSelected] = useState<Row | null>(null)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    try { const list = await listResource({ data: { password: pw(), resource: 'messages' } }); setRows(Array.isArray(list) ? list : [list]) } catch { /* */ }
  }, [])
  useEffect(() => { refresh() }, [refresh])

  const markRead = async (id: number) => {
    await updateResource({ data: { password: pw(), resource: 'messages', id: id, patch: { ['read']: 1 } } })
    await refresh()
  }

  const remove = async (id: number) => {
    if (!window.confirm('Delete this message?')) return
    try { await deleteResource({ data: { password: pw(), resource: 'messages', id: id } }); await refresh(); setSelected(null) } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed.') }
  }

  const unread = rows.filter((r) => !r.read).length

  return (
    <div>
      <h2 className="font-head text-lg font-extrabold tracking-tight uppercase">
        Messages {unread > 0 && <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[0.7rem] font-bold text-black">{unread}</span>}
      </h2>
      {notice && <p className="mt-3 text-sm text-red-400">{notice}</p>}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Message list */}
        <div className="flex flex-col gap-2">
          {rows.length === 0 && <p className="text-[0.85rem] text-(--gray-500)">No messages yet.</p>}
          {rows.map((row) => (
            <button
              key={String(row.id)}
              type="button"
              onClick={() => { setSelected(row); if (!row.read) markRead(Number(row.id)) }}
              className={`w-full cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors ${
                selected?.id === row.id ? 'border-white bg-(--ink)' : 'border-(--line-light) hover:border-(--white)'
              } ${!row.read ? 'border-l-2 border-l-white' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-head text-sm font-bold">{row.anonymous ? 'Anonymous' : String(row.name)}</span>
                <span className="text-[0.65rem] text-(--gray-500)">{String(row.createdAt ?? '').slice(0, 16)}</span>
              </div>
              <p className="mt-0.5 text-[0.75rem] text-(--gray-400)">{String(row.subject || '(no subject)')}</p>
            </button>
          ))}
        </div>

        {/* Message detail */}
        <div className="rounded-xl border border-(--line-light) p-5">
          {selected ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-head text-sm font-bold">{selected.anonymous ? 'Anonymous' : String(selected.name)}</p>
                  <p className="text-[0.75rem] text-(--gray-400)">{String(selected.email)} · {String(selected.createdAt ?? '').slice(0, 16)}</p>
                  {selected.country ? <p className="text-[0.65rem] text-(--gray-500)">📍 {String(selected.country)} · IP: {String(selected.ip)}</p> : null}
                </div>
                <button type="button" onClick={() => remove(Number(selected.id))}
                  className="cursor-pointer border-0 bg-transparent text-red-400 material-symbols-outlined text-[1.1rem] hover:text-red-300">delete</button>
              </div>
              {selected.subject ? <p className="mt-3 font-head text-sm font-bold">{String(selected.subject)}</p> : null}
              <p className="mt-3 whitespace-pre-wrap text-[0.9rem] leading-relaxed text-(--gray-300)">{String(selected.body)}</p>
            </>
          ) : (
            <p className="text-[0.85rem] text-(--gray-500)">Select a message to read.</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Admin Shell ───────────────────────────────────────── */

export function Admin() {
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [active, setActive] = useState('profile')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { try { if (sessionStorage.getItem(SESSION_KEY) === '1') setUnlocked(true) } catch { /* */ } }, [])
  useEffect(() => { if (!unlocked) return; resourceMeta({ data: { password: pw() } }).catch(() => setUnlocked(false)) }, [unlocked])

  async function unlock(event: FormEvent): Promise<void> {
    event.preventDefault(); setLoginError('')
    try {
      const result = await checkAdmin({ data: { password } })
      if (!result.ok) { setLoginError('Wrong password.'); return }
      sessionStorage.setItem(SESSION_KEY, '1'); sessionStorage.setItem(SESSION_KEY + '-pw', password)
      setPassword(''); setUnlocked(true)
    } catch (err) { setLoginError(err instanceof Error ? err.message : 'Login failed.') }
  }

  function lock(): void { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY + '-pw'); setUnlocked(false) }

  async function seed(): Promise<void> {
    try {
      const result = await seedFromJson({ data: { password: pw() } })
      const done = result.results.filter((r) => !r.skipped).map((r) => `${r.resource} (${r.inserted})`)
      alert(done.length > 0 ? `Imported: ${done.join(', ')}` : 'Everything already had rows.')
    } catch (err) { alert(err instanceof Error ? err.message : 'Seed failed.') }
  }

  if (!unlocked) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex min-h-[70vh] w-full max-w-[480px] flex-col justify-center px-6">
          <h1 className="flex items-center gap-2 font-head text-2xl font-extrabold tracking-tight uppercase"><span className="material-symbols-outlined text-[1.5rem]">admin_panel_settings</span>Admin</h1>
          <p className="mt-2 text-sm text-(--gray-400)">Enter the admin password.</p>
          <form onSubmit={unlock} className="mt-6 flex gap-2">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password"
              className="min-w-0 flex-1 rounded-xl border border-transparent bg-(--ink) px-5 py-3 text-sm outline-none placeholder:text-(--gray-500) focus:border-(--white)" />
            <button type="submit" className="cursor-pointer rounded-xl border border-white bg-white px-6 py-3 font-head text-[0.7rem] font-semibold tracking-[0.18em] text-black uppercase transition-all hover:bg-transparent hover:text-white">Unlock</button>
          </form>
          {loginError && <p className="mt-4 text-sm text-red-400">{loginError}</p>}
        </main>
      </>
    )
  }

  const section = () => {
    switch (active) {
      case 'dashboard': return <DashboardSection />
      case 'messages': return <MessagesSection />
      case 'profile': return <ProfileSection />
      case 'skills': return <SkillsSection />
      case 'projects': return <ProjectsSection />
      case 'designs': return <DesignsSection />
      case 'experience': return <ExperienceSection />
      case 'education': return <EducationSection />
      case 'blogs': return <BlogsSection />
      case 'socials': return <SocialsSection />
      case 'code-profiles': return <CrudSection resourceName="code-profiles" title="Source Repositories" fields={[
        { key: 'id', label: 'ID' }, { key: 'label', label: 'Label' }, { key: 'url', label: 'URL' },
      ]} />
      default: return null
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen pt-20">
        <aside className={`fixed inset-y-0 left-0 z-40 w-56 border-r border-(--line-light) bg-(--black) pt-20 transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="flex flex-col gap-1 p-3">
            {ADMIN_NAV.map((s) => (
              <button key={s.id} type="button" onClick={() => { setActive(s.id); setSidebarOpen(false) }}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[0.8rem] font-semibold transition-colors ${active === s.id ? 'bg-white text-black' : 'text-(--gray-300) hover:bg-(--panel)'}`}>
                <span className="material-symbols-outlined text-[1.1rem]">{s.materialIcon}</span><span>{s.label}</span>
              </button>
            ))}
          </nav>
          <div className="absolute bottom-4 left-3 right-3 flex flex-col gap-2">
            <button type="button" onClick={seed} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-(--line-light) bg-transparent py-2 text-[0.7rem] font-semibold tracking-[0.1em] text-(--gray-400) uppercase transition-colors hover:border-(--white) hover:text-(--white)"><span className="material-symbols-outlined text-[1rem]">download</span>Import</button>
            <button type="button" onClick={lock} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-(--line-light) bg-transparent py-2 text-[0.7rem] font-semibold tracking-[0.1em] text-(--gray-400) uppercase transition-colors hover:border-(--white) hover:text-(--white)"><span className="material-symbols-outlined text-[1rem]">lock</span>Lock</button>
          </div>
        </aside>
        <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-(--white) bg-(--black) lg:hidden"><span className="material-symbols-outlined">menu</span></button>
        <div className="flex-1 px-4 py-8 lg:ml-56 lg:px-12">{section()}</div>
      </main>
    </>
  )
}
