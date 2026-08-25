/*
 * The ask, on the page rather than in a DM.
 *
 * Four fields and one of them is the point. Name, WhatsApp and email are how we
 * reach back; "what do you want to build" is what decides the answer — private
 * space for somebody practising, their own account for somebody already running
 * a client's marketing. Learning that on the form rather than in a thread is
 * the whole reason this is not a wa.me link.
 *
 * Closed until asked for. A form sitting open under a price nobody quoted turns
 * the row into a lead-capture block; a link that opens one keeps the section
 * reading as information.
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'

export function PrivateSpaceForm() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [useCase, setUseCase] = useState('')
  const [website, setWebsite] = useState('') // honeypot

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/private-space', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, whatsapp, email, useCase, website }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'That did not send. Try again in a moment.')
        return
      }
      setDone(data.message)
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <p className="text-[15px] text-white/85 leading-relaxed border-l-2 border-brand-pink pl-4">
        {done}
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-white/80 hover:text-white border-b border-white/30 hover:border-white pb-0.5 transition-colors"
      >
        Need your own private space to practice and build? Message us
      </button>
    )
  }

  const field =
    'w-full rounded-lg bg-white/[0.05] border border-white/18 px-3.5 py-2.5 text-white ' +
    'placeholder:text-white/35 focus:outline-none focus:border-white/45 transition-colors text-[15px]'

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-md">
      <p className="text-sm text-white/70 leading-relaxed">
        Leave these and we will message you on WhatsApp to sort it out.
      </p>

      {/* Off-screen rather than display:none — some bots skip hidden inputs. */}
      <div className="absolute -left-[9999px]" aria-hidden>
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={e => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className="text-xs text-white/55">Your name</span>
        <input className={field} value={name} onChange={e => setName(e.target.value)} required />
      </label>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="grid gap-1.5">
          <span className="text-xs text-white/55">WhatsApp number</span>
          <input
            className={field}
            type="tel"
            inputMode="tel"
            placeholder="09xx or +63"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs text-white/55">Email</span>
          <input
            className={field}
            type="email"
            inputMode="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className="text-xs text-white/55">What do you want to build in it?</span>
        <textarea
          className={field}
          rows={3}
          placeholder="A sentence is plenty — what you are learning, or what you want to have ready to show someone."
          value={useCase}
          onChange={e => setUseCase(e.target.value)}
          required
        />
      </label>

      {error && <p className="text-sm text-red-400 leading-relaxed">{error}</p>}

      <div className="flex items-center gap-3 flex-wrap">
        <button className="btn-grad text-[15px]" type="submit" disabled={busy}>
          {busy ? 'Sending…' : 'Send'}
        </button>
        <button
          type="button"
          className="text-sm text-white/55 hover:text-white transition-colors"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-white/40 leading-relaxed">
        We use your number and email to reply about this and nothing else &mdash; no list, no
        marketing.{' '}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-white/70">
          Privacy policy
        </Link>
      </p>
    </form>
  )
}
