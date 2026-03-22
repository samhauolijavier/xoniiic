import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const CATEGORIES = ['Development', 'Design', 'Virtual Assistant', 'Writing', 'Marketing', 'Other']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const period = searchParams.get('period') || 'week'

  const daysBack = period === 'month' ? 30 : 7
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)

  try {
    // Try to get view counts from ProfileView records in the period
    const profileViewCounts = await db.profileView.groupBy({
      by: ['seekerProfileId'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 50,
    })

    const useSparseData = profileViewCounts.length < 3

    let profiles
    if (useSparseData) {
      // Fall back to using profileViews integer counter
      const whereClause: Record<string, unknown> = {
        user: { active: true },
      }
      if (category && category !== 'All') {
        whereClause.skills = { some: { skill: { category } } }
      }
      profiles = await db.seekerProfile.findMany({
        where: whereClause,
        orderBy: { profileViews: 'desc' },
        take: 10,
        include: {
          user: { select: { id: true, name: true, premium: true } },
          skills: { include: { skill: true }, orderBy: { rating: 'desc' }, take: 1 },
        },
      })
    } else {
      // Use ProfileView data
      const seekerProfileIds = profileViewCounts.map((v) => v.seekerProfileId)
      const viewCountMap = new Map(
        profileViewCounts.map((v) => [v.seekerProfileId, v._count.id])
      )

      const whereClause: Record<string, unknown> = {
        id: { in: seekerProfileIds },
        user: { active: true },
      }
      if (category && category !== 'All') {
        whereClause.skills = { some: { skill: { category } } }
      }

      profiles = await db.seekerProfile.findMany({
        where: whereClause,
        take: 10,
        include: {
          user: { select: { id: true, name: true, premium: true } },
          skills: { include: { skill: true }, orderBy: { rating: 'desc' }, take: 1 },
        },
      })

      // Sort by view count from ProfileView data
      profiles.sort((a, b) => (viewCountMap.get(b.id) || 0) - (viewCountMap.get(a.id) || 0))
    }

    const result = profiles.slice(0, 10).map((profile, index) => {
      const viewCountEntry = profileViewCounts.find((v) => v.seekerProfileId === profile.id)
      const thisWeekViews = useSparseData
        ? profile.profileViews
        : (viewCountEntry?._count.id || 0)

      const topSkill = profile.skills[0]?.skill.name || null

      return {
        rank: index + 1,
        id: profile.id,
        username: profile.username,
        name: profile.user.name,
        avatarUrl: profile.avatarUrl,
        title: profile.title,
        profileViews: thisWeekViews,
        topSkill,
        hourlyRate: profile.hourlyRate,
        availability: profile.availability,
        premium: profile.user.premium,
        englishRating: profile.englishRating,
      }
    })

    return NextResponse.json({
      leaderboard: result,
      categories: CATEGORIES,
      period,
      category: category || 'All',
      sparse: useSparseData,
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
