'use client'

interface RatingBarProps {
  rating: number
  max?: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function RatingBar({ rating, max = 10, label, size = 'md', showLabel = true }: RatingBarProps) {
  const percentage = (rating / max) * 100

  const getColor = (pct: number) => {
    if (pct >= 80) return 'from-purple-500 to-orange-400'
    if (pct >= 60) return 'from-purple-500 to-pink-500'
    if (pct >= 40) return 'from-purple-600 to-purple-400'
    return 'from-purple-700 to-purple-500'
  }

  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className="w-full">
      {(label || showLabel) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm text-brand-muted truncate">{label}</span>
          )}
          {showLabel && (
            <span className="text-xs font-semibold text-brand-text ml-auto">
              {rating}/{max}
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-brand-border rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} rounded-full bg-gradient-to-r ${getColor(percentage)} rating-fill`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
