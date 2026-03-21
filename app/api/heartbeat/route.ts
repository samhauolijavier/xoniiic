import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as { id: string; role: string }
  if (user.role !== 'seeker') {
    return NextResponse.json({ ok: false, reason: 'not a seeker' })
  }

  try {
    await db.seekerProfile.updateMany({
      where: { userId: user.id },
      data: { lastActiveAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
