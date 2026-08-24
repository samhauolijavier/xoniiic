/*
 * The people behind the click count.
 *
 * Two columns matter and they are not the same question. "Clicked" is a fact
 * about interest. "Can email" is a permission that member gave or withheld,
 * and it is shown next to every name so a follow-up never starts with a guess.
 *
 * Deliberately not exportable. This exists so Spencer can reach out himself,
 * and the moment it becomes a list you can hand over it stops being
 * first-party data and starts being somebody else's problem.
 */
'use client'

import { useState } from 'react'

interface Person {
  id: string
  name: string | null
  email: string
  role: string
  username: string | null
  marketingOptIn: boolean
  clicks: number
  lastClickedAt: string
}

export function WhoClicked({ adId, adName }: { adId: string; adName: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [people, setPeople] = useState<Person[]>([])
  const [contactable, setContactable] = useState(0)
  const [error, setError] = useState('')

  async function load() {
    if (open) { setOpen(false); return }
    setOpen(true)
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/ads/${adId}/clicks`)
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not load.'); return }
      setPeople(data.people)
      setContactable(data.contactable)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={load}
        className="text-xs text-brand-purple hover:underline"
      >
        {open ? 'Hide' : 'Who clicked'}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-brand-border bg-brand-bg p-4">
          <p className="text-xs font-semibold mb-2">{adName}</p>

          {loading && <p className="text-xs text-brand-muted">Loading…</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}

          {!loading && !error && people.length === 0 && (
            <p className="text-xs text-brand-muted">Nobody has clicked this one yet.</p>
          )}

          {!loading && people.length > 0 && (
            <>
              <p className="text-xs text-brand-muted mb-3">
                {people.length} {people.length === 1 ? 'person' : 'people'} ·{' '}
                <strong className="text-brand-text">{contactable} agreed to marketing</strong>.
                Only email those — the rest said no when they signed up.
              </p>
              <div className="divide-y divide-brand-border">
                {people.map(p => (
                  <div key={p.id} className="py-2 flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p.name ?? 'No name yet'}
                        <span className="text-xs text-brand-muted font-normal">
                          {' '}· {p.role === 'employer' ? 'business' : 'freelancer'}
                        </span>
                      </p>
                      <p className="text-xs text-brand-muted truncate">{p.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-none">
                      {p.clicks > 1 && (
                        <span className="text-xs text-brand-muted">{p.clicks}&times;</span>
                      )}
                      {p.marketingOptIn ? (
                        <a
                          href={`mailto:${p.email}`}
                          className="text-xs font-medium text-brand-purple hover:underline"
                        >
                          Email
                        </a>
                      ) : (
                        <span
                          className="text-xs text-brand-muted"
                          title="They did not tick the marketing box when they signed up"
                        >
                          No marketing
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
