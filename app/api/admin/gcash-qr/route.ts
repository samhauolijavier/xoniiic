import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, deleteFile } from '@/lib/supabase-storage'

export const dynamic = 'force-dynamic'

// Not under the private.* prefix, because a payment QR is meant to be looked
// at — it is shown to anyone signed in who wants a seat. It stays out of the
// public settings response anyway by being read server-side on the seat page,
// so it is not sitting on an open endpoint for scrapers either.
const SETTING_KEY = 'gcashQrUrl'
const BUCKET = 'logos'

// SVG is deliberately excluded. An SVG is a document that can carry script, and
// this one gets served from our own domain — a QR is a picture and should be a
// picture format.
const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

// A phone screenshot of a GCash QR is well under this.
const MAX_BYTES = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('qr')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Attach the QR image.' }, { status: 400 })
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({
      error: 'Use a PNG, JPG, or WebP — a screenshot from the GCash app is fine.',
    }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'That image is over 5MB. A screenshot should be far smaller.' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()?.slice(0, 5) || 'png'
    // Timestamped so a replacement is never served from a stale cache under the
    // old name — a QR pointing at the wrong wallet is the worst possible bug here.
    const filename = `gcash-qr-${Date.now()}.${ext}`

    const existing = await db.siteSetting.findUnique({ where: { key: SETTING_KEY } })

    const url = await uploadFile(BUCKET, filename, buffer, file.type)
    if (!url) {
      return NextResponse.json({
        error: `Upload failed. Check that a public bucket named "${BUCKET}" exists in Supabase.`,
      }, { status: 500 })
    }

    await db.siteSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: url },
      create: { key: SETTING_KEY, value: url },
    })

    // Old file removed only after the new one is saved. The other order risks
    // deleting the working QR and then failing to upload the new one.
    if (existing?.value?.includes('supabase')) {
      const oldPath = existing.value.split(`/${BUCKET}/`)[1]
      if (oldPath && oldPath !== filename) await deleteFile(BUCKET, oldPath)
    }

    return NextResponse.json({ message: 'QR updated. It is on the practice account page now.', url })
  } catch (error) {
    console.error('GCash QR upload error:', error)
    return NextResponse.json({ error: 'Could not save that image.' }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const existing = await db.siteSetting.findUnique({ where: { key: SETTING_KEY } })
    if (existing?.value?.includes('supabase')) {
      const oldPath = existing.value.split(`/${BUCKET}/`)[1]
      if (oldPath) await deleteFile(BUCKET, oldPath)
    }
    await db.siteSetting.deleteMany({ where: { key: SETTING_KEY } })
    return NextResponse.json({ message: 'QR removed. The page falls back to the number alone.' })
  } catch (error) {
    console.error('GCash QR delete error:', error)
    return NextResponse.json({ error: 'Could not remove it.' }, { status: 500 })
  }
}
