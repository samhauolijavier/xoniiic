import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function ownProfile() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  const user = session.user as { id: string }
  return db.seekerProfile.findUnique({ where: { userId: user.id }, select: { id: true } })
}

// "2024-03", or empty. Anything else is rejected rather than stored and
// rendered as nonsense later.
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

export async function POST(req: NextRequest) {
  try {
    const profile = await ownProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const company = String(body.company ?? '').trim()
    const role = String(body.role ?? '').trim()
    const startMonth = String(body.startMonth ?? '').trim()
    const current = body.current === true
    const endMonth = current ? null : (String(body.endMonth ?? '').trim() || null)

    if (!company || !role) {
      return NextResponse.json({ error: 'Company and role are both needed.' }, { status: 400 })
    }
    if (!MONTH.test(startMonth)) {
      return NextResponse.json({ error: 'Pick a start month.' }, { status: 400 })
    }
    if (endMonth && !MONTH.test(endMonth)) {
      return NextResponse.json({ error: 'That end month does not look right.' }, { status: 400 })
    }
    if (endMonth && endMonth < startMonth) {
      return NextResponse.json({ error: 'It cannot have ended before it started.' }, { status: 400 })
    }

    const last = await db.workExperience.findFirst({
      where: { profileId: profile.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const experience = await db.workExperience.create({
      data: {
        profileId: profile.id,
        company, role, startMonth, endMonth, current,
        location: String(body.location ?? '').trim() || null,
        description: String(body.description ?? '').trim().slice(0, 1000) || null,
        order: (last?.order ?? 0) + 1,
      },
    })

    return NextResponse.json({ experience })
  } catch (error) {
    console.error('Experience POST error:', error)
    return NextResponse.json({ error: 'Could not save that.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const profile = await ownProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    // Scoped to their own profile, so an id belonging to somebody else deletes
    // nothing rather than deleting theirs.
    const deleted = await db.workExperience.deleteMany({
      where: { id, profileId: profile.id },
    })
    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Removed.' })
  } catch (error) {
    console.error('Experience DELETE error:', error)
    return NextResponse.json({ error: 'Could not remove that.' }, { status: 500 })
  }
}
