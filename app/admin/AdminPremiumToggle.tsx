'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminPremiumToggle({ userId, isPremium }: { userId: string; isPremium: boolean }) {
  const [loading, setLoading] = useState(false)
  const [currentPremium, setCurrentPremium] = useState(isPremium)
  const router = useRouter()

  const handleToggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/premium`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setCurrentPremium(data.premium)
        router.refresh()
      }
    } catch {
      alert('Failed to toggle premium status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`text-xs px-3 py-1 rounded-lg font-medium transition-all disabled:opacity-60 ${
        currentPremium
          ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50'
          : 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 border border-amber-900/50'
      }`}
    >
      {loading ? '...' : currentPremium ? 'Revoke Premium' : 'Grant Premium'}
    </button>
  )
}
