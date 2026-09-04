/*
 * Finding a duplicate, and getting rid of it.
 *
 * Built after two members created second accounts by signing in with Google on
 * a different email, and there was no way to see that had happened, let alone
 * tidy it up.
 *
 * Every row says what the account actually holds before offering to do anything
 * with it. Deactivate is the prominent action because it is reversible and
 * almost always the right one; delete only appears on an account that holds
 * nothing at all, so the destructive button is simply absent in every case
 * where it would destroy something.
 *
 * Remove & block exists for the case the other two do not cover: a signup
 * nobody recognises, which comes straight back under the same address the
 * moment it is removed. It blocks the address first and then does whatever
 * removal is safe — delete if the account is empty, deactivate if it is not.
 * The confirm dialog says which of those is about to happen, because they are
 * very different things and the button is the same.
 */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Account {
  id: string
  email: string
  name: string | null
  role: string
  active: boolean
  createdAt: string
  profile: { username: string; title: string | null; bio: string | null } | null
  employer: { companyName: string | null } | null
  counts: Record<string, number>
  isEmpty: boolean
}

interface Blocked {
  email: string
  normalized: string
  reason?: string
  by?: string
  at: string
}

const day = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function AdminAccountsPage() {
  const { data: session, status } = useSession()
  const toast = useToast()

  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Account[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<{ account: Account; action: string } | null>(null)
  const [blocked, setBlocked] = useState<Blocked[] | null>(null)

  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin'

  const loadBlocked = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/accounts?blocked=1')
      const data = await res.json()
      if (res.ok) setBlocked(data.blocked ?? [])
    } catch {
      // The list is context, not the job. A failure here must not look like a
      // broken page when the search above still works.
    }
  }, [])

  useEffect(() => {
    if (isAdmin) loadBlocked()
  }, [isAdmin, loadBlocked])

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (q.trim().length < 2) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/accounts?q=${encodeURIComponent(q.trim())}`)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Search failed.'); return }
      setRows(data.users ?? [])
    } catch {
      toast.error('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  async function run(account: Account, action: string) {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: account.id, action }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'That did not work.'); return }
      toast.success(data.message)

      // A blocked account either vanished or went inactive, depending on what
      // it held — mirror whichever the server actually did.
      const removed = action === 'delete' || (action === 'block' && account.isEmpty)
      setRows(prev => prev
        ? removed
          ? prev.filter(r => r.id !== account.id)
          : prev.map(r => r.id === account.id ? { ...r, active: action === 'reactivate' } : r)
        : prev)
      if (action === 'block') loadBlocked()
    } catch {
      toast.error('Could not reach the server.')
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  async function unblock(email: string) {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unblock', email }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'That did not work.'); return }
      toast.success(data.message)
      setBlocked(prev => prev?.filter(b => b.normalized !== email) ?? prev)
    } catch {
      toast.error('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading') return null
  if (!isAdmin) {
    return <div className="max-w-3xl mx-auto px-5 py-16"><p className="text-brand-muted">Admins only.</p></div>
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-12">
      <h1 className="text-2xl font-bold text-brand-text mb-1.5">Accounts</h1>
      <p className="text-sm text-brand-muted leading-relaxed mb-7 max-w-2xl">
        Search by name or email. Every account shows what it holds before you do anything to it &mdash;
        an account with a profile, a message or a review cannot be deleted here, only deactivated.
        <strong className="text-brand-text font-medium"> Remove &amp; block</strong> also stops that
        address signing up again.
      </p>

      <form onSubmit={search} className="flex gap-2 mb-8 max-w-lg">
        <input
          className="input-field flex-1"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Name or email"
          autoFocus
        />
        <button className="btn-primary" type="submit" disabled={busy || q.trim().length < 2}>
          {busy ? 'Looking…' : 'Search'}
        </button>
      </form>

      {rows?.length === 0 && (
        <p className="text-sm text-brand-muted">Nothing matched that.</p>
      )}

      <div className="grid gap-3">
        {rows?.map(a => {
          const held = Object.entries(a.counts).filter(([, n]) => n > 0)
          return (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-brand-text">
                    {a.name ?? 'No name'}{' '}
                    <span className="font-normal text-brand-muted text-sm">· {a.role}</span>
                    {!a.active && (
                      <span className="ml-2 text-xs font-medium text-red-600">deactivated</span>
                    )}
                  </p>
                  <p className="text-sm text-brand-muted break-all">{a.email}</p>
                  <p className="text-xs text-brand-muted font-mono mt-1">
                    joined {day(a.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 flex-none flex-wrap">
                  <button
                    className="btn-secondary text-sm"
                    disabled={busy}
                    onClick={() => run(a, a.active ? 'deactivate' : 'reactivate')}
                  >
                    {a.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <button
                    className="text-sm font-medium rounded-lg px-4 py-2.5 border border-red-600 text-red-600 hover:bg-red-50 transition-colors"
                    disabled={busy}
                    onClick={() => setPending({ account: a, action: 'block' })}
                  >
                    Remove &amp; block
                  </button>
                  {/* Only ever rendered on an account that holds nothing. */}
                  {a.isEmpty && (
                    <button
                      className="text-sm font-medium rounded-lg px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 transition-colors"
                      disabled={busy}
                      onClick={() => setPending({ account: a, action: 'delete' })}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-brand-border text-sm">
                {a.isEmpty ? (
                  <p className="text-brand-muted">
                    Holds nothing &mdash; no filled-in profile and no activity. Safe to delete.
                  </p>
                ) : (
                  <p className="text-brand-text">
                    {a.profile?.username && (
                      <>Profile <a href={`/@${a.profile.username}`} className="text-brand-purple hover:text-brand-pink underline underline-offset-2">@{a.profile.username}</a>{held.length ? ' · ' : ''}</>
                    )}
                    {a.employer?.companyName && <>Company: {a.employer.companyName}{held.length ? ' · ' : ''}</>}
                    {held.map(([k, n]) => `${n} ${k}`).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Kept on the page rather than behind a tab: a blocklist nobody ever
          looks at is how a real person stays locked out by mistake. */}
      <section className="mt-12">
        <h2 className="text-lg font-bold text-brand-text mb-1.5">Blocked emails</h2>
        <p className="text-sm text-brand-muted leading-relaxed mb-5 max-w-2xl">
          These addresses cannot sign up or sign in, including with Google.
          Blocking ignores anything after a <span className="font-mono">+</span>, so an
          address blocked once cannot come back as a variant of itself.
        </p>

        {blocked === null ? null : blocked.length === 0 ? (
          <p className="text-sm text-brand-muted">Nothing is blocked.</p>
        ) : (
          <div className="grid gap-2">
            {blocked.map(b => (
              <div key={b.normalized} className="card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm text-brand-text break-all font-medium">{b.email}</p>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {day(b.at)}{b.by ? ` · by ${b.by}` : ''}{b.reason ? ` · ${b.reason}` : ''}
                  </p>
                </div>
                <button
                  className="btn-secondary text-sm flex-none"
                  disabled={busy}
                  onClick={() => unblock(b.normalized)}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.action === 'block' ? 'Remove and block this account?' : 'Delete this account?'}
        body={
          pending
            ? pending.action === 'block'
              ? pending.account.isEmpty
                ? `${pending.account.email} holds nothing, so it will be deleted, and that address will not be able to sign up again. You can unblock it later.`
                : `${pending.account.email} holds work, so it will be deactivated rather than deleted — nothing is destroyed. That address will not be able to sign up again, and you can unblock it later.`
              : `${pending.account.email} will be removed permanently. It holds nothing, but this cannot be undone.`
            : undefined
        }
        confirmLabel={pending?.action === 'block' ? 'Remove and block' : 'Delete permanently'}
        destructive
        onConfirm={() => pending && run(pending.account, pending.action)}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
