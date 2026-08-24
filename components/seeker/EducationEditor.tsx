/*
 * Adding a school.
 *
 * Everything except the school name is optional on purpose. Plenty of very good
 * VAs did not finish a degree, and a form that demands one either gets left
 * blank or gets a lie — and a blank Education section is what an employer
 * notices, not an unfinished course.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Education {
  id: string
  school: string
  degree: string | null
  field: string | null
  startYear: number | null
  endYear: number | null
  description: string | null
}

const EMPTY = { school: '', degree: '', field: '', startYear: '', endYear: '', description: '' }

export function EducationEditor() {
  const [items, setItems] = useState<Education[]>([])
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  // What is about to be removed, or null when nothing is being asked.
  const [pendingRemove, setPendingRemove] = useState<{ id: string; label: string } | null>(null)
  const toast = useToast()

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/education')
      const data = await res.json()
      if (res.ok) setItems(data.education ?? [])
    } catch {
      // Empty list beats a broken page.
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(''); setNote('')
    try {
      const res = await fetch('/api/profile/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          startYear: form.startYear ? Number(form.startYear) : null,
          endYear: form.endYear ? Number(form.endYear) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not save that.'); toast.error(data.error ?? 'Could not save that.'); return }
      setForm(EMPTY)
      toast.success('Added to your profile.')
      await load()
    } catch {
      setError('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/profile/education?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Could not remove that. Try again in a moment.'); return }
      toast.success('Removed.')
      await load()
    } catch {
      toast.error('Could not reach the server.')
    } finally {
      setBusy(false)
      setPendingRemove(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-brand-text mb-1">Add a school</h2>
        <p className="text-xs text-brand-muted mb-4">
          Only the school name is required. An unfinished course still belongs here &mdash; a
          blank section is what gets noticed, not a missing graduation year.
        </p>

        <form onSubmit={add} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">School *</label>
            <input
              className="input-field" value={form.school}
              onChange={e => setForm(f => ({ ...f, school: e.target.value }))}
              placeholder="e.g. University of San Carlos" required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                Degree <span className="text-brand-muted font-normal">— optional</span>
              </label>
              <input
                className="input-field" value={form.degree}
                onChange={e => setForm(f => ({ ...f, degree: e.target.value }))}
                placeholder="e.g. BS, Diploma, Short course"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                Field <span className="text-brand-muted font-normal">— optional</span>
              </label>
              <input
                className="input-field" value={form.field}
                onChange={e => setForm(f => ({ ...f, field: e.target.value }))}
                placeholder="e.g. Business Administration"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                From <span className="text-brand-muted font-normal">— optional</span>
              </label>
              <input
                type="number" className="input-field" value={form.startYear}
                onChange={e => setForm(f => ({ ...f, startYear: e.target.value }))}
                placeholder="2018" min={1950} max={new Date().getFullYear() + 10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                To <span className="text-brand-muted font-normal">— optional</span>
              </label>
              <input
                type="number" className="input-field" value={form.endYear}
                onChange={e => setForm(f => ({ ...f, endYear: e.target.value }))}
                placeholder="2022" min={1950} max={new Date().getFullYear() + 10}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">
              Anything worth adding <span className="text-brand-muted font-normal">— optional</span>
            </label>
            <textarea
              className="input-field" rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Honours, a thesis worth mentioning, or what you focused on."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {note && <p className="text-sm text-brand-purple">{note}</p>}

          <button className="btn-primary" type="submit" disabled={busy || !form.school.trim()}>
            {busy ? 'Saving…' : 'Add school'}
          </button>
        </form>
      </div>

      {items.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-brand-text mb-4">
            Your education <span className="text-brand-muted font-normal text-sm">({items.length})</span>
          </h2>
          <div className="divide-y divide-brand-border">
            {items.map(x => (
              <div key={x.id} className="py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-brand-text">{x.school}</p>
                  {(x.degree || x.field) && (
                    <p className="text-sm text-brand-text">
                      {[x.degree, x.field].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {(x.startYear || x.endYear) && (
                    <p className="text-xs text-brand-muted font-mono mt-0.5">
                      {[x.startYear, x.endYear].filter(Boolean).join(' — ')}
                    </p>
                  )}
                </div>
                <button
                  className="text-sm text-red-600 hover:underline flex-none"
                  onClick={() => setPendingRemove({ id: x.id, label: x.school })}
                  disabled={busy}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={pendingRemove !== null}
        title="Remove school?"
        body={pendingRemove ? `"${pendingRemove.label}" comes off your public profile. You can add it again later.` : undefined}
        confirmLabel="Remove school"
        destructive
        onConfirm={() => pendingRemove && remove(pendingRemove.id)}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  )
}
