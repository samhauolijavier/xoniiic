/*
 * A permanent home for "share your story".
 *
 * The dashboard card only appears for somebody who was placed here or has been
 * asked directly — deliberately, because prompting every freelancer to describe
 * a placement they never had is how you get invented testimonials.
 *
 * But that left nowhere to send a person who simply wants to write one, and no
 * link to paste into a message. This page is that link. It is the same form,
 * always reachable, and it is where the invitation email points — so nobody has
 * to sign in and then go hunting for a box on a dashboard.
 */
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { TestimonialCard } from '../../dashboard/TestimonialCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Share your story',
  description: 'Tell people what working remotely has actually been like.',
}

export default async function TestimonialPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login?callbackUrl=/testimonials/write')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-black text-brand-text mb-2">Share your story</h1>
      <p className="text-brand-muted leading-relaxed mb-6">
        Someone deciding whether any of this is real has no way to know until a person who has
        actually done it tells them. A few honest lines does more than anything we could write
        ourselves.
      </p>

      <TestimonialCard alwaysOpen />

      <p className="text-sm text-brand-muted mt-6 leading-relaxed">
        Nothing is published without your say-so, and you can ask for it to come down at any time.{' '}
        <Link href="/dashboard" className="text-brand-purple hover:text-brand-pink transition-colors underline underline-offset-2">
          Back to your dashboard
        </Link>
      </p>
    </div>
  )
}
