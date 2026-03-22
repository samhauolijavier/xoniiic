import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getNotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string }
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { notificationPreferences: true },
    })

    const prefs = getNotificationPreferences(dbUser?.notificationPreferences ?? null)
    return NextResponse.json({ preferences: prefs })
  } catch (error) {
    console.error('Notification preferences GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string }
    const body = await req.json()

    // Merge with defaults, ensure system is always true
    const current = await db.user.findUnique({
      where: { id: user.id },
      select: { notificationPreferences: true },
    })
    const existing = getNotificationPreferences(current?.notificationPreferences ?? null)

    const updated = {
      contact_request: typeof body.contact_request === 'boolean' ? body.contact_request : existing.contact_request,
      profile_view: typeof body.profile_view === 'boolean' ? body.profile_view : existing.profile_view,
      message: typeof body.message === 'boolean' ? body.message : existing.message,
      system: true, // always on
    }

    await db.user.update({
      where: { id: user.id },
      data: { notificationPreferences: JSON.stringify(updated) },
    })

    return NextResponse.json({ preferences: updated })
  } catch (error) {
    console.error('Notification preferences PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
