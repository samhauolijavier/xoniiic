/*
 * The feed itself, and only the feed.
 *
 * This used to be the whole page, which meant a 'use client' module importing
 * AdSlot — an async server component that reaches for the session. A server
 * component imported into a client module gets bundled as a client one, so
 * getServerSession ran with no request to read headers from and the page threw
 * `headers was called outside a request scope` in production.
 *
 * The heading and the ad now live in the server page above this. Nothing here
 * touches a server-only API.
 */
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'

interface ActivityEvent {
  id: string
  type: string
  icon: string
  message: string
  actorName: string | null
  actorAvatar: string | null
  actorRole: string | null
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

export function ActivityFeed() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchEvents = useCallback(async (pageNum: number) => {
    try {
      const res = await fetch(`/api/activity?page=${pageNum}&limit=20`)
      if (!res.ok) return
      const data = await res.json()
      if (pageNum === 1) {
        setEvents(data.events)
      } else {
        setEvents((prev) => [...prev, ...data.events])
      }
      setHasMore(data.hasMore)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchEvents(1).then(() => setLoading(false))
    }
  }, [status, router, fetchEvents])

  const loadMore = async () => {
    setLoadingMore(true)
    const nextPage = page + 1
    await fetchEvents(nextPage)
    setPage(nextPage)
    setLoadingMore(false)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-brand-border rounded w-3/4" />
                  <div className="h-3 bg-brand-border rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
      </div>
    )
  }

  return (
    <>
      {events.length === 0 ? (
        <div className="card p-12 text-center border-brand-purple/30 bg-brand-purple/[0.04]">
          <h3 className="text-lg font-bold mb-2">
            <span className="gradient-text">Stay Tuned</span>
          </h3>
          <p className="text-brand-muted text-sm max-w-sm mx-auto">
            The activity feed will light up as members join and start connecting!
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {events.map((event) => (
            <div
              key={event.id}
              className="card p-4 hover:border-brand-purple/30 transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Avatar or Icon */}
                <div className="flex-shrink-0">
                  {event.actorAvatar ? (
                    <img
                      src={event.actorAvatar}
                      alt={event.actorName || ''}
                      className="w-10 h-10 rounded-full object-cover border border-brand-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-lg">
                      {event.icon}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brand-text">{event.message}</p>
                  <p className="text-xs text-brand-muted mt-1">{timeAgo(event.createdAt)}</p>
                </div>

                {/* Type icon on the right */}
                <div className="flex-shrink-0 text-lg opacity-60">{event.icon}</div>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-secondary text-sm px-6"
              >
                {loadingMore ? (
                  <>
                    <span className="spinner w-4 h-4" /> Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
