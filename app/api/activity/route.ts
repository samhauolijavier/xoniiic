import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

function formatEvent(event: {
  type: string
  metadata: string | null
  actor: { name: string | null; role: string; seekerProfile: { avatarUrl: string | null } | null; employerProfile: { companyName: string | null; logoUrl: string | null } | null } | null
}) {
  const meta = event.metadata ? JSON.parse(event.metadata) : {}
  const actorName = event.actor?.name || 'Someone'
  const companyName = event.actor?.employerProfile?.companyName || actorName

  const iconMap: Record<string, string> = {
    new_seeker: '\uD83D\uDC4B',
    new_employer: '\uD83C\uDFE2',
    job_posted: '\uD83D\uDCCB',
    badge_earned: '\uD83C\uDFC6',
    profile_updated: '\u270F\uFE0F',
    premium_upgrade: '\u2B50',
    partner_upgrade: '\uD83D\uDEE1\uFE0F',
    vf_verified: '\u2705',
  }

  const messageMap: Record<string, string> = {
    new_seeker: `${actorName} joined as a seeker`,
    new_employer: `${companyName} joined as an employer`,
    job_posted: `${companyName} posted a new job: ${meta.title || 'Untitled'}`,
    badge_earned: `${actorName} earned the ${meta.badge || ''} badge`,
    profile_updated: `${actorName} updated their profile`,
    premium_upgrade: `${actorName} upgraded to Premium`,
    partner_upgrade: `${companyName} became a Verified Partner`,
    vf_verified: `${companyName} earned VF Verified status`,
  }

  return {
    icon: iconMap[event.type] || '\uD83D\uDD14',
    message: messageMap[event.type] || `${actorName} did something`,
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const where = user.role === 'admin' ? {} : { isPublic: true }

    const [events, total] = await Promise.all([
      db.activityEvent.findMany({
        where,
        include: {
          actor: {
            select: {
              name: true,
              role: true,
              seekerProfile: { select: { avatarUrl: true } },
              employerProfile: { select: { companyName: true, logoUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.activityEvent.count({ where }),
    ])

    const formatted = events.map((event) => {
      const { icon, message } = formatEvent(event)
      return {
        id: event.id,
        type: event.type,
        icon,
        message,
        actorName: event.actor?.name || null,
        actorAvatar: event.actor?.seekerProfile?.avatarUrl || event.actor?.employerProfile?.logoUrl || null,
        actorRole: event.actor?.role || null,
        createdAt: event.createdAt.toISOString(),
      }
    })

    return NextResponse.json({
      events: formatted,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    })
  } catch (error) {
    console.error('Activity feed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
