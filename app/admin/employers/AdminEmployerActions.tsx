'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminEmployerActionsProps {
  userId: string
  isVerified: boolean
  verificationTier: string | null
  isPremium: boolean
}

export function AdminEmployerActions({ userId, isVerified, verificationTier, isPremium }: AdminEmployerActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: 'verify' | 'unverify') => {
    setLoading(true)
    try {
      await fetch(`/api/admin/employers/${userId}/${action}`, { method: 'POST' })
      router.refresh()
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleVFVerify = async () => {
    if (!confirm('Award VF Verified badge to this employer? This is the highest trust tier.')) return
    setLoading(true)
    try {
      await fetch(`/api/admin/employers/${userId}/vf-verify`, { method: 'POST' })
      router.refresh()
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveVFVerify = async () => {
    if (!confirm('Remove VF Verified badge from this employer?')) return
    setLoading(true)
    try {
      await fetch(`/api/admin/employers/${userId}/vf-verify`, { method: 'DELETE' })
      router.refresh()
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const isVFVerified = verificationTier === 'vf_verified'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {isVerified ? (
        <button
          onClick={() => handleAction('unverify')}
          disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg bg-red-900/20 border border-red-700/30 text-red-400 hover:bg-red-900/40 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Unverify'}
        </button>
      ) : (
        <button
          onClick={() => handleAction('verify')}
          disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg bg-emerald-900/20 border border-emerald-700/30 text-emerald-400 hover:bg-emerald-900/40 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Verify'}
        </button>
      )}

      {/* VF Verified toggle */}
      {isVFVerified ? (
        <button
          onClick={handleRemoveVFVerify}
          disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg bg-teal-900/20 border border-teal-700/30 text-teal-400 hover:bg-teal-900/40 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Remove VF'}
        </button>
      ) : (
        <button
          onClick={handleVFVerify}
          disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-600/30 text-emerald-300 hover:from-emerald-900/50 hover:to-teal-900/50 transition-colors disabled:opacity-50"
          title="Award VF Verified badge (highest trust tier)"
        >
          {loading ? '...' : 'Award VF ✓'}
        </button>
      )}
    </div>
  )
}
