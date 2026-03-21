'use client'

interface Review {
  id: string
  rating: number
  comment?: string | null
  createdAt: string | Date
  reviewerUser: {
    id: string
    name?: string | null
    role: string
  }
}

interface ReviewListProps {
  reviews: Review[]
  averageRating: number
  totalCount: number
}

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const starSize = size === 'md' ? 'w-5 h-5' : 'w-4 h-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${starSize}`}
          fill={rating >= star ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: rating >= star ? '#f97316' : '#475569' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ))}
    </div>
  )
}

export function ReviewList({ reviews, averageRating, totalCount }: ReviewListProps) {
  if (totalCount === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-brand-muted text-sm">No reviews yet. Be the first to leave a review.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="card p-5 flex items-center gap-4">
        <div className="text-center">
          <div className="text-3xl font-black gradient-text">{averageRating.toFixed(1)}</div>
          <StarDisplay rating={Math.round(averageRating)} size="md" />
          <div className="text-xs text-brand-muted mt-1">{totalCount} review{totalCount !== 1 ? 's' : ''}</div>
        </div>
        <div className="w-px h-12 bg-brand-border" />
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length
            const pct = totalCount > 0 ? (count / totalCount) * 100 : 0
            return (
              <div key={star} className="flex items-center gap-2 text-xs text-brand-muted">
                <span className="w-3">{star}</span>
                <svg className="w-3 h-3 text-brand-orange" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#f97316' }}>
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <div className="flex-1 h-1.5 bg-brand-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: '#f97316' }}
                  />
                </div>
                <span className="w-4 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Individual reviews */}
      {reviews.map((review) => (
        <div key={review.id} className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {review.reviewerUser.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand-text">
                    {review.reviewerUser.name || 'Anonymous'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    review.reviewerUser.role === 'employer'
                      ? 'bg-blue-900/40 text-blue-400'
                      : 'bg-purple-900/40 text-purple-400'
                  }`}>
                    {review.reviewerUser.role}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StarDisplay rating={review.rating} />
                  <span className="text-xs text-brand-muted">
                    {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {review.comment && (
            <p className="text-brand-muted text-sm mt-3 leading-relaxed">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  )
}
