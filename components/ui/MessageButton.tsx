'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface MessageButtonProps {
  recipientId: string
  recipientName: string
  className?: string
}

export function MessageButton({ recipientId, recipientName, className }: MessageButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId }),
      })

      const data = await res.json()
      if (data.conversation) {
        router.push(`/messages?conversation=${data.conversation.id}`)
      }
    } catch {
      console.error('Failed to create conversation')
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-purple text-white text-sm font-medium hover:bg-brand-purple/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
      title={`Message ${recipientName}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
      {loading ? 'Opening...' : 'Message'}
    </button>
  )
}
