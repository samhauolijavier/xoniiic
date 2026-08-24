/*
 * Adding a job.
 *
 * The one field that decides whether this section is worth anything is the
 * description — "Executive Assistant at Acme" tells an employer nothing they
 * could not guess. So the placeholder asks for what changed rather than what
 * the job was called, and the label says so.
 *
 * Month inputs rather than free text: everybody types dates differently, and a
 * profile where one role says 03/2024 and the next says March 2024 reads as
 * carelessness on the person's part rather than on ours.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Experience {
  id: string
  company: string
  role: string
  startMonth: string
  endMonth: string | null
  current: boolean
  location: string | null
  description: string | null
}

const EMPTY = {
  company: '', role: '', startMonth: '', endMonth: '',
  current: false, location: '', description: '',
}

export function ExperienceEditor() {
  const [items, setItems] = useState<Experience[]>([])
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  // What is about to be removed, or null when nothing is being asked.
  const [pendingRemove, setPendingRemove] = useState<{ id: string; label: string } | null>(null)
  const toast = useToast()

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/experience')
      const data = await res.json()
      if (res.ok) setItems(data.experiences ?? [])
    } catch {
      // A failed read leaves the list empty rather than the page broken.
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(''); setNote('')
    try {
      const res = await fetch('/api/profile/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      const res = await fetch(`/api/profile/experience?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
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
        <h2 className="text-lg font-semibold text-brand-text mb-1">Add a role</h2>
        <p className="text-xs text-brand-muted mb-4">
          This is the first thing a hiring manager reads. Even one role, described properly, does
          more than a full skill list.
        </p>

        <form onSubmit={add} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Job title *</label>
              <input
                className="input-field" value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Executive Assistant, Media Buyer" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Company *</label>
              <input
                className="input-field" value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="e.g. Rad CRM, or a client's business" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Started *</label>
              <input
                type="month" className="input-field" value={form.startMonth}
                onChange={e => setForm(f => ({ ...f, startMonth: e.target.value }))} required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">Ended</label>
              <input
                type="month" className="input-field" value={form.endMonth}
                disabled={form.current}
                onChange={e => setForm(f => ({ ...f, endMonth: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm text-brand-muted mt-2">
                <input
                  type="checkbox" checked={form.current}
                  onChange={e => setForm(f => ({ ...f, current: e.target.checked, endMonth: '' }))}
                />
                I still work here
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                Location <span className="text-brand-muted font-normal">— optional</span>
              </label>
              <input
                className="input-field" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Remote, or Cebu, Philippines"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">
              What did you actually do?
            </label>
            <textarea
              className="input-field" rows={4} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Not the job description — what changed because you were there. Numbers help: inbox down from 400 unread to zero daily, 12 campaigns rebuilt, close rate up a third."
            />
            <p className="text-xs text-brand-muted mt-1">
              The title says what you were called. This says whether you were any good.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {note && <p className="text-sm text-brand-purple">{note}</p>}

          <button
            className="btn-primary"
            type="submit"
            disabled={busy || !form.role.trim() || !form.company.trim() || !form.startMonth}
          >
            {busy ? 'Saving…' : 'Add role'}
          </button>
        </form>
      </div>

      {items.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-brand-text mb-4">
            Your roles <span className="text-brand-muted font-normal text-sm">({items.length})</span>
          </h2>
          <div className="divide-y divide-brand-border">
            {items.map(x => (
              <div key={x.id} className="py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-brand-text">{x.role}</p>
                  <p className="text-sm text-brand-text">
                    {x.company}{x.location ? ` · ${x.location}` : ''}
                  </p>
                  <p className="text-xs text-brand-muted font-mono mt-0.5">
                    {x.startMonth} — {x.current ? 'Present' : (x.endMonth ?? '')}
                  </p>
                  {x.description && (
                    <p className="text-sm text-brand-muted mt-1.5 leading-relaxed">{x.description}</p>
                  )}
                </div>
                <button
                  className="text-sm text-red-600 hover:underline flex-none"
                  onClick={() => setPendingRemove({ id: x.id, label: x.role })}
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
        title="Remove role?"
        body={pendingRemove ? `"${pendingRemove.label}" comes off your public profile. You can add it again later.` : undefined}
        confirmLabel="Remove role"
        destructive
        onConfirm={() => pendingRemove && remove(pendingRemove.id)}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  )
}
