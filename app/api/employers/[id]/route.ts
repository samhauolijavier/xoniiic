import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        employerProfile: {
          include: {
            reviewsReceived: {
              include: {
                reviewerUser: { select: { id: true, name: true, role: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    if (!user || !user.employerProfile) {
      return NextResponse.json({ error: 'Employer not found' }, { status: 404 })
    }

    const reviews = user.employerProfile.reviewsReceived
    const totalCount = reviews.length
    const averageRating = totalCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
      : 0

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
      employerProfile: user.employerProfile,
      reviews,
      totalCount,
      averageRating,
    })
  } catch (error) {
    console.error('Employer GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
