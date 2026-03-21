'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  actionUrl: string | null
  relatedId: string | null
  read: boolean
  createdAt: string
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'messages', label: 'Messages' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'system', label: 'System' },
] as const

type TabKey = (typeof TABS)[number]['key']

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function typeIcon(type: string): string {
  switch (type) {
    case 'message':
      return '\u{1F4AC}' // speech bubble
    case 'contact_request':
      return '\u{1F44B}' // wave
    case 'profile_view':
      return '\u{1F441}\uFE0F' // eye
    case 'job_interest':
      return '\u{1F4CB}' // clipboard
    case 'badge_earned':
      return '\u{1F3C6}' // trophy
    case 'subscription':
      return '\u{1F4B3}' // credit card
    case 'report_filed':
      return '\u{1F6A9}' // flag
    case 'report_resolved':
      return '\u2705' // check
    case 'review_received':
      return '\u2B50' // star
    default:
      return '\u{1F4E2}' // megaphone (system)
  }
}

function tabMatchesType(tab: TabKey, type: string): boolean {
  switch (tab) {
    case 'all':
      return true
    case 'unread':
      return true // filtered separately
    case 'messages':
      return type === 'message'
    case 'contacts':
      return type === 'contact_request'
    case 'system':
      return ['system', 'subscription', 'report_filed', 'report_resolved', 'badge_earned'].includes(type)
    default:
      return true
  }
}

function emptyStateForTab(tab: TabKey): { icon: string; title: string; subtitle: string } {
  switch (tab) {
    case 'unread':
      return { icon: '\u2705', title: 'All caught up!', subtitle: 'No unread notifications.' }
    case 'messages':
      return { icon: '\u{1F4AC}', title: 'No messages yet', subtitle: 'Message notifications will appear here.' }
    case 'contacts':
      return { icon: '\u{1F44B}', title: 'No contact requests', subtitle: 'Contact request notifications will appear here.' }
    case 'system':
      return { icon: '\u{1F4E2}', title: 'No system notifications', subtitle: 'System announcements will appear here.' }
    default:
      return { icon: '\u{1F514}', title: "You're all caught up!", subtitle: 'No notifications yet.' }
  }
}

interface DefenseFormProps {
  reportId: string
  onSuccess: () => void
}

function DefenseForm({ reportId, onSuccess }: DefenseFormProps) {
  const [expanded, setExpanded] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/reports/${reportId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit response')
      } else {
        setSubmitted(true)
        onSuccess()
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="mt-3 p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30 text-emerald-400 text-sm">
        Your response has been submitted.
      </div>
    )
  }

  return (
    <div className="mt-3">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="text-sm px-3 py-1.5 rounded-lg bg-brand-purple/20 border border-brand-purple/30 text-brand-purple hover:bg-brand-purple/30 transition-colors"
        >
          Submit Your Response
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Provide your side of the situation..."
            rows={4}
            className="input-field resize-none text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="text-xs px-3 py-1.5 rounded-lg bg-brand-purple text-white hover:bg-brand-purple/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  const fetchNotifications = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)

      try {
        const res = await fetch(`/api/notifications?page=${pageNum}&limit=20`)
        const data = await res.json()
        if (Array.isArray(data.notifications)) {
          setNotifications((prev) =>
            append ? [...prev, ...data.notifications] : data.notifications
          )
          setHasMore(data.hasMore ?? false)
          setUnreadCount(data.unreadCount ?? 0)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    []
  )

  useEffect(() => {
    if (session) {
      setPage(1)
      fetchNotifications(1)
    }
  }, [session, fetchNotifications])

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    fetchNotifications(next, true)
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // silent
    } finally {
      setMarkingAll(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // silent
    }
  }

  const handleDelete = async (id: string) => {
    const n = notifications.find((n) => n.id === id)
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (n && !n.read) setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // silent
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) handleMarkRead(notification.id)
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-purple border-t-transparent animate-spin mx-auto" />
      </div>
    )
  }

  if (!session) return null

  // Filter based on active tab
  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read
    return tabMatchesType(activeTab, n.type)
  })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
            <span className="gradient-text">Notifications</span>
          </h1>
          <p className="text-brand-muted mt-1 text-sm">
            {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            {markingAll ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-brand-purple text-white'
                : 'bg-brand-card text-brand-muted hover:text-brand-text border border-brand-border'
            }`}
          >
            {tab.label}
            {tab.key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">{emptyStateForTab(activeTab).icon}</div>
          <p className="text-brand-text font-semibold text-lg mb-2">
            {emptyStateForTab(activeTab).title}
          </p>
          <p className="text-brand-muted text-sm">
            {emptyStateForTab(activeTab).subtitle}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification) => (
            <div
              key={notification.id}
              className={`card p-4 transition-all cursor-pointer group relative ${
                !notification.read
                  ? 'bg-brand-purple/5 border-l-2 border-l-brand-purple'
                  : 'hover:bg-brand-card/80'
              }`}
              onClick={() => handleNotificationClick(notification)}
              onMouseEnter={() => setHoveredId(notification.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-2xl flex-shrink-0 mt-0.5">{typeIcon(notification.type)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-brand-purple flex-shrink-0" />
                      )}
                      <p
                        className={`text-sm truncate ${
                          !notification.read
                            ? 'font-bold text-brand-text'
                            : 'font-medium text-brand-muted'
                        }`}
                      >
                        {notification.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-brand-muted">
                        {timeAgo(notification.createdAt)}
                      </span>
                      {/* Delete button on hover */}
                      {hoveredId === notification.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(notification.id)
                          }}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-brand-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          aria-label="Delete notification"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-brand-muted mt-1 leading-relaxed">
                    {notification.message}
                  </p>

                  {notification.actionUrl && notification.type !== 'report_filed' && (
                    <Link
                      href={notification.actionUrl}
                      className="inline-block mt-2 text-xs text-brand-purple hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View details &rarr;
                    </Link>
                  )}

                  {notification.type === 'report_filed' && notification.relatedId && (
                    <DefenseForm
                      reportId={notification.relatedId}
                      onSuccess={() => {}}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasMore && activeTab === 'all' && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
                    Loading...
                  </span>
                ) : (
                  'Load more'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
