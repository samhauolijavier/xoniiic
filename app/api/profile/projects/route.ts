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
    const { title, description, imageUrl } = body

    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'Title and image are required' }, { status: 400 })
    }

    const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Count existing projects (max 8)
    const count = await db.projectImage.count({ where: { profileId: profile.id } })
    if (count >= 8) {
      return NextResponse.json({ error: 'Maximum 8 projects allowed' }, { status: 400 })
    }

    const project = await db.projectImage.create({
      data: {
        profileId: profile.id,
        title,
        description: description || null,
        imageUrl,
        order: count,
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Project POST error:', error)
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
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const profile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Ensure the project belongs to this profile
    const project = await db.projectImage.findFirst({ where: { id, profileId: profile.id } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await db.projectImage.delete({ where: { id } })

    return NextResponse.json({ message: 'Project deleted' })
  } catch (error) {
    console.error('Project DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
