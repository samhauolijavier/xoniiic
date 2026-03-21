'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminReportActionsProps {
  reportId: string
  currentStatus: string
}

export function AdminReportActions({ reportId, currentStatus }: AdminReportActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpdate = async (status: string) => {
    setLoading(status)
    try {
      await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      router.refresh()
    } catch {
      // silent
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {currentStatus === 'pending' && (
        <button
          onClick={() => handleUpdate('reviewed')}
          disabled={!!loading}
          className="px-2.5 py-1 text-xs rounded-lg bg-blue-900/20 border border-blue-700/30 text-blue-400 hover:bg-blue-900/40 transition-colors disabled:opacity-50"
        >
          {loading === 'reviewed' ? '...' : 'Mark Reviewed'}
        </button>
      )}
      <button
        onClick={() => handleUpdate('dismissed')}
        disabled={!!loading}
        className="px-2.5 py-1 text-xs rounded-lg bg-brand-border text-brand-muted hover:text-brand-text transition-colors disabled:opacity-50"
      >
        {loading === 'dismissed' ? '...' : 'Dismiss'}
      </button>
      <button
        onClick={() => handleUpdate('actioned')}
        disabled={!!loading}
        className="px-2.5 py-1 text-xs rounded-lg bg-emerald-900/20 border border-emerald-700/30 text-emerald-400 hover:bg-emerald-900/40 transition-colors disabled:opacity-50"
      >
        {loading === 'actioned' ? '...' : 'Action'}
      </button>
    </div>
  )
}
