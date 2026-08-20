import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendNewMessageEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// GET — Get single conversation with messages
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string }
    const conversationId = params.id

    // Verify current user is a participant
    const participant = await db.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
    })

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
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
          orderBy: { createdAt: 'asc' },
          take: 50,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                seekerProfile: { select: { avatarUrl: true } },
                employerProfile: { select: { logoUrl: true } },
              },
            },
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Update lastReadAt for current user
    await db.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
      data: { lastReadAt: new Date() },
    })

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Conversation GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — Send a message
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string }
    const conversationId = params.id
    const { content } = await req.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Verify current user is a participant
    const participant = await db.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
    })

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Create message and update conversation timestamp
    const message = await db.message.create({
      data: {
        content: content.trim(),
        conversationId,
        senderId: user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            seekerProfile: { select: { avatarUrl: true } },
            employerProfile: { select: { logoUrl: true } },
          },
        },
      },
    })

    // Update conversation updatedAt
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Tell the other person, by email, because a badge in the navigation is
    // only seen by somebody already on the site — and the person who most
    // needs to know is the one who is not.
    //
    // Sent once per quiet stretch, not once per message: somebody typing five
    // lines in a row should produce one email, not five. The test is whether
    // the recipient has already read up to now — if they have unread messages
    // sitting there, they have been told.
    try {
      const others = await db.conversationParticipant.findMany({
        where: { conversationId, userId: { not: user.id } },
        select: {
          userId: true,
          lastReadAt: true,
          user: { select: { email: true, name: true } },
        },
      })

      const sender = message.sender.name || 'Someone'
      const justNow = new Date(Date.now() - 30 * 60 * 1000)

      await Promise.all(others.map(async other => {
        // Anything already sitting unread means they have been told once and
        // do not need telling again. Counted excluding the message just
        // created, and excluding anything they sent themselves.
        const alreadyUnread = await db.message.count({
          where: {
            conversationId,
            id: { not: message.id },
            senderId: { not: other.userId },
            ...(other.lastReadAt ? { createdAt: { gt: other.lastReadAt } } : {}),
          },
        })
        if (alreadyUnread > 0) return
        if (other.lastReadAt && other.lastReadAt > justNow) return

        await sendNewMessageEmail({
          email: other.user.email,
          recipientName: other.user.name,
          senderName: sender,
          conversationId,
        })
      }))
    } catch (error) {
      console.error('New-message email failed (message still sent):', error)
    }

    // Update sender's lastReadAt
    await db.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
      data: { lastReadAt: new Date() },
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Message POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
