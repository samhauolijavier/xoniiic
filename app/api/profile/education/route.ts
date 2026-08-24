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

function year(value: unknown): number | null {
  const n = Number(value)
  // A sane window. Rejecting the rest stops a typo'd 202 or 20244 rendering
  // as a career that started in the third century.
  if (!Number.isInteger(n) || n < 1950 || n > new Date().getFullYear() + 10) return null
  return n
}

export async function POST(req: NextRequest) {
  try {
    const profile = await ownProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const school = String(body.school ?? '').trim()
    if (!school) {
      return NextResponse.json({ error: 'Which school?' }, { status: 400 })
    }

    const startYear = year(body.startYear)
    const endYear = year(body.endYear)
    if (startYear && endYear && endYear < startYear) {
      return NextResponse.json({ error: 'It cannot have ended before it started.' }, { status: 400 })
    }

    const last = await db.education.findFirst({
      where: { profileId: profile.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const education = await db.education.create({
      data: {
        profileId: profile.id,
        school,
        degree: String(body.degree ?? '').trim() || null,
        field: String(body.field ?? '').trim() || null,
        startYear,
        endYear,
        description: String(body.description ?? '').trim().slice(0, 600) || null,
        order: (last?.order ?? 0) + 1,
      },
    })

    return NextResponse.json({ education })
  } catch (error) {
    console.error('Education POST error:', error)
    return NextResponse.json({ error: 'Could not save that.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const profile = await ownProfile()
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const deleted = await db.education.deleteMany({
      where: { id, profileId: profile.id },
    })
    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Removed.' })
  } catch (error) {
    console.error('Education DELETE error:', error)
    return NextResponse.json({ error: 'Could not remove that.' }, { status: 500 })
  }
}
