/*
 * Shown once, when the terms have actually changed.
 *
 * Not a modal that traps somebody. It sits at the top of the page, says what
 * changed in a sentence, and links to both documents — because "we updated our
 * terms, click accept" with no indication of what moved is a prompt designed
 * to be dismissed rather than read.
 *
 * Nothing is blocked while it is showing. Somebody who wants to read properly
 * before agreeing should be able to, and somebody who disagrees should be able
 * to close their account rather than be held hostage on a page.
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TERMS_SUMMARY } from '@/lib/legal'

export function AcceptTerms() {
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function accept() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/legal/accept', { method: 'POST' })
      if (!res.ok) { setError('Could not save that. Try again in a moment.'); return }
      setDone(true)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  if (done) return null

  return (
    <div className="card p-5 mb-6 border-brand-purple/40 bg-brand-purple/[0.04]">
      <h2 className="font-semibold mb-1.5">We have updated our terms</h2>
      <p className="text-sm text-brand-muted leading-relaxed mb-3">
        {TERMS_SUMMARY} Nothing about your account or your profile has changed, and we still take
        no commission on what you earn.
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <button className="btn-primary text-sm" onClick={accept} disabled={busy}>
          {busy ? 'Saving…' : 'I agree'}
        </button>
        <Link href="/terms" className="text-sm text-brand-purple underline underline-offset-2">
          Read the terms
        </Link>
        <Link href="/privacy" className="text-sm text-brand-purple underline underline-offset-2">
          Read the privacy policy
        </Link>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
