import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover' as const,
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
