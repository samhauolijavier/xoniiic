import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { stripe, EMPLOYER_PREMIUM_PRICE } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as { id: string; role: string }
  if (user.role !== 'employer') {
    return NextResponse.json({ error: 'Only employers can subscribe to Verified Partner' }, { status: 403 })
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } })
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (dbUser.premium) {
    return NextResponse.json({ error: 'Already a Verified Partner' }, { status: 400 })
  }

  // Get or create Stripe customer
  let stripeCustomerId = dbUser.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email,
      name: dbUser.name ?? undefined,
      metadata: { userId: dbUser.id, role: 'employer' },
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
          unit_amount: EMPLOYER_PREMIUM_PRICE,
          recurring: { interval: 'month' },
          product_data: {
            name: 'Virtual Freaks Verified Partner',
            description: 'Unlimited contacts, unlimited job posts, verified badge, priority placement, advanced filters',
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/verified-partner/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/verified-partner`,
    metadata: { userId: dbUser.id, tier: 'employer_partner' },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
