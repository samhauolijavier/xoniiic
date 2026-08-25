/*
 * What the practice account is, for somebody who is not signed in.
 *
 * This page used to bounce every logged-out visitor to a login form. The
 * homepage says "practice on real systems", they click it, and the next thing
 * they see is a password field with no price, no explanation, and no reason to
 * make an account. The marketing page for the only paid product on the site was
 * behind the login.
 *
 * The boundary is stated here rather than buried in the terms. These seats live
 * inside our own GoHighLevel agency account, which exists to serve our members —
 * not to become the software a stranger's clients' data sits in. Somebody doing
 * real client work needs their own, and saying so is both the honest answer and
 * the more valuable one: a referred account pays us far better than a resold
 * seat, for as long as they keep it.
 */
import Link from 'next/link'
import { PrivateSpaceForm } from './PrivateSpaceForm'

export function SandboxPitch({
  price,
  affiliateUrl,
}: {
  price: number
  affiliateUrl: string | null
}) {
  return (
    <div className="page-ink">
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-56 w-[760px] h-[760px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(162,28,175,0.34), rgba(249,115,22,0.12) 52%, transparent 72%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-5 pt-20 pb-14 sm:pt-28 sm:pb-20">
          <span className="quieter block font-mono text-[11px] uppercase tracking-[0.16em] mb-6">
            Practice accounts
          </span>
          <h1 className="display text-[clamp(2.4rem,7vw,5rem)] max-w-[17ch] mb-8">
            Reading about a tool is not{' '}
            <span className="strikeout">the same as using one.</span>
          </h1>
          <p className="quiet text-lg leading-relaxed max-w-[48ch] mb-9">
            A real GoHighLevel account to build in, break, and put back together &mdash; so the work
            on your profile is work you have actually done, not a list of tools you say you know.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register?role=seeker&redirect=/sandbox" className="btn-grad">
              Make a free profile first
            </Link>
            <Link href="/resources" className="btn-outline">
              See the free briefs
            </Link>
          </div>
          <p className="quieter text-sm mt-5">
            Your profile and the briefs are free forever. Practice time is the only thing here that
            costs anything.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
        <div className="border-t border-white/10">
          <div className="py-9 grid sm:grid-cols-[minmax(0,14rem)_1fr] gap-5 sm:gap-10 border-b border-white/10">
            <div>
              <p className="display-sm text-3xl sm:text-4xl">&#8369;{price}</p>
              <p className="quieter text-sm mt-1.5">for 30 days</p>
            </div>
            <div>
              <h2 className="display-sm text-xl sm:text-2xl mb-2">A seat in the shared sandbox</h2>
              <p className="quiet text-[15px] leading-relaxed max-w-[54ch]">
                Your own login inside a GoHighLevel sub-account we run. Enough to work through the
                scenario briefs, learn the software properly, and finish something worth putting on
                your profile. You can earn more time instead of paying for it &mdash; two people who
                join through your link is a free month.
              </p>
            </div>
          </div>

          <div className="py-9 grid sm:grid-cols-[minmax(0,14rem)_1fr] gap-5 sm:gap-10 border-b border-white/10">
            <div>
              <p className="display-sm text-3xl sm:text-4xl">Ask us</p>
              <p className="quieter text-sm mt-1.5">arranged case by case</p>
            </div>
            <div>
              <h2 className="display-sm text-xl sm:text-2xl mb-2">A private space of your own</h2>
              <p className="quiet text-[15px] leading-relaxed max-w-[54ch] mb-4">
                Somewhere nobody else can touch. What you build stays built &mdash; a working funnel,
                a real pipeline, a calendar you can screen-share in an interview without somebody
                else&rsquo;s half-finished experiment in the frame.
              </p>
              {/* No price here on purpose. Ours is arranged per person, and what
                  suits somebody depends entirely on what they are actually
                  doing with it — which is a conversation, not a checkout. */}
              <PrivateSpaceForm />
            </div>
          </div>

          <div className="py-9 grid sm:grid-cols-[minmax(0,14rem)_1fr] gap-5 sm:gap-10">
            <div>
              <p className="display-sm text-3xl sm:text-4xl">Your own</p>
              <p className="quieter text-sm mt-1.5">direct from GoHighLevel</p>
            </div>
            <div>
              <h2 className="display-sm text-xl sm:text-2xl mb-2">Once you have paying clients</h2>
              <p className="quiet text-[15px] leading-relaxed max-w-[54ch] mb-4">
                The moment you are doing real work for a business, you need an account in your own
                name. Their contacts and conversations should sit on software they can be told about
                and you control &mdash; not inside ours.
              </p>
              {affiliateUrl ? (
                <a
                  href={affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm text-white/80 hover:text-white border-b border-white/30 hover:border-white pb-0.5 transition-colors"
                >
                  Start your own GoHighLevel account
                </a>
              ) : (
                <p className="quieter text-sm">Ask us and we will point you at the right plan.</p>
              )}
            </div>
          </div>
        </div>

        {/* Said here rather than only in the terms. Somebody deciding what to
            buy should not have to go and read a legal page to find the one rule
            that decides which of these they need. */}
        <div className="mt-10 border border-white/12 rounded-xl p-6 max-w-[62ch]">
          <h3 className="font-semibold mb-2">One rule on both practice accounts</h3>
          <p className="quiet text-[15px] leading-relaxed">
            They are for learning and for your own business.{' '}
            <strong className="text-white">Not for client work.</strong> If you are managing a real
            business&rsquo;s marketing, that business&rsquo;s data belongs in an account you hold
            yourself &mdash; which is better for them, better for you, and the only arrangement we
            are willing to run.
          </p>
        </div>
      </section>
    </div>
  )
}
