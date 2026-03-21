'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'

interface TrendingSkill {
  skillName: string
  thisWeekCount?: number
  lastWeekCount?: number
  changePercent: number
  trending: 'up' | 'down' | 'new'
}

export function TrendingSkills() {
  const [skills, setSkills] = useState<TrendingSkill[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch('/api/trending-skills', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setSkills(data.skills || [])
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSkills()
    const interval = setInterval(fetchSkills, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchSkills])

  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-4 w-36 bg-brand-border rounded mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 bg-brand-border rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (skills.length === 0) return null

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-brand-text mb-3 flex items-center gap-2 text-sm">
        <span>🔥</span> Trending This Week
      </h3>
      <div className="space-y-2">
        {skills.map((skill) => {
          const href =
            ['Development', 'Design', 'Virtual Assistant', 'Writing', 'Marketing'].includes(skill.skillName)
              ? `/browse?category=${encodeURIComponent(skill.skillName)}`
              : `/browse?search=${encodeURIComponent(skill.skillName)}`

          return (
            <Link
              key={skill.skillName}
              href={href}
              className="flex items-center justify-between gap-2 group py-1 hover:bg-brand-border/40 -mx-1 px-1 rounded-lg transition-all"
            >
              <span className="text-sm text-brand-text group-hover:text-brand-purple transition-colors truncate">
                {skill.skillName}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                {skill.trending === 'new' ? (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-purple/20 text-purple-300 border border-brand-purple/30 font-medium">
                    new
                  </span>
                ) : skill.trending === 'up' ? (
                  <>
                    <span className="text-emerald-400 text-xs">↑</span>
                    <span className="text-xs text-emerald-400 font-medium">
                      {skill.changePercent}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-red-400 text-xs">↓</span>
                    <span className="text-xs text-red-400 font-medium">
                      {Math.abs(skill.changePercent)}%
                    </span>
                  </>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
