import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Realistic 2026 remote work market trending skills
const SEED_SKILLS = [
  { skillName: 'AI Prompt Engineering', changePercent: 67, trending: 'up' as const },
  { skillName: 'Short-Form Video Editing', changePercent: 42, trending: 'up' as const },
  { skillName: 'Virtual Assistance', changePercent: 31, trending: 'up' as const },
  { skillName: 'Social Media Management', changePercent: 26, trending: 'up' as const },
  { skillName: 'SEO & Digital Marketing', changePercent: 19, trending: 'up' as const },
  { skillName: 'No-Code Development', changePercent: 38, trending: 'up' as const },
  { skillName: 'Bookkeeping & Accounting', changePercent: 14, trending: 'up' as const },
  { skillName: 'Data Entry', changePercent: -8, trending: 'down' as const },
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
