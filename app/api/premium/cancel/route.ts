import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as { id: string }
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { stripeSubscriptionId: true },
  })

  if (!dbUser?.stripeSubscriptionId) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
  }

  await stripe.subscriptions.update(dbUser.stripeSubscriptionId, {
    cancel_at_period_end: true,
  })

  return NextResponse.json({ success: true })
}
