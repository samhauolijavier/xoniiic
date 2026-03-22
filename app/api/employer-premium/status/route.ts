import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { FREE_CONTACTS_PER_MONTH, FREE_ACTIVE_JOB_POSTS } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as { id: string; role: string }
  if (user.role !== 'employer') {
    return NextResponse.json({ error: 'Not an employer' }, { status: 403 })
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { premium: true, premiumUntil: true },
  })

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Count contacts sent this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const contactsThisMonth = await db.contactRequest.count({
    where: {
      senderId: user.id,
      createdAt: { gte: startOfMonth },
    },
  })

  // Count active job posts
  const activeJobPosts = await db.jobNeed.count({
    where: {
      employerId: user.id,
      status: 'active',
    },
  })

  const isPartner = dbUser.premium === true

  return NextResponse.json({
    isPartner,
    premiumUntil: dbUser.premiumUntil?.toISOString() ?? null,
    contactsThisMonth,
    contactLimit: isPartner ? null : FREE_CONTACTS_PER_MONTH,
    contactsRemaining: isPartner ? null : Math.max(0, FREE_CONTACTS_PER_MONTH - contactsThisMonth),
    activeJobPosts,
    jobPostLimit: isPartner ? null : FREE_ACTIVE_JOB_POSTS,
    jobPostsRemaining: isPartner ? null : Math.max(0, FREE_ACTIVE_JOB_POSTS - activeJobPosts),
  })
}
