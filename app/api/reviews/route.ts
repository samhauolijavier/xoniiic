import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }
    const body = await req.json()
    const { type, rating, comment, seekerProfileId, employerProfileId } = body

    if (!type || !rating) {
      return NextResponse.json({ error: 'type and rating are required' }, { status: 400 })
    }

    if (!['employer_to_seeker', 'seeker_to_employer'].includes(type)) {
      return NextResponse.json({ error: 'Invalid review type' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    if (comment && comment.length > 500) {
      return NextResponse.json({ error: 'Comment must be 500 characters or fewer' }, { status: 400 })
    }

    if (!seekerProfileId && !employerProfileId) {
      return NextResponse.json({ error: 'seekerProfileId or employerProfileId is required' }, { status: 400 })
    }

    // Check for duplicate review
    if (seekerProfileId) {
      const existing = await db.review.findUnique({
        where: { reviewerUserId_seekerProfileId: { reviewerUserId: user.id, seekerProfileId } },
      })
      if (existing) {
        return NextResponse.json({ error: 'You have already reviewed this freelancer' }, { status: 409 })
      }
    }

    if (employerProfileId) {
      const existing = await db.review.findUnique({
        where: { reviewerUserId_employerProfileId: { reviewerUserId: user.id, employerProfileId } },
      })
      if (existing) {
        return NextResponse.json({ error: 'You have already reviewed this employer' }, { status: 409 })
      }
    }

    const review = await db.review.create({
      data: {
        reviewerUserId: user.id,
        type,
        rating,
        comment: comment || null,
        seekerProfileId: seekerProfileId || null,
        employerProfileId: employerProfileId || null,
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Review POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const seekerProfileId = searchParams.get('seekerProfileId')
    const employerProfileId = searchParams.get('employerProfileId')

    if (!seekerProfileId && !employerProfileId) {
      return NextResponse.json({ error: 'seekerProfileId or employerProfileId query param required' }, { status: 400 })
    }

    const where = seekerProfileId ? { seekerProfileId } : { employerProfileId: employerProfileId! }

    const reviews = await db.review.findMany({
      where,
      include: {
        reviewerUser: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalCount = reviews.length
    const averageRating = totalCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
      : 0

    return NextResponse.json({ reviews, totalCount, averageRating })
  } catch (error) {
    console.error('Review GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
