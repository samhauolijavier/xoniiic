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
 *
 * Three columns of equal quotes read as reviews. One story given the room to
 * be a story, with the others beside it, reads as somebody's account of what
 * happened to them — which is the thing that actually moves a reader. So the
 * featured one takes two thirds and the rest stack alongside.
 *
 * What makes it a story rather than a pull quote is context, not editing:
 * a face at a size you can actually read, what they do now, and how long they
 * have been doing it. Nothing here rewrites or headlines anybody's words —
 * the section promises they are unedited, and a "punchy" extracted headline
 * would quietly break that promise.
 */
import Link from 'next/link'
import { db, withRetry } from '@/lib/db'

interface Item {
  id: string
  body: string
  roleTitle: string | null
  company: string | null
  placedSince: Date | null
  videoUrl: string | null
  user: { name: string | null; seekerProfile: { username: string; avatarUrl: string | null } | null }
}

/* Longer than this and the clamp will bite, so the link has somewhere to go.
   Shorter and "read more" would lead to the same words the reader just read. */
const FEATURE_CLAMP = 620
const SIDE_CLAMP = 300

const since = (d: Date | null) =>
  d ? `Placed ${new Date(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}` : null

const roleOf = (t: Item) =>
  [t.roleTitle, t.company].filter(Boolean).join(' · ') || 'Placed through Virtual Freaks'

function Face({ t, px }: { t: Item; px: number }) {
  const url = t.user.seekerProfile?.avatarUrl
  return (
    <span
      className="flex-none rounded-full p-[2px] block"
      style={{ backgroundImage: 'linear-gradient(135deg, #e879f9, #f97316)' }}
    >
      {url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={url}
          alt=""
          width={px}
          height={px}
          className="rounded-full object-cover block"
          style={{ width: px, height: px }}
        />
      ) : (
        <span className="rounded-full bg-white/10 block" style={{ width: px, height: px }} />
      )}
    </span>
  )
}

/* Anchored, so the link lands on this person's story rather than the top of a
   page of four and leaving the reader to find them again. */
const storyHref = (t: Item) => `/testimonials#t-${t.id}`

export async function Testimonials({ limit = 3 }: { limit?: number }) {
  let items: Item[] = []
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
        id: true, body: true, roleTitle: true, company: true, placedSince: true, videoUrl: true,
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
  const [feature, ...side] = items

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
          <figcaption className="flex items-center gap-4 mt-8">
            <Face t={one} px={64} />
            <div className="min-w-0">
              <cite className="not-italic font-semibold block text-white text-lg">
                {one.user.name ?? 'Virtual Freaks member'}
              </cite>
              <span className="text-sm text-white/45 block leading-snug">{roleOf(one)}</span>
              {since(one.placedSince) && (
                <span className="text-xs text-white/35 block mt-0.5">{since(one.placedSince)}</span>
              )}
            </div>
          </figcaption>
        </figure>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-10 border-t border-white/10 pt-10">
          {/* The feature: two thirds, a face you can read, and room to be an
              account of something rather than a quote about it. */}
          <figure className="lg:col-span-2 flex flex-col">
            <figcaption className="flex items-center gap-4 mb-6">
              <Face t={feature} px={72} />
              <div className="min-w-0">
                <cite className="not-italic font-semibold block text-white text-lg leading-tight">
                  {feature.user.name ?? 'Virtual Freaks member'}
                </cite>
                <span className="text-sm text-white/45 block leading-snug mt-0.5">
                  {roleOf(feature)}
                </span>
                {since(feature.placedSince) && (
                  <span className="text-xs text-white/35 block mt-1">
                    {since(feature.placedSince)}
                  </span>
                )}
              </div>
            </figcaption>

            {feature.videoUrl && (
              /* eslint-disable-next-line jsx-a11y/media-has-caption */
              <video
                src={feature.videoUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full max-w-xl rounded-xl bg-black mb-6 aspect-video object-cover"
              />
            )}

            {/* Capped at a readable measure. Two thirds of this container is
                about a hundred characters a line, which is past the point
                where the eye loses its place returning to the left margin. */}
            <blockquote className="text-[16px] sm:text-[17px] leading-[1.7] text-white/85 whitespace-pre-wrap line-clamp-[14] max-w-[66ch]">
              {feature.body}
            </blockquote>

            {feature.body.length > FEATURE_CLAMP && (
              <Link
                href={storyHref(feature)}
                className="text-sm font-medium text-white/90 hover:text-white mt-5 self-start inline-flex items-center gap-1.5 border-b border-white/25 hover:border-white/60 pb-0.5 transition-colors"
              >
                Read {(feature.user.name ?? 'their').split(' ')[0]}&rsquo;s full story &rarr;
              </Link>
            )}
          </figure>

          {/* The rest, stacked in the last third. Divided by a rule rather than
              boxed, the same as everything else on this page. */}
          <div className="lg:col-span-1 grid gap-8 content-start">
            {side.map(t => (
              <figure key={t.id} className="flex flex-col">
                <blockquote className="text-[15px] leading-relaxed text-white/80 whitespace-pre-wrap line-clamp-[8]">
                  {t.body}
                </blockquote>
                <figcaption className="flex items-center gap-3.5 mt-5">
                  <Face t={t} px={52} />
                  <div className="min-w-0">
                    <cite className="not-italic font-semibold text-[15px] block truncate text-white">
                      {t.user.name ?? 'Virtual Freaks member'}
                    </cite>
                    <span className="text-xs text-white/45 block leading-snug">{roleOf(t)}</span>
                  </div>
                </figcaption>
                {t.body.length > SIDE_CLAMP && (
                  <Link
                    href={storyHref(t)}
                    className="text-[13px] font-medium text-white/70 hover:text-white mt-3.5 self-start transition-colors"
                  >
                    Read more &rarr;
                  </Link>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
