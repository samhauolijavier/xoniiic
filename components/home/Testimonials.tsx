/*
 * Real stories from people actually placed.
 *
 * Renders nothing at all when there are none. An empty testimonials section
 * with a "coming soon" placeholder advertises that nobody has vouched yet,
 * which is worse than the section simply not existing.
 *
 * No star ratings and no company logos. Both are trivially faked and everyone
 * knows it. A name, a face, a role, and something specific enough that it
 * could only have come from a real person is the whole argument.
 */
import Link from 'next/link'
import { db, withRetry } from '@/lib/db'

export async function Testimonials({ limit = 3 }: { limit?: number }) {
  let items: {
    id: string
    body: string
    roleTitle: string | null
    company: string | null
    videoUrl: string | null
    user: { name: string | null; seekerProfile: { username: string; avatarUrl: string | null } | null }
  }[] = []

  let total = 0

  try {
    total = await withRetry(() => db.testimonial.count({
      where: { state: 'approved', consentPublic: true },
    }))
    items = await withRetry(() => db.testimonial.findMany({
      where: { state: 'approved', consentPublic: true },
      orderBy: [{ featured: 'desc' }, { reviewedAt: 'desc' }],
      take: limit,
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
    console.error('Testimonials load failed:', error)
  }

  if (!items.length) return null

  // One story is a pull quote, not a card.
  //
  // A single 400-word testimonial in a bordered box at a third of the width
  // becomes a column of small text with an acre of nothing beside it — which is
  // exactly how it looked. Set large and given the room, the same words carry a
  // section on their own, and it will be a while before there are three.
  const solo = items.length === 1
  const one = items[0]

  return (
    <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-9">
        <div>
          <h2 className="display-sm text-3xl sm:text-4xl mb-3">
            From people we placed
          </h2>
          <p className="quiet">
            Written by them, in their words. Nothing here is edited.
          </p>
        </div>
        {total > items.length && (
          <Link href="/testimonials" className="btn-outline text-sm">
            Read all {total} &rarr;
          </Link>
        )}
      </div>

      {solo ? (
        <figure className="max-w-[64ch]">
          {one.videoUrl && (
            /* eslint-disable-next-line jsx-a11y/media-has-caption */
            <video
              src={one.videoUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full max-w-2xl rounded-xl bg-black mb-8 aspect-video object-cover"
            />
          )}
          {/* The rule is the only ornament, and it carries the one gradient. */}
          <span
            aria-hidden
            className="block w-14 h-[3px] rounded-full mb-7"
            style={{ background: 'linear-gradient(to right,#a21caf,#e879f9,#f97316)' }}
          />
          <blockquote className="text-lg sm:text-[1.4rem] leading-[1.55] text-white/90 whitespace-pre-wrap">
            {one.body}
          </blockquote>
          <figcaption className="flex items-center gap-3.5 mt-8">
            {one.user.seekerProfile?.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={one.user.seekerProfile.avatarUrl}
                alt=""
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover flex-none"
              />
            ) : (
              <span className="w-11 h-11 rounded-full bg-white/10 flex-none" />
            )}
            <div className="min-w-0">
              <cite className="not-italic font-semibold block text-white">
                {one.user.name ?? 'Virtual Freaks member'}
              </cite>
              <span className="text-sm text-white/45 block leading-snug">
                {[one.roleTitle, one.company].filter(Boolean).join(' · ') || 'Placed through Virtual Freaks'}
              </span>
            </div>
          </figcaption>
        </figure>
      ) : (
        /* Rules between, not boxes around — the same move as every other
           section on the page.

           items-start, and no flex-1 on the quote. Stretching every column to
           the tallest and pinning the name to the bottom left whoever wrote
           four lines sitting above an acre of nothing, next to somebody who
           wrote four paragraphs. The name now follows the words it belongs to.
           The excerpt is clamped for the same reason: this is the teaser, and
           the whole story is one click away on /testimonials. */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 border-t border-white/10 pt-10 items-start">
          {items.map(t => (
            <blockquote key={t.id} className="flex flex-col">
              {t.videoUrl && (
                /* eslint-disable-next-line jsx-a11y/media-has-caption */
                <video
                  src={t.videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full rounded-lg bg-black mb-5 aspect-video object-cover"
                />
              )}
              <p className="text-[15px] leading-relaxed text-white/80 whitespace-pre-wrap line-clamp-[11]">
                {t.body}
              </p>
              <footer className="flex items-center gap-3 mt-5">
                {t.user.seekerProfile?.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={t.user.seekerProfile.avatarUrl}
                    alt=""
                    width={38}
                    height={38}
                    className="w-[38px] h-[38px] rounded-full object-cover flex-none"
                  />
                ) : (
                  <span className="w-[38px] h-[38px] rounded-full bg-white/10 flex-none" />
                )}
                <div className="min-w-0">
                  <cite className="not-italic font-semibold text-sm block truncate text-white">
                    {t.user.name ?? 'Virtual Freaks member'}
                  </cite>
                  <span className="text-xs text-white/45 block leading-snug line-clamp-2">
                    {[t.roleTitle, t.company].filter(Boolean).join(' · ') || 'Placed through Virtual Freaks'}
                  </span>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      )}
    </section>
  )
}
