import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, withRetry } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// GET — List hires for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = session.user as { id: string; role: string }

    const hires = await withRetry(() => db.hire.findMany({
      where: {
        OR: [
          { employerId: user.id },
          { seekerId: user.id },
        ],
      },
      include: {
        employer: { select: { id: true, name: true, email: true, employerProfile: { select: { companyName: true, logoUrl: true } } } },
        seeker: { select: { id: true, name: true, email: true, seekerProfile: { select: { avatarUrl: true, username: true, title: true } } } },
        jobNeed: { select: { id: true, title: true } },
        reviews: { select: { id: true, reviewerId: true, rating: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    }))

    return NextResponse.json({ hires })
  } catch (error) {
    console.error('Hires GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — Create a hire (employer only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = session.user as { id: string; role: string; name?: string }

    if (user.role !== 'employer' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only employers can create hires' }, { status: 403 })
    }

    const { seekerId, title, rateAgreed, rateType, jobNeedId, notes } = await req.json()

    if (!seekerId || !title) {
      return NextResponse.json({ error: 'seekerId and title are required' }, { status: 400 })
    }

    const hire = await withRetry(() => db.hire.create({
      data: {
        employerId: user.id,
        seekerId,
        title,
        rateAgreed: rateAgreed ? parseFloat(rateAgreed) : null,
        rateType: rateType || null,
        jobNeedId: jobNeedId || null,
        notes: notes || null,
      },
      include: {
        seeker: { select: { name: true } },
      },
    }))

    // Notify the seeker
    await createNotification({
      userId: seekerId,
      type: 'hire',
      title: 'You\'ve Been Hired! 🎉',
      message: `${user.name || 'An employer'} has hired you as ${title}`,
      actionUrl: '/hires',
    })

    return NextResponse.json({ hire })
  } catch (error) {
    console.error('Hires POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
