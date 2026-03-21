import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }

    const body = await req.json().catch(() => ({}))
    const { message } = body

    // Check if need exists
    const need = await db.jobNeed.findUnique({ where: { id: params.id } })
    if (!need) {
      return NextResponse.json({ error: 'Need not found' }, { status: 404 })
    }

    if (need.status !== 'active') {
      return NextResponse.json({ error: 'This need is no longer active' }, { status: 400 })
    }

    // Prevent employer from expressing interest in their own need
    if (need.employerId === user.id) {
      return NextResponse.json({ error: 'Cannot express interest in your own post' }, { status: 400 })
    }

    // Upsert interest record
    const interest = await db.needInterest.upsert({
      where: { needId_seekerId: { needId: params.id, seekerId: user.id } },
      update: { message: message || null },
      create: {
        needId: params.id,
        seekerId: user.id,
        message: message || null,
      },
    })

    // Notify the employer about the interest
    const seeker = await db.user.findUnique({
      where: { id: user.id },
      select: { name: true, seekerProfile: { select: { username: true } } },
    })
    const seekerName = seeker?.name || 'A seeker'

    await createNotification({
      userId: need.employerId,
      type: 'job_interest',
      title: 'New Interest in Your Post',
      message: `${seekerName} expressed interest in "${need.title}"`,
      actionUrl: '/employer-dashboard',
    })

    return NextResponse.json({ interest }, { status: 201 })
  } catch (error) {
    console.error('Interest error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
