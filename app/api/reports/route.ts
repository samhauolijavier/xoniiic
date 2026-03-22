import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const VALID_REASONS = ['scam', 'spam', 'fake', 'inappropriate', 'unpaid', 'other']

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }
    const body = await req.json()
    const { reason, description, seekerProfileId, employerProfileId } = body

    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Valid reason is required' }, { status: 400 })
    }

    if (!seekerProfileId && !employerProfileId) {
      return NextResponse.json({ error: 'seekerProfileId or employerProfileId is required' }, { status: 400 })
    }

    // Rule 1: If reporting a seeker, reporter must be a verified employer
    if (seekerProfileId) {
      const employerProfile = await db.employerProfile.findUnique({
        where: { userId: user.id },
      })

      if (!employerProfile || employerProfile.verified !== true) {
        return NextResponse.json(
          {
            error: 'verified_required',
            message: 'Only verified employer partners can report freelancers.',
          },
          { status: 403 }
        )
      }
    }

    // If reporting an employer: anyone logged in can report — no verification required

    // Prevent duplicate reports from same reporter to same target
    const existingReport = await db.report.findFirst({
      where: {
        reporterUserId: user.id,
        ...(seekerProfileId ? { seekerProfileId } : {}),
        ...(employerProfileId ? { employerProfileId } : {}),
      },
    })

    if (existingReport) {
      return NextResponse.json({ error: 'You have already reported this profile' }, { status: 409 })
    }

    const report = await db.report.create({
      data: {
        reporterUserId: user.id,
        reason,
        description: description || null,
        seekerProfileId: seekerProfileId || null,
        employerProfileId: employerProfileId || null,
        status: 'pending',
      },
    })

    // Count total reports for this target and warn if 3+
    const reportCount = await db.report.count({
      where: seekerProfileId ? { seekerProfileId } : { employerProfileId: employerProfileId! },
    })

    if (reportCount >= 3) {
      console.warn(
        `[REPORTS] Target ${seekerProfileId ? `seekerProfile:${seekerProfileId}` : `employerProfile:${employerProfileId}`} has ${reportCount} reports. Consider reviewing.`
      )
    }

    return NextResponse.json({ success: true, message: 'Report submitted for review.', report })
  } catch (error) {
    console.error('Report POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
