import { db } from '@/lib/db'
import { publiclyListable } from '@/lib/constants'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * This endpoint is public and unauthenticated — it feeds branding and copy to
 * every visitor. So it is not a general settings store: anything named
 * `private.*` is withheld here and must be read server-side by whatever needs
 * it. The GCash number lives behind that prefix, because a personal mobile
 * number on an open endpoint is a number that gets scraped.
 */
const PRIVATE_PREFIX = 'private.'

export async function GET() {
  try {
    const settings = await db.siteSetting.findMany()
    const map: Record<string, string> = {}
    settings.forEach((s) => {
      if (s.key.startsWith(PRIVATE_PREFIX)) return
      map[s.key] = s.value
    })

    // Real counts, so the homepage does not have to invent any. An admin
    // override still wins — this only replaces the hardcoded defaults, which
    // claimed 500 freelancers and 50 categories regardless of the truth. On a
    // launch page aimed at people who will immediately go and look, a number
    // that cannot survive being checked costs more than no number at all.
    const [seekers, skills, faces] = await Promise.all([
      // The same bar browse uses. This counted every row, so the hero could
      // claim 27 profiles while browse showed a dozen — a number that fails
      // the first check is worse than no number.
      db.seekerProfile.count({ where: { user: publiclyListable() } }),
      db.skill.count(),
      // A handful of real members for the hero. It is a marketplace of people
      // and it showed none of them until three sections down.
      db.seekerProfile.findMany({
        where: { user: publiclyListable(), avatarUrl: { not: null } },
        select: { avatarUrl: true, username: true },
        orderBy: { profileViews: 'desc' },
        take: 5,
      }),
    ])
    map._seekerCount = String(seekers)
    map._skillCount = String(skills)
    map._faces = JSON.stringify(faces)

    return NextResponse.json(map)
  } catch {
    return NextResponse.json({})
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        await db.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      }
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
