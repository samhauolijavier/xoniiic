import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, withRetry } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await withRetry(() =>
      db.jobNeed.findUnique({
        where: { id: params.id },
        include: {
          employer: {
            select: {
              id: true,
              name: true,
              employerProfile: {
                select: {
                  companyName: true,
                  logoUrl: true,
                  website: true,
                  description: true,
                  verified: true,
                  verificationTier: true,
                  location: true,
                  industry: true,
                  companySize: true,
                },
              },
            },
          },
          _count: { select: { interests: true } },
        },
      })
    )

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('GET /api/jobs/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }

    const existingJob = await withRetry(() =>
      db.jobNeed.findUnique({ where: { id: params.id } })
    )

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (existingJob.employerId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to edit this job' }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, category, skills, minRate, maxRate, availability, status } = body

    const job = await withRetry(() =>
      db.jobNeed.update({
        where: { id: params.id },
        data: {
          ...(title !== undefined && { title: title.trim() }),
          ...(description !== undefined && { description: description.trim() }),
          ...(category !== undefined && { category }),
          ...(skills !== undefined && { skills }),
          ...(minRate !== undefined && { minRate: minRate ? parseFloat(minRate) : null }),
          ...(maxRate !== undefined && { maxRate: maxRate ? parseFloat(maxRate) : null }),
          ...(availability !== undefined && { availability }),
          ...(status !== undefined && { status }),
        },
      })
    )

    return NextResponse.json({ job })
  } catch (error) {
    console.error('PATCH /api/jobs/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }

    const existingJob = await withRetry(() =>
      db.jobNeed.findUnique({ where: { id: params.id } })
    )

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (existingJob.employerId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to delete this job' }, { status: 403 })
    }

    await withRetry(() => db.jobNeed.delete({ where: { id: params.id } }))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/jobs/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
