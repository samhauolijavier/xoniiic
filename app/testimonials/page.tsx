/*
 * Every story, on one public page.
 *
 * The homepage carries three, which is right for a homepage and wrong as the
 * only place they exist. This is the page you send a partner who is deciding
 * whether any of it is real, and the one Google can index — a page of specific
 * accounts from named people is the strongest thing on the site that we did not
 * write ourselves.
 *
 * Note the URL pair. /testimonials is this; /testimonials/write is the form.
 * They were /testimonials and /testimonial before, one letter apart, which sent
 * the first person who guessed to a 404.
 *
 * On the layout, which was the whole problem here:
 *
 * These were an equal-height grid. Real testimonials are not equal height —
 * one person writes four paragraphs and the next writes four lines — so every
 * short story was stretched to match the tallest in its row and left two
 * thirds of its card empty, with the attribution stranded at the bottom of a
 * void. Four stories also meant three across and one alone underneath.
 *
 * So: the first story leads, laid out sideways where a long one can use the
 * width instead of being poured into a 250px column. The rest flow in CSS
 * columns, where each card is exactly as tall as what is in it and the last
 * one lands in whichever column is shortest rather than starting a new row on
 * its own.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { db, withRetry } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Stories from people we placed',
  description:
    'Written by them, in their own words, unedited. What remote work has actually been like for people who found it through Virtual Freaks.',
  alternates: { canonical: 'https://virtualfreaks.co/testimonials' },
}

interface Item {
  id: string
  body: string
  roleTitle: string | null
  company: string | null
  videoUrl: string | null
  user: { name: string | null; seekerProfile: { username: string; avatarUrl: string | null } | null }
}

const roleOf = (t: Item) =>
  [t.roleTitle, t.company].filter(Boolean).join(' · ') || 'Placed through Virtual Freaks'

/* The person is the point of the page, so they get a ring rather than a
   thumbnail. The 2px gradient edge is the same warm half of the mark the
   headline uses. */
function Avatar({ t, px }: { t: Item; px: number }) {
  const url = t.user.seekerProfile?.avatarUrl
  return (
    <span
      className="flex-none rounded-full p-[2px] block"
      style={{ backgroundImage: 'linear-gradient(135deg, #e879f9, #f97316)' }}
    >
      {url ? (
        <Image
          src={url}
          alt=""
          width={px * 2}
          height={px * 2}
          className="rounded-full object-cover block"
          style={{ width: px, height: px }}
        />
      ) : (
        <span className="rounded-full bg-brand-card block" style={{ width: px, height: px }} />
      )}
    </span>
  )
}

function Video({ src }: { src: string }) {
  return (
    /* eslint-disable-next-line jsx-a11y/media-has-caption */
    <video
      src={src}
      controls
      playsInline
      preload="metadata"
      className="w-full rounded-lg bg-black mb-4 aspect-video object-cover"
    />
  )
}

/* Wrapped in a link only where there is a profile to reach — the story and
   the person it belongs to are more use together than apart. */
function Linked({ t, className, children }: { t: Item; className: string; children: React.ReactNode }) {
  const username = t.user.seekerProfile?.username
  return username
    ? <Link href={`/@${username}`} className={className}>{children}</Link>
    : <div className={className}>{children}</div>
}

/*
 * The lead. Sideways on anything above a phone: who said it on the left,
 * what they said on the right, at a size that reads like a pull quote rather
 * than a card. A long story is an asset here instead of the thing that broke
 * the row.
 */
function Lead({ t }: { t: Item }) {
  return (
    <Linked t={t} className="card block p-6 sm:p-9 mb-5">
      <div className="sm:flex sm:gap-9">
        <div className="flex sm:block items-center gap-4 flex-none sm:w-44 mb-6 sm:mb-0">
          <Avatar t={t} px={60} />
          <div className="min-w-0 sm:mt-4">
            <cite className="not-italic font-semibold text-brand-text text-base block">
              {t.user.name ?? 'Virtual Freaks member'}
            </cite>
            <span className="text-[13px] text-brand-muted block leading-snug mt-1">
              {roleOf(t)}
            </span>
            {/* The same rule the solo quote on the homepage uses. It anchors a
                column that is otherwise mostly air. */}
            <span
              aria-hidden
              className="hidden sm:block w-10 h-[3px] rounded-full mt-5"
              style={{ background: 'linear-gradient(to right,#a21caf,#e879f9,#f97316)' }}
            />
          </div>
        </div>
        <blockquote className="flex-1 min-w-0">
          {t.videoUrl && <Video src={t.videoUrl} />}
          <p className="text-[15px] sm:text-base leading-[1.75] text-brand-text whitespace-pre-wrap">
            {t.body}
          </p>
        </blockquote>
      </div>
    </Linked>
  )
}

/* One of the rest. No h-full and no flex-1: the card is exactly as tall as
   what it holds, which is the entire fix. */
function Card({ t }: { t: Item }) {
  return (
    <Linked t={t} className="card block p-6 mb-5 break-inside-avoid">
      <blockquote>
        {t.videoUrl && <Video src={t.videoUrl} />}
        <p className="text-[14.5px] leading-[1.7] text-brand-text whitespace-pre-wrap">
          {t.body}
        </p>
      </blockquote>
      <footer className="flex items-center gap-3.5 mt-5 pt-4 border-t border-brand-border">
        <Avatar t={t} px={48} />
        <div className="min-w-0">
          <cite className="not-italic font-semibold text-[15px] text-brand-text block truncate">
            {t.user.name ?? 'Virtual Freaks member'}
          </cite>
          <span className="text-xs text-brand-muted block leading-snug mt-0.5">
            {roleOf(t)}
          </span>
        </div>
      </footer>
    </Linked>
  )
}

export default async function TestimonialsPage() {
  let items: Item[] = []

  try {
    items = await withRetry(() => db.testimonial.findMany({
      where: { state: 'approved', consentPublic: true },
      orderBy: [{ featured: 'desc' }, { reviewedAt: 'desc' }],
      select: {
        id: true, body: true, roleTitle: true, company: true, videoUrl: true,
        user: {
          select: {
            name: true,
            seekerProfile: { select: { username: true, avatarUrl: true } },
          },
        },
      },
    }))
  } catch (error) {
    console.error('Testimonials page load failed:', error)
  }

  // Below three there is nothing to lead — one wide card and a lone straggler
  // looks like a mistake, so they simply sit side by side.
  const leads = items.length >= 3
  const lead = leads ? items[0] : null
  const rest = leads ? items.slice(1) : items

  return (
    <div className="page-ink"><div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <h1 className="text-3xl sm:text-4xl font-black text-brand-text mb-3">
        Stories from <span className="mark-warm">people we placed</span>
      </h1>
      <p className="text-brand-muted max-w-2xl leading-relaxed mb-10">
        Written by them, in their words. Nothing here is edited, and nothing is published without
        their say-so. Where somebody has left the rough parts in, we left those in too &mdash; a page
        of perfect reviews convinces nobody.
      </p>

      {items.length === 0 ? (
        <div className="card p-8 max-w-xl">
          <h2 className="font-semibold text-brand-text mb-2">The first ones are being written</h2>
          <p className="text-sm text-brand-muted leading-relaxed">
            We have asked the people we have placed to describe what it has actually been like. As
            they come back, they appear here &mdash; unedited.
          </p>
        </div>
      ) : (
        <>
          {lead && <Lead t={lead} />}
          {rest.length > 0 && (
            {/* Two columns, not three, until there are enough stories to fill
                three. Three columns of four stories is a narrow, choppy line
                length in service of a shape nobody asked for. */}
            <div className={
              rest.length === 1 ? 'max-w-2xl'
              : rest.length === 2 ? 'grid sm:grid-cols-2 gap-5 [&>*]:mb-0'
              : rest.length <= 4 ? 'columns-1 md:columns-2 gap-5'
              : 'columns-1 md:columns-2 xl:columns-3 gap-5'
            }>
              {rest.map(t => <Card key={t.id} t={t} />)}
            </div>
          )}
        </>
      )}

      <div className="mt-12 pt-8 border-t border-brand-border">
        <p className="text-sm text-brand-muted leading-relaxed">
          Been hired through Virtual Freaks?{' '}
          <Link href="/testimonials/write" className="text-brand-purple hover:text-brand-pink transition-colors underline underline-offset-2">
            Share your story
          </Link>{' '}
          &mdash; it takes a few minutes and it is the thing that helps the next person most.
        </p>
      </div>
    </div></div>
  )
}
