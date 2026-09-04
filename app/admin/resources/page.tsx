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
  scenario: 'The brief someone practices against. This is the thing that makes a video worth following.',
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

  const [batch, setBatch] = useState<File[]>([])
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

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

  /*
   * Thirty briefs, one at a time, over one connection.
   *
   * Deliberately not one request with thirty files: a single upload that fails
   * halfway loses the lot and tells you nothing, and Vercel's request ceiling
   * is a wall you would eventually hit. Sequential is slower to watch and far
   * better to recover from — a failure names the file and the rest still land.
   *
   * Every brief is named for its key, so the server already knows what each one
   * is. Nothing here has to be typed.
   */
  async function uploadBatch() {
    if (!batch.length) return
    setBusy(true); setError(''); setSuccess('')
    let added = 0, already = 0
    const failed: string[] = []

    for (let i = 0; i < batch.length; i++) {
      setProgress({ done: i, total: batch.length })
      const form = new FormData()
      form.set('file', batch[i])
      try {
        const res = await fetch('/api/admin/resources', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) failed.push(`${batch[i].name} — ${data.error ?? 'failed'}`)
        else if (data.skipped) already++
        else added++
      } catch {
        failed.push(`${batch[i].name} — could not reach the server`)
      }
    }

    setProgress(null)
    setBusy(false)
    setBatch([])
    const input = document.getElementById('batch-files') as HTMLInputElement | null
    if (input) input.value = ''

    const parts = []
    if (added) parts.push(`${added} added as drafts`)
    if (already) parts.push(`${already} already here`)
    if (failed.length) setError(`${failed.length} did not upload:\n${failed.join('\n')}`)
    if (parts.length) setSuccess(`${parts.join(' · ')}. Publish them when you are ready.`)
    await load()
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
        Everything that hangs off a video: the scenario people practice against, the templates
        they fill in, and the video itself. Uploads save as drafts — nothing is public until you
        publish it.
      </p>

      {error && <p className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-50 border border-red-200 text-red-700 whitespace-pre-line">{error}</p>}
      {success && <p className="mb-4 px-4 py-3 rounded-xl text-sm bg-brand-purple/[0.06] border border-brand-purple/30 text-brand-purple">{success}</p>}

      <div className="card p-5 mb-6 border-brand-purple/30 bg-brand-purple/[0.03]">
        <h2 className="font-semibold mb-1">Add the scenario briefs</h2>
        <p className="text-sm text-brand-muted leading-relaxed mb-4 max-w-2xl">
          Select the brief PDFs &mdash; all of them at once is fine. Each file is named for its
          scenario, so the title, track and summary come from the curriculum and there is nothing
          to type. They arrive as drafts. Uploading the same folder twice is harmless.
        </p>

        <input
          id="batch-files" type="file" multiple accept=".pdf" className="w-full text-sm"
          onChange={e => setBatch(Array.from(e.target.files ?? []))}
        />

        {batch.length > 0 && !progress && (
          <p className="text-sm text-brand-text mt-3">
            {batch.length} file{batch.length === 1 ? '' : 's'} ready.
          </p>
        )}

        {progress && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-brand-purple/15 overflow-hidden">
              <div
                className="h-full bg-brand-purple transition-all"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-brand-muted mt-2 font-mono">
              {progress.done} of {progress.total}
            </p>
          </div>
        )}

        <button
          type="button" className="btn-primary text-sm mt-4"
          disabled={busy || !batch.length}
          onClick={uploadBatch}
        >
          {progress ? 'Uploading…' : `Upload ${batch.length || ''} brief${batch.length === 1 ? '' : 's'}`.trim()}
        </button>
      </div>

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
