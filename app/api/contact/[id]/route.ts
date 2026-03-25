import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, withRetry } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string; name?: string }
    const body = await req.json()
    const { action } = body // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Find the contact request
    const contact = await withRetry(() => db.contactRequest.findUnique({
      where: { id: params.id },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { include: { user: { select: { id: true, name: true } } } },
      },
    }))

    if (!contact) {
      return NextResponse.json({ error: 'Contact request not found' }, { status: 404 })
    }

    // Verify the current user is the receiver
    if (contact.receiver.user.id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (action === 'reject') {
      await withRetry(() => db.contactRequest.update({
        where: { id: params.id },
        data: { status: 'rejected' },
      }))

      return NextResponse.json({ message: 'Contact request declined' })
    }

    // Accept: update status and create conversation
    await withRetry(() => db.contactRequest.update({
      where: { id: params.id },
      data: { status: 'accepted' },
    }))

    // Check if conversation already exists between these users
    const existingConversation = await withRetry(() => db.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: contact.sender.id } } },
          { participants: { some: { userId: contact.receiver.user.id } } },
        ],
      },
    }))

    let conversationId: string

    if (existingConversation) {
      conversationId = existingConversation.id
    } else {
      // Create new conversation
      const conversation = await withRetry(() => db.conversation.create({
        data: {
          participants: {
            create: [
              { userId: contact.sender.id },
              { userId: contact.receiver.user.id },
            ],
          },
        },
      }))
      conversationId = conversation.id
    }

    // Send the original contact message as the first message in the conversation
    await withRetry(() => db.message.create({
      data: {
        conversationId,
        senderId: contact.sender.id,
        content: contact.message,
      },
    }))

    // Update conversation timestamp
    await withRetry(() => db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }))

    // Notify the sender that their request was accepted
    const receiverName = contact.receiver.user.name || 'A freelancer'
    await createNotification({
      userId: contact.sender.id,
      type: 'contact_accepted',
      title: 'Contact Request Accepted',
      message: `${receiverName} accepted your request — you can now message them!`,
      actionUrl: `/messages?id=${conversationId}`,
    })

    return NextResponse.json({
      message: 'Contact request accepted',
      conversationId,
    })
  } catch (error) {
    console.error('Contact PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
