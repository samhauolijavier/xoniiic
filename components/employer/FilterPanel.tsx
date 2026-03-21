'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

const CATEGORIES = ['Development', 'Design', 'Virtual Assistant', 'Writing', 'Marketing', 'Other']
const AVAILABILITY_OPTIONS = [
  { value: 'open', label: 'Available Now' },
  { value: 'part-time', label: 'Part-Time' },
  { value: 'unavailable', label: 'Unavailable' },
]

export function FilterPanel() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [availability, setAvailability] = useState(searchParams.get('availability') || '')
  const [minRate, setMinRate] = useState(searchParams.get('minRate') || '')
  const [maxRate, setMaxRate] = useState(searchParams.get('maxRate') || '')
  const [minEnglish, setMinEnglish] = useState(searchParams.get('minEnglish') || '')
  const [onlineNow, setOnlineNow] = useState(searchParams.get('onlineNow') === 'true')

  const createQueryString = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()))
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          current.set(key, value)
        } else {
          current.delete(key)
        }
      })
      current.delete('page') // Reset page on filter change
      return current.toString()
    },
    [searchParams]
  )

  const applyFilters = () => {
    const qs = createQueryString({ search, category, availability, minRate, maxRate, minEnglish, onlineNow: onlineNow ? 'true' : '' })
    router.push(`${pathname}?${qs}`)
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setAvailability('')
    setMinRate('')
    setMaxRate('')
    setMinEnglish('')
    setOnlineNow(false)
    router.push(pathname)
  }

  const hasFilters = search || category || availability || minRate || maxRate || minEnglish || onlineNow

  return (
    <div className="card p-5 space-y-5 sticky top-20">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-brand-text">Filters</h3>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-brand-muted hover:text-red-400 transition-colors">
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="text-xs text-brand-muted font-medium mb-1.5 block">Search</label>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Name, skill, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="input-field pl-10 text-sm"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs text-brand-muted font-medium mb-1.5 block">Category</label>
        <div className="space-y-1.5">
          <button
            onClick={() => setCategory('')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
              !category ? 'bg-brand-purple/20 text-purple-300 border border-brand-purple/40' : 'text-brand-muted hover:text-brand-text hover:bg-brand-border'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === category ? '' : cat)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
                category === cat
                  ? 'bg-brand-purple/20 text-purple-300 border border-brand-purple/40'
                  : 'text-brand-muted hover:text-brand-text hover:bg-brand-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <label className="text-xs text-brand-muted font-medium mb-1.5 block">Availability</label>
        <div className="space-y-1.5">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAvailability(availability === opt.value ? '' : opt.value)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
                availability === opt.value
                  ? 'bg-brand-purple/20 text-purple-300 border border-brand-purple/40'
                  : 'text-brand-muted hover:text-brand-text hover:bg-brand-border'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Online Now */}
      <div>
        <label className="text-xs text-brand-muted font-medium mb-1.5 block">Status</label>
        <button
          onClick={() => setOnlineNow(!onlineNow)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
            onlineNow
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-brand-muted hover:text-brand-text hover:bg-brand-border border border-transparent'
          }`}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${onlineNow ? 'bg-emerald-400 animate-pulse' : 'bg-brand-border'}`} />
          Online Now
        </button>
      </div>

      {/* Hourly Rate */}
      <div>
        <label className="text-xs text-brand-muted font-medium mb-1.5 block">Hourly Rate (USD)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minRate}
            onChange={(e) => setMinRate(e.target.value)}
            className="input-field text-sm"
            min={0}
          />
          <input
            type="number"
            placeholder="Max"
            value={maxRate}
            onChange={(e) => setMaxRate(e.target.value)}
            className="input-field text-sm"
            min={0}
          />
        </div>
      </div>

      {/* English Level */}
      <div>
        <label className="text-xs text-brand-muted font-medium mb-1.5 block">
          Min English Level: {minEnglish || 'Any'}
        </label>
        <input
          type="range"
          min={0}
          max={10}
          value={minEnglish || 0}
          onChange={(e) => setMinEnglish(e.target.value === '0' ? '' : e.target.value)}
          className="w-full accent-brand-purple"
        />
        <div className="flex justify-between text-xs text-brand-muted mt-1">
          <span>Any</span>
          <span>Native (10)</span>
        </div>
      </div>

      {/* Apply */}
      <button onClick={applyFilters} className="btn-primary w-full justify-center text-sm">
        Apply Filters
      </button>
    </div>
  )
}
