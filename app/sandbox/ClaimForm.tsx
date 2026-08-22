'use client'

import { useState, useEffect } from 'react'
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
  const [zoomed, setZoomed] = useState(false)

  // Escape closes it, and the page behind stops scrolling while it is open.
  // A lightbox you can only dismiss by finding a small × is a lightbox people
  // feel trapped in.
  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomed(false) }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [zoomed])

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
          /* A button, not a link. The uploaded image is usually a whole GCash
             screenshot, so the code itself occupies maybe a third of the frame
             — too small to scan at any sensible page size. Opening it over the
             page keeps somebody on the step they are in the middle of; a new
             tab loses them the form they were about to fill in. */
          <div className="qr-col">
          <button
            type="button"
            className="qr-frame"
            onClick={() => setZoomed(true)}
            aria-label="Show the QR code larger"
          >
            {/* A frame around it rather than sizing the image directly: GCash
                screenshots come in every aspect ratio, and letting the image
                sit centred inside a fixed square keeps it square without
                stretching whatever was uploaded. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="qr" src={gcashQrUrl} alt={`GCash QR for paying ₱${price}`} />
          </button>
            <span className="qr-hint">Click the code to enlarge it</span>
          </div>
        )}
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
      {zoomed && gcashQrUrl && (
        <div
          className="qr-zoom"
          role="dialog"
          aria-modal="true"
          aria-label="GCash QR code"
          onClick={() => setZoomed(false)}
        >
          {/* Clicking the picture itself should not dismiss it — people tap a
              QR while lining up a camera, and closing under them is maddening. */}
          <div className="qr-zoom-inner" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gcashQrUrl} alt={`GCash QR for paying ₱${price}`} />
            <div className="qr-zoom-foot">
              <span>₱{price}{gcashNumber ? ` · ${gcashNumber}` : ''}</span>
              <button type="button" className="sbtn ghost" onClick={() => setZoomed(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <p className="note quiet">
        One payment, 30 days. Nothing renews by itself and no card is stored — when the 30 days
        are up, it simply stops unless you top up again.
      </p>
    </div>
  )
}
