import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { seatStatus, referralCodeFor, SEAT_PRICE_PESOS, SEAT_DAYS } from '@/lib/sandbox'
import { db, withRetry } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const me = session.user as { id: string }

  try {
    const [status, referralCode, gcashNumber, referrals] = await Promise.all([
      seatStatus(me.id),
      referralCodeFor(me.id),
      withRetry(() => db.siteSetting.findUnique({ where: { key: 'private.gcashNumber' }, select: { value: true } })),
      withRetry(() => db.referral.count({ where: { referrerId: me.id, qualified: true } })),
    ])

    return NextResponse.json({
      ...status,
      referralCode,
      qualifiedReferrals: referrals,
      price: SEAT_PRICE_PESOS,
      seatDays: SEAT_DAYS,
      // The number is configuration, not code — it changes when the business
      // account replaces the personal one, and that must not need a deploy.
      gcashNumber: gcashNumber?.value ?? null,
    })
  } catch (error) {
    console.error('Sandbox status error:', error)
    return NextResponse.json({ error: 'Database connection failed. Please try again.' }, { status: 500 })
  }
}
