import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadFile, deleteFile } from '@/lib/supabase-storage'
import { moderateImage } from '@/lib/moderation'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

const BUCKET = 'avatars'

// Wider than an avatar because it is a banner, but still capped — a phone
// photo dropped in unresized is several megabytes, and every visitor to that
// profile pays for it.
const MAX_BYTES = 4 * 1024 * 1024

// No SVG and no GIF. An SVG can carry script and would be served from our own
// domain; an animated banner behind someone's name is a distraction on a page
// whose job is to make them look employable.
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user as { id: string }

    const formData = await req.formData()
    const file = formData.get('cover')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Choose an image first.' }, { status: 400 })
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'Use a JPEG, PNG, or WebP.' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({
        error: `That image is ${(file.size / 1024 / 1024).toFixed(1)}MB. Keep it under 4MB.`,
      }, { status: 400 })
    }

    const profile = await db.seekerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, coverUrl: true },
    })
    if (!profile) {
      return NextResponse.json({ error: 'No profile to put it on.' }, { status: 404 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Same check as profile photos. A banner is just as public and just as
    // capable of carrying something nobody wants on the site.
    const moderation = await moderateImage(buffer, file.type)
    if (!moderation.safe) {
      return NextResponse.json(
        { error: moderation.reason || 'Image rejected: inappropriate content detected' },
        { status: 400 }
      )
    }

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const filename = `cover-${uuidv4()}.${ext}`

    const url = await uploadFile(BUCKET, filename, buffer, file.type)
    if (!url) {
      return NextResponse.json({ error: 'Upload failed. Try again in a moment.' }, { status: 500 })
    }

    await db.seekerProfile.update({
      where: { id: profile.id },
      data: { coverUrl: url },
    })

    // Old file goes only after the new one is saved, so a storage hiccup leaves
    // an orphaned image rather than a profile pointing at nothing.
    if (profile.coverUrl?.includes('supabase')) {
      const oldPath = profile.coverUrl.split(`/${BUCKET}/`)[1]
      if (oldPath && oldPath !== filename) await deleteFile(BUCKET, oldPath)
    }

    return NextResponse.json({ message: 'Banner saved. It is on your profile now.', url })
  } catch (error) {
    console.error('Cover upload error:', error)
    return NextResponse.json({ error: 'Could not save that image.' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user as { id: string }

    const profile = await db.seekerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, coverUrl: true },
    })
    if (!profile) return NextResponse.json({ error: 'No profile found.' }, { status: 404 })

    if (profile.coverUrl?.includes('supabase')) {
      const oldPath = profile.coverUrl.split(`/${BUCKET}/`)[1]
      if (oldPath) await deleteFile(BUCKET, oldPath)
    }
    await db.seekerProfile.update({ where: { id: profile.id }, data: { coverUrl: null } })

    return NextResponse.json({ message: 'Banner removed. Your profile has no banner area now.' })
  } catch (error) {
    console.error('Cover delete error:', error)
    return NextResponse.json({ error: 'Could not remove it.' }, { status: 500 })
  }
}
