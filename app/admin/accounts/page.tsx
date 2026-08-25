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
 */
'use client'

import { useState } from 'react'
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

export default function AdminAccountsPage() {
  const { data: session, status } = useSession()
  const toast = useToast()

  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Account[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<{ account: Account; action: string } | null>(null)

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
      setRows(prev => prev
        ? action === 'delete'
          ? prev.filter(r => r.id !== account.id)
          : prev.map(r => r.id === account.id ? { ...r, active: action === 'reactivate' } : r)
        : prev)
    } catch {
      toast.error('Could not reach the server.')
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  if (status === 'loading') return null
  if ((session?.user as { role?: string } | undefined)?.role !== 'admin') {
    return <div className="max-w-3xl mx-auto px-5 py-16"><p className="text-brand-muted">Admins only.</p></div>
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-12">
      <h1 className="text-2xl font-bold text-brand-text mb-1.5">Accounts</h1>
      <p className="text-sm text-brand-muted leading-relaxed mb-7 max-w-2xl">
        Search by name or email. Every account shows what it holds before you do anything to it &mdash;
        an account with a profile, a message or a review cannot be deleted here, only deactivated.
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
                    joined {new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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

      <ConfirmDialog
        open={pending !== null}
        title="Delete this account?"
        body={pending ? `${pending.account.email} will be removed permanently. It holds nothing, but this cannot be undone.` : undefined}
        confirmLabel="Delete permanently"
        destructive
        onConfirm={() => pending && run(pending.account, pending.action)}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
