'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function HeroSection() {
  const { data: session } = useSession()
  const router = useRouter()

  const [heroTag, setHeroTag] = useState('100% Free for Employers \u2022 No Subscriptions')
  const [heroHeadline, setHeroHeadline] = useState('Find World-Class Remote Talent')
  const [heroSubtitle, setHeroSubtitle] = useState('Browse skilled freelancers in development, design, marketing, and more. Connect directly. No fees. No middlemen. Just talent.')
  const [heroCta1, setHeroCta1] = useState('Browse Talent Free')
  const [heroCta2, setHeroCta2] = useState('Post Your Profile')
  const [stats, setStats] = useState([
    { value: '500+', label: 'Skilled Freelancers' },
    { value: 'Free', label: 'For Employers' },
    { value: '50+', label: 'Skill Categories' },
  ])

  useEffect(() => {
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.heroTag) setHeroTag(data.heroTag)
        if (data.heroHeadline) setHeroHeadline(data.heroHeadline)
        if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle)
        if (data.heroCta1) setHeroCta1(data.heroCta1)
        if (data.heroCta2) setHeroCta2(data.heroCta2)
        if (data.heroStat1Value || data.heroStat1Label || data.heroStat2Value || data.heroStat2Label || data.heroStat3Value || data.heroStat3Label) {
          setStats([
            { value: data.heroStat1Value || '500+', label: data.heroStat1Label || 'Skilled Freelancers' },
            { value: data.heroStat2Value || 'Free', label: data.heroStat2Label || 'For Employers' },
            { value: data.heroStat3Value || '50+', label: data.heroStat3Label || 'Skill Categories' },
          ])
        }
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
            <button onClick={handleBrowseClick} className="btn-primary text-base px-8 py-3">
              {heroCta1}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button onClick={handlePostProfileClick} className="btn-secondary text-base px-8 py-3">
              {heroCta2}
            </button>
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

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-black gradient-text">{stat.value}</div>
                <div className="text-xs sm:text-sm text-brand-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
