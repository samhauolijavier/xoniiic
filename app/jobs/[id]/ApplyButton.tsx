'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ApplyButton({ jobId }: { jobId: string }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleApply() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to apply')
        return
      }

      setSuccess(true)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-medium">Application submitted successfully!</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Add a message to your application (optional)..."
        rows={3}
        className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-purple transition-colors resize-none"
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      <button
        onClick={handleApply}
        disabled={loading}
        className="btn-primary px-6 py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Applying...' : 'Apply Now'}
      </button>
    </div>
  )
}
