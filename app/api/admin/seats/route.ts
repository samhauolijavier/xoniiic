import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'
import { grantSeat, daysBetween, SEAT_DAYS } from '@/lib/sandbox'
import type { AccessSource } from '@prisma/client'
import { notifyDiscord } from '@/lib/discord'
import { sendSeatOpenEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const LAPSING_WINDOW_DAYS = 7

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const admin = session.user as { id: string; role: string; name?: string | null }
  if (admin.role !== 'admin') return { error: NextResponse.json({ error: 'Admin only' }, { status: 403 }) }
  return { admin }
}

const PERSON = { select: { id: true, name: true, email: true } } as const

export async function GET() {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const now = new Date()
  const lapsingBy = new Date(now.getTime() + LAPSING_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  try {
    const [waiting, needsSandbox, live, recent] = await Promise.all([
      withRetry(() => db.gcashPayment.findMany({
        where: { state: { in: ['awaiting_proof', 'awaiting_check'] } },
        orderBy: { createdAt: 'asc' },
        include: { user: PERSON },
      })),
      // Money matched, GoHighLevel user not created yet. This queue is the
      // step that used to be invisible, and the one people wait inside.
      withRetry(() => db.gcashPayment.findMany({
        where: { state: 'verified', accessId: null },
        orderBy: { checkedAt: 'asc' },
        include: { user: PERSON },
      })),
      withRetry(() => db.sandboxAccess.findMany({
        where: { expiresAt: { gt: now } },
        orderBy: { expiresAt: 'asc' },
        include: { user: PERSON },
      })),
      withRetry(() => db.gcashPayment.findMany({
        where: { state: { in: ['verified', 'rejected'] } },
        orderBy: { checkedAt: 'desc' },
        take: 20,
        include: { user: PERSON },
      })),
    ])

    return NextResponse.json({
      waiting: waiting.map(p => ({
        id: p.id,
        reference: p.reference,
        amount: p.amount,
        proofUrl: p.proofUrl,
        state: p.state,
        createdAt: p.createdAt,
        waitingHours: Math.floor((now.getTime() - p.createdAt.getTime()) / 3_600_000),
        user: p.user,
      })),
      needsSandbox: needsSandbox.map(p => ({
        id: p.id,
        reference: p.reference,
        checkedAt: p.checkedAt,
        waitingHours: p.checkedAt ? Math.floor((now.getTime() - p.checkedAt.getTime()) / 3_600_000) : 0,
        user: p.user,
      })),
      live: live.map(a => ({
        id: a.id,
        source: a.source,
        expiresAt: a.expiresAt,
        daysLeft: daysBetween(now, a.expiresAt),
        subAccount: a.subAccount,
        note: a.note,
        user: a.user,
      })),
      lapsing: live
        .filter(a => a.expiresAt <= lapsingBy)
        .map(a => ({ id: a.id, daysLeft: daysBetween(now, a.expiresAt), user: a.user, source: a.source })),
      recent: recent.map(p => ({
        id: p.id,
        reference: p.reference,
        state: p.state,
        checkedAt: p.checkedAt,
        rejectReason: p.rejectReason,
        user: p.user,
      })),
    })
  } catch (error) {
    console.error('Seat desk load error:', error)
    return NextResponse.json({ error: 'Database connection failed. Please try again.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error
  const admin = gate.admin!

  const body = await req.json().catch(() => ({}))
  const action = String(body.action ?? '')

  try {
    if (action === 'verify') {
      const paymentId = String(body.paymentId ?? '')
      if (!paymentId) return NextResponse.json({ error: 'paymentId is required' }, { status: 400 })

      // Claim the payment before granting anything. Two people clicking verify
      // at the same moment must not buy the same person two months — whoever
      // loses the race sees a count of zero and stops here.
      const claimed = await withRetry(() => db.gcashPayment.updateMany({
        where: { id: paymentId, state: { in: ['awaiting_proof', 'awaiting_check'] } },
        data: { state: 'verified', checkedBy: admin.id, checkedAt: new Date() },
      }))
      if (claimed.count === 0) {
        return NextResponse.json({ error: 'That payment has already been handled.' }, { status: 409 })
      }

      const payment = await withRetry(() => db.gcashPayment.findUnique({
        where: { id: paymentId },
        select: { userId: true, reference: true, user: { select: { email: true } } },
      })).then(p => p && ({ ...p, email: p.user.email }))
      if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

      await qualifyReferral(payment.userId)

      // Deliberately no seat and no email here. Next step is creating their
      // GoHighLevel user by hand; the days start, and they get told, only once
      // there is something to log into.
      await notifyDiscord({
        title: 'Create their GoHighLevel user',
        description: 'Payment confirmed. Add them to the shared sandbox, then press "Sandbox ready" on the seat desk to start their 30 days.',
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://virtualfreaks.co'}/admin/seats`,
        tone: 'good',
        fields: [
          { name: 'Email to add', value: payment.email ?? 'unknown', inline: true },
          { name: 'Reference', value: payment.reference, inline: true },
        ],
      })

      return NextResponse.json({
        message: 'Payment confirmed. Create their GoHighLevel user, then press "Sandbox ready".',
      })
    }

    if (action === 'reject') {
      const paymentId = String(body.paymentId ?? '')
      const reason = String(body.reason ?? '').trim()
      if (!paymentId) return NextResponse.json({ error: 'paymentId is required' }, { status: 400 })
      if (!reason) {
        return NextResponse.json({ error: 'Say why — they need to know what to fix.' }, { status: 400 })
      }

      const claimed = await withRetry(() => db.gcashPayment.updateMany({
        where: { id: paymentId, state: { in: ['awaiting_proof', 'awaiting_check'] } },
        data: { state: 'rejected', checkedBy: admin.id, checkedAt: new Date(), rejectReason: reason },
      }))
      if (claimed.count === 0) {
        return NextResponse.json({ error: 'That payment has already been handled.' }, { status: 409 })
      }
      return NextResponse.json({ message: 'Marked as not matched.' })
    }

    if (action === 'ready') {
      const paymentId = String(body.paymentId ?? '')
      const subAccount = String(body.subAccount ?? '').trim()
      if (!paymentId) return NextResponse.json({ error: 'paymentId is required' }, { status: 400 })
      if (!subAccount) {
        return NextResponse.json({
          error: 'Name the sub-account you put them in — it is the only record of where they are.',
        }, { status: 400 })
      }

      const payment = await withRetry(() => db.gcashPayment.findUnique({
        where: { id: paymentId },
        select: { userId: true, reference: true, accessId: true, state: true },
      }))
      if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      if (payment.state !== 'verified') {
        return NextResponse.json({ error: 'Confirm the payment first.' }, { status: 409 })
      }
      if (payment.accessId) {
        return NextResponse.json({ error: 'Their seat is already open.' }, { status: 409 })
      }

      const access = await grantSeat({
        userId: payment.userId,
        source: 'paid',
        subAccount,
        note: `GCash ${payment.reference}`,
        grantedBy: admin.id,
      })
      await withRetry(() => db.gcashPayment.update({
        where: { id: paymentId },
        data: { accessId: access.id },
      }))

      await announceSeat(payment.userId, access.expiresAt, 'paid')

      return NextResponse.json({
        message: `Seat open and they have been emailed. Runs until ${access.expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
      })
    }

    if (action === 'grant') {
      const userId = String(body.userId ?? '')
      const source = String(body.source ?? '') as AccessSource
      if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })
      if (!['earned', 'sponsored', 'referred', 'comped'].includes(source)) {
        return NextResponse.json({
          error: 'A seat granted by hand must be earned, sponsored, referred, or comped. Paid seats come from a payment.',
        }, { status: 400 })
      }
      const days = Number.isFinite(body.days) ? Math.min(365, Math.max(1, Number(body.days))) : SEAT_DAYS

      const person = await withRetry(() => db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }))
      if (!person) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const access = await grantSeat({
        userId,
        source,
        days,
        subAccount: body.subAccount ? String(body.subAccount) : null,
        note: body.note ? String(body.note) : null,
        grantedBy: admin.id,
      })
      await announceSeat(userId, access.expiresAt, source)

      return NextResponse.json({
        message: `${days} days added for ${person.name ?? 'them'}.`,
        expiresAt: access.expiresAt,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Seat desk action error:', error)
    return NextResponse.json({ error: 'Database connection failed. Please try again.' }, { status: 500 })
  }
}

/**
 * A referral counts once the invited person actually holds a seat — a signup
 * that never pays is a name, not a referral. Failing here must not undo a seat
 * that was correctly granted, so it is logged and swallowed.
 */
async function qualifyReferral(invitedId: string) {
  try {
    await withRetry(() => db.referral.updateMany({
      where: { invitedId, qualified: false },
      data: { qualified: true },
    }))
  } catch (error) {
    console.error('Referral qualify error (seat still granted):', error)
  }
}

/**
 * Tells the two people who need to know: the learner, and whoever has to put
 * them in the sandbox.
 *
 * Provisioning in GoHighLevel is still done by hand, so the Discord notice is
 * the task itself rather than a heads-up — it carries the exact email address
 * to add, because a VA who has to go looking for it is a VA who does it later.
 *
 * Neither send is allowed to undo a seat that was correctly granted, so both
 * failures are logged and swallowed.
 */
async function announceSeat(userId: string, expiresAt: Date, source: AccessSource) {
  try {
    const person = await withRetry(() => db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }))
    if (!person) return

    await sendSeatOpenEmail({
      email: person.email,
      name: person.name,
      expiresAt,
      // Flips to true once the GHL user is created automatically. Until then
      // the email must not promise an invite nobody has sent yet.
      provisioned: false,
    })

    await notifyDiscord({
      title: 'Add to the sandbox',
      description: 'Their seat is open. They need a GoHighLevel user in the shared sandbox sub-account.',
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://virtualfreaks.co'}/admin/seats`,
      tone: 'good',
      fields: [
        { name: 'Who', value: person.name || 'No name yet', inline: true },
        { name: 'Email to add', value: person.email, inline: true },
        { name: 'Seat', value: source, inline: true },
        { name: 'Runs until', value: expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), inline: true },
      ],
    })
  } catch (error) {
    console.error('Seat announcement failed (seat still granted):', error)
  }
}
