import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    // Only these three. This passed the whole request body into update(), so
    // anything sent — slug, isCustom, a typo'd field — was written straight to
    // the row. A skill whose slug quietly changes breaks every link to it.
    const data: Record<string, unknown> = {}
    if (typeof body.active === 'boolean') data.active = body.active
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body.category === 'string' && body.category.trim()) data.category = body.category.trim()

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 })
    }

    const skill = await db.skill.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ skill })
  } catch (error) {
    console.error('Skill PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.skill.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Skill deleted' })
  } catch (error) {
    console.error('Skill DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
