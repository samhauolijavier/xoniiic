/*
 * Where the GCash QR gets set.
 *
 * It lives on the seat desk rather than a settings page because this is where
 * payments are looked at all day — if the QR is ever wrong, this is where
 * somebody notices, and it should be fixable in the same place.
 */
'use client'

import { useState, useEffect } from 'react'

export function GcashQrUpload() {
  const [url, setUrl] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(d => {
        setUrl(d.gcashQrUrl ?? null)
        setPrice(d.seatPricePesos ?? '')
      })
      .catch(() => {})
  }, [])

  async function upload(file: File) {
    setBusy(true); setNote(''); setError('')
    try {
      const form = new FormData()
      form.set('qr', file)
      const res = await fetch('/api/admin/gcash-qr', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Upload failed.'); return }
      setUrl(data.url)
      setNote(data.message)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!window.confirm('Remove the QR? The page will show just the number.')) return
    setBusy(true); setNote(''); setError('')
    try {
      const res = await fetch('/api/admin/gcash-qr', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not remove it.'); return }
      setUrl(null)
      setNote(data.message)
    } finally {
      setBusy(false)
    }
  }

  async function savePrice(e: React.FormEvent) {
    e.preventDefault()
    setSavingPrice(true); setNote(''); setError('')
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatPricePesos: String(Number(price)) }),
      })
      if (!res.ok) { setError('Could not save the price.'); return }
      setNote(`Price is now ₱${Number(price)}. Upload a matching QR if the amount is printed on it.`)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setSavingPrice(false)
    }
  }

  return (
    <section className="panel">
      <div className="panel-head"><h2>Payment</h2></div>

      <form onSubmit={savePrice} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        <label style={{ fontSize: 13 }} htmlFor="seat-price">Price per 30 days</label>
        <span style={{ fontFamily: 'var(--mono)' }}>₱</span>
        <input
          id="seat-price" value={price} onChange={e => setPrice(e.target.value)}
          inputMode="numeric" placeholder="129"
          style={{ width: 90, fontFamily: 'var(--mono)', padding: '6px 9px',
                   border: '1px solid var(--rule)', borderRadius: 7, background: 'var(--paper)' }}
        />
        <button className="dbtn" type="submit" disabled={savingPrice || !Number(price)}>
          {savingPrice ? '…' : 'Save price'}
        </button>
        <span className="quiet">Applies everywhere at once — the seat page, the claim, and the Discord ping.</span>
      </form>
      <p className="quiet pad">
        Shown on the practice account page beside the number. Most people would rather scan than
        type thirteen digits, and a mistyped reference is a payment somebody has to chase.
      </p>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={url}
            alt="Current GCash QR"
            width={120}
            height={120}
            style={{ width: 120, height: 120, objectFit: 'contain', border: '1px solid var(--rule)', borderRadius: 8, background: '#fff' }}
          />
        )}
        <div style={{ flex: 1, minWidth: 220 }}>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={busy}
            onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }}
            style={{ fontSize: 13 }}
          />
          <p className="quiet" style={{ marginTop: 8, lineHeight: 1.5 }}>
            <strong>Crop it to just the code.</strong> A full app screenshot puts the QR in about
            a third of the frame, and at that size nobody can scan it off a screen. PNG, JPG, or WebP.
            {url ? ' Uploading a new one replaces this.' : ''}
          </p>
          {url && (
            <button className="dbtn ghost" type="button" onClick={remove} disabled={busy} style={{ marginTop: 6 }}>
              Remove QR
            </button>
          )}
        </div>
      </div>

      {error && <p className="note bad" style={{ marginTop: 10 }}>{error}</p>}
      {note && <p className="note good" style={{ marginTop: 10 }}>{note}</p>}
    </section>
  )
}
