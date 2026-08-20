import type { Metadata } from 'next'

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  // The page speaks to remote workers now, so the title has to as well —
  // otherwise search sends employers to the page written for someone else,
  // and /hire, which was written for them, never gets found.
  title: 'Virtual Freaks — Get hired as a VA or remote professional',
  description: 'Build a free profile that shows real work, practice on live systems, and get found by people hiring directly. No commission, ever. Hiring instead? See virtualfreaks.co/hire.',
  keywords: ['virtual assistant jobs', 'remote work philippines', 'VA portfolio', 'get hired as a VA', 'remote jobs', 'GoHighLevel practice', 'freelancer profile', 'hire remote talent'],
  alternates: {
    canonical: 'https://virtualfreaks.co',
  },
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { HeroSection } from '@/components/home/HeroSection'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { Testimonials } from '@/components/home/Testimonials'
import { ProfileCard } from '@/components/seeker/ProfileCard'
import { TrendingSkills } from '@/components/ui/TrendingSkills'
import { db } from '@/lib/db'
import { excludeDemoAccounts, publiclyListable } from '@/lib/constants'
import Link from 'next/link'
import Image from 'next/image'

async function getFeaturedSeekers() {
  return db.seekerProfile.findMany({
    where: { featured: true, openToWork: true, user: publiclyListable() },
    take: 6,
    orderBy: { profileViews: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      skills: { include: { skill: true }, orderBy: { rating: 'desc' } },
    },
  })
}

async function getRecentSeekers() {
  return db.seekerProfile.findMany({
    where: { openToWork: true, user: publiclyListable() },
    take: 4,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      skills: { include: { skill: true }, orderBy: { rating: 'desc' } },
    },
  })
}

async function getTopTalent() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const profileViewCounts = await db.profileView.groupBy({
    by: ['seekerProfileId'],
    where: { createdAt: { gte: since } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 20,
  })

  const useSparseData = profileViewCounts.length < 3

  if (useSparseData) {
    return db.seekerProfile.findMany({
      where: { openToWork: true, user: publiclyListable() },
      orderBy: { profileViews: 'desc' },
      take: 5,
      include: {
        user: { select: { id: true, name: true, premium: true } },
        skills: { include: { skill: true }, orderBy: { rating: 'desc' }, take: 1 },
      },
    }).then((profiles) =>
      profiles.map((p, i) => ({
        rank: i + 1,
        id: p.id,
        username: p.username,
        name: p.user.name,
        avatarUrl: p.avatarUrl,
        title: p.title,
        profileViews: p.profileViews,
        topSkill: p.skills[0]?.skill.name || null,
        premium: p.user.premium,
      }))
    )
  }

  const ids = profileViewCounts.slice(0, 5).map((v) => v.seekerProfileId)
  const viewCountMap = new Map(profileViewCounts.map((v) => [v.seekerProfileId, v._count.id]))
  const profiles = await db.seekerProfile.findMany({
    where: { id: { in: ids }, openToWork: true, user: publiclyListable() },
    include: {
      user: { select: { id: true, name: true, premium: true } },
      skills: { include: { skill: true }, orderBy: { rating: 'desc' }, take: 1 },
    },
  })
  profiles.sort((a, b) => (viewCountMap.get(b.id) || 0) - (viewCountMap.get(a.id) || 0))
  return profiles.slice(0, 5).map((p, i) => ({
    rank: i + 1,
    id: p.id,
    username: p.username,
    name: p.user.name,
    avatarUrl: p.avatarUrl,
    title: p.title,
    profileViews: viewCountMap.get(p.id) || 0,
    topSkill: p.skills[0]?.skill.name || null,
    premium: p.user.premium,
  }))
}

const howItWorks = [
  {
    step: '01',
    title: 'Make a profile',
    description: 'Free, and it stays free. Skills, rate, availability, and how to reach you — no commission is ever taken from what you earn.',
  },
  {
    step: '02',
    title: 'Do the work',
    description: 'Scenario briefs you can download and complete, on live systems rather than slides. What you finish goes on your profile as work you have actually done.',
  },
  {
    step: '03',
    title: 'Get contacted directly',
    description: 'Businesses message you themselves. Nobody stands in the middle, and you agree your own rate with them.',
  },
]

export default async function Home() {
  // Redirect logged-in users to their role-specific dashboard
  const session = await getServerSession(authOptions)
  if (session?.user) {
    const user = session.user as { role: string }
    if (user.role === 'seeker') redirect('/dashboard')
    if (user.role === 'employer') redirect('/employer-dashboard')
    if (user.role === 'admin') redirect('/admin')
  }

  let featuredSeekers: Awaited<ReturnType<typeof getFeaturedSeekers>> = []
  let recentSeekers: Awaited<ReturnType<typeof getRecentSeekers>> = []
  let topTalent: Awaited<ReturnType<typeof getTopTalent>> = []

  try {
    ;[featuredSeekers, recentSeekers, topTalent] = await Promise.all([
      getFeaturedSeekers(),
      getRecentSeekers(),
      getTopTalent(),
    ])
  } catch (error) {
    console.error('Homepage DB query failed:', error)
    // Page renders with empty arrays — shows inviting empty states instead of crashing
  }

  return (
    <div>
      <HeroSection />

      {/* Trending Skills */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TrendingSkills />
      </section>

      <CategoryGrid />

      {/* Renders nothing until somebody has actually vouched. */}
      <Testimonials />

      {/* Top Talent This Week — only show with 3+ entries so it doesn't look sparse */}
      {topTalent.length >= 3 && (
        <section className="py-12 bg-brand-card/20 border-y border-brand-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-brand-text">
                  <span className="gradient-text">Top Talent</span> This Week
                </h2>
                <p className="text-brand-muted mt-1 text-sm sm:text-base">Most viewed profiles in the last seven days.</p>
              </div>
              <Link href="/leaderboard" className="btn-secondary text-sm">
                Full Leaderboard →
              </Link>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 items-stretch">
              {topTalent.map((entry) => {
                const initials = entry.name
                  ? entry.name.split(' ').map((n) => n[0]).join('').toUpperCase()
                  : entry.username[0].toUpperCase()
                // Was medals for the top three and #4, #5 for the rest — two
                // notations for one ranked list, in the same row. One notation,
                // in monospace, and the top three carry the accent instead.
                const isPodium = entry.rank <= 3
                return (
                  <Link key={entry.id} href={`/@${entry.username}`} className="block h-full">
                    <div className="card p-4 text-center group hover-glow cursor-pointer h-full flex flex-col">
                      <div className={`font-mono text-sm mb-2 tabular-nums ${isPodium ? 'text-brand-purple font-semibold' : 'text-brand-muted'}`}>
                        #{entry.rank}
                      </div>
                      {entry.avatarUrl ? (
                        <div className="w-14 h-14 rounded-full overflow-hidden mx-auto mb-2 ring-2 ring-brand-purple/30">
                          <Image
                            src={entry.avatarUrl}
                            alt={entry.name || entry.username}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-brand-purple flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                          {initials}
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <p className="text-sm font-semibold text-brand-text group-hover:gradient-text transition-all truncate">
                          {entry.name || entry.username}
                        </p>
                        {entry.premium && <span className="text-brand-purple text-xs font-semibold">PRO</span>}
                      </div>
                      {/* Always rendered. Two of five profiles have no top skill,
                          and letting the line vanish made those cards shorter
                          than the rest of the row. */}
                      <p className="text-xs text-brand-muted truncate mb-1 min-h-[1rem]">
                        {entry.topSkill ?? '\u00A0'}
                      </p>
                      <p className="text-xs text-brand-muted mt-auto">
                        <span className="font-semibold text-brand-text">{entry.profileViews}</span> views
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Talent — or early adopter CTA */}
      {featuredSeekers.length > 0 ? (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-brand-text">
                <span className="gradient-text">Featured</span> Talent
              </h2>
              <p className="text-brand-muted mt-1 text-sm sm:text-base">Hand-picked top performers</p>
            </div>
            <Link href="/browse?featured=true" className="btn-secondary text-sm">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredSeekers.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        </section>
      ) : (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-10 text-center border-brand-purple/30 bg-brand-purple/[0.04]">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-text mb-3">
              Join <span className="gradient-text">Virtual Freaks</span>
            </h2>
            <p className="text-brand-muted max-w-lg mx-auto mb-6">
              Create your profile and get discovered by employers worldwide. Early members earn exclusive Founding Member badges.
            </p>
            <Link href="/register" className="inline-block btn-primary px-8 py-3 text-lg font-bold">
              Register Now
            </Link>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 bg-brand-card/30 border-y border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-brand-text mb-4">
              How It{' '}
              <span className="gradient-text">Works</span>
            </h2>
            <p className="text-brand-muted text-lg max-w-xl mx-auto">
              Connect with remote talent in 3 simple steps — completely free
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => (
              <div key={step.step} className="relative text-center">
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-3/4 w-1/2 h-px bg-gradient-to-r from-brand-purple/50 to-transparent" />
                )}
                <div className="font-mono text-3xl text-brand-purple mb-3 tabular-nums">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-brand-text mb-3">{step.title}</h3>
                <p className="text-brand-muted text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Joined */}
      {recentSeekers.length >= 2 ? (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-brand-text">
                Recently{' '}
                <span className="gradient-text">Joined</span>
              </h2>
              <p className="text-brand-muted mt-1 text-sm sm:text-base">The newest profiles on the platform.</p>
            </div>
            <Link href="/browse" className="btn-secondary text-sm">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentSeekers.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        </section>
      ) : (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-10 text-center border-brand-purple/30 bg-brand-purple/[0.04]">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-text mb-3">
              <span className="gradient-text">Be one of the first</span>
            </h2>
            <p className="text-brand-muted max-w-lg mx-auto mb-6">
              The first members here are numbered, and the badge stays on the profile permanently.
            </p>
            <Link href="/register" className="inline-block btn-primary px-8 py-3 text-lg font-bold">
              Register Now
            </Link>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-purple/[0.06]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-brand-text mb-4">
            Ready to hire{' '}
            <span className="gradient-text">top remote talent?</span>
          </h2>
          <p className="text-brand-muted text-lg mb-8 max-w-2xl mx-auto">
            Browse thousands of skilled freelancers. It&apos;s completely free for employers — no hidden fees, no subscriptions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse" className="btn-primary text-base px-8 py-3">
              Start Browsing Free
            </Link>
            <Link href="/register?role=seeker" className="btn-secondary text-base px-8 py-3">
              Post Your Profile
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
