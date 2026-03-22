import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { seekerId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }
    const { seekerId } = params

    // Check seeker profile exists
    const profile = await db.seekerProfile.findUnique({ where: { id: seekerId } })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Toggle save
    const existing = await db.savedProfile.findUnique({
      where: { employerId_profileId: { employerId: user.id, profileId: seekerId } },
    })

    if (existing) {
      await db.savedProfile.delete({
        where: { employerId_profileId: { employerId: user.id, profileId: seekerId } },
      })
      return NextResponse.json({ saved: false })
    } else {
      await db.savedProfile.create({
        data: { employerId: user.id, profileId: seekerId },
      })
      return NextResponse.json({ saved: true })
    }
  } catch (error) {
    console.error('Save toggle error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { seekerId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ saved: false })
    }

    const user = session.user as { id: string }
    const { seekerId } = params

    const saved = await db.savedProfile.findUnique({
      where: { employerId_profileId: { employerId: user.id, profileId: seekerId } },
    })

    return NextResponse.json({ saved: !!saved })
  } catch (error) {
    console.error('Save check error:', error)
    return NextResponse.json({ saved: false })
  }
}
