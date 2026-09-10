/*
 * The page a LinkedIn profile points at.
 *
 * Somebody arriving here has already decided to talk — they clicked a booking
 * link. So this is not a sales page and must not read as one. The whole job is
 * to confirm they are in the right place, say what the thirty minutes actually
 * is, and get out of the way of the calendar.
 *
 * Set on paper rather than the ink used elsewhere on the marketing pages, for
 * one practical reason: Calendly's embed is white, and recolouring it is a paid
 * feature. A white widget sitting in a dark page looks broken, and looking
 * broken is expensive on the one page where the visit was already earned.
 */
import Image from 'next/image'
import Script from 'next/script'

const CALENDLY = 'https://calendly.com/samhauolijavier/30min'

/* Dropped into public/ whenever there is one. Until then the monogram renders,
   which is better than a broken image on a page whose whole job is to look
   like somebody is home. */
const HEADSHOT = '/spencer.jpg'

export function ConsultPage({ hasHeadshot = false }: { hasHeadshot?: boolean }) {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-5 sm:px-6 pt-16 pb-20 sm:pt-20">

        <header className="text-center">
          {/* The same 2px gradient ring the testimonials use — the one place
              the brand mark shows up on a page that otherwise stays quiet. */}
          <span
            className="inline-block rounded-full p-[3px] mb-5"
            style={{ backgroundImage: 'linear-gradient(135deg, #a21caf, #e879f9, #f97316)' }}
          >
            {hasHeadshot ? (
              <Image
                src={HEADSHOT}
                alt="Spencer Javier"
                width={224}
                height={224}
                priority
                className="w-28 h-28 rounded-full object-cover block bg-white"
              />
            ) : (
              <span className="w-28 h-28 rounded-full bg-white flex items-center justify-center block">
                <span className="text-3xl font-black text-brand-text tracking-tight">SJ</span>
              </span>
            )}
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-brand-text tracking-tight mb-2">
            Spencer Javier
          </h1>
          <p className="text-brand-muted text-[15px] mb-8">
            Fractional COO &middot; Operations, systems and the team to run them
          </p>

          <div className="max-w-lg mx-auto text-left sm:text-center">
            <p className="text-brand-text leading-relaxed mb-3">
              Thirty minutes. Tell me about one process end to end &mdash; the one that keeps
              falling over &mdash; and I will tell you where it actually breaks.
            </p>
            <p className="text-brand-muted text-[15px] leading-relaxed">
              No deck and no pitch. If I am not the right person for it, I will say so and point
              you at what I would do instead.
            </p>
          </div>
        </header>

        <div className="h-px bg-brand-border my-10" />

        {/* min-width is Calendly's own floor; below it the widget scrolls
            sideways inside itself rather than reflowing. */}
        <div
          className="calendly-inline-widget rounded-xl overflow-hidden"
          data-url={`${CALENDLY}?hide_gdpr_banner=1&primary_color=a21caf`}
          style={{ minWidth: 320, height: 760 }}
        />
        <Script
          src="https://assets.calendly.com/assets/external/widget.js"
          strategy="lazyOnload"
        />

        <p className="text-center text-xs text-brand-muted mt-10">
          Prefer email?{' '}
          <a
            href="mailto:spencer@insomniac.systems"
            className="text-brand-purple hover:text-brand-pink underline underline-offset-2"
          >
            spencer@insomniac.systems
          </a>
        </p>
      </div>
    </div>
  )
}
