'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ContactRequestCardProps {
  contact: {
    id: string
    message: string
    status: string
    createdAt: string | Date
    senderEmail: string
    sender: {
      id: string
      name: string | null
      email: string
    }
  }
}

export function ContactRequestCard({ contact }: ContactRequestCardProps) {
  const [status, setStatus] = useState(contact.status)
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)
  const router = useRouter()

  const handleAction = async (action: 'accept' | 'reject') => {
    setLoading(action)
    try {
      const res = await fetch(`/api/contact/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) throw new Error('Failed')

      const data = await res.json()
      setStatus(action === 'accept' ? 'accepted' : 'rejected')

      if (action === 'accept' && data.conversationId) {
        router.push(`/messages?id=${data.conversationId}`)
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const date = new Date(contact.createdAt).toLocaleDateString()

  return (
    <div className="p-4 rounded-xl border border-brand-border bg-brand-card/50 hover:border-brand-purple/30 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-brand-text text-sm truncate">
              {contact.sender.name || contact.senderEmail}
            </span>
            {status === 'pending' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">
                pending
              </span>
            )}
            {status === 'accepted' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                accepted
              </span>
            )}
            {status === 'rejected' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
                declined
              </span>
            )}
          </div>
          <p className="text-brand-muted text-xs mb-2">{contact.sender.email} &middot; {date}</p>
          <p className="text-brand-text/80 text-sm leading-relaxed">{contact.message}</p>
        </div>
      </div>

      {status === 'pending' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-brand-border">
          <button
            onClick={() => handleAction('accept')}
            disabled={loading !== null}
            className="flex-1 text-sm font-medium py-2 px-4 rounded-lg bg-gradient-to-r from-brand-purple to-brand-orange text-white hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading === 'accept' ? 'Accepting...' : 'Accept & Chat'}
          </button>
          <button
            onClick={() => handleAction('reject')}
            disabled={loading !== null}
            className="text-sm font-medium py-2 px-4 rounded-lg border border-brand-border text-brand-muted hover:border-red-500/50 hover:text-red-400 transition-all disabled:opacity-50"
          >
            {loading === 'reject' ? '...' : 'Decline'}
          </button>
        </div>
      )}

      {status === 'accepted' && (
        <div className="mt-3 pt-3 border-t border-brand-border">
          <button
            onClick={() => router.push('/messages')}
            className="text-sm text-brand-purple hover:underline"
          >
            Go to Messages →
          </button>
        </div>
      )}
    </div>
  )
}
