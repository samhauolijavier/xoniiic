import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET — Get total unread message count for navbar badge
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ count: 0 })
    }

    const user = session.user as { id: string }

    // Get all conversations this user participates in
    const participants = await db.conversationParticipant.findMany({
      where: { userId: user.id },
      select: { conversationId: true, lastReadAt: true },
    })

    let totalUnread = 0

    for (const p of participants) {
      const where: Record<string, unknown> = {
        conversationId: p.conversationId,
        senderId: { not: user.id },
      }
      if (p.lastReadAt) {
        where.createdAt = { gt: p.lastReadAt }
      }

      const count = await db.message.count({ where })
      totalUnread += count
    }

    return NextResponse.json({ count: totalUnread })
  } catch (error) {
    console.error('Unread count error:', error)
    return NextResponse.json({ count: 0 })
  }
}
