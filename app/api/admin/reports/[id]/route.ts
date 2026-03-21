import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const VALID_STATUSES = ['pending', 'reviewed', 'dismissed', 'actioned']

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { status } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 })
    }

    // Fetch the full report to determine who was reported
    const existingReport = await db.report.findUnique({
      where: { id: params.id },
      include: {
        seekerProfile: { select: { userId: true } },
        employerProfile: { select: { userId: true } },
        response: true,
      },
    })

    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const report = await db.report.update({
      where: { id: params.id },
      data: {
        status,
        reviewedAt: new Date(),
      },
    })

    // Determine the reported user's ID
    const reportedUserId =
      existingReport.seekerProfile?.userId ?? existingReport.employerProfile?.userId ?? null

    if (status === 'actioned' && reportedUserId) {
      // Notify the accused so they can submit a defense response
      await db.notification.create({
        data: {
          userId: reportedUserId,
          type: 'report_filed',
          title: 'A report has been filed against your profile',
          message:
            'A report has been submitted against your profile and is under review by our team. You have the right to respond and provide your side of the situation.',
          actionUrl: '/notifications',
          relatedId: params.id,
        },
      })
    }

    if (status === 'dismissed' && reportedUserId) {
      // If the report was previously actioned (notification sent), send a follow-up resolution notice
      const previousNotification = await db.notification.findFirst({
        where: {
          userId: reportedUserId,
          type: 'report_filed',
          relatedId: params.id,
        },
      })

      if (previousNotification) {
        await db.notification.create({
          data: {
            userId: reportedUserId,
            type: 'report_resolved',
            title: 'Report resolved in your favor',
            message:
              'A report filed against your profile has been reviewed and dismissed. No action will be taken on your profile.',
            actionUrl: '/notifications',
            relatedId: params.id,
          },
        })
      }
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Report PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
