import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as { id: string; role: string }
  if (user.role !== 'seeker') {
    return NextResponse.json({ error: 'Seekers only' }, { status: 403 })
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      premium: true,
      seekerProfile: {
        select: {
          id: true,
          profileViews: true,
          skills: { include: { skill: true }, orderBy: { rating: 'desc' }, take: 5 },
          reviewsReceived: { select: { rating: true } },
        },
      },
    },
  })

  if (!dbUser?.seekerProfile) {
    return NextResponse.json({ error: 'No seeker profile found' }, { status: 404 })
  }

  const profileId = dbUser.seekerProfile.id
  const isPremium = dbUser.premium

  const reviews = dbUser.seekerProfile.reviewsReceived
  const totalReviews = reviews.length
  const averageRating =
    totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0

  const topSkills = dbUser.seekerProfile.skills.map((s) => ({
    name: s.skill.name,
    rating: s.rating,
  }))

  const totalViews = dbUser.seekerProfile.profileViews

  if (!isPremium) {
    return NextResponse.json({
      isPremium: false,
      totalViews,
      topSkills,
    })
  }

  // Premium: fetch detailed analytics
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [views30, savesCount, contactCount] = await Promise.all([
    db.profileView.findMany({
      where: {
        seekerProfileId: profileId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.savedProfile.count({ where: { profileId } }),
    db.contactRequest.count({ where: { receiverId: profileId } }),
  ])

  // Build views per day map for last 30 days
  const dayMap: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - (29 - i))
    const key = d.toISOString().slice(0, 10)
    dayMap[key] = 0
  }
  for (const v of views30) {
    const key = v.createdAt.toISOString().slice(0, 10)
    if (key in dayMap) dayMap[key]++
  }

  const viewsPerDay = Object.entries(dayMap).map(([date, count]) => ({ date, count }))

  return NextResponse.json({
    isPremium: true,
    totalViews,
    savesCount,
    contactCount,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    topSkills,
    viewsPerDay,
  })
}
