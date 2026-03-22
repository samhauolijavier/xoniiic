import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { id: string; role: string }
  if (user.role !== 'employer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const searches = await db.savedSearch.findMany({
    where: { employerId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ searches })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { id: string; role: string }
  if (user.role !== 'employer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { name, search, category, availability, minRate, maxRate, minEnglish } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const savedSearch = await db.savedSearch.create({
    data: {
      employerId: user.id,
      name: name.trim(),
      search: search || null,
      category: category || null,
      availability: availability || null,
      minRate: minRate ? parseFloat(minRate) : null,
      maxRate: maxRate ? parseFloat(maxRate) : null,
      minEnglish: minEnglish ? parseInt(minEnglish) : null,
    },
  })

  return NextResponse.json({ savedSearch })
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { id: string; role: string }
  if (user.role !== 'employer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await db.savedSearch.deleteMany({
    where: { id, employerId: user.id },
  })

  return NextResponse.json({ ok: true })
}
