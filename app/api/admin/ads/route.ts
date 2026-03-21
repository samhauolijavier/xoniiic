import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ads = await db.adSlot.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ ads })
  } catch (error) {
    console.error('Ads GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, placement, imageUrl, linkUrl, altText, advertiser } = body

    if (!name || !placement || !imageUrl || !linkUrl || !altText) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const ad = await db.adSlot.create({
      data: { name, placement, imageUrl, linkUrl, altText, advertiser, active: true },
    })

    return NextResponse.json({ ad }, { status: 201 })
  } catch (error) {
    console.error('Ads POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
