/*
 * "Share your story" — the box the invitation email points at.
 *
 * It leads with what the person gets, not with what we want, because they are
 * being asked for a favour and the ask should be worth their two minutes. And
 * it says plainly that honest is better than glowing: a page of perfect
 * reviews reads as solicited, which is the one thing testimonials cannot
 * afford to look like.
 */
'use client'

import { useState, useEffect } from 'react'

interface Testimonial {
  id: string
  body: string
  roleTitle: string | null
  company: string | null
  state: 'pending' | 'approved' | 'rejected'
  reviewNote: string | null
}

const MIN_BODY = 80

export function TestimonialCard() {
  const [existing, setExisting] = useState<Testimonial | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const [body, setBody] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [company, setCompany] = useState('')
  const [consent, setConsent] = useState(true)

  useEffect(() => {
    fetch('/api/testimonials')
      .then(r => r.json())
      .then(d => {
        if (d.testimonial) {
          setExisting(d.testimonial)
          if (d.testimonial.state === 'rejected') {
            setBody(d.testimonial.body)
            setRoleTitle(d.testimonial.roleTitle ?? '')
            setCompany(d.testimonial.company ?? '')
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(''); setDone('')
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, roleTitle, company, consentPublic: consent }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'That did not send.'); return }
      setDone(data.message)
      setExisting(data.testimonial)
      setOpen(false)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return null

  if (existing?.state === 'approved') {
    return (
      <div className="card p-5 mb-6">
        <h2 className="font-semibold mb-1.5">Your story is on the site</h2>
        <p className="text-sm text-brand-muted leading-relaxed">
          Thank you — it is doing more work than anything we could write ourselves. Your{' '}
          <strong className="text-brand-text">Placed through Virtual Freaks</strong> badge is on your
          public profile, and your 30 days have been added.
        </p>
      </div>
    )
  }

  if (existing?.state === 'pending') {
    return (
      <div className="card p-5 mb-6">
        <h2 className="font-semibold mb-1.5">Your story is with us</h2>
        <p className="text-sm text-brand-muted leading-relaxed">
          We are reading it. Once it is approved your badge and 30 days appear here automatically —
          nothing else for you to do.
        </p>
      </div>
    )
  }

  return (
    <div className="card p-5 mb-6">
      <h2 className="font-semibold mb-1.5">Share your story</h2>
      <p className="text-sm text-brand-muted leading-relaxed mb-3">
        Business owners deciding whether to hire from here have no way to know it works until
        somebody who has done it says so. A few honest lines is plenty.
      </p>

      <div className="text-sm text-brand-muted mb-4 leading-relaxed">
        <strong className="text-brand-text">What you get:</strong> the{' '}
        <strong className="text-brand-text">Placed through Virtual Freaks</strong> badge on your
        public profile — employers look for it — and{' '}
        <strong className="text-brand-text">30 days of practice account</strong>.
      </div>

      {existing?.state === 'rejected' && existing.reviewNote && (
        <p className="text-sm mb-4 px-3 py-2.5 rounded-lg bg-brand-purple/[0.06] border border-brand-purple/30 leading-relaxed">
          <strong>Sent back:</strong> {existing.reviewNote}
        </p>
      )}

      {!open ? (
        <button className="btn-primary" onClick={() => setOpen(true)}>
          {existing?.state === 'rejected' ? 'Edit and resend' : 'Write a few lines'}
        </button>
      ) : (
        <form onSubmit={submit} className="grid gap-3">
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Your story</span>
            <textarea
              className="w-full" rows={5} value={body} onChange={e => setBody(e.target.value)}
              placeholder="What you do, how the placement came about, and what it has meant for you. Honest beats glowing — a page of perfect reviews convinces nobody."
              required
            />
            <span className="block text-xs text-brand-muted mt-1">
              {body.length < MIN_BODY
                ? `${MIN_BODY - body.length} more characters`
                : `${body.length} characters`}
            </span>
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-sm font-medium mb-1.5">
                Your role <span className="text-brand-muted font-normal">— optional</span>
              </span>
              <input className="w-full" value={roleTitle} onChange={e => setRoleTitle(e.target.value)}
                placeholder="Executive Assistant" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1.5">
                Company <span className="text-brand-muted font-normal">— optional</span>
              </span>
              <input className="w-full" value={company} onChange={e => setCompany(e.target.value)}
                placeholder="Leave blank if you would rather not say" />
            </label>
          </div>

          <label className="flex items-start gap-2.5 text-sm text-brand-muted leading-relaxed">
            <input type="checkbox" className="mt-1" checked={consent}
              onChange={e => setConsent(e.target.checked)} />
            <span>
              I am happy for this to appear publicly on virtualfreaks.co with my name and profile
              photo. I can ask for it to be removed at any time.
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button className="btn-primary" type="submit" disabled={busy || body.trim().length < MIN_BODY}>
              {busy ? 'Sending…' : 'Send it'}
            </button>
            <button className="btn-secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      {done && <p className="text-sm text-brand-purple mt-3">{done}</p>}
    </div>
  )
}
