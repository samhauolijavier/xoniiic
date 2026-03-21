import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { id: string; role: string }
  if (user.role !== 'employer') return NextResponse.json({ checked: 0, notified: 0 })

  const savedSearches = await db.savedSearch.findMany({
    where: { employerId: user.id },
  })

  let checked = 0
  let notified = 0

  for (const savedSearch of savedSearches) {
    checked++
    const since = savedSearch.lastNotified || savedSearch.createdAt

    // Build where conditions piece by piece to avoid TS complexity
    const andConditions: Record<string, unknown>[] = [
      { user: { active: true } },
      { createdAt: { gte: since } },
    ]

    if (savedSearch.category) {
      andConditions.push({ skills: { some: { skill: { category: savedSearch.category } } } })
    }
    if (savedSearch.availability) {
      andConditions.push({ availability: savedSearch.availability })
    }
    if (savedSearch.minRate) {
      andConditions.push({ hourlyRate: { gte: savedSearch.minRate } })
    }
    if (savedSearch.maxRate) {
      andConditions.push({ hourlyRate: { lte: savedSearch.maxRate } })
    }
    if (savedSearch.minEnglish) {
      andConditions.push({ englishRating: { gte: savedSearch.minEnglish } })
    }
    if (savedSearch.search) {
      andConditions.push({
        OR: [
          { username: { contains: savedSearch.search } },
          { bio: { contains: savedSearch.search } },
          { user: { name: { contains: savedSearch.search } } },
          { skills: { some: { skill: { name: { contains: savedSearch.search } } } } },
        ],
      })
    }

    const count = await db.seekerProfile.count({ where: { AND: andConditions } })

    if (count > 0) {
      const params = new URLSearchParams()
      if (savedSearch.search) params.set('search', savedSearch.search)
      if (savedSearch.category) params.set('category', savedSearch.category)
      if (savedSearch.availability) params.set('availability', savedSearch.availability)
      if (savedSearch.minRate) params.set('minRate', String(savedSearch.minRate))
      if (savedSearch.maxRate) params.set('maxRate', String(savedSearch.maxRate))
      if (savedSearch.minEnglish) params.set('minEnglish', String(savedSearch.minEnglish))
      const actionUrl = `/browse?${params.toString()}`

      await db.notification.create({
        data: {
          userId: user.id,
          type: 'general',
          title: 'New matches for your saved search',
          message: `${count} new freelancer${count === 1 ? '' : 's'} match your "${savedSearch.name}" search since your last visit`,
          actionUrl,
        },
      })
      notified++
    }

    await db.savedSearch.update({
      where: { id: savedSearch.id },
      data: { lastNotified: new Date() },
    })
  }

  return NextResponse.json({ checked, notified })
}
