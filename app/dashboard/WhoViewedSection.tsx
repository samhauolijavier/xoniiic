'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Viewer {
  userId: string
  name: string | null
  companyName: string | null
  verified: boolean
  viewedAt: string
}

interface ViewsData {
  count: number
  weekCount: number
  viewers: Viewer[]
  isPremium: boolean
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const BLUR_PLACEHOLDERS = [
  { company: '████████████ Company', time: '2 hours ago' },
  { company: '███████ Solutions', time: '1 day ago' },
  { company: '██████████████ Inc', time: '3 days ago' },
]

export function WhoViewedSection({ isPremium }: { isPremium: boolean }) {
  const [data, setData] = useState<ViewsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profile/views')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card p-6 mb-6 animate-pulse">
        <div className="h-6 bg-brand-border rounded w-64 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-brand-border rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const count = data?.count ?? 0
  const weekCount = data?.weekCount ?? 0
  const viewers = data?.viewers ?? []

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-brand-text flex items-center gap-2">
            <span>👁</span> Who Viewed Your Profile
          </h2>
          <p className="text-sm text-brand-muted mt-0.5">
            <span className="text-brand-text font-bold">{count}</span> employers viewed your profile in the last 30 days
            {weekCount > 0 && (
              <> · <span className="text-brand-text font-bold">{weekCount}</span> this week</>
            )}
          </p>
        </div>
        {!isPremium && (
          <Link
            href="/premium"
            className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 hover:opacity-90 transition-all"
          >
            Unlock Now →
          </Link>
        )}
      </div>

      {isPremium ? (
        <>
          {viewers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">👀</div>
              <p className="text-brand-muted text-sm">No employer views in the last 30 days yet</p>
              <p className="text-brand-muted text-xs mt-1">Keep your profile updated to attract more employers</p>
            </div>
          ) : (
            <div className="space-y-3">
              {viewers.map((v) => (
                <div
                  key={v.userId}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl bg-brand-border/30 border border-brand-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(v.companyName || v.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-brand-text">
                          {v.companyName || v.name || 'Employer'}
                        </p>
                        {v.verified && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-400 font-medium">
                            Verified ✓
                          </span>
                        )}
                      </div>
                      {v.name && v.companyName && (
                        <p className="text-xs text-brand-muted">{v.name}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-brand-muted flex-shrink-0">{timeAgo(v.viewedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Blurred placeholders */}
          <div className="space-y-3 mb-5">
            {BLUR_PLACEHOLDERS.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 p-4 rounded-xl bg-brand-border/30 border border-brand-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-border flex-shrink-0" />
                  <div>
                    <p
                      className="text-sm font-medium text-brand-text select-none"
                      style={{ filter: 'blur(5px)', userSelect: 'none' }}
                    >
                      {p.company}
                    </p>
                    {i === 0 && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-400 font-medium"
                        style={{ filter: 'blur(3px)' }}
                      >
                        Verified ✓
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-brand-muted">{p.time}</span>
              </div>
            ))}
          </div>

          {/* Upgrade CTA */}
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-5 text-center">
            <p className="text-brand-text font-medium mb-1">
              🔓 Upgrade to Premium to see who&apos;s interested in you
            </p>
            <p className="text-brand-muted text-sm mb-4">
              {count > 0
                ? `${count} employer${count === 1 ? '' : 's'} viewed your profile. Find out who.`
                : 'See every employer who views your profile.'}
            </p>
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 hover:opacity-90 transition-all"
            >
              Unlock Now → $2.99/mo
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
