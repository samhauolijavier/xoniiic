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

  return (
    <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-text mb-2">
            From people we placed
          </h2>
          <p className="text-brand-muted">
            Written by them, in their words. Nothing here is edited.
          </p>
        </div>
        {/* Only once there is more to see than what is already on screen. */}
        {total > items.length && (
          <Link href="/testimonials" className="btn-secondary text-sm">
            Read all {total} &rarr;
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {items.map(t => (
          <blockquote key={t.id} className="card p-6 flex flex-col">
            {t.videoUrl && (
              /* Never autoplays. A page that starts talking at you is a page
                 people close. preload="metadata" fetches a few kilobytes for
                 the poster frame rather than the whole file. */
              /* eslint-disable-next-line jsx-a11y/media-has-caption */
              <video
                src={t.videoUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-lg bg-black mb-4 aspect-video object-cover"
              />
            )}
            <p className="text-sm leading-relaxed text-brand-text flex-1 whitespace-pre-wrap">
              {t.body}
            </p>
            <footer className="flex items-center gap-3 mt-5 pt-4 border-t border-brand-border">
              {t.user.seekerProfile?.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={t.user.seekerProfile.avatarUrl}
                  alt={t.user.name ?? 'Profile photo'}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover flex-none"
                />
              ) : (
                <span className="w-9 h-9 rounded-full bg-brand-purple/[0.10] flex-none" />
              )}
              <div className="min-w-0">
                <cite className="not-italic font-semibold text-sm block truncate">
                  {t.user.name ?? 'Virtual Freaks member'}
                </cite>
                <span className="text-xs text-brand-muted block truncate">
                  {[t.roleTitle, t.company].filter(Boolean).join(' · ') || 'Placed through Virtual Freaks'}
                </span>
              </div>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}
