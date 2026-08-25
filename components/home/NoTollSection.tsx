/*
 * The position, as three ruled rows rather than three cards.
 *
 * A border on four sides makes an object; a border on one side makes a
 * structure. Nine bordered objects down a column is the shape that reads as
 * assembled from a kit — so the page uses rules and space from here on, and
 * keeps its boxes for the things that genuinely are objects: a person, a job.
 */
import Link from 'next/link'

const TOLLS = [
  {
    n: '01',
    heading: 'No commission on what you earn',
    body: 'Not fifteen percent, not ten, not five. You agree a rate with a business and that is the number that reaches you.',
  },
  {
    n: '02',
    heading: 'No fee to apply',
    body: 'No connects, no credits, no paying for the chance to be considered. Message anyone you like, as often as you like.',
  },
  {
    n: '03',
    heading: 'Free for businesses too',
    body: 'No subscription to browse, no charge to make contact. The cost of hiring here is the wage you agree, and nothing else.',
  },
]

export function NoTollSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <div className="grid lg:grid-cols-[minmax(0,26rem)_1fr] gap-12 lg:gap-20">
        <div>
          <h2 className="display-sm text-3xl sm:text-4xl">
            What we don&apos;t
            <br />
            charge for
          </h2>
          <p className="quiet mt-5 leading-relaxed">
            Every other marketplace puts a toll between you and the work. We make our money
            elsewhere, which means the only thing we want from you is that you get hired.
          </p>
          <Link
            href="/virtual-freaks-vs-upwork"
            className="inline-block mt-6 text-sm text-white/80 hover:text-white border-b border-white/30 hover:border-white pb-0.5 transition-colors"
          >
            How this compares to Upwork
          </Link>
        </div>

        <div>
          {TOLLS.map(item => (
            <div key={item.n} className="ink-row py-7 grid grid-cols-[2.5rem_1fr] gap-5 sm:gap-8">
              <span className="quieter font-mono text-xs pt-1.5">{item.n}</span>
              <div>
                <h3 className="display-sm text-xl sm:text-2xl mb-2">{item.heading}</h3>
                <p className="quiet text-[15px] leading-relaxed max-w-[52ch]">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
