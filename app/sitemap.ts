/*
 * What we ask Google to index.
 *
 * Two rules decide what belongs here.
 *
 * It must be reachable by a logged-out crawler. /browse used to sit at
 * priority 0.9 and hard-redirects anyone without a session to the register
 * form, so Googlebot saw a redirect where we claimed our second most important
 * page was. A sitemap entry that resolves to a redirect is worse than no entry.
 *
 * And it must have something on it. Profiles are the growth engine here —
 * every member is a page that can rank for their own name and skills — but a
 * profile with no title and no bio is thin content, and submitting a few
 * hundred of those teaches Google the wrong thing about the whole domain.
 */
import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { publiclyListable } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://virtualfreaks.co'
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    // The employer side of the marketplace. Highest commercial intent on the
    // site and it was missing entirely.
    { url: `${baseUrl}/hire`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/jobs`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    // Free briefs anybody can read without an account — the most linkable
    // thing we publish, and the natural landing page for social posts.
    { url: `${baseUrl}/resources`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/virtual-freaks-vs-upwork`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/testimonials`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/leaderboard`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const profiles = await db.seekerProfile.findMany({
      where: {
        // Same bar the rest of the site uses to decide somebody is real:
        // active, verified, not a demo account. The old filter here let
        // unverified signups through, so the sitemap listed people the
        // homepage would not.
        user: publiclyListable(),
        OR: [
          { title: { not: null } },
          { bio: { not: null } },
        ],
      },
      select: { username: true, updatedAt: true },
    })

    const profilePages: MetadataRoute.Sitemap = profiles
      .filter((p) => p.username)
      .map((p) => ({
        url: `${baseUrl}/@${p.username}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))

    const jobs = await db.jobNeed.findMany({
      where: {
        status: 'active',
        employer: { email: { not: { contains: '@example.com' } } },
      },
      select: { id: true, updatedAt: true },
    })

    const jobPages: MetadataRoute.Sitemap = jobs.map((j) => ({
      url: `${baseUrl}/jobs/${j.id}`,
      lastModified: j.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...profilePages, ...jobPages]
  } catch {
    return staticPages
  }
}
