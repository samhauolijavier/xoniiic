import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, withRetry } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// GET — Single hire with reviews
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = session.user as { id: string }

    const hire = await withRetry(() => db.hire.findUnique({
      where: { id: params.id },
      include: {
        employer: { select: { id: true, name: true, employerProfile: { select: { companyName: true, logoUrl: true } } } },
        seeker: { select: { id: true, name: true, seekerProfile: { select: { avatarUrl: true, username: true, title: true } } } },
        jobNeed: { select: { id: true, title: true } },
        reviews: { include: { reviewer: { select: { id: true, name: true } } } },
      },
    }))

    if (!hire) return NextResponse.json({ error: 'Hire not found' }, { status: 404 })
    if (hire.employerId !== user.id && hire.seekerId !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    return NextResponse.json({ hire })
  } catch (error) {
    console.error('Hire GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — Update hire status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = session.user as { id: string; name?: string }

    const hire = await withRetry(() => db.hire.findUnique({
      where: { id: params.id },
      include: { seeker: { select: { name: true } }, employer: { select: { name: true } } },
    }))

    if (!hire) return NextResponse.json({ error: 'Hire not found' }, { status: 404 })
    if (hire.employerId !== user.id) return NextResponse.json({ error: 'Only the employer can update' }, { status: 403 })

    const { status } = await req.json()
    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updated = await withRetry(() => db.hire.update({
      where: { id: params.id },
      data: {
        status,
        endDate: status === 'completed' || status === 'cancelled' ? new Date() : null,
      },
    }))

    // If completed, notify both sides to leave reviews
    if (status === 'completed') {
      await createNotification({
        userId: hire.seekerId,
        type: 'review_request',
        title: 'Leave a Review',
        message: `Your work on "${hire.title}" is complete! Please leave a review.`,
        actionUrl: `/hires/${hire.id}/review`,
      })
      await createNotification({
        userId: hire.employerId,
        type: 'review_request',
        title: 'Leave a Review',
        message: `"${hire.title}" is complete! Rate your experience with ${hire.seeker.name || 'the freelancer'}.`,
        actionUrl: `/hires/${hire.id}/review`,
      })
    }

    return NextResponse.json({ hire: updated })
  } catch (error) {
    console.error('Hire PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
