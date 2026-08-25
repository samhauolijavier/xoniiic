/*
 * The other half of a two-sided marketplace.
 *
 * A rule and a headline rather than a tinted card, for the same reason as
 * everything else on this page: one more bordered box would have made it the
 * fifth in a row.
 */
import Link from 'next/link'

export function ForBusinesses() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
      <div className="border-t border-white/10 pt-10 flex flex-col lg:flex-row lg:items-end gap-10">
        <div className="flex-1 min-w-0">
          <p className="quieter font-mono text-[11px] uppercase tracking-[0.16em] mb-5">
            Hiring instead?
          </p>
          <h2 className="display-sm text-3xl sm:text-[2.75rem] max-w-[18ch]">
            Nobody should have to pay to hire, either
          </h2>
          <p className="quiet mt-5 leading-relaxed max-w-[52ch]">
            No subscription, no fee to make contact, and no commission on what you pay. Every profile
            shows work the person has actually finished, so you are judging evidence rather than
            adjectives &mdash; and you message them directly.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 flex-none">
          <Link href="/hire" className="btn-light text-[15px]">
            See how hiring works
          </Link>
          <Link href="/register?role=employer&redirect=/browse" className="btn-outline text-[15px]">
            Browse people
          </Link>
        </div>
      </div>
    </section>
  )
}
