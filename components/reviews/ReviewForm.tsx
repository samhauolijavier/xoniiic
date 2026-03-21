'use client'

import { useState } from 'react'

interface ReviewFormProps {
  targetType: 'seeker' | 'employer'
  targetId: string
  targetName: string
  onSuccess?: () => void
}

export function ReviewForm({ targetType, targetId, targetName, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a star rating')
      return
    }
    setLoading(true)
    setError('')

    try {
      const body =
        targetType === 'seeker'
          ? {
              type: 'employer_to_seeker',
              rating,
              comment: comment || undefined,
              seekerProfileId: targetId,
            }
          : {
              type: 'seeker_to_employer',
              rating,
              comment: comment || undefined,
              employerProfileId: targetId,
            }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit review')
      } else {
        setSuccess(true)
        onSuccess?.()
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="card p-5 text-center">
        <div className="w-10 h-10 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-brand-text font-medium text-sm">Review submitted!</p>
        <p className="text-brand-muted text-xs mt-1">Thank you for your feedback.</p>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-brand-text mb-4">Leave a Review for {targetName}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-brand-text mb-2">Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110"
              >
                <svg
                  className="w-7 h-7 transition-colors"
                  fill={(hovered || rating) >= star ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: (hovered || rating) >= star ? '#f97316' : '#475569' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-brand-muted">
                {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">
            Comment <span className="text-brand-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows={3}
            maxLength={500}
            className="input-field resize-none"
          />
          <p className="text-xs text-brand-muted mt-1">{comment.length}/500</p>
        </div>

        <button
          type="submit"
          disabled={loading || rating === 0}
          className="btn-primary w-full justify-center text-sm"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}
