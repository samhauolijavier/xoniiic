import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/supabase-storage'
import { placementSpec } from '@/lib/ads'

export const dynamic = 'force-dynamic'

const BUCKET = 'logos'
const MAX_BYTES = 3 * 1024 * 1024

// No SVG. An advertiser's file is the least trusted image on the site — it
// comes from outside — and an SVG is a document that can carry script, served
// from our own domain.
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('image')
  const placement = String(form.get('placement') ?? 'sidebar')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Choose an image.' }, { status: 400 })
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Use a PNG, JPG, WebP, or GIF.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({
      error: `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. Keep ad creative under 3MB — every visitor to the page downloads it.`,
    }, { status: 400 })
  }

  try {
    const spec = placementSpec(placement)
    const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png'
    const filename = `ad-${placement}-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const url = await uploadFile(BUCKET, filename, buffer, file.type)
    if (!url) {
      return NextResponse.json({ error: 'Upload failed. Try again in a moment.' }, { status: 500 })
    }

    return NextResponse.json({
      url,
      // Echoed back so the form can show what shape it will actually render in.
      expected: `${spec.width}×${spec.height}`,
    })
  } catch (error) {
    console.error('Ad image upload error:', error)
    return NextResponse.json({ error: 'Could not save that image.' }, { status: 500 })
  }
}
