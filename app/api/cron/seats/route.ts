import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'
import { notifyDiscord } from '@/lib/discord'
import { sendSeatEndingEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

/*
 * The end of a seat, handled.
 *
 * Until now a practice account simply stopped. Somebody paid, used it for a
 * month, and one morning it was over with no warning — which reads as the
 * thing breaking rather than the thing ending, and is the surest way to lose a
 * renewal from a person who was perfectly happy.
 *
 * Two jobs, once a day:
 *   1. Tell anyone with three days left, while there is still time to act.
 *   2. Tell the team which GoHighLevel users to remove, because nobody
 *      removes them otherwise and a shared sandbox quietly fills with people
 *      who stopped paying months ago — which makes the fee optional.
 */

const WARN_AT_DAYS = 3

function startOfDayFrom(now: Date, daysAhead: number) {
  const d = new Date(now)
  d.setUTCDate(d.getUTCDate() + daysAhead)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export async function GET(req: NextRequest) {
  // Vercel signs its cron calls with this header. Without the check the route
  // is a button anyone on the internet can press to send mail to your members.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date()
  const warnFrom = startOfDayFrom(now, WARN_AT_DAYS)
  const warnTo = startOfDayFrom(now, WARN_AT_DAYS + 1)
  const endedFrom = startOfDayFrom(now, -1)

  let warned = 0
  let ended = 0

  try {
    // Ending in three days. Matched on a single day's window so a seat is
    // warned about once, not once per run.
    const ending = await withRetry(() => db.sandboxAccess.findMany({
      where: { expiresAt: { gte: warnFrom, lt: warnTo } },
      include: { user: { select: { email: true, name: true } } },
    }))

    for (const seat of ending) {
      // Somebody who already holds a later grant is not running out of
      // anything, and telling them so would be wrong.
      const laterGrant = await withRetry(() => db.sandboxAccess.count({
        where: { userId: seat.userId, expiresAt: { gt: seat.expiresAt } },
      }))
      if (laterGrant > 0) continue

      await sendSeatEndingEmail({
        email: seat.user.email,
        name: seat.user.name,
        expiresAt: seat.expiresAt,
        daysLeft: WARN_AT_DAYS,
      })
      warned++
    }

    // Ended yesterday, and nothing newer has replaced it. These are the
    // GoHighLevel users to take out.
    const expired = await withRetry(() => db.sandboxAccess.findMany({
      where: { expiresAt: { gte: endedFrom, lt: startOfDayFrom(now, 0) } },
      include: { user: { select: { id: true, email: true, name: true } } },
    }))

    const toRemove: { email: string; subAccount: string | null }[] = []
    for (const seat of expired) {
      const stillActive = await withRetry(() => db.sandboxAccess.count({
        where: { userId: seat.userId, expiresAt: { gt: now } },
      }))
      if (stillActive > 0) continue
      toRemove.push({ email: seat.user.email, subAccount: seat.subAccount })
      ended++
    }

    if (toRemove.length > 0) {
      await notifyDiscord({
        title: `Remove ${toRemove.length} GoHighLevel ${toRemove.length === 1 ? 'user' : 'users'}`,
        description:
          'These practice accounts ended yesterday and have not been topped up. Removing them is what keeps the fee meaningful.',
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://virtualfreaks.co'}/admin/seats`,
        tone: 'warn',
        fields: toRemove.slice(0, 20).map(r => ({
          name: r.subAccount || 'Sub-account not recorded',
          value: r.email,
          inline: true,
        })),
      })
    }

    return NextResponse.json({ warned, ended, checkedAt: now.toISOString() })
  } catch (error) {
    console.error('Seat cron error:', error)
    return NextResponse.json({ error: 'Seat cron failed' }, { status: 500 })
  }
}
