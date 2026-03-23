import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { excludeDemoAccounts } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://virtualfreaks.co'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/browse`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Dynamic talent profile pages
  let talentPages: MetadataRoute.Sitemap = []
  try {
    const profiles = await db.seekerProfile.findMany({
      where: { openToWork: true, user: { active: true, ...excludeDemoAccounts() } },
      select: { username: true, updatedAt: true },
    })
    talentPages = profiles.map((profile) => ({
      url: `${baseUrl}/talent/${profile.username}`,
      lastModified: profile.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    console.error('Sitemap talent query failed:', error)
  }

  return [...staticPages, ...talentPages]
}
