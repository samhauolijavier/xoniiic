export const dynamic = "force-dynamic"
import { db } from '@/lib/db'
import { excludeDemoAccounts } from '@/lib/constants'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { FoundingMemberBadge } from '@/components/ui/FoundingMemberBadge'

const CATEGORIES = ['All', 'Development', 'Design', 'Virtual Assistant', 'Writing', 'Marketing']

const MEDALS = ['🥇', '🥈', '🥉']

async function getLeaderboard(category?: string) {
  const daysBack = 7
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)

  const profileViewCounts = await db.profileView.groupBy({
    by: ['seekerProfileId'],
    where: { createdAt: { gte: since } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 50,
  })

  const useSparseData = profileViewCounts.length < 3

  const whereClause: Record<string, unknown> = {
    user: { active: true, ...excludeDemoAccounts() },
  }
  if (category && category !== 'All') {
    whereClause.skills = { some: { skill: { category } } }
  }

  let profiles
  if (useSparseData) {
    profiles = await db.seekerProfile.findMany({
      where: whereClause,
      orderBy: { profileViews: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, name: true, premium: true, foundingMemberNumber: true } },
        skills: { include: { skill: true }, orderBy: { rating: 'desc' }, take: 1 },
      },
    })
  } else {
    const seekerProfileIds = profileViewCounts.map((v) => v.seekerProfileId)
    profiles = await db.seekerProfile.findMany({
      where: { ...whereClause, id: { in: seekerProfileIds } },
      take: 10,
      include: {
        user: { select: { id: true, name: true, premium: true, foundingMemberNumber: true } },
        skills: { include: { skill: true }, orderBy: { rating: 'desc' }, take: 1 },
      },
    })
    const viewCountMap = new Map(profileViewCounts.map((v) => [v.seekerProfileId, v._count.id]))
    profiles.sort((a, b) => (viewCountMap.get(b.id) || 0) - (viewCountMap.get(a.id) || 0))
  }

  return profiles.slice(0, 10).map((profile, index) => {
    const viewEntry = profileViewCounts.find((v) => v.seekerProfileId === profile.id)
    return {
      rank: index + 1,
      id: profile.id,
      username: profile.username,
      name: profile.user.name,
      avatarUrl: profile.avatarUrl,
      title: profile.title,
      profileViews: useSparseData ? profile.profileViews : (viewEntry?._count.id || 0),
      topSkill: profile.skills[0]?.skill.name || null,
      hourlyRate: profile.hourlyRate,
      availability: profile.availability,
      premium: profile.user.premium,
      foundingMemberNumber: profile.user.foundingMemberNumber,
      englishRating: profile.englishRating,
    }
  })
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const activeCategory = searchParams.category || 'All'
  const leaderboard = await getLeaderboard(activeCategory)

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3">
          <span className="gradient-text">Top Talent This Week</span>
        </h1>
        <p className="text-brand-muted text-lg">Updated every Monday. Compete to rank higher.</p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={cat === 'All' ? '/leaderboard' : `/leaderboard?category=${encodeURIComponent(cat)}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-brand-purple to-brand-orange text-white shadow-glow-purple'
                : 'bg-brand-card border border-brand-border text-brand-muted hover:border-brand-purple hover:text-brand-text'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {leaderboard.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-brand-text mb-2">No data yet</h3>
          <p className="text-brand-muted">Check back soon as talent builds up their profile views.</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              {top3.map((entry) => {
                const initials = entry.name
                  ? entry.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                  : entry.username[0].toUpperCase()

                const rankConfig = {
                  1: { border: 'border-amber-400/50', ring: 'ring-amber-400', bg: 'from-amber-400 to-yellow-300', label: '1st Place', color: 'text-amber-400' },
                  2: { border: 'border-slate-400/40', ring: 'ring-slate-400', bg: 'from-slate-400 to-slate-300', label: '2nd Place', color: 'text-slate-400' },
                  3: { border: 'border-amber-700/40', ring: 'ring-amber-700', bg: 'from-amber-700 to-amber-600', label: '3rd Place', color: 'text-amber-700' },
                }[entry.rank]!

                return (
                  <Link key={entry.id} href={`/talent/${entry.username}`}>
                    <div className={`relative card p-6 text-center group hover-glow cursor-pointer border ${rankConfig.border}`}>
                      {/* Rank label at top */}
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 bg-gradient-to-r ${rankConfig.bg} text-white`}>
                        <span>#{entry.rank}</span>
                        <span>{rankConfig.label}</span>
                      </div>

                      {/* Avatar */}
                      <div className="mb-4">
                        {entry.avatarUrl ? (
                          <div className={`w-16 h-16 rounded-full overflow-hidden mx-auto ring-2 ${rankConfig.ring}`}>
                            <Image
                              src={entry.avatarUrl}
                              alt={entry.name || entry.username}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${rankConfig.bg} flex items-center justify-center text-white font-black text-lg mx-auto`}>
                            {initials}
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex items-center justify-center gap-1.5 flex-wrap mb-1">
                        <h3 className="font-bold text-brand-text group-hover:gradient-text transition-all text-sm">
                          {entry.name || entry.username}
                        </h3>
                        {entry.premium && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950">★</span>
                        )}
                        {entry.foundingMemberNumber && (
                          <FoundingMemberBadge number={entry.foundingMemberNumber} size="sm" />
                        )}
                      </div>
                      {entry.title && (
                        <p className="text-xs text-brand-muted truncate mb-3">{entry.title}</p>
                      )}

                      {/* Top Skill */}
                      {entry.topSkill && (
                        <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-brand-purple/20 text-purple-300 border border-brand-purple/30 mb-3">
                          {entry.topSkill}
                        </span>
                      )}

                      {/* Views */}
                      <div className="text-sm text-brand-muted pt-3 border-t border-brand-border">
                        <span className="font-semibold text-brand-text">{entry.profileViews}</span>{' '}
                        views this week
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Ranks 4-10 */}
          {rest.length > 0 && (
            <div className="card divide-y divide-brand-border mb-8">
              {rest.map((entry) => {
                const initials = entry.name
                  ? entry.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                  : entry.username[0].toUpperCase()
                return (
                  <Link key={entry.id} href={`/talent/${entry.username}`}>
                    <div className="flex items-center gap-4 p-4 hover:bg-brand-border/30 transition-all cursor-pointer group">
                      {/* Rank */}
                      <div className="w-8 h-8 rounded-full bg-brand-border flex items-center justify-center text-sm font-bold text-brand-muted flex-shrink-0">
                        {entry.rank}
                      </div>

                      {/* Avatar */}
                      {entry.avatarUrl ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={entry.avatarUrl}
                            alt={entry.name || entry.username}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {initials}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-brand-text group-hover:gradient-text transition-all truncate">
                            {entry.name || entry.username}
                          </span>
                          {entry.premium && <span className="text-amber-400 text-xs">⭐</span>}
                          {entry.foundingMemberNumber && (
                            <FoundingMemberBadge number={entry.foundingMemberNumber} size="sm" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.title && (
                            <span className="text-xs text-brand-muted truncate">{entry.title}</span>
                          )}
                          {entry.topSkill && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-purple/10 text-purple-400 border border-brand-purple/20">
                              {entry.topSkill}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Views */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold text-brand-text">{entry.profileViews}</div>
                        <div className="text-xs text-brand-muted">views</div>
                      </div>

                      {/* Availability */}
                      <div className="hidden sm:block flex-shrink-0">
                        <Badge status={entry.availability} size="sm" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Tip */}
      <div className="card p-5 border-brand-purple/30 bg-brand-purple/5">
        <h3 className="font-semibold text-brand-text mb-2 flex items-center gap-2">
          <span>💡</span> How to rank higher
        </h3>
        <p className="text-sm text-brand-muted leading-relaxed">
          Complete your profile, update your availability, add your best skills, and upload a portfolio.
          More profile views from employers = higher rank.
          <Link href="/profile/edit" className="text-brand-purple hover:text-purple-300 ml-1 transition-colors">
            Edit your profile →
          </Link>
        </p>
      </div>
    </div>
  )
}
