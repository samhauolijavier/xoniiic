import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'
import { grantSeat, SEAT_DAYS } from '@/lib/sandbox'
import { sendTestimonialApprovedEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const admin = session.user as { id: string; role: string }
  if (admin.role !== 'admin') return { error: NextResponse.json({ error: 'Admin only' }, { status: 403 }) }
  return { admin }
}

const PERSON = { select: { id: true, name: true, email: true, placedBadgeAt: true } } as const

export async function GET() {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  try {
    const [pending, approved, rejected] = await Promise.all([
      withRetry(() => db.testimonial.findMany({
        where: { state: 'pending' }, orderBy: { createdAt: 'asc' }, include: { user: PERSON },
      })),
      withRetry(() => db.testimonial.findMany({
        where: { state: 'approved' }, orderBy: { reviewedAt: 'desc' }, include: { user: PERSON },
      })),
      withRetry(() => db.testimonial.findMany({
        where: { state: 'rejected' }, orderBy: { reviewedAt: 'desc' }, take: 10, include: { user: PERSON },
      })),
    ])
    return NextResponse.json({ pending, approved, rejected })
  } catch (error) {
    console.error('Testimonial list error:', error)
    return NextResponse.json({ error: 'Database connection failed. Please try again.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error
  const admin = gate.admin!

  const body = await req.json().catch(() => ({}))
  const action = String(body.action ?? '')
  const id = String(body.id ?? '')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  try {
    if (action === 'approve') {
      // Claimed before anything is granted, so two admins approving at once
      // cannot pay the reward twice.
      const claimed = await withRetry(() => db.testimonial.updateMany({
        where: { id, state: 'pending' },
        data: { state: 'approved', reviewedBy: admin.id, reviewedAt: new Date() },
      }))
      if (claimed.count === 0) {
        return NextResponse.json({ error: 'That one has already been handled.' }, { status: 409 })
      }

      const testimonial = await withRetry(() => db.testimonial.findUnique({
        where: { id },
        select: { userId: true, rewardedAt: true, user: { select: { name: true, email: true } } },
      }))
      if (!testimonial) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      // Paid once, ever. Re-approving an edited testimonial must not hand out
      // a second month.
      let rewarded = false
      let expiresAt: Date | null = null
      if (!testimonial.rewardedAt) {
        const access = await grantSeat({
          userId: testimonial.userId,
          source: 'earned',
          note: 'Testimonial approved',
          grantedBy: admin.id,
        })
        expiresAt = access.expiresAt
        await withRetry(() => db.$transaction([
          db.testimonial.update({ where: { id }, data: { rewardedAt: new Date() } }),
          db.user.update({
            where: { id: testimonial.userId },
            data: { placedBadgeAt: new Date() },
          }),
        ]))
        rewarded = true
      }

      // The seat and the badge are the payment; the email is the receipt.
      // Failing to send must not undo either.
      try {
        await sendTestimonialApprovedEmail({
          email: testimonial.user.email,
          name: testimonial.user.name,
          rewarded,
          expiresAt,
        })
      } catch (error) {
        console.error('Testimonial email failed (reward still granted):', error)
      }

      return NextResponse.json({
        message: rewarded
          ? `Live on the site. Badge granted and ${SEAT_DAYS} days added.`
          : 'Live on the site. They had already been rewarded for this one.',
      })
    }

    if (action === 'reject') {
      const note = String(body.note ?? '').trim()
      if (!note) {
        return NextResponse.json({ error: 'Say what needs changing — they can edit and resubmit.' }, { status: 400 })
      }
      const claimed = await withRetry(() => db.testimonial.updateMany({
        where: { id, state: 'pending' },
        data: { state: 'rejected', reviewedBy: admin.id, reviewedAt: new Date(), reviewNote: note },
      }))
      if (claimed.count === 0) {
        return NextResponse.json({ error: 'That one has already been handled.' }, { status: 409 })
      }
      return NextResponse.json({ message: 'Sent back with your note.' })
    }

    if (action === 'feature' || action === 'unfeature') {
      await withRetry(() => db.testimonial.update({
        where: { id },
        data: { featured: action === 'feature' },
      }))
      return NextResponse.json({
        message: action === 'feature' ? 'Pinned to the top of the page.' : 'Unpinned.',
      })
    }

    if (action === 'unpublish') {
      // Takes it off the site without touching rewardedAt, so pulling a
      // testimonial never claws back a badge or the days someone earned.
      await withRetry(() => db.testimonial.update({
        where: { id },
        data: { state: 'rejected', reviewNote: 'Removed from the site by an admin.', featured: false },
      }))
      return NextResponse.json({ message: 'Taken off the site. Their badge and days are untouched.' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Testimonial action error:', error)
    return NextResponse.json({ error: 'Database connection failed. Please try again.' }, { status: 500 })
  }
}
