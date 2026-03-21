import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { FREE_ACTIVE_JOB_POSTS } from '@/lib/stripe'
import { logActivity } from '@/lib/activity'
import { isMonetizationEnabled } from '@/lib/monetization'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }
    if (user.role !== 'employer' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only employers can post needs' }, { status: 403 })
    }

    // Check job post limit for free employers (skip if monetization is off)
    const monetizationOn = await isMonetizationEnabled()
    if (monetizationOn && user.role === 'employer') {
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { premium: true },
      })

      if (!dbUser?.premium) {
        const activeJobPosts = await db.jobNeed.count({
          where: {
            employerId: user.id,
            status: 'active',
          },
        })

        if (activeJobPosts >= FREE_ACTIVE_JOB_POSTS) {
          return NextResponse.json({
            error: 'job_post_limit_reached',
            message: `You've reached your free limit of ${FREE_ACTIVE_JOB_POSTS} active job posts. Upgrade to Verified Partner for unlimited posts.`,
            activeJobPosts,
            limit: FREE_ACTIVE_JOB_POSTS,
          }, { status: 403 })
        }
      }
    }

    const body = await req.json()
    const { title, description, category, skills, minRate, maxRate, availability } = body

    if (!title || !description || !category) {
      return NextResponse.json({ error: 'Title, description, and category are required' }, { status: 400 })
    }

    const need = await db.jobNeed.create({
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

    // Log activity event
    await logActivity('job_posted', user.id, { title: need.title })

    return NextResponse.json({ need }, { status: 201 })
  } catch (error) {
    console.error('Post need error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const needs = await db.jobNeed.findMany({
      where: { status: 'active' },
      include: {
        employer: { select: { id: true, name: true } },
        _count: { select: { interests: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ needs })
  } catch (error) {
    console.error('Get needs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
