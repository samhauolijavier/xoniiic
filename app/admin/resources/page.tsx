/*
 * The two-minute uploader.
 *
 * The whole point is that adding a resource the day a video goes out takes
 * long enough to do between other things, not long enough to put off. So the
 * form is one screen, everything saves as a draft, and publishing is a single
 * toggle on the row afterwards.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Resource {
  id: string
  title: string
  slug: string
  summary: string | null
  track: string
  kind: 'video' | 'document' | 'scenario'
  videoUrl: string | null
  filePath: string | null
  fileName: string | null
  fileSize: number | null
  published: boolean
  position: number
}

const KIND_HELP: Record<Resource['kind'], string> = {
  video: 'A YouTube link. Shows up as something to watch.',
  scenario: 'The brief someone practises against. This is the thing that makes a video worth following.',
  document: 'A template, checklist, or spreadsheet they fill in.',
}

function prettySize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function AdminResourcesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [resources, setResources] = useState<Resource[]>([])
  const [tracks, setTracks] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [title, setTitle] = useState('')
  const [track, setTrack] = useState('')
  const [kind, setKind] = useState<Resource['kind']>('scenario')
  const [summary, setSummary] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    const user = session?.user as { role?: string } | undefined
    if (user && user.role !== 'admin') router.push('/')
  }, [status, session, router])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/resources')
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not load resources.'); return }
      setResources(data.resources)
      setTracks(data.tracks)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function upload(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(''); setSuccess('')
    try {
      const form = new FormData()
      form.set('title', title)
      form.set('track', track)
      form.set('kind', kind)
      form.set('summary', summary)
      form.set('videoUrl', videoUrl)
      if (file) form.set('file', file)

      const res = await fetch('/api/admin/resources', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Upload failed.'); return }

      setSuccess(data.message)
      setTitle(''); setSummary(''); setVideoUrl(''); setFile(null)
      const input = document.getElementById('resource-file') as HTMLInputElement | null
      if (input) input.value = ''
      await load()
    } catch {
      setError('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  async function togglePublished(r: Resource) {
    setBusyId(r.id); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/admin/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, published: !r.published }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not save.'); return }
      setSuccess(data.message)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function remove(r: Resource) {
    if (!window.confirm(`Delete "${r.title}"? The file goes too, and this cannot be undone.`)) return
    setBusyId(r.id); setError(''); setSuccess('')
    try {
      const res = await fetch(`/api/admin/resources?id=${encodeURIComponent(r.id)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not delete.'); return }
      setSuccess(data.message)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  const grouped = resources.reduce<Record<string, Resource[]>>((acc, r) => {
    (acc[r.track] ||= []).push(r)
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-bold mb-1">Resources</h1>
      <p className="text-brand-muted text-sm mb-6">
        Everything that hangs off a video: the scenario people practise against, the templates
        they fill in, and the video itself. Uploads save as drafts — nothing is public until you
        publish it.
      </p>

      {error && <p className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-700">{error}</p>}
      {success && <p className="mb-4 px-4 py-3 rounded-xl text-sm bg-brand-purple/[0.06] border border-brand-purple/30 text-brand-purple">{success}</p>}

      <form onSubmit={upload} className="card p-5 mb-8">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Title</span>
            <input
              className="w-full" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Rescue a campaign that spent ₱4,000 and booked nothing" required
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Track</span>
            <input
              className="w-full" value={track} onChange={e => setTrack(e.target.value)}
              placeholder="GoHighLevel" list="tracks" required
            />
            <datalist id="tracks">
              {tracks.map(t => <option key={t} value={t} />)}
            </datalist>
            <span className="block text-xs text-brand-muted mt-1">
              Type a new one to start a track. Existing ones autocomplete.
            </span>
          </label>

          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Kind</span>
            <select className="w-full" value={kind} onChange={e => setKind(e.target.value as Resource['kind'])}>
              <option value="scenario">Scenario brief</option>
              <option value="document">Template or document</option>
              <option value="video">Video</option>
            </select>
            <span className="block text-xs text-brand-muted mt-1">{KIND_HELP[kind]}</span>
          </label>

          {kind === 'video' ? (
            <label className="block">
              <span className="block text-sm font-medium mb-1.5">YouTube link</span>
              <input
                className="w-full" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </label>
          ) : (
            <label className="block">
              <span className="block text-sm font-medium mb-1.5">File</span>
              <input
                id="resource-file" type="file" className="w-full text-sm"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              <span className="block text-xs text-brand-muted mt-1">
                PDF, Word, Excel, CSV, image, or zip. Up to 25MB.
              </span>
            </label>
          )}

          <label className="block md:col-span-2">
            <span className="block text-sm font-medium mb-1.5">
              Summary <span className="text-brand-muted font-normal">— what they will be able to do afterwards</span>
            </span>
            <textarea
              className="w-full" rows={2} value={summary} onChange={e => setSummary(e.target.value)}
              placeholder="Work out where the spend went, and rebuild the campaign so it books."
            />
          </label>
        </div>

        <button className="btn-primary mt-4" type="submit" disabled={busy || !title || !track}>
          {busy ? 'Uploading…' : 'Add as draft'}
        </button>
      </form>

      {loading ? (
        <p className="text-brand-muted text-sm">Loading…</p>
      ) : !resources.length ? (
        <div className="card p-8 text-center">
          <p className="font-medium mb-1">Nothing here yet</p>
          <p className="text-brand-muted text-sm">
            The page is ready. Add the first scenario brief and it appears the moment you publish it.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([trackName, items]) => (
          <section key={trackName} className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-muted mb-2">{trackName}</h2>
            <div className="card divide-y divide-brand-border">
              {items.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-4 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-brand-muted">
                      {r.kind}
                      {r.fileName && ` · ${r.fileName} (${prettySize(r.fileSize)})`}
                      {r.videoUrl && ' · video link'}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    r.published
                      ? 'bg-brand-purple/[0.08] text-brand-purple'
                      : 'bg-brand-border text-brand-muted'
                  }`}>
                    {r.published ? 'live' : 'draft'}
                  </span>
                  <button
                    className="btn-secondary text-sm" disabled={busyId === r.id}
                    onClick={() => togglePublished(r)}
                  >
                    {r.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    className="text-sm text-red-600 hover:underline px-2" disabled={busyId === r.id}
                    onClick={() => remove(r)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
