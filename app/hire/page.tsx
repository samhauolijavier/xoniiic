/*
 * The employer door.
 *
 * The homepage talks to remote workers, because that is who the videos send.
 * Businesses arrive a different way — a link in an email, a search, someone
 * passing the URL on — and they arrive with a job already in mind. So this page
 * assumes intent and gets out of the way: what it costs, who is here, and two
 * ways to start.
 *
 * The one thing it must not do is sell. Someone who followed a link to a hiring
 * page has already decided to look; the job is to remove doubt, not to create
 * desire.
 */
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { db, withRetry } from '@/lib/db'
import { publiclyListable } from '@/lib/constants'
import { HireSearch } from '@/components/home/HireSearch'
import { Testimonials } from '@/components/home/Testimonials'

export const metadata: Metadata = {
  title: 'Hire remote talent — free, no commission',
  description:
    'Browse skilled virtual assistants and remote professionals. No fees, no commission, no subscription. Message anyone directly and agree your own rate.',
  alternates: { canonical: 'https://virtualfreaks.co/hire' },
  openGraph: {
    title: 'Hire remote talent — free, no commission',
    description: 'No fees, no commission. Message talent directly and agree your own rate.',
    url: 'https://virtualfreaks.co/hire',
  },
}

// Every claim here has to stay true without anybody maintaining it. These three
// are structural — they describe how the business works, not how it is going.
const PROMISES = [
  {
    figure: 'Free',
    label: 'To browse, message, and hire',
    body: 'No subscription and no per-hire fee. Upwork takes 5–10% of the contract, Fiverr 5.5% plus processing. We take nothing.',
  },
  {
    figure: '0%',
    label: 'Commission on their rate',
    body: 'You agree a rate directly and pay it directly. Nothing is skimmed on the way through, which is why the rate you agree is the rate that works for them.',
  },
  {
    figure: 'Direct',
    label: 'No account manager in between',
    body: 'Message anyone on the platform yourself. No gatekeeping, no matching fee, no waiting on someone to introduce you.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Say what you need',
    body: 'Post it and let people come to you, or skip it entirely and go straight to browsing. Both work; posting just saves you the search.',
    href: '/post-a-need',
    cta: 'Post a need',
  },
  {
    n: '02',
    title: 'Look at real work',
    body: 'Profiles carry the scenarios people have actually completed, not just a list of skills they typed in. You can see what someone has done before you spend a call finding out.',
    href: '/browse',
    cta: 'Browse talent',
  },
  {
    n: '03',
    title: 'Message and agree terms',
    body: 'Straight to them, on your terms, at a rate you both settle. Nothing goes through us and nothing is taken out of it.',
    href: '/register?role=employer',
    cta: 'Create a free account',
  },
]

export default async function HirePage() {
  // Shown only when it is worth showing. A directory that announces its own size
  // while small does more damage than one that says nothing.
  let seekerCount = 0
  try {
    seekerCount = await withRetry(() => db.seekerProfile.count({ where: { user: publiclyListable() } }))
  } catch (error) {
    console.error('Hire page count failed:', error)
  }

  return (
    <div className="page-ink">
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-56 w-[760px] h-[760px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(162,28,175,0.36), rgba(249,115,22,0.12) 52%, transparent 72%)' }}
        />
        <div className="relative max-w-5xl mx-auto px-5 pt-20 pb-14 sm:pt-28 sm:pb-20">
          <span className="quieter block font-mono text-[11px] uppercase tracking-[0.16em] mb-6">
            For businesses
          </span>
          {/* The mirror of the homepage line, carrying the same strike — so the
              two sides of the marketplace make one argument in one voice. */}
          <h1 className="display text-[clamp(2.4rem,7vw,5rem)] max-w-[16ch] mb-8">
            Pay the person,
            {/* Break forced rather than left to wrapping: the strike has to
                take the whole phrase, and "not" hanging on the line above
                reads as a stray word rather than part of what is cancelled. */}
            <br />
            <span className="strikeout">not the platform.</span>
          </h1>
          <p className="quiet text-lg leading-relaxed max-w-[46ch] mb-9">
            Browse skilled virtual assistants and remote professionals, message them directly, and
            agree your own rate. No commission, no subscription, no one standing in the middle.
          </p>
          {/* One action, not two. Somebody here already knows what they need. */}
          <HireSearch />

          <p className="quieter text-sm mt-5">
            Results open with a free account — a minute, no card, nothing to pay. Or{' '}
            <Link href="/post-a-need" className="text-white/75 hover:text-white border-b border-white/30 hover:border-white pb-0.5 transition-colors">post what you need</Link>{' '}
            and let people come to you.
          </p>
          {seekerCount >= 10 && (
            <p className="quieter font-mono text-xs mt-6 tabular-nums">
              {seekerCount} profiles on the platform today
            </p>
          )}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
        <div className="grid md:grid-cols-3 gap-10 border-t border-white/10 pt-10">
          {PROMISES.map(p => (
            <div key={p.label}>
              <p className="display-sm text-4xl sm:text-5xl mb-3">{p.figure}</p>
              <p className="font-semibold text-[15px] mb-2">{p.label}</p>
              <p className="quiet text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 pb-14 sm:pb-20">
        <h2 className="display-sm text-3xl sm:text-4xl mb-8">How hiring works here</h2>
        <div className="border-t border-white/10">
          {STEPS.map(s => (
            <div key={s.n} className="py-7 border-b border-white/10 flex gap-5 sm:gap-8 items-start flex-wrap">
              <span className="quieter text-xs font-mono pt-1.5">{s.n}</span>
              <div className="flex-1 min-w-[240px]">
                <h3 className="font-semibold mb-1.5">{s.title}</h3>
                <p className="quiet text-sm leading-relaxed">{s.body}</p>
              </div>
              <Link href={s.href} className="btn-outline text-sm">{s.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Why the talent here is worth looking at — the part no competitor can
          copy quickly, because it is the training side of the business. */}
      <section className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
        <div className="border-t border-white/10 pt-10 grid lg:grid-cols-[minmax(0,24rem)_1fr] gap-10 lg:gap-16">
          <h2 className="display-sm text-3xl sm:text-4xl">
            People here practice on real systems
          </h2>
          <div>
          <p className="quiet leading-relaxed max-w-[54ch] mb-4">
            Virtual Freaks runs its own training. Members work through scenario briefs in a live
            GoHighLevel sandbox — rescuing a campaign that spent and booked nothing, closing a
            month that does not balance, taking over an inbox with hundreds unread.
          </p>
          <p className="quiet leading-relaxed max-w-[54ch]">
            What that means for you: a profile can show work someone actually did, not a list of
            tools they say they know. It is the difference between a CV and a portfolio.
          </p>
          </div>
        </div>
      </section>

      <Testimonials />

      <section className="max-w-5xl mx-auto px-5 py-20 sm:py-28">
        <h2 className="display-sm text-4xl sm:text-5xl mb-6 max-w-[16ch]">Make a free account</h2>
        <p className="quiet text-lg leading-relaxed max-w-[52ch] mb-9">
          {/* The number is read from the database and only appears once it helps.
              Below that it says "every profile", which is true at any size and
              never has to be revised. */}
          It takes a minute and opens {seekerCount >= 100 ? `all ${seekerCount} profiles` : 'every profile'}.
          Nothing here costs money — no card, no subscription, and no commission on whatever you
          agree with the person you hire.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/register?role=employer&redirect=/browse" className="btn-grad">Browse talent</Link>
          <Link href="/register?role=employer" className="btn-outline">Create a free account</Link>
        </div>
      </section>
    </div>
  )
}
