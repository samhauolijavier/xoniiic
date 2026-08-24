/*
 * Reading and approving stories.
 *
 * Approve does three things at once — publishes it, grants the badge, adds
 * thirty days — so the button says so rather than making anybody remember.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Person { id: string; name: string | null; email: string; placedBadgeAt: string | null }

interface Testimonial {
  id: string
  body: string
  roleTitle: string | null
  company: string | null
  state: 'pending' | 'approved' | 'rejected'
  featured: boolean
  reviewNote: string | null
  rewardedAt: string | null
  createdAt: string
  user: Person
}

export default function AdminTestimonialsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [pending, setPending] = useState<Testimonial[]>([])
  const [approved, setApproved] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [askEmail, setAskEmail] = useState('')

  async function requestFrom() {
    setBusyId('ask'); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email: askEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not ask them.'); return }
      setSuccess(data.message)
      setAskEmail('')
    } catch {
      setError('Could not reach the server.')
    } finally {
      setBusyId(null)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    const user = session?.user as { role?: string } | undefined
    if (user && user.role !== 'admin') router.push('/')
  }, [status, session, router])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/testimonials')
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not load.'); return }
      setPending(data.pending)
      setApproved(data.approved)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function act(payload: Record<string, unknown>, id: string) {
    setBusyId(id); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'That did not go through.'); return }
      setSuccess(data.message)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  function reject(t: Testimonial) {
    const note = window.prompt(
      `Send this back to ${t.user.name ?? 'them'}. What needs changing?\n\nThey will see this and can edit and resend.`,
      ''
    )
    if (!note?.trim()) return
    act({ action: 'reject', id: t.id, note: note.trim() }, t.id)
  }

  if (loading) return <div className="max-w-4xl mx-auto px-5 py-10"><p className="text-brand-muted text-sm">Loading…</p></div>

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-bold mb-1">Testimonials</h1>
      <p className="text-brand-muted text-sm mb-6">
        Approving publishes the story, grants the <strong>Placed through Virtual Freaks</strong> badge,
        and adds 30 days to their practice account. The reward is paid once, even if you approve an
        edited version later.
      </p>

      {error && <p className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-700">{error}</p>}
      {success && <p className="mb-4 px-4 py-3 rounded-xl text-sm bg-brand-purple/[0.06] border border-brand-purple/30 text-brand-purple">{success}</p>}

      {/* The prompt no longer shows to every freelancer, so there has to be a
          way to ask the people Spencer placed himself. */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-muted mb-3">
          Ask someone
        </h2>
        <div className="card p-5">
          <p className="text-brand-muted text-sm leading-relaxed mb-3">
            The &ldquo;Share your story&rdquo; card only appears for people hired through the
            platform, or who already carry the badge. If you placed somebody yourself, paste their
            email here and it appears on their dashboard.
          </p>
          <form
            className="flex gap-2 flex-wrap"
            onSubmit={e => { e.preventDefault(); requestFrom() }}
          >
            <input
              value={askEmail}
              onChange={e => setAskEmail(e.target.value)}
              placeholder="their@email.com"
              type="email"
              className="input-field flex-1 min-w-[220px]"
            />
            <button className="btn-primary text-sm" type="submit" disabled={busyId === 'ask' || !askEmail.trim()}>
              {busyId === 'ask' ? '…' : 'Ask them'}
            </button>
          </form>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-muted mb-3">
          Waiting to be read · {pending.length}
        </h2>
        {!pending.length ? (
          <div className="card p-6"><p className="text-brand-muted text-sm">Nothing waiting.</p></div>
        ) : pending.map(t => (
          <article key={t.id} className="card p-5 mb-3">
            <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
              <strong>{t.user.name ?? 'No name yet'}</strong>
              <span className="text-xs text-brand-muted">
                {[t.roleTitle, t.company].filter(Boolean).join(' · ') || 'no role given'}
              </span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4">{t.body}</p>
            <div className="flex gap-2 flex-wrap">
              <button className="btn-primary text-sm" disabled={busyId === t.id}
                onClick={() => act({ action: 'approve', id: t.id }, t.id)}>
                {busyId === t.id ? '…' : 'Approve, badge + 30 days'}
              </button>
              <button className="btn-secondary text-sm" disabled={busyId === t.id} onClick={() => reject(t)}>
                Send back
              </button>
            </div>
          </article>
        ))}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-muted mb-3">
          Live on the site · {approved.length}
        </h2>
        {!approved.length ? (
          <div className="card p-6"><p className="text-brand-muted text-sm">None published yet.</p></div>
        ) : approved.map(t => (
          <article key={t.id} className="card p-5 mb-3">
            <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
              <strong>{t.user.name ?? 'No name yet'}</strong>
              {t.featured && <span className="text-xs font-semibold text-brand-purple">pinned</span>}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4">{t.body}</p>
            <div className="flex gap-2 flex-wrap">
              <button className="btn-secondary text-sm" disabled={busyId === t.id}
                onClick={() => act({ action: t.featured ? 'unfeature' : 'feature', id: t.id }, t.id)}>
                {t.featured ? 'Unpin' : 'Pin to top'}
              </button>
              <button className="text-sm text-red-600 hover:underline px-2" disabled={busyId === t.id}
                onClick={() => act({ action: 'unpublish', id: t.id }, t.id)}>
                Take off the site
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
