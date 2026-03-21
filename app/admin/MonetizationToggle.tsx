'use client'

import { useState } from 'react'

export function MonetizationToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      const newValue = !enabled
      const res = await fetch('/api/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monetization_enabled: newValue ? 'true' : 'false' }),
      })
      if (res.ok) {
        setEnabled(newValue)
      } else {
        alert('Failed to update monetization setting')
      }
    } catch {
      alert('Failed to update monetization setting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6 border-brand-purple/30">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">💰</span>
            <h3 className="text-lg font-bold text-brand-text">Monetization</h3>
          </div>
          <p className="text-sm text-brand-muted">
            Enable paid subscriptions (Seeker Premium &amp; Verified Partner). Requires Stripe keys in environment variables.
          </p>
          <div className="mt-3">
            {enabled ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                <span>💰</span> Live — Stripe subscriptions are active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted">
                <span>💤</span> Monetization is paused — all features are free for everyone
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className="relative flex-shrink-0"
          aria-label={enabled ? 'Disable monetization' : 'Enable monetization'}
        >
          <div
            className={`w-14 h-7 rounded-full transition-colors duration-200 ${
              enabled ? 'bg-emerald-500' : 'bg-brand-border'
            } ${loading ? 'opacity-60' : ''}`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                enabled ? 'translate-x-7.5' : 'translate-x-0.5'
              }`}
              style={{ transform: enabled ? 'translateX(1.75rem)' : 'translateX(0.125rem)' }}
            />
          </div>
        </button>
      </div>
    </div>
  )
}
