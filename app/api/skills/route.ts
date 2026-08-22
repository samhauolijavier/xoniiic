import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    // Admins can ask for the inactive ones too.
    //
    // Without this the admin screen showed only active skills, so switching one
    // off removed it from the very page that switches it back on — a one-way
    // door with the handle on the outside. Everyone else still sees only what
    // is active.
    let includeInactive = false
    if (searchParams.get('all') === '1') {
      const session = await getServerSession(authOptions)
      const user = session?.user as { role?: string } | undefined
      includeInactive = user?.role === 'admin'
    }

    const skills = await db.skill.findMany({
      where: {
        ...(includeInactive ? {} : { active: true }),
        ...(search && { name: { contains: search } }),
        ...(category && { category }),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ skills })
  } catch (error) {
    console.error('Skills GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined

    // Open to any signed-in member, not just admins.
    //
    // Nobody can list every skill anyone will ever have, and a person whose
    // actual job is missing from the list either picks something inaccurate or
    // gives up on the profile. Theirs is marked isCustom so it can be reviewed,
    // renamed, or merged later — but it is live immediately, because the point
    // is that they are not blocked.
    if (!user) {
      return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
    }

    const body = await req.json()
    const name = String(body.name ?? '').trim().slice(0, 40)
    const category = String(body.category ?? '').trim()

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }
    if (name.length < 2) {
      return NextResponse.json({ error: 'That is too short to be a skill.' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
    if (!slug) {
      return NextResponse.json({ error: 'Use letters or numbers in the name.' }, { status: 400 })
    }

    // Handing back the existing one rather than erroring: somebody typing
    // "figma" when Figma is already there wants Figma, not a message.
    const existing = await db.skill.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ skill: existing }, { status: 200 })
    }

    const skill = await db.skill.create({
      data: { name, slug, category, isCustom: user.role !== 'admin' },
    })

    return NextResponse.json({ skill }, { status: 201 })
  } catch (error) {
    console.error('Skills POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
