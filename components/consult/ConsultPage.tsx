/*
 * The page a LinkedIn profile points at.
 *
 * Somebody arriving here has already decided to talk — they clicked a booking
 * link. So this is not a sales page and must not read as one. The whole job is
 * to confirm they are in the right place, say what the thirty minutes actually
 * is, and get out of the way of the calendar.
 *
 * Two columns, because one column put six hundred pixels of identity above the
 * thing the visitor came to use. Everything on the left is context, answered in
 * the time it takes to glance at it; the calendar is on the right, in view on
 * arrival. Below the breakpoint it stacks, and the left block is tightened so
 * the calendar is still close to the fold on a phone.
 *
 * Set on paper rather than the ink used elsewhere on the marketing pages, for
 * one practical reason: Calendly's embed is white, and recolouring it is a paid
 * feature. A white widget sitting in a dark page looks broken, and looking
 * broken is expensive on the one page where the visit was already earned.
 *
 * No headshot. The Calendly widget shows Spencer's photo the moment the booking
 * flow starts, and a second portrait beside it is the kind of repetition that
 * reads as a template.
 */
import Script from 'next/script'

const CALENDLY = 'https://calendly.com/samhauolijavier/30min'

export function ConsultPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-10 lg:gap-16 items-start">

          <header className="text-center lg:text-left lg:pt-2">
            {/* The real mark, cropped out of the LinkedIn banner SVG.
                Everything below the eye was left behind on purpose: the banner
                was auto-traced from a raster, and the tracer turned the thin
                tagline letterforms into "SO Ui ONS THAI NEVER SLEEP". The words
                are set in type underneath instead, which is legible and scales.
                Plain <img> rather than next/image — an SVG has no sizes to
                optimise, and the loader only adds a request. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/insomniac.svg"
              alt="Insomniac Systems"
              width={150}
              height={97}
              className="block mx-auto lg:mx-0"
              style={{ width: 150, height: 'auto' }}
            />
            {/* The one place the brand gradient appears. It ties the page to the
                site it is hosted on without putting a Virtual Freaks mark above
                an Insomniac name. */}
            <span
              aria-hidden
              className="block h-[2.5px] rounded-full mt-3.5 mx-auto lg:mx-0"
              style={{ width: 56, background: 'linear-gradient(to right,#a21caf,#e879f9,#f97316)' }}
            />
            <p
              className="text-brand-muted mt-3 mb-8"
              style={{ fontSize: 9.5, letterSpacing: '0.24em' }}
            >
              SOLUTIONS THAT NEVER SLEEP
            </p>

            <h1 className="text-3xl font-black text-brand-text tracking-tight mb-2">
              Spencer Javier
            </h1>
            <p className="text-brand-text text-[15px] font-medium leading-snug">
              Fractional COO &mdash; operations, systems and the team to run them
            </p>
            <p className="text-brand-muted text-[13px] mt-1.5 leading-snug">
              Founder, Insomniac Systems &nbsp;&middot;&nbsp; Head Freak, Virtual Freaks
            </p>

            <div className="h-px bg-brand-border my-7" />

            <p className="text-brand-text leading-relaxed mb-3">
              Thirty minutes. Tell me about one process end to end &mdash; the one that keeps
              falling over &mdash; and I will tell you where it actually breaks.
            </p>
            <p className="text-brand-muted text-[15px] leading-relaxed">
              No deck and no pitch. If I am not the right person for it, I will say so and point
              you at what I would do instead.
            </p>

            <p className="text-xs text-brand-muted mt-7">
              Prefer email?{' '}
              <a
                href="mailto:spencer@insomniac.systems"
                className="text-brand-purple hover:text-brand-pink underline underline-offset-2"
              >
                spencer@insomniac.systems
              </a>
            </p>
          </header>

          {/* min-width is Calendly's own floor; below it the widget scrolls
              sideways inside itself rather than reflowing. */}
          <div
            className="calendly-inline-widget rounded-xl overflow-hidden lg:-mt-2"
            data-url={`${CALENDLY}?hide_gdpr_banner=1&primary_color=a21caf`}
            style={{ minWidth: 320, height: 780 }}
          />
          <Script
            src="https://assets.calendly.com/assets/external/widget.js"
            strategy="lazyOnload"
          />

        </div>
      </div>
    </div>
  )
}
