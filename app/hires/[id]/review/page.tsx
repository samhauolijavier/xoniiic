'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ReviewPage() {
  const router = useRouter()
  const params = useParams()
  const hireId = params.id as string

  const [hire, setHire] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/hires/${hireId}`)
      .then(r => r.json())
      .then(data => {
        setHire(data.hire)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load hire details')
        setLoading(false)
      })
  }, [hireId])

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/hires/${hireId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      })

      if (res.ok) {
        router.push('/hires')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit review')
      }
    } catch {
      setError('Something went wrong')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-brand-muted">Loading...</div>
      </div>
    )
  }

  if (!hire) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-brand-muted">Hire not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-text mb-2">
        Leave a <span className="gradient-text">Review</span>
      </h1>
      <p className="text-brand-muted text-sm mb-8">
        Rate your experience for &ldquo;{hire.title}&rdquo;
      </p>

      {/* Who you're reviewing */}
      <div className="card p-4 mb-6">
        <p className="text-xs text-brand-muted mb-1">Reviewing</p>
        <p className="text-brand-text font-medium">
          {hire.employer?.employerProfile?.companyName || hire.employer?.name || hire.seeker?.name || 'Unknown'}
        </p>
        <p className="text-xs text-brand-muted mt-0.5">{hire.title}</p>
      </div>

      {/* Star Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-brand-text mb-3">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-4xl transition-transform hover:scale-110"
            >
              <span className={
                star <= (hoverRating || rating)
                  ? 'text-amber-400'
                  : 'text-brand-border'
              }>
                ★
              </span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs text-brand-muted mt-2">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Great'}
            {rating === 5 && 'Excellent'}
          </p>
        )}
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-brand-text mb-2">
          Comment <span className="text-brand-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience working together..."
          rows={4}
          className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-purple resize-none"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="flex-1 btn-primary py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 text-sm font-medium rounded-xl border border-brand-border text-brand-muted hover:text-brand-text transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
