'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface HireButtonProps {
  seekerId: string
  seekerName: string
  compact?: boolean
}

export function HireButton({ seekerId, seekerName, compact = false }: HireButtonProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [rateAgreed, setRateAgreed] = useState('')
  const [rateType, setRateType] = useState('hourly')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Job title is required')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/hires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seekerId,
          title: title.trim(),
          rateAgreed: rateAgreed || null,
          rateType,
          notes: notes.trim() || null,
        }),
      })

      if (res.ok) {
        setOpen(false)
        router.push('/hires')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create hire')
      }
    } catch {
      setError('Something went wrong')
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={compact
          ? 'text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all'
          : 'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 font-medium text-sm transition-all'
        }
      >
        🤝 {compact ? 'Hire' : `Mark as Hired`}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-bold text-brand-text mb-1">
              Hire {seekerName}
            </h2>
            <p className="text-xs text-brand-muted mb-5">Track this working relationship</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">Job Title / Role *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Virtual Assistant, Web Developer"
                  className="w-full bg-brand-border/30 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1.5">Agreed Rate</label>
                  <input
                    type="number"
                    value={rateAgreed}
                    onChange={(e) => setRateAgreed(e.target.value)}
                    placeholder="$0"
                    className="w-full bg-brand-border/30 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1.5">Rate Type</label>
                  <select
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value)}
                    className="w-full bg-brand-border/30 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-purple"
                  >
                    <option value="hourly">Per Hour</option>
                    <option value="monthly">Per Month</option>
                    <option value="fixed">Fixed Price</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any details about the arrangement..."
                  rows={2}
                  className="w-full bg-brand-border/30 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-purple resize-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs mt-3">{error}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 btn-primary py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Confirm Hire'}
              </button>
              <button
                onClick={() => { setOpen(false); setError('') }}
                className="px-5 py-2.5 text-sm rounded-xl border border-brand-border text-brand-muted hover:text-brand-text transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
