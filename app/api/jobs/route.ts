import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, withRetry } from '@/lib/db'
import { excludeDemoAccounts } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const skills = searchParams.get('skills')
    const search = searchParams.get('search')
    const minRate = searchParams.get('minRate')
    const maxRate = searchParams.get('maxRate')
    const mine = searchParams.get('mine')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 12
    const skip = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: 'active',
      employer: { ...excludeDemoAccounts() },
    }

    // If "mine" param is set, return only the current employer's jobs (all statuses)
    if (mine) {
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const user = session.user as { id: string; role: string }
      where.employerId = user.id
      delete where.status // Show all statuses for owner
      delete where.employer // No need to exclude demo for own jobs
    }

    if (category) {
      where.category = category
    }

    if (skills) {
      where.skills = { contains: skills }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { skills: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (minRate) {
      where.minRate = { ...(where.minRate || {}), gte: parseFloat(minRate) }
    }

    if (maxRate) {
      where.maxRate = { ...(where.maxRate || {}), lte: parseFloat(maxRate) }
    }

    const [jobs, total] = await withRetry(() =>
      Promise.all([
        db.jobNeed.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            employer: {
              select: {
                id: true,
                name: true,
                employerProfile: {
                  select: { companyName: true, logoUrl: true, verified: true, verificationTier: true },
                },
              },
            },
            _count: { select: { interests: true } },
          },
        }),
        db.jobNeed.count({ where }),
      ])
    )

    return NextResponse.json({
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/jobs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }
    if (user.role !== 'employer' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only employers can post jobs' }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, category, skills, minRate, maxRate, availability } = body

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      )
    }

    const job = await withRetry(() =>
      db.jobNeed.create({
        data: {
          employerId: user.id,
          title: title.trim(),
          description: description.trim(),
          category,
          skills: skills || '',
          minRate: minRate ? parseFloat(minRate) : null,
          maxRate: maxRate ? parseFloat(maxRate) : null,
          availability: availability || 'open',
          status: 'active',
        },
      })
    )

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('POST /api/jobs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
