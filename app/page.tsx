export const dynamic = "force-dynamic"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { HeroSection } from '@/components/home/HeroSection'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { ProfileCard } from '@/components/seeker/ProfileCard'
import { TrendingSkills } from '@/components/ui/TrendingSkills'
import { db } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'

async function getFeaturedSeekers() {
  return db.seekerProfile.findMany({
    where: { featured: true, user: { active: true } },
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
    where: { user: { active: true } },
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
      where: { user: { active: true } },
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
    where: { id: { in: ids }, user: { active: true } },
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
    title: 'Browse Talent',
    description: 'Search through hundreds of skilled freelancers. Filter by category, skill, rate, and availability.',
    icon: '🔍',
  },
  {
    step: '02',
    title: 'Review Profiles',
    description: 'See detailed skill ratings, years of experience, English proficiency, and read their bio.',
    icon: '📋',
  },
  {
    step: '03',
    title: 'Contact Directly',
    description: 'Send a message directly to the talent. No platform fees — connect via email and start working.',
    icon: '💬',
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

  const [featuredSeekers, recentSeekers, topTalent] = await Promise.all([
    getFeaturedSeekers(),
    getRecentSeekers(),
    getTopTalent(),
  ])

  return (
    <div>
      <HeroSection />

      {/* Trending Skills */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TrendingSkills />
      </section>

      <CategoryGrid />

      {/* Top Talent This Week */}
      {topTalent.length > 0 && (
        <section className="py-12 bg-brand-card/20 border-y border-brand-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-brand-text">
                  <span className="gradient-text">Top Talent</span> This Week
                </h2>
                <p className="text-brand-muted mt-1 text-sm sm:text-base">Most viewed freelancers in the last 7 days</p>
              </div>
              <Link href="/leaderboard" className="btn-secondary text-sm">
                Full Leaderboard →
              </Link>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {topTalent.map((entry) => {
                const initials = entry.name
                  ? entry.name.split(' ').map((n) => n[0]).join('').toUpperCase()
                  : entry.username[0].toUpperCase()
                const medalMap: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
                return (
                  <Link key={entry.id} href={`/talent/${entry.username}`}>
                    <div className="card p-4 text-center group hover-glow cursor-pointer">
                      <div className="text-lg mb-2">{medalMap[entry.rank] || `#${entry.rank}`}</div>
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
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                          {initials}
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <p className="text-sm font-semibold text-brand-text group-hover:gradient-text transition-all truncate">
                          {entry.name || entry.username}
                        </p>
                        {entry.premium && <span className="text-amber-400 text-xs">⭐</span>}
                      </div>
                      {entry.topSkill && (
                        <p className="text-xs text-brand-muted truncate mb-1">{entry.topSkill}</p>
                      )}
                      <p className="text-xs text-brand-muted">
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

      {/* Featured Talent */}
      {featuredSeekers.length > 0 && (
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-2xl mx-auto mb-4 shadow-glow-purple">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-brand-purple mb-2 tracking-widest uppercase">
                  Step {step.step}
                </div>
                <h3 className="text-xl font-bold text-brand-text mb-3">{step.title}</h3>
                <p className="text-brand-muted text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Joined */}
      {recentSeekers.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-brand-text">
                Recently{' '}
                <span className="gradient-text">Joined</span>
              </h2>
              <p className="text-brand-muted mt-1 text-sm sm:text-base">Fresh talent on the platform</p>
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
      )}

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/10 via-brand-pink/10 to-brand-orange/10" />
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
