/*
 * The learner's seat page.
 *
 * Three things it has to get right.
 *
 * The clock covers the PRACTICE ACCOUNT and nothing else. A Virtual Freaks
 * profile is free forever — if a lapsed 100 pesos took someone's profile down,
 * the marketplace would lose exactly the people the videos brought in.
 *
 * The number is always paired with a way out of it. A bare countdown is a meter
 * running, and to someone earning 8,000 pesos a month that reads as pressure.
 * Next to two free routes it reads as a choice.
 *
 * And it stays quiet until it matters. Calm past a week, warmer inside seven
 * days, loud under three — a card that always shouts is a card nobody reads.
 */
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db, withRetry } from '@/lib/db'
import { seatStatus, referralCodeFor, seatPrice, SEAT_DAYS } from '@/lib/sandbox'
import { ClaimForm } from './ClaimForm'
import { CopyLink } from './CopyLink'
import './sandbox.css'

export const metadata: Metadata = {
  title: 'Practice account',
  description: 'Your GoHighLevel practice account and how long is left on it.',
  robots: { index: false, follow: false },
}

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://virtualfreaks.co'
const REFERRALS_FOR_A_MONTH = 2

export default async function SandboxPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login?callbackUrl=/sandbox')
  const me = session.user as { id: string; name?: string | null }

  const [status, referralCode, gcash, gcashQr, qualified, passed, price] = await Promise.all([
    seatStatus(me.id),
    referralCodeFor(me.id),
    withRetry(() => db.siteSetting.findUnique({ where: { key: 'private.gcashNumber' }, select: { value: true } })),
    withRetry(() => db.siteSetting.findUnique({ where: { key: 'gcashQrUrl' }, select: { value: true } })),
    withRetry(() => db.referral.count({ where: { referrerId: me.id, qualified: true } })),
    withRetry(() => db.scenarioAttempt.count({ where: { userId: me.id, passed: true } })),
    seatPrice(),
  ])

  const pct = status.active ? Math.min(100, (status.daysLeft / SEAT_DAYS) * 100) : 0
  const referralUrl = `${SITE}/register?ref=${referralCode}`

  return (
    <div className="seatpage">
      <h1>Practice Account</h1>
      <p className="lede">
        A real GoHighLevel sub-account to build in, break, and rebuild — so the work on your
        profile is work you have actually done.
      </p>

      <article className={`seat ${status.urgency}`}>
        <div className="seat-head">
          <div>
            <h2>GoHighLevel Practice Account</h2>
            <p className="seat-sub">
              {status.subAccount
                ? `Sandbox sub-account · ${status.subAccount}`
                : status.pendingReference
                  ? 'We have your payment. Your sub-account is assigned once we match it.'
                  : 'Sandbox sub-account, assigned when your seat opens'}
            </p>
          </div>
          <div className="seat-days">
            {status.active ? (
              <>
                <span className="n">{status.daysLeft}</span>
                <span className="u">{status.daysLeft === 1 ? 'day left' : 'days left'}</span>
              </>
            ) : status.pendingReference ? (
              <>
                <span className="n">₱{price}</span>
                <span className="u">paid · being checked</span>
              </>
            ) : (
              <>
                <span className="n">—</span>
                <span className="u">not open yet</span>
              </>
            )}
          </div>
        </div>

        {status.active && <div className="meter"><i style={{ width: `${pct}%` }} /></div>}

        {/* The line that stops anyone panicking about the wrong thing. */}
        <p className="seat-scope">
          This clock is only on the practice account.{' '}
          <strong>Your Virtual Freaks profile, badges and messages are free forever</strong> and
          are not affected when it runs out.
        </p>

        <div className="ways">
          <div className="way">
            <div className="way-top">
              <strong>Pass a scenario</strong>
              <span className="plus">+{SEAT_DAYS} days</span>
            </div>
            <p>
              {passed === 0
                ? 'Scenarios are free to attempt, always. Passing three adds a month.'
                : `You have passed ${passed}. Every third one adds a month.`}
            </p>
            <Link className="sbtn ghost" href="/resources">Open scenarios</Link>
          </div>

          <div className="way">
            <div className="way-top">
              <strong>Bring {REFERRALS_FOR_A_MONTH} people</strong>
              <span className="plus">+{SEAT_DAYS} days</span>
            </div>
            <p>
              {qualified} of {REFERRALS_FOR_A_MONTH} so far. It counts when their seat opens, not
              when they sign up.
            </p>
            <CopyLink url={referralUrl} />
          </div>

          <div className="way">
            <div className="way-top">
              <strong>Top up</strong>
              <span className="plus">₱{price} · {SEAT_DAYS} days</span>
            </div>
            <p>GCash. One payment, no subscription — nothing renews by itself.</p>
            <a className="sbtn ghost" href="#claim">Top up</a>
          </div>
        </div>
      </article>

      <div id="claim">
        {status.pendingReference ? (
          <div className="claim">
            <h2>Payment received — waiting on us</h2>
            <div className="pending">
              <span>Reference</span>
              <code>{status.pendingReference}</code>
              <span>· we match it by hand, usually the same day</span>
            </div>
            <p className="note quiet">
              No need to send it again. If something is wrong with it we will tell you here and
              say what to fix.
            </p>
          </div>
        ) : (
          <ClaimForm
            price={price}
            gcashNumber={gcash?.value ?? null}
            gcashQrUrl={gcashQr?.value ?? null}
          />
        )}
      </div>
    </div>
  )
}
