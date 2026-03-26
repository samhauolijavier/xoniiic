import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, withRetry } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// POST — Submit a review for a hire
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = session.user as { id: string; name?: string }

    const hire = await withRetry(() => db.hire.findUnique({
      where: { id: params.id },
      include: {
        employer: { select: { id: true, name: true } },
        seeker: { select: { id: true, name: true } },
        reviews: { select: { reviewerId: true } },
      },
    }))

    if (!hire) return NextResponse.json({ error: 'Hire not found' }, { status: 404 })

    // Must be a participant
    const isEmployer = hire.employerId === user.id
    const isSeeker = hire.seekerId === user.id
    if (!isEmployer && !isSeeker) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Must be completed
    if (hire.status !== 'completed') {
      return NextResponse.json({ error: 'Can only review completed hires' }, { status: 400 })
    }

    // Check if already reviewed
    const alreadyReviewed = hire.reviews.some(r => r.reviewerId === user.id)
    if (alreadyReviewed) {
      return NextResponse.json({ error: 'You have already reviewed this hire' }, { status: 400 })
    }

    const { rating, comment } = await req.json()
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const type = isEmployer ? 'employer_to_seeker' : 'seeker_to_employer'

    const review = await withRetry(() => db.hireReview.create({
      data: {
        hireId: params.id,
        reviewerId: user.id,
        rating: parseInt(rating),
        comment: comment?.trim() || null,
        type,
      },
    }))

    // Notify the other person
    const otherUserId = isEmployer ? hire.seekerId : hire.employerId
    const otherName = isEmployer ? hire.seeker.name : hire.employer.name
    await createNotification({
      userId: otherUserId,
      type: 'review_received',
      title: 'New Review Received ⭐',
      message: `${user.name || 'Someone'} left you a ${rating}-star review for "${hire.title}"`,
      actionUrl: `/hires`,
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Review POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
