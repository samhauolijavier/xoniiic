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
    select: { premium: true, seekerProfile: { select: { id: true } } },
  })

  if (!dbUser?.seekerProfile) {
    return NextResponse.json({ error: 'No seeker profile found' }, { status: 404 })
  }

  const profileId = dbUser.seekerProfile.id
  const isPremium = dbUser.premium

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [allViews, weekViews] = await Promise.all([
    db.profileView.findMany({
      where: {
        seekerProfileId: profileId,
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        viewerUser: {
          select: {
            id: true,
            name: true,
            email: true,
            employerProfile: {
              select: { companyName: true, verified: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.profileView.count({
      where: {
        seekerProfileId: profileId,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
  ])

  // Deduplicate by viewerUserId, keep latest per viewer
  const seenViewers = new Set<string>()
  const uniqueViews = allViews.filter((v) => {
    if (seenViewers.has(v.viewerUserId)) return false
    seenViewers.add(v.viewerUserId)
    return true
  })

  const viewers = isPremium
    ? uniqueViews.map((v) => ({
        userId: v.viewerUserId,
        name: v.viewerUser.name || v.viewerUser.email,
        companyName: v.viewerUser.employerProfile?.companyName ?? null,
        verified: v.viewerUser.employerProfile?.verified ?? false,
        viewedAt: v.createdAt.toISOString(),
      }))
    : []

  return NextResponse.json({
    count: uniqueViews.length,
    weekCount: weekViews,
    viewers,
    isPremium,
  })
}
