import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST — Create or find existing conversation between two users
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string }
    const { recipientId } = await req.json()

    if (!recipientId) {
      return NextResponse.json({ error: 'recipientId is required' }, { status: 400 })
    }

    if (recipientId === user.id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
    }

    // Check if conversation already exists between these two users
    const existing = await db.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: recipientId } } },
        ],
        participants: { every: { userId: { in: [user.id, recipientId] } } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                seekerProfile: { select: { avatarUrl: true, username: true } },
                employerProfile: { select: { logoUrl: true, companyName: true } },
              },
            },
          },
        },
      },
    })

    if (existing) {
      return NextResponse.json({ conversation: existing })
    }

    // Create new conversation with both participants
    const conversation = await db.conversation.create({
      data: {
        participants: {
          create: [
            { userId: user.id },
            { userId: recipientId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                seekerProfile: { select: { avatarUrl: true, username: true } },
                employerProfile: { select: { logoUrl: true, companyName: true } },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Conversations POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET — List all conversations for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string }

    const conversations = await db.conversation.findMany({
      where: {
        participants: { some: { userId: user.id } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                seekerProfile: { select: { avatarUrl: true, username: true } },
                employerProfile: { select: { logoUrl: true, companyName: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Compute unread counts
    const conversationsWithUnread = conversations.map((conv) => {
      const myParticipant = conv.participants.find((p) => p.userId === user.id)
      const lastReadAt = myParticipant?.lastReadAt
      const lastMessage = conv.messages[0] || null

      return {
        ...conv,
        lastMessage,
        unreadCount: lastReadAt
          ? conv.messages.filter(
              (m) => new Date(m.createdAt) > new Date(lastReadAt) && m.senderId !== user.id
            ).length
          : conv.messages.filter((m) => m.senderId !== user.id).length,
      }
    })

    return NextResponse.json({ conversations: conversationsWithUnread })
  } catch (error) {
    console.error('Conversations GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
