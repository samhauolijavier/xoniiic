/*
 * Shown until an address is confirmed.
 *
 * It says what is actually being asked and why, rather than nagging. Somebody
 * who does not know what verifying buys them will not do it, and a banner they
 * have learned to scroll past is worse than no banner.
 */
'use client'

import { useState } from 'react'

export function VerifyBanner({ email }: { email: string }) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)

  async function resend() {
    setBusy(true); setNote(''); setError('')
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setNote(data.message ?? data.error ?? 'Sent.')
    } catch {
      setError('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(''); setNote('')
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'That did not work.'); return }
      setVerified(true)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  if (verified) {
    return (
      <div className="card p-4 mb-6 border-brand-purple/40 bg-brand-purple/[0.05]">
        <p className="text-sm">
          <strong>Confirmed.</strong> Your profile is visible to employers now.
        </p>
      </div>
    )
  }

  return (
    <div className="card p-5 mb-6 border-brand-purple/40 bg-brand-purple/[0.05]">
      <h2 className="font-semibold mb-1.5">Confirm your email address</h2>
      <p className="text-sm text-brand-muted leading-relaxed mb-3">
        We sent a six-digit code to <strong className="text-brand-text">{email}</strong>. Until it
        is confirmed your profile stays hidden from employers browsing the directory — it is how we
        keep the listings real, and it takes one minute.
      </p>

      <form onSubmit={submit} className="flex gap-2 flex-wrap items-start">
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label="Verification code"
          className="w-40 font-mono"
        />
        <button className="btn-primary" type="submit" disabled={busy || code.trim().length < 4}>
          {busy ? '…' : 'Confirm'}
        </button>
        <button className="btn-secondary" type="button" onClick={resend} disabled={busy}>
          Send a new code
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mt-2.5">{error}</p>}
      {note && <p className="text-sm text-brand-muted mt-2.5">{note}</p>}
      <p className="text-xs text-brand-muted mt-3">
        Check spam if it has not arrived within a few minutes. Codes last an hour.
      </p>
    </div>
  )
}
