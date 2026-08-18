import Stripe from 'stripe'

let client: Stripe | null = null

function stripeClient(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set — this route needs Stripe configured.')
    }
    client = new Stripe(key, { apiVersion: '2026-02-25.clover' as const })
  }
  return client
}

/**
 * Built on first use, not on import. Constructing at module scope meant a
 * missing or rotated key took down the build for the entire site — including
 * every page that has nothing to do with payments. Now only a route that
 * actually reaches for Stripe can fail, and it fails with a readable message.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(stripeClient(), prop, receiver)
  },
})

// Seeker Premium
export const PREMIUM_PRICE = 299 // $2.99 in cents
export const PREMIUM_PRICE_DISPLAY = '$2.99'

// Employer Verified Partner
export const EMPLOYER_PREMIUM_PRICE = 1299 // $12.99 in cents
export const EMPLOYER_PREMIUM_PRICE_DISPLAY = '$12.99'

// Employer free tier limits
export const FREE_CONTACTS_PER_MONTH = 5
export const FREE_ACTIVE_JOB_POSTS = 2
