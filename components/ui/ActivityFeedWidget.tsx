'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ActivityEvent {
  id: string
  type: string
  icon: string
  message: string
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function ActivityFeedWidget() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/activity?limit=5')
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-text">Activity Feed</h2>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-brand-border flex-shrink-0" />
              <div className="flex-1 h-3 bg-brand-border rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-brand-text">Activity Feed</h2>
        <Link href="/activity" className="text-xs text-brand-purple hover:underline">
          View all
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">📡</div>
          <p className="text-brand-muted text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-2.5">
              <span className="text-sm flex-shrink-0 mt-0.5">{event.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-brand-text truncate">{event.message}</p>
                <p className="text-xs text-brand-muted">{timeAgo(event.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
