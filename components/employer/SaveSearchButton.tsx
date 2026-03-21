'use client'

import { useState } from 'react'

interface SaveSearchButtonProps {
  searchParams: {
    search?: string
    category?: string
    availability?: string
    minRate?: string
    maxRate?: string
    minEnglish?: string
    onlineNow?: string
  }
}

export function SaveSearchButton({ searchParams }: SaveSearchButtonProps) {
  const [showInput, setShowInput] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasFilters = Object.values(searchParams).some(Boolean)

  if (!hasFilters) return null

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ...searchParams }),
      })
      if (res.ok) {
        setSaved(true)
        setShowInput(false)
        setName('')
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save')
      }
    } catch {
      setError('Failed to save search')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
        <span>✓</span> Search saved!
      </span>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="text-sm text-brand-muted hover:text-brand-purple transition-colors flex items-center gap-1.5"
        >
          <span>💾</span> Save This Search
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="input-field text-sm py-1 px-3 h-8 w-44"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="btn-primary text-xs py-1 px-3 h-8"
          >
            {saving ? '...' : 'Save'}
          </button>
          <button
            onClick={() => { setShowInput(false); setName(''); setError(null) }}
            className="text-xs text-brand-muted hover:text-brand-text"
          >
            Cancel
          </button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      )}
    </div>
  )
}
