'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function HeroSection() {
  const { data: session } = useSession()
  const router = useRouter()

  const [heroTag, setHeroTag] = useState('Free profile \u2022 No commission, ever')
  const [heroHeadline, setHeroHeadline] = useState('Nobody hires you without experience. Start here.')
  const [heroSubtitle, setHeroSubtitle] = useState('Build a profile that shows real work, practise on live systems, and get found by people hiring directly. Free, and it stays free.')
  const [heroCta1, setHeroCta1] = useState('Make a free profile')
  const [heroCta2, setHeroCta2] = useState('See the practice account')
  // Starts blank rather than with a claim. The old defaults said 500+
  // freelancers and 50+ categories no matter what was actually in the
  // database, and a launch page aimed at people who will go and look
  // immediately cannot afford a number that fails the first check.
  const [stats, setStats] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.heroTag) setHeroTag(data.heroTag)
        if (data.heroHeadline) setHeroHeadline(data.heroHeadline)
        if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle)
        if (data.heroCta1) setHeroCta1(data.heroCta1)
        if (data.heroCta2) setHeroCta2(data.heroCta2)
        // Real counts unless an admin has set a value by hand. A count is
        // only worth showing once it is worth showing — under ten people on
        // the site, the honest move is to say nothing and let the two claims
        // that are always true carry the row.
        const seekers = Number(data._seekerCount ?? 0)
        const skills = Number(data._skillCount ?? 0)
        const next: { value: string; label: string }[] = []

        if (data.heroStat1Value) {
          next.push({ value: data.heroStat1Value, label: data.heroStat1Label || 'Skilled Freelancers' })
        } else if (seekers >= 10) {
          next.push({ value: `${seekers}`, label: seekers === 1 ? 'Profile' : 'Profiles' })
        }

        next.push({
          value: data.heroStat2Value || 'Free',
          label: data.heroStat2Label || 'For Employers',
        })

        if (data.heroStat3Value) {
          next.push({ value: data.heroStat3Value, label: data.heroStat3Label || 'Skill Categories' })
        } else if (skills >= 5) {
          next.push({ value: `${skills}`, label: 'Skill Categories' })
        } else {
          next.push({ value: '0%', label: 'Commission Taken' })
        }

        setStats(next)
      })
      .catch(() => {})
  }, [])

  function handleBrowseClick() {
    if (session) {
      router.push('/browse')
    } else {
      router.push('/register?role=employer&redirect=/browse')
    }
  }

  function handlePostProfileClick() {
    if (session) {
      router.push('/profile/edit')
    } else {
      router.push('/register?role=seeker&redirect=/profile/edit')
    }
  }

  // Split headline for gradient styling: last two words get gradient
  const words = heroHeadline.split(' ')
  const gradientCount = Math.min(2, words.length)
  const normalWords = words.slice(0, words.length - gradientCount).join(' ')
  const gradientWords = words.slice(words.length - gradientCount).join(' ')

  return (
    <section className="relative overflow-hidden hero-bg py-20 lg:py-32">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-pink/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-brand-card border border-brand-border rounded-full px-4 py-1.5 text-sm text-brand-muted mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {heroTag}
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-tight mb-6">
            {normalWords}{' '}
            <span className="gradient-text">{gradientWords}</span>
          </h1>

          <p className="text-lg sm:text-xl text-brand-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            {heroSubtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={handlePostProfileClick} className="btn-primary text-base px-8 py-3">
              {heroCta1}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <Link href="/sandbox" className="btn-secondary text-base px-8 py-3">
              {heroCta2}
            </Link>
          </div>

          {/* Already have an account nudge — only shown to logged-out visitors */}
          {!session && (
            <p className="mt-4 text-sm text-brand-muted">
              Already have an account?{' '}
              <Link
                href="/login?redirect=/browse"
                className="text-brand-purple hover:text-brand-pink transition-colors underline underline-offset-2"
              >
                Log in to browse
              </Link>
            </p>
          )}

          {/* Stats — hide any stat whose value is a bare number under 10 (e.g. "2") */}
          {(() => {
            const visible = stats.filter((s) => {
              const n = parseInt(s.value, 10)
              // If the value is purely numeric and less than 10, hide it
              if (!isNaN(n) && String(n) === s.value.trim() && n < 10) return false
              return true
            })
            if (visible.length === 0) return null
            return (
              <div className={`mt-16 grid gap-6 max-w-lg mx-auto ${visible.length === 3 ? 'grid-cols-3' : visible.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {visible.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl sm:text-3xl font-black gradient-text">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-brand-muted mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </div>
    </section>
  )
}
