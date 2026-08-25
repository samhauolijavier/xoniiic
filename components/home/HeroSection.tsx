'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function HeroSection() {
  const { data: session } = useSession()
  const router = useRouter()

  const [heroTag, setHeroTag] = useState('Free profile \u2022 No commission, ever')
  // The position, not a feature. Upwork takes 0-15% and charges to submit a
  // proposal; OnlineJobs.ph charges the employer monthly for the right to send
  // a message. Both put a toll between the work and the person doing it. That
  // is what the page is against, and it is a principle rather than a price — so
  // it does not go stale the next time Upwork changes its fee.
  const [heroHeadline, setHeroHeadline] = useState('Nobody should have to pay to get hired.')
  const [heroSubtitle, setHeroSubtitle] = useState('No commission on your rate. No fee to apply. No charge to message anyone. Free for freelancers, free for businesses, and it stays that way.')
  const [heroCta1, setHeroCta1] = useState('Make a free profile')
  const [heroCta2, setHeroCta2] = useState("I'm hiring")
  // Starts blank rather than with a claim. The old defaults said 500+
  // freelancers and 50+ categories no matter what was actually in the
  // database, and a launch page aimed at people who will go and look
  // immediately cannot afford a number that fails the first check.
  const [stats, setStats] = useState<{ value: string; label: string }[]>([])
  const [faces, setFaces] = useState<{ avatarUrl: string | null; username: string }[]>([])
  const [memberCount, setMemberCount] = useState(0)

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
        setMemberCount(seekers)
        try {
          const parsed = JSON.parse(data._faces ?? '[]')
          if (Array.isArray(parsed)) setFaces(parsed)
        } catch {
          // A missing row of avatars is a smaller loss than a broken hero.
        }
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
          // Skills, not categories. There are six categories and fifty-five
          // skills inside them; the old copy called the larger number
          // "Skill Categories", which was wrong in a way anyone counting the
          // six tiles below it would notice.
          next.push({ value: `${skills}`, label: 'Skills Listed' })
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
    <section className="relative overflow-hidden hero-bg py-12 sm:py-20 lg:py-32">
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
          <h1 className="text-[32px] leading-[1.12] sm:text-5xl sm:leading-tight lg:text-7xl font-black mb-5 sm:mb-6">
            {normalWords}{' '}
            <span className="brand-text-gradient">{gradientWords}</span>
          </h1>

          <p className="text-base sm:text-xl text-brand-muted max-w-2xl mx-auto mb-7 sm:mb-10 leading-relaxed">
            {heroSubtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={handlePostProfileClick} className="btn-primary text-base px-8 py-3">
              {heroCta1}
            </button>
            <Link href="/hire" className="btn-secondary text-base px-8 py-3">
              {heroCta2}
            </Link>
          </div>

          {/* Faces, before anything else on the page.
              It is a marketplace of people and it used to show none of them
              until three sections down — the stat said "27 Profiles" and then
              displayed nothing. This costs about forty pixels. */}
          {faces.length >= 3 && (
            <div className="mt-7 flex items-center justify-center gap-3">
              <div className="flex">
                {faces.map((f, i) => (
                  <Link
                    key={f.username}
                    href={`/@${f.username}`}
                    className="block -ml-2.5 first:ml-0 transition-transform hover:-translate-y-0.5 hover:z-10"
                    style={{ zIndex: faces.length - i }}
                    aria-label={`See ${f.username}'s profile`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.avatarUrl ?? ''}
                      alt=""
                      width={38}
                      height={38}
                      className="w-[38px] h-[38px] rounded-full object-cover ring-2 ring-brand-bg bg-brand-card"
                    />
                  </Link>
                ))}
              </div>
              <p className="text-sm text-brand-muted text-left leading-tight">
                <strong className="text-brand-text">{memberCount}</strong> people
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>looking for work now
              </p>
            </div>
          )}

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
