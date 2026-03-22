import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { FREE_CONTACTS_PER_MONTH } from '@/lib/stripe'
import { createNotification } from '@/lib/notifications'
import { isMonetizationEnabled } from '@/lib/monetization'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; email: string; role: string }
    const body = await req.json()
    const { receiverId, message, senderEmail } = body

    if (!receiverId || !message) {
      return NextResponse.json({ error: 'Receiver and message are required' }, { status: 400 })
    }

    if (message.trim().length < 20) {
      return NextResponse.json({ error: 'Message must be at least 20 characters' }, { status: 400 })
    }

    // Check contact limit for free employers (skip if monetization is off)
    const monetizationOn = await isMonetizationEnabled()
    if (monetizationOn && user.role === 'employer') {
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { premium: true },
      })

      if (!dbUser?.premium) {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const contactsThisMonth = await db.contactRequest.count({
          where: {
            senderId: user.id,
            createdAt: { gte: startOfMonth },
          },
        })

        if (contactsThisMonth >= FREE_CONTACTS_PER_MONTH) {
          return NextResponse.json({
            error: 'contact_limit_reached',
            message: `You've reached your free limit of ${FREE_CONTACTS_PER_MONTH} contacts this month. Upgrade to Verified Partner for unlimited contacts.`,
            contactsUsed: contactsThisMonth,
            limit: FREE_CONTACTS_PER_MONTH,
          }, { status: 403 })
        }
      }
    }

    // Check receiver exists
    const profile = await db.seekerProfile.findUnique({
      where: { id: receiverId },
      include: { user: { select: { id: true } } },
    })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get sender info for notification
    const sender = await db.user.findUnique({
      where: { id: user.id },
      select: { name: true, employerProfile: { select: { companyName: true } } },
    })
    const senderName = sender?.employerProfile?.companyName || sender?.name || 'Someone'

    const contact = await db.contactRequest.create({
      data: {
        senderId: user.id,
        receiverId,
        message: message.trim(),
        senderEmail: senderEmail || user.email || '',
        status: 'pending',
      },
    })

    // Notify the seeker about the contact request
    await createNotification({
      userId: profile.user.id,
      type: 'contact_request',
      title: 'New Contact Request',
      message: `${senderName} wants to connect with you`,
      actionUrl: '/dashboard',
    })

    return NextResponse.json({ message: 'Contact request sent', contact }, { status: 201 })
  } catch (error) {
    console.error('Contact POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }

    if (user.role === 'seeker') {
      // Get seeker profile
      const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
      if (!profile) {
        return NextResponse.json({ contacts: [] })
      }

      const contacts = await db.contactRequest.findMany({
        where: { receiverId: profile.id },
        include: {
          sender: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ contacts })
    } else {
      const contacts = await db.contactRequest.findMany({
        where: { senderId: user.id },
        include: {
          receiver: {
            include: { user: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ contacts })
    }
  } catch (error) {
    console.error('Contact GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
