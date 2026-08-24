import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'

export const dynamic = 'force-dynamic'

/*
 * Who clicked one ad.
 *
 * Grouped by person rather than listed per click, because three clicks from
 * one member is one interested person, not three — and a list that says
 * otherwise reads as more interest than there is.
 *
 * Every row carries whether that member agreed to marketing. Seeing who
 * clicked and being allowed to email them are different permissions, and the
 * second one is theirs to give.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const clicks = await withRetry(() => db.adClick.findMany({
      where: { adId: params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, role: true, marketingOptIn: true,
            seekerProfile: { select: { username: true } },
          },
        },
      },
    }))

    const byPerson = new Map<string, {
      id: string
      name: string | null
      email: string
      role: string
      username: string | null
      marketingOptIn: boolean
      clicks: number
      lastClickedAt: Date
    }>()

    for (const click of clicks) {
      const seen = byPerson.get(click.userId)
      if (seen) {
        seen.clicks++
        continue
      }
      byPerson.set(click.userId, {
        id: click.user.id,
        name: click.user.name,
        email: click.user.email,
        role: click.user.role,
        username: click.user.seekerProfile?.username ?? null,
        marketingOptIn: click.user.marketingOptIn,
        clicks: 1,
        // First row wins: the list is newest first, so this is their latest.
        lastClickedAt: click.createdAt,
      })
    }

    const people = Array.from(byPerson.values())
    return NextResponse.json({
      people,
      totalClicks: clicks.length,
      contactable: people.filter(p => p.marketingOptIn).length,
    })
  } catch (error) {
    console.error('Ad clicks load error:', error)
    return NextResponse.json({ error: 'Could not load who clicked.' }, { status: 500 })
  }
}
