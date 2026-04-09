import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://virtualfreaks.co'

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/browse`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/jobs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/virtual-freaks-vs-upwork`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]

  try {
    const profiles = await db.seekerProfile.findMany({
      where: {
        user: {
          active: true,
          email: { not: { contains: '@example.com' } },
        },
      },
      select: { username: true, updatedAt: true },
    })

    const profilePages: MetadataRoute.Sitemap = profiles
      .filter((p) => p.username)
      .map((p) => ({
        url: `${baseUrl}/talent/${p.username}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))

    const jobs = await db.jobNeed.findMany({
      where: {
        status: 'active',
        employer: {
          email: { not: { contains: '@example.com' } },
        },
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
