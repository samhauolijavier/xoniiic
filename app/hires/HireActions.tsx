'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface HireActionsProps {
  hireId: string
  status: string
  isEmployer: boolean
  hasReviewed: boolean
}

export function HireActions({ hireId, status, isEmployer, hasReviewed }: HireActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this as ${newStatus}?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/hires/${hireId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) router.refresh()
      else alert('Failed to update')
    } catch {
      alert('Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-2 flex-shrink-0">
      {/* Employer can mark complete or cancel */}
      {isEmployer && status === 'active' && (
        <>
          <button
            onClick={() => handleStatusChange('completed')}
            disabled={loading}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
          >
            ✓ Complete
          </button>
          <button
            onClick={() => handleStatusChange('cancelled')}
            disabled={loading}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-border text-brand-muted hover:border-red-500/50 hover:text-red-400 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        </>
      )}

      {/* Both sides can leave a review after completion */}
      {status === 'completed' && !hasReviewed && (
        <Link
          href={`/hires/${hireId}/review`}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all text-center"
        >
          ⭐ Review
        </Link>
      )}

      {status === 'completed' && hasReviewed && (
        <span className="text-xs text-emerald-400 px-3 py-1.5">✓ Reviewed</span>
      )}
    </div>
  )
}
