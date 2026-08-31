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

export default async function TestimonialsPage() {
  let items: {
    id: string
    body: string
    roleTitle: string | null
    company: string | null
    videoUrl: string | null
    user: { name: string | null; seekerProfile: { username: string; avatarUrl: string | null } | null }
  }[] = []

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

  return (
    <div className="page-ink"><div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
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
        <div
          className={
            items.length === 1 ? 'grid gap-5 max-w-2xl'
            : items.length === 2 ? 'grid sm:grid-cols-2 gap-5'
            : 'grid sm:grid-cols-2 lg:grid-cols-3 gap-5'
          }
        >
          {items.map(t => {
            const username = t.user.seekerProfile?.username
            const body = (
              <blockquote className="rounded-xl border border-white/12 bg-white/[0.03] p-6 flex flex-col h-full">
                {t.videoUrl && (
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
                <footer className="flex items-center gap-3.5 mt-5 pt-4 border-t border-brand-border">
                  {/* The person is the point of the page, so they get a ring
                      rather than a thumbnail. The 2px gradient edge is the
                      same warm half of the mark the headline uses. */}
                  <span
                    className="flex-none rounded-full p-[2px]"
                    style={{ backgroundImage: 'linear-gradient(135deg, #e879f9, #f97316)' }}
                  >
                    {t.user.seekerProfile?.avatarUrl ? (
                      <Image
                        src={t.user.seekerProfile.avatarUrl}
                        alt=""
                        width={112}
                        height={112}
                        className="w-14 h-14 rounded-full object-cover block"
                      />
                    ) : (
                      <span className="w-14 h-14 rounded-full bg-brand-card block" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <cite className="not-italic font-semibold text-[15px] block truncate">
                      {t.user.name ?? 'Virtual Freaks member'}
                    </cite>
                    <span className="text-xs text-brand-muted block leading-snug line-clamp-2 mt-0.5">
                      {[t.roleTitle, t.company].filter(Boolean).join(' · ') || 'Placed through Virtual Freaks'}
                    </span>
                  </div>
                </footer>
              </blockquote>
            )

            // Linked to their profile where there is one — the story and the
            // person it belongs to are more use together than apart.
            return username
              ? <Link key={t.id} href={`/@${username}`} className="block h-full hover-glow rounded-2xl">{body}</Link>
              : <div key={t.id} className="h-full">{body}</div>
          })}
        </div>
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
