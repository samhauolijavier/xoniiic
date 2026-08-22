'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ClaimForm({
  price,
  gcashNumber,
  gcashQrUrl,
}: {
  price: number
  gcashNumber: string | null
  gcashQrUrl: string | null
}) {
  const router = useRouter()
  const [reference, setReference] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/sandbox/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Try again in a moment.')
        return
      }
      setDone(data.message)
      setReference('')
      router.refresh()
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="claim">
      <h2>Get a Practice Account — ₱{price} for 30 days</h2>
      <div className="pay-row">
        {/* Scanning beats typing thirteen digits into a phone, and a mistyped
            number is a payment somebody has to chase. The number stays for
            anyone paying from a second device or a desktop. */}
        {gcashQrUrl && (
          /* A link, not just a picture. The uploaded image is usually a whole
             GCash screenshot, so the code itself occupies maybe a third of the
             frame — at any sensible page size that is too small to scan. Full
             resolution is one tap away, and that version always scans. */
          <a className="qr-frame" href={gcashQrUrl} target="_blank" rel="noreferrer" title="Open full size">
            {/* A frame around it rather than sizing the image directly: GCash
                screenshots come in every aspect ratio, and letting the image
                sit centred inside a fixed square keeps it square without
                stretching whatever was uploaded. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="qr" src={gcashQrUrl} alt={`GCash QR for paying ₱${price}`} />
          </a>
        )}
        {gcashQrUrl && <span className="qr-hint">Tap the code to open it full size</span>}
        <ol className="steps">
          <li>
            {gcashQrUrl ? <>Scan the QR in your GCash app, or send </> : <>Send </>}
            <strong>₱{price}</strong> to{' '}
            {gcashNumber
              ? <code>{gcashNumber}</code>
              : <em>the number shown on the Virtual Freaks channel</em>}
          </li>
          <li>Open the receipt and find the <strong>reference number</strong></li>
          <li>Type it below. Your seat opens once we match it — usually the same day.</li>
        </ol>
      </div>

      <form className="claim-row" onSubmit={submit}>
        <input
          value={reference}
          onChange={e => setReference(e.target.value)}
          placeholder="GCash reference number"
          aria-label="GCash reference number"
          autoComplete="off"
          required
        />
        <button className="sbtn" type="submit" disabled={busy || !reference.trim()}>
          {busy ? 'Sending…' : 'Submit reference'}
        </button>
      </form>

      {error && <p className="note bad">{error}</p>}
      {done && <p className="note good">{done}</p>}
      <p className="note quiet">
        One payment, 30 days. Nothing renews by itself and no card is stored — when the 30 days
        are up, it simply stops unless you top up again.
      </p>
    </div>
  )
}
