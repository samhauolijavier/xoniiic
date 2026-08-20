/*
 * The banner slot, on the dashboard.
 *
 * Optional in the real sense: upload one and it appears on the public profile,
 * skip it and there is no banner area at all — not a grey rectangle announcing
 * that somebody did not bother. That matters most for the profiles that are
 * still thin, which are the ones that can least afford another visible gap.
 *
 * Shown as an opportunity rather than an outstanding task, because it is the
 * one part of a profile that is purely presentation and nobody should feel
 * behind for not having one.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CoverUpload({ initialUrl }: { initialUrl: string | null }) {
  const router = useRouter()
  const [url, setUrl] = useState(initialUrl)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  async function upload(file: File) {
    setBusy(true); setError(''); setNote('')
    try {
      const form = new FormData()
      form.set('cover', file)
      const res = await fetch('/api/profile/cover', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Upload failed.'); return }
      setUrl(data.url)
      setNote(data.message)
      router.refresh()
    } catch {
      setError('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!window.confirm('Remove your banner? Your profile will simply have no banner area.')) return
    setBusy(true); setError(''); setNote('')
    try {
      const res = await fetch('/api/profile/cover', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not remove it.'); return }
      setUrl(null)
      setNote(data.message)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-5 mb-6">
      <h2 className="font-semibold mb-1.5">Profile banner</h2>
      <p className="text-sm text-brand-muted leading-relaxed mb-4">
        Optional. A wide image across the top of your public profile — the tools you work in, your
        own branding, or a shot of your workspace. If you don&apos;t add one, your profile just
        has no banner. Nothing looks missing.
      </p>

      {url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={url}
          alt="Your current profile banner"
          className="w-full rounded-xl border border-brand-border mb-3"
          style={{ aspectRatio: '4 / 1', objectFit: 'cover' }}
        />
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <label className="btn-secondary text-sm cursor-pointer">
          {url ? 'Replace banner' : 'Add a banner'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={busy}
            onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }}
          />
        </label>
        {url && (
          <button className="text-sm text-red-600 hover:underline" onClick={remove} disabled={busy}>
            Remove
          </button>
        )}
        <span className="text-xs text-brand-muted">
          Wide works best — around 1600&times;400. JPEG, PNG or WebP, under 4MB.
        </span>
      </div>

      {busy && <p className="text-sm text-brand-muted mt-3">Uploading…</p>}
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      {note && <p className="text-sm text-brand-purple mt-3">{note}</p>}
    </div>
  )
}
