/*
 * The position, given a section instead of a pill.
 *
 * "No commission, ever" used to appear once, at 13px, inside a grey badge above
 * the fold — and it is not a nice extra, it is the entire argument for existing.
 * Upwork takes 0-15% of a freelancer's rate and charges them to submit a
 * proposal; OnlineJobs.ph charges the employer a monthly fee for the right to
 * send a message. Both put a toll between the work and the person doing it.
 *
 * It is the only dark section on the page, and deliberately so. Nine sections on
 * identical paper read as a list rather than a composed page; one moment of
 * contrast is what gives the scroll a shape, and this is the part that has
 * earned it.
 */
import Link from 'next/link'

const TOLLS = [
  {
    heading: 'No commission on what you earn',
    body: 'Not fifteen percent, not ten, not five. You agree a rate with a business and that is the number that reaches you.',
  },
  {
    heading: 'No fee to apply',
    body: 'No connects, no credits, no paying for the chance to be considered. Message anyone you like, as often as you like.',
  },
  {
    heading: 'Free for businesses too',
    body: 'No subscription to browse, no charge to make contact. The cost of hiring here is the wage you agree, and nothing else.',
  },
]

export function NoTollSection() {
  return (
    <section className="bg-[#17121a] text-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">
          What we{' '}
          <span className="bg-gradient-to-r from-brand-pink via-[#f472b6] to-brand-orange bg-clip-text text-transparent">
            don&apos;t
          </span>{' '}
          charge for
        </h2>
        <p className="text-white/70 max-w-2xl leading-relaxed mb-10">
          Every other marketplace puts a toll between you and the work. We make our money elsewhere,
          which means the only thing we want from you is that you get hired.
        </p>

        <div className="grid sm:grid-cols-3 gap-px bg-white/[0.14] border border-white/[0.14] rounded-xl overflow-hidden">
          {TOLLS.map(item => (
            <div key={item.heading} className="bg-[#17121a] p-6">
              <h3 className="font-semibold text-white mb-2 leading-snug">{item.heading}</h3>
              <p className="text-sm text-white/65 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-white/60 mt-6 leading-relaxed">
          {/* The argument this whole position rests on already exists as a page
              and nothing linked to it. */}
          <Link
            href="/virtual-freaks-vs-upwork"
            className="text-brand-pink hover:text-white transition-colors underline underline-offset-2"
          >
            How this compares to Upwork
          </Link>{' '}
          &mdash; the fees, side by side.
        </p>
      </div>
    </section>
  )
}
