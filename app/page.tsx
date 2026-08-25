import type { Metadata } from 'next'

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  // The page speaks to remote workers now, so the title has to as well —
  // otherwise search sends employers to the page written for someone else,
  // and /hire, which was written for them, never gets found.
  title: 'Virtual Freaks — Get hired as a VA or remote professional',
  description: 'No commission on your rate, no fee to apply, and no charge to message anyone. A free profile that shows work you have actually finished, and businesses that contact you directly. Hiring instead? See virtualfreaks.co/hire.',
  keywords: ['virtual assistant jobs', 'remote work philippines', 'VA portfolio', 'get hired as a VA', 'remote jobs', 'GoHighLevel practice', 'freelancer profile', 'hire remote talent'],
  alternates: {
    canonical: 'https://virtualfreaks.co',
  },
  // The homepage overrides the site-wide card copy so the words Facebook prints
  // under the image agree with the image. The generic pair — "The Marketplace
  // for Remote Talent" over "Connect with top remote talent worldwide" — pitched
  // employers beneath a picture aimed at somebody looking for work, and promised
  // browsing that needs an account. Every other page keeps the generic version.
  openGraph: {
    title: 'Nobody should have to pay to get hired.',
    description:
      'No commission on your rate. No fee to apply. No charge to message anyone. Free for freelancers, free for businesses, and it stays that way.',
    url: 'https://virtualfreaks.co',
    siteName: 'Virtual Freaks',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nobody should have to pay to get hired.',
    description:
      'No commission on your rate. No fee to apply. Free for freelancers and businesses alike.',
  },
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { HeroSection } from '@/components/home/HeroSection'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { NoTollSection } from '@/components/home/NoTollSection'
import { ForBusinesses } from '@/components/home/ForBusinesses'
import { Testimonials } from '@/components/home/Testimonials'
import { db } from '@/lib/db'
import { excludeDemoAccounts, publiclyListable } from '@/lib/constants'
import Link from 'next/link'
import Image from 'next/image'

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

  let recentSeekers: Awaited<ReturnType<typeof getRecentSeekers>> = []
  let topTalent: Awaited<ReturnType<typeof getTopTalent>> = []

  try {
    ;[recentSeekers, topTalent] = await Promise.all([
      getRecentSeekers(),
      getTopTalent(),
    ])
  } catch (error) {
    console.error('Homepage DB query failed:', error)
    // Page renders with empty arrays — shows inviting empty states instead of crashing
  }

  return (
    <div className="page-ink">
      <HeroSection />

      {/* The position, not a feature — and the page's only dark section, which
          is what stops nine identical panels reading as a list. */}
      <NoTollSection />

      {/* How It Works — three ruled rows, not three centred cards. The
          numerals stay because the steps genuinely are a sequence; the boxes
          go because they were not doing any work. */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="grid lg:grid-cols-[minmax(0,26rem)_1fr] gap-12 lg:gap-20">
          <div>
            <h2 className="display-sm text-3xl sm:text-4xl">How it works</h2>
            <p className="quiet mt-5 leading-relaxed">
              Three steps, and none of them cost anything.
            </p>
            <p className="quieter text-sm mt-6 leading-relaxed">
              Step two goes faster with somewhere to actually work.{' '}
              <Link href="/sandbox" className="text-white/70 hover:text-white border-b border-white/25 hover:border-white pb-0.5 transition-colors">
                Practice on real systems
              </Link>{' '}
              &mdash; GoHighLevel is open now.
            </p>
          </div>
          <div>
            {howItWorks.map(step => (
              <div key={step.step} className="ink-row py-7 grid grid-cols-[2.5rem_1fr] gap-5 sm:gap-8">
                <span className="quieter font-mono text-xs pt-1.5">{step.step}</span>
                <div>
                  <h3 className="display-sm text-xl sm:text-2xl mb-2">{step.title}</h3>
                  <p className="quiet text-[15px] leading-relaxed max-w-[52ch]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CategoryGrid />

      {/* Renders nothing until somebody has actually vouched. */}
      <Testimonials />

      {/* Employers had one button in the hero and nothing else on a two-sided
          marketplace whose thinner side is demand. */}
      <ForBusinesses />

      {/* Top Talent This Week — only show with 3+ entries so it doesn't look sparse */}
      {topTalent.length >= 3 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div>
            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
              <div>
                <h2 className="display-sm text-3xl sm:text-4xl">Top talent this week</h2>
                <p className="quiet mt-3 text-sm sm:text-base">Most viewed profiles in the last seven days.</p>
              </div>
              <Link href="/leaderboard" className="btn-outline text-sm">
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
                    <div className="rounded-xl border border-white/12 bg-white/[0.03] hover:border-brand-pink/45 p-4 text-center group cursor-pointer h-full flex flex-col transition-colors">
                      <div className={`font-mono text-sm mb-2 tabular-nums ${isPodium ? 'text-brand-pink font-semibold' : 'quieter'}`}>
                        #{entry.rank}
                      </div>
                      {entry.avatarUrl ? (
                        <div className="w-14 h-14 rounded-full overflow-hidden mx-auto mb-2 ring-2 ring-white/20">
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
                        <p className="text-sm font-semibold text-white group-hover:text-brand-pink transition-colors truncate">
                          {entry.name || entry.username}
                        </p>
                        {entry.premium && <span className="text-brand-pink text-xs font-semibold">PRO</span>}
                      </div>
                      {/* Always rendered. Two of five profiles have no top skill,
                          and letting the line vanish made those cards shorter
                          than the rest of the row. */}
                      <p className="text-xs quieter truncate mb-1 min-h-[1rem]">
                        {entry.topSkill ?? '\u00A0'}
                      </p>
                      <p className="text-xs quieter mt-auto">
                        <span className="font-semibold text-white">{entry.profileViews}</span> views
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Recently joined.
          This was two sections — Featured Talent and Recently Joined — each
          with a full-card grid and each with an "early adopter" empty state
          that said the same thing as the closing call below. Three "here are
          people" blocks in a row, two of them usually empty. One ruled list
          does the only job they had: showing the place is alive. */}
      {recentSeekers.length >= 2 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-9">
            <div>
              <h2 className="display-sm text-3xl sm:text-4xl">Recently joined</h2>
              <p className="quiet mt-3 text-sm sm:text-base">The newest profiles on the platform.</p>
            </div>
            <Link href="/browse" className="btn-outline text-sm">View all</Link>
          </div>
          <div className="border-t border-white/10">
            {recentSeekers.map((profile) => (
              <Link
                key={profile.id}
                href={`/@${profile.username}`}
                className="group flex items-center gap-4 py-4 border-b border-white/10 transition-colors hover:bg-white/[0.035] px-1"
              >
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover flex-none"
                  />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-white/10 flex-none" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white truncate group-hover:text-brand-pink transition-colors">
                    {profile.user.name ?? profile.username}
                  </p>
                  <p className="quieter text-sm truncate">
                    {profile.title ?? profile.skills[0]?.skill.name ?? 'Building their profile'}
                  </p>
                </div>
                <span className="quieter font-mono text-xs hidden sm:block flex-none">
                  {profile.skills.slice(0, 2).map(s => s.skill.name).join(' · ')}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        {/* A single warm bloom, so the closing band is not a flat rectangle. */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(162,28,175,0.28), rgba(249,115,22,0.10) 50%, transparent 72%)' }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="display-sm text-4xl sm:text-6xl mb-6">
            Put your work{' '}
            <span className="bg-gradient-to-r from-brand-pink to-brand-orange bg-clip-text text-transparent">
              where people can see it
            </span>
          </h2>
          <p className="quiet text-lg mb-9 max-w-2xl mx-auto">
            A profile takes a few minutes and costs nothing — now or ever. No commission on what you
            earn, no fee to message anyone, and businesses contact you directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=seeker&redirect=/profile/edit" className="btn-grad text-base">
              Make a free profile
            </Link>
            <Link href="/hire" className="btn-outline text-base">
              I&apos;m hiring instead
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
