import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const SEED_SKILLS = [
  { skillName: 'React', changePercent: 34, trending: 'up' as const },
  { skillName: 'Figma', changePercent: 22, trending: 'up' as const },
  { skillName: 'Python', changePercent: 18, trending: 'up' as const },
  { skillName: 'Node.js', changePercent: 12, trending: 'up' as const },
  { skillName: 'TypeScript', changePercent: 8, trending: 'up' as const },
  { skillName: 'WordPress', changePercent: -5, trending: 'down' as const },
  { skillName: 'Copywriting', changePercent: 15, trending: 'up' as const },
  { skillName: 'Video Editing', changePercent: 28, trending: 'up' as const },
]

export async function GET() {
  try {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const [thisWeekSearches, lastWeekSearches, totalCount] = await Promise.all([
      db.skillSearch.groupBy({
        by: ['skillName'],
        where: { createdAt: { gte: oneWeekAgo } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 8,
      }),
      db.skillSearch.groupBy({
        by: ['skillName'],
        where: { createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } },
        _count: { id: true },
      }),
      db.skillSearch.count(),
    ])

    if (totalCount < 5) {
      return NextResponse.json({ skills: SEED_SKILLS, seeded: true })
    }

    const lastWeekMap = new Map(lastWeekSearches.map((s) => [s.skillName, s._count.id]))

    const skills = thisWeekSearches.map((entry) => {
      const thisWeek = entry._count.id
      const lastWeek = lastWeekMap.get(entry.skillName) || 0
      const changePercent = Math.round(((thisWeek - lastWeek) / Math.max(lastWeek, 1)) * 100)
      const trending: 'up' | 'down' | 'new' =
        lastWeek === 0 ? 'new' : changePercent >= 0 ? 'up' : 'down'

      return {
        skillName: entry.skillName,
        thisWeekCount: thisWeek,
        lastWeekCount: lastWeek,
        changePercent,
        trending,
      }
    })

    return NextResponse.json({ skills, seeded: false })
  } catch (error) {
    console.error('Trending skills error:', error)
    return NextResponse.json({ skills: SEED_SKILLS, seeded: true })
  }
}
