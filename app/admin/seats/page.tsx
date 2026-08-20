/*
 * The seat desk.
 *
 * Someone sends 100 pesos, types a reference, and waits. This is the page where
 * that wait ends. It is built for one job done many times in a row, so the
 * queue is first, sorted oldest first, and each row carries the one number that
 * matters — how long that person has been waiting.
 *
 * Verifying is one click. Rejecting asks for a reason, because "rejected" with
 * no reason is a dead end for someone who cannot afford to guess.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { GcashQrUpload } from './GcashQrUpload'
import './seats.css'

interface Person { id: string; name: string | null; email: string }

interface Waiting {
  id: string
  reference: string
  amount: number
  proofUrl: string | null
  state: string
  createdAt: string
  waitingHours: number
  user: Person
}

interface Live {
  id: string
  source: string
  expiresAt: string
  daysLeft: number
  subAccount: string | null
  note: string | null
  user: Person
}

interface Recent {
  id: string
  reference: string
  state: string
  checkedAt: string | null
  rejectReason: string | null
  user: Person
}

interface Desk {
  waiting: Waiting[]
  live: Live[]
  lapsing: { id: string; daysLeft: number; user: Person; source: string }[]
  recent: Recent[]
}

const SOURCE_LABEL: Record<string, string> = {
  paid: 'paid',
  earned: 'earned',
  sponsored: 'sponsored',
  referred: 'referred',
  comped: 'comped',
}

export default function SeatDeskPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [desk, setDesk] = useState<Desk | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    const user = session?.user as { role?: string } | undefined
    if (user && user.role !== 'admin') router.push('/')
  }, [status, session, router])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/seats')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not load the desk.')
        return
      }
      setDesk(data)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function act(body: Record<string, unknown>, id: string) {
    setBusyId(id)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/admin/seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'That did not go through.')
        return
      }
      setSuccess(data.message)
      await load()
    } catch {
      setError('Could not reach the server.')
    } finally {
      setBusyId(null)
    }
  }

  function reject(payment: Waiting) {
    const reason = window.prompt(
      `Why is ${payment.reference} not matched?\n\nThey will see this, so say what they should do.`,
      'No payment found with this reference'
    )
    if (!reason?.trim()) return
    act({ action: 'reject', paymentId: payment.id, reason: reason.trim() }, payment.id)
  }

  if (loading) return <div className="desk"><p className="quiet">Loading the desk…</p></div>

  return (
    <div className="desk">
      <h1>Seat desk</h1>
      <p className="lede">
        Match GCash payments to seats. Oldest first — the hours column is how long someone has
        been waiting on you.
      </p>

      {error && <p className="banner bad">{error}</p>}
      {success && <p className="banner good">{success}</p>}

      <GcashQrUpload />

      <section className="panel">
        <div className="panel-head">
          <h2>Waiting</h2>
          <span className="count">{desk?.waiting.length ?? 0}</span>
        </div>
        {!desk?.waiting.length ? (
          <p className="quiet pad">Nobody is waiting. The queue is clear.</p>
        ) : (
          <table className="grid">
            <thead>
              <tr><th>Who</th><th>Reference</th><th>Amount</th><th>Waiting</th><th /></tr>
            </thead>
            <tbody>
              {desk.waiting.map(p => (
                <tr key={p.id} className={p.waitingHours >= 24 ? 'stale' : ''}>
                  <td>
                    <strong>{p.user.name ?? 'No name yet'}</strong>
                    <span className="sub">{p.user.email}</span>
                  </td>
                  <td className="mono">{p.reference}</td>
                  <td className="mono">₱{p.amount}</td>
                  <td className="mono">{p.waitingHours}h</td>
                  <td className="row-actions">
                    {p.proofUrl && (
                      <a className="dbtn ghost" href={p.proofUrl} target="_blank" rel="noreferrer">Receipt</a>
                    )}
                    <button
                      className="dbtn"
                      disabled={busyId === p.id}
                      onClick={() => act({ action: 'verify', paymentId: p.id }, p.id)}
                    >
                      {busyId === p.id ? '…' : 'Open seat'}
                    </button>
                    <button className="dbtn ghost" disabled={busyId === p.id} onClick={() => reject(p)}>
                      Not matched
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Running out within 7 days</h2>
          <span className="count">{desk?.lapsing.length ?? 0}</span>
        </div>
        {!desk?.lapsing.length ? (
          <p className="quiet pad">Nobody is close to the end of a seat.</p>
        ) : (
          <table className="grid">
            <thead><tr><th>Who</th><th>Source</th><th>Days left</th><th /></tr></thead>
            <tbody>
              {desk.lapsing.map(a => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.user.name ?? 'No name yet'}</strong>
                    <span className="sub">{a.user.email}</span>
                  </td>
                  <td>{SOURCE_LABEL[a.source] ?? a.source}</td>
                  <td className="mono">{a.daysLeft}</td>
                  <td className="row-actions">
                    <button
                      className="dbtn ghost"
                      disabled={busyId === a.id}
                      onClick={() => act(
                        { action: 'grant', userId: a.user.id, source: 'comped', note: 'Extended from the seat desk' },
                        a.id
                      )}
                    >
                      Add 30 days
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Open seats</h2>
          <span className="count">{desk?.live.length ?? 0}</span>
        </div>
        {!desk?.live.length ? (
          <p className="quiet pad">No seats are open yet.</p>
        ) : (
          <table className="grid">
            <thead><tr><th>Who</th><th>Source</th><th>Sub-account</th><th>Days left</th></tr></thead>
            <tbody>
              {desk.live.map(a => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.user.name ?? 'No name yet'}</strong>
                    <span className="sub">{a.user.email}</span>
                  </td>
                  <td>{SOURCE_LABEL[a.source] ?? a.source}</td>
                  <td className="mono">{a.subAccount ?? '—'}</td>
                  <td className="mono">{a.daysLeft}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {!!desk?.recent.length && (
        <section className="panel">
          <div className="panel-head"><h2>Recently handled</h2></div>
          <table className="grid">
            <thead><tr><th>Who</th><th>Reference</th><th>Result</th></tr></thead>
            <tbody>
              {desk.recent.map(p => (
                <tr key={p.id}>
                  <td><span className="sub">{p.user.email}</span></td>
                  <td className="mono">{p.reference}</td>
                  <td>
                    <span className={`chip ${p.state === 'verified' ? 'good' : 'bad'}`}>{p.state}</span>
                    {p.rejectReason && <span className="sub"> {p.rejectReason}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
