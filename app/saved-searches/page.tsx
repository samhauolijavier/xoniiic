'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SavedSearch {
  id: string
  name: string
  search: string | null
  category: string | null
  availability: string | null
  minRate: number | null
  maxRate: number | null
  minEnglish: number | null
  lastNotified: string | null
  createdAt: string
}

function buildSearchUrl(s: SavedSearch): string {
  const params = new URLSearchParams()
  if (s.search) params.set('search', s.search)
  if (s.category) params.set('category', s.category)
  if (s.availability) params.set('availability', s.availability)
  if (s.minRate) params.set('minRate', String(s.minRate))
  if (s.maxRate) params.set('maxRate', String(s.maxRate))
  if (s.minEnglish) params.set('minEnglish', String(s.minEnglish))
  const qs = params.toString()
  return `/browse${qs ? `?${qs}` : ''}`
}

function summarizeSearch(s: SavedSearch): string {
  const parts: string[] = []
  if (s.search) parts.push(`"${s.search}"`)
  if (s.category) parts.push(s.category)
  if (s.availability) parts.push(s.availability === 'open' ? 'Available Now' : s.availability)
  if (s.minRate && s.maxRate) parts.push(`$${s.minRate}–$${s.maxRate}/hr`)
  else if (s.minRate) parts.push(`$${s.minRate}+/hr`)
  else if (s.maxRate) parts.push(`up to $${s.maxRate}/hr`)
  if (s.minEnglish) parts.push(`English ${s.minEnglish}+`)
  return parts.length > 0 ? parts.join(' · ') : 'All freelancers'
}

export default function SavedSearchesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)

  const user = session?.user as { id: string; role: string } | undefined

  useEffect(() => {
    if (status === 'loading') return
    if (!session || user?.role !== 'employer') {
      router.push('/login')
      return
    }
    fetch('/api/saved-searches')
      .then((r) => r.json())
      .then((data) => setSearches(data.searches || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session, status, user?.role, router])

  const deleteSearch = async (id: string) => {
    try {
      await fetch(`/api/saved-searches?id=${id}`, { method: 'DELETE' })
      setSearches((prev) => prev.filter((s) => s.id !== id))
    } catch {
      // silent
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-brand-card rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 h-20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
          <span className="gradient-text">Saved Searches</span>
        </h1>
        <p className="text-brand-muted mt-1">
          Get notified when new freelancers match your saved filters.
        </p>
      </div>

      {searches.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">💾</div>
          <h3 className="text-xl font-semibold text-brand-text mb-2">No saved searches yet</h3>
          <p className="text-brand-muted mb-6">
            Browse talent and save your filter combinations to get notified of new matches.
          </p>
          <Link href="/browse" className="btn-primary">
            Browse Talent
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((s) => (
            <div key={s.id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-brand-text mb-1 truncate">{s.name}</h3>
                <p className="text-sm text-brand-muted mb-2 truncate">{summarizeSearch(s)}</p>
                <div className="flex items-center gap-3 text-xs text-brand-muted flex-wrap">
                  <span>
                    Created {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {s.lastNotified && (
                    <span>
                      Last notified {new Date(s.lastNotified).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={buildSearchUrl(s)} className="btn-secondary text-sm py-1.5 px-4">
                  Run Search
                </Link>
                <button
                  onClick={() => deleteSearch(s.id)}
                  className="p-2 text-brand-muted hover:text-red-400 transition-colors rounded-lg hover:bg-brand-border"
                  title="Delete saved search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 card p-5 border-brand-purple/30 bg-brand-purple/5">
        <h3 className="font-semibold text-brand-text mb-1 flex items-center gap-2">
          <span>🔔</span> How alerts work
        </h3>
        <p className="text-sm text-brand-muted leading-relaxed">
          When you visit the browse page, we automatically check if any new freelancers match your saved filters since your last visit.
          If they do, you&apos;ll receive a notification. Check your{' '}
          <Link href="/notifications" className="text-brand-purple hover:text-purple-300 transition-colors">
            notifications
          </Link>{' '}
          to see new matches.
        </p>
      </div>
    </div>
  )
}
