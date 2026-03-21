'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ReportModalProps {
  targetType: 'seeker' | 'employer'
  targetId: string
  targetName: string
  isOpen: boolean
  onClose: () => void
}

const REASONS = [
  { value: 'scam', label: 'Scam / Fraud' },
  { value: 'spam', label: 'Spam' },
  { value: 'fake', label: 'Fake Profile' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'unpaid', label: 'Unpaid Work' },
  { value: 'other', label: 'Other' },
]

export function ReportModal({ targetType, targetId, targetName, isOpen, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [verifiedRequired, setVerifiedRequired] = useState(false)

  if (!isOpen) return null

  const handleClose = () => {
    setReason('')
    setDescription('')
    setError('')
    setSuccess(false)
    setVerifiedRequired(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) {
      setError('Please select a reason')
      return
    }
    setLoading(true)
    setError('')
    setVerifiedRequired(false)

    try {
      const body =
        targetType === 'seeker'
          ? { reason, description: description || undefined, seekerProfileId: targetId }
          : { reason, description: description || undefined, employerProfileId: targetId }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'verified_required') {
          setVerifiedRequired(true)
        } else {
          setError(data.error || 'Failed to submit report')
        }
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative card p-6 w-full max-w-md z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-brand-text">Report {targetName}</h3>
          <button onClick={handleClose} className="text-brand-muted hover:text-brand-text">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-brand-text font-semibold">Report submitted for admin review.</p>
            <p className="text-brand-muted text-sm mt-2 leading-relaxed">
              No action will be taken against this profile until our team has fully investigated. This process protects all parties.
            </p>
            <button onClick={handleClose} className="btn-secondary text-sm mt-4">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {verifiedRequired && (
              <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-600/40 text-sm">
                <p className="font-semibold text-amber-400 mb-1">Verified Partners Only</p>
                <p className="text-amber-300/80">
                  Only verified employer accounts can report freelancers.{' '}
                  <Link
                    href="/employer-profile"
                    onClick={handleClose}
                    className="underline text-amber-400 hover:text-amber-300"
                  >
                    Get Verified →
                  </Link>
                </p>
              </div>
            )}

            {error && !verifiedRequired && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">Reason</label>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <label key={r.value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="accent-brand-orange"
                    />
                    <span className="text-sm text-brand-muted group-hover:text-brand-text transition-colors">
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-1.5">
                Additional Details <span className="text-brand-muted font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue..."
                rows={3}
                className="input-field resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={handleClose} className="btn-secondary flex-1 justify-center text-sm">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason}
                className="flex-1 justify-center text-sm px-4 py-2 rounded-xl font-semibold text-white bg-red-700 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
