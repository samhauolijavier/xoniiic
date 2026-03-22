import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as { id: string; role: string }
  if (user.role !== 'seeker') {
    return NextResponse.json({ error: 'Only seekers can subscribe to premium' }, { status: 403 })
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } })
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Get or create Stripe customer
  let stripeCustomerId = dbUser.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email,
      name: dbUser.name ?? undefined,
      metadata: { userId: dbUser.id },
    })
    stripeCustomerId = customer.id
    await db.user.update({
      where: { id: dbUser.id },
      data: { stripeCustomerId },
    })
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: 299,
          recurring: { interval: 'month' },
          product_data: {
            name: 'Virtual Freaks Premium',
            description: 'See who viewed your profile, full analytics, premium badge',
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/premium`,
    metadata: { userId: dbUser.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
