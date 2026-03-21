import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import Stripe from 'stripe'
import { logActivity } from '@/lib/activity'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!userId) break

        const now = new Date()
        const premiumUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

        await db.user.update({
          where: { id: userId },
          data: {
            premium: true,
            premiumSince: now,
            premiumUntil,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          },
        })

        // Log activity for premium upgrade
        if (session.metadata?.tier === 'employer_partner') {
          await logActivity('partner_upgrade', userId)
        } else {
          await logActivity('premium_upgrade', userId)
        }

        // If employer partner, also set verified on employer profile
        if (session.metadata?.tier === 'employer_partner') {
          // Only set to 'partner' tier if not already 'vf_verified' (don't downgrade)
          const existingProfile = await db.employerProfile.findUnique({
            where: { userId },
            select: { verificationTier: true },
          })
          const tier = existingProfile?.verificationTier === 'vf_verified' ? 'vf_verified' : 'partner'
          await db.employerProfile.updateMany({
            where: { userId },
            data: { verified: true, verifiedAt: now, newEmployer: false, verificationTier: tier },
          })
        }

        // Send subscription notification
        const isPartner = session.metadata?.tier === 'employer_partner'
        await createNotification({
          userId,
          type: 'subscription',
          title: isPartner ? 'Welcome, Verified Partner!' : 'Welcome to Premium!',
          message: isPartner
            ? 'Your Verified Partner subscription is now active. Enjoy unlimited contacts and a verified badge.'
            : 'Your Premium subscription is now active. Enjoy all the premium features!',
          actionUrl: isPartner ? '/employer-dashboard' : '/dashboard',
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        if (!customerId) break

        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (!user) break

        const newUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        await db.user.update({
          where: { id: user.id },
          data: { premium: true, premiumUntil: newUntil },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (!user) break

        await db.user.update({
          where: { id: user.id },
          data: { premium: false, premiumUntil: new Date() },
        })

        // If employer, remove partner verification (but preserve VF Verified)
        if (user.role === 'employer') {
          const profile = await db.employerProfile.findUnique({
            where: { userId: user.id },
            select: { verificationTier: true },
          })
          // Only strip verification if they were just a partner, not VF Verified
          if (profile?.verificationTier !== 'vf_verified') {
            await db.employerProfile.updateMany({
              where: { userId: user.id },
              data: { verified: false, verifiedAt: null, verificationTier: null },
            })
          }
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
