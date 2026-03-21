import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Find by username or id
    const profile = await db.seekerProfile.findFirst({
      where: {
        OR: [
          { id },
          { username: id },
        ],
        user: { active: true },
      },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        skills: {
          include: { skill: true },
          orderBy: { rating: 'desc' },
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Increment view count
    await db.seekerProfile.update({
      where: { id: profile.id },
      data: { profileViews: { increment: 1 } },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Seeker GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
