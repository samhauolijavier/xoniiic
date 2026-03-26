import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, withRetry } from '@/lib/db'

export const dynamic = 'force-dynamic'

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
    if (user.role !== 'seeker' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only seekers can apply to jobs' }, { status: 403 })
    }

    // Check that the job exists and is active
    const job = await withRetry(() =>
      db.jobNeed.findUnique({ where: { id: params.id } })
    )

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status !== 'active') {
      return NextResponse.json({ error: 'This job is no longer accepting applications' }, { status: 400 })
    }

    // Prevent employers from applying to their own jobs
    if (job.employerId === user.id) {
      return NextResponse.json({ error: 'You cannot apply to your own job' }, { status: 400 })
    }

    // Check for duplicate application
    const existingInterest = await withRetry(() =>
      db.needInterest.findUnique({
        where: { needId_seekerId: { needId: params.id, seekerId: user.id } },
      })
    )

    if (existingInterest) {
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 409 })
    }

    const body = await req.json().catch(() => ({}))
    const { message } = body as { message?: string }

    const interest = await withRetry(() =>
      db.needInterest.create({
        data: {
          needId: params.id,
          seekerId: user.id,
          message: message?.trim() || null,
        },
      })
    )

    // Create notification for the employer
    try {
      await withRetry(() =>
        db.notification.create({
          data: {
            userId: job.employerId,
            type: 'job_application',
            title: 'New Job Application',
            message: `Someone applied to your job posting "${job.title}"`,
            actionUrl: `/employer-dashboard/jobs`,
            relatedId: job.id,
          },
        })
      )
    } catch {
      // Non-critical: don't fail the application if notification fails
    }

    return NextResponse.json({ interest }, { status: 201 })
  } catch (error) {
    console.error('POST /api/jobs/[id]/apply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
