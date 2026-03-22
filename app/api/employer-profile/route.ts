import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { premium: true },
    })

    const profile = await db.employerProfile.findUnique({
      where: { userId: user.id },
    })

    return NextResponse.json({ profile, isPartner: dbUser?.premium ?? false })
  } catch (error) {
    console.error('EmployerProfile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }
    const body = await req.json()

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { premium: true },
    })
    const isPartner = dbUser?.premium ?? false

    // Free tier fields
    const { companyName, website, linkedIn, description } = body

    // Partner-only fields
    const partnerFields = isPartner
      ? {
          industry: body.industry || null,
          companySize: body.companySize || null,
          location: body.location || null,
          foundedYear: body.foundedYear ? parseInt(body.foundedYear) : null,
          techStack: body.techStack || null,
          benefits: body.benefits || null,
          cultureStatement: body.cultureStatement || null,
          videoIntroUrl: body.videoIntroUrl || null,
        }
      : {}

    const profile = await db.employerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        companyName: companyName || null,
        website: website || null,
        linkedIn: linkedIn || null,
        description: description || null,
        newEmployer: true,
        ...partnerFields,
      },
      update: {
        companyName: companyName || null,
        website: website || null,
        linkedIn: linkedIn || null,
        description: description || null,
        ...partnerFields,
      },
    })

    // Throttle: only log profile_updated if no such event from this user in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentUpdate = await db.activityEvent.findFirst({
      where: {
        type: 'profile_updated',
        actorId: user.id,
        createdAt: { gte: oneHourAgo },
      },
    })
    if (!recentUpdate) {
      await logActivity('profile_updated', user.id)
    }

    return NextResponse.json({ profile, isPartner })
  } catch (error) {
    console.error('EmployerProfile PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
