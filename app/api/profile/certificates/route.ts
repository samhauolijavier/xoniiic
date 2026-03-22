import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }
    const body = await req.json()
    const { name, issuer, year, imageUrl } = body

    if (!name || !issuer) {
      return NextResponse.json({ error: 'Name and issuer are required' }, { status: 400 })
    }

    const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const certificate = await db.certificate.create({
      data: {
        profileId: profile.id,
        name,
        issuer,
        year: year ? parseInt(year) : null,
        imageUrl: imageUrl || null,
      },
    })

    return NextResponse.json({ certificate })
  } catch (error) {
    console.error('Certificate POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Certificate ID required' }, { status: 400 })
    }

    const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Ensure the certificate belongs to this profile
    const cert = await db.certificate.findFirst({ where: { id, profileId: profile.id } })
    if (!cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    await db.certificate.delete({ where: { id } })

    return NextResponse.json({ message: 'Certificate deleted' })
  } catch (error) {
    console.error('Certificate DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
