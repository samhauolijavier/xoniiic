/*
 * The other half of a two-sided marketplace.
 *
 * Employers had one button in the hero and nothing else on the page — which is
 * a strange thing on a site whose thinner side is demand. This says the two
 * things a business actually needs to know before clicking: it costs nothing,
 * and the people here can show their work rather than describe it.
 */
import Link from 'next/link'

export function ForBusinesses() {
  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="card p-8 sm:p-10 border-brand-purple/25 bg-brand-purple/[0.03]">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand-purple mb-3">
              Hiring instead?
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-text mb-3 tracking-tight">
              Nobody should have to pay to hire, either
            </h2>
            <p className="text-brand-muted leading-relaxed max-w-xl">
              No subscription, no fee to make contact, and no commission on what you pay. Every profile
              shows work the person has actually finished, so you are judging evidence rather than
              adjectives &mdash; and you message them directly.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-none">
            <Link href="/hire" className="btn-primary text-center whitespace-nowrap">
              See how hiring works
            </Link>
            <Link
              href="/register?role=employer&redirect=/browse"
              className="btn-secondary text-center whitespace-nowrap"
            >
              Browse people
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
