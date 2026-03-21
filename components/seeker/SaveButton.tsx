'use client'

import { useState, useEffect } from 'react'

interface SaveButtonProps {
  profileId: string
}

export function SaveButton({ profileId }: SaveButtonProps) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/saved/${profileId}`)
      .then(r => r.json())
      .then(data => setSaved(data.saved))
      .catch(() => {})
  }, [profileId])

  const handleToggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/saved/${profileId}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) setSaved(data.saved)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`btn-secondary w-full justify-center text-sm ${saved ? 'border-brand-purple text-purple-400' : ''}`}
    >
      {saved ? (
        <>
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M5 3a2 2 0 00-2 2v14l7-3 7 3V5a2 2 0 00-2-2H5z" />
          </svg>
          Saved
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Save Profile
        </>
      )}
    </button>
  )
}
