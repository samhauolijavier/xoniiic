'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DayData {
  date: string
  count: number
}

interface AnalyticsData {
  isPremium: boolean
  totalViews: number
  savesCount?: number
  contactCount?: number
  averageRating?: number
  totalReviews?: number
  topSkills?: { name: string; rating: number }[]
  viewsPerDay?: DayData[]
}

export function AnalyticsSection({ isPremium, hideMonetization }: { isPremium: boolean; hideMonetization?: boolean }) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profile/analytics')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card p-6 mb-6 animate-pulse">
        <div className="h-6 bg-brand-border rounded w-48 mb-4" />
        <div className="h-40 bg-brand-border rounded-xl" />
      </div>
    )
  }

  if (!isPremium && !hideMonetization) {
    return (
      <div className="card p-6 mb-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-brand-text flex items-center gap-2">
            <span>📊</span> Premium Analytics
          </h2>
          <Link
            href="/premium"
            className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 hover:opacity-90 transition-all"
          >
            Upgrade →
          </Link>
        </div>

        {/* Blurred preview */}
        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5" style={{ filter: 'blur(4px)', userSelect: 'none' }}>
            {[
              { label: '30-Day Views', value: data?.totalViews ?? 42 },
              { label: 'Employers Saved', value: 8 },
              { label: 'Contact Requests', value: 3 },
              { label: 'Avg Rating', value: '4.8' },
            ].map((s) => (
              <div key={s.label} className="bg-brand-border/40 rounded-xl p-4 text-center">
                <div className="text-2xl font-black gradient-text">{s.value}</div>
                <div className="text-xs text-brand-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-brand-card/95 border border-amber-500/30 rounded-xl px-6 py-4 text-center shadow-xl">
              <p className="text-brand-text font-bold mb-1">📊 Premium Analytics</p>
              <p className="text-brand-muted text-sm mb-3">See your full performance data</p>
              <Link
                href="/premium"
                className="inline-flex items-center gap-1 text-sm font-bold text-amber-400 hover:text-amber-300"
              >
                Upgrade → $2.99/mo
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const viewsPerDay = data.viewsPerDay ?? []
  const maxViews = Math.max(...viewsPerDay.map((d) => d.count), 1)

  // Show last 14 days in the chart for readability
  const chartDays = viewsPerDay.slice(-14)

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-lg font-semibold text-brand-text mb-5 flex items-center gap-2">
        <span>📊</span> Analytics Dashboard
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">Premium</span>
      </h2>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-brand-border/40 rounded-xl p-4 text-center">
          <div className="text-2xl font-black gradient-text">{data.totalViews}</div>
          <div className="text-xs text-brand-muted mt-1">30-Day Views</div>
        </div>
        <div className="bg-brand-border/40 rounded-xl p-4 text-center">
          <div className="text-2xl font-black gradient-text">{data.savesCount ?? 0}</div>
          <div className="text-xs text-brand-muted mt-1">Employers Saved</div>
        </div>
        <div className="bg-brand-border/40 rounded-xl p-4 text-center">
          <div className="text-2xl font-black gradient-text">{data.contactCount ?? 0}</div>
          <div className="text-xs text-brand-muted mt-1">Contact Requests</div>
        </div>
        <div className="bg-brand-border/40 rounded-xl p-4 text-center">
          <div className="text-2xl font-black gradient-text">
            {data.averageRating && data.averageRating > 0 ? data.averageRating.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-brand-muted mt-1">Avg Rating</div>
        </div>
      </div>

      {/* Views per day bar chart */}
      {chartDays.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-3">Profile Views — Last 14 Days</h3>
          <div className="flex items-end gap-1 h-28">
            {chartDays.map((d) => {
              const pct = maxViews > 0 ? (d.count / maxViews) * 100 : 0
              const date = new Date(d.date)
              const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full flex items-end" style={{ height: '88px' }}>
                    <div
                      className="w-full rounded-t-sm bg-brand-purple transition-all group-hover:bg-brand-orange"
                      style={{ height: `${Math.max(pct, d.count > 0 ? 4 : 0)}%` }}
                      title={`${label}: ${d.count} view${d.count !== 1 ? 's' : ''}`}
                    />
                  </div>
                  <span className="text-[9px] text-brand-muted hidden sm:block" style={{ fontSize: '8px' }}>
                    {date.getDate()}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-brand-muted mt-1">
            <span>{chartDays[0] ? new Date(chartDays[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
            <span>{chartDays[chartDays.length - 1] ? new Date(chartDays[chartDays.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
          </div>
        </div>
      )}
    </div>
  )
}
