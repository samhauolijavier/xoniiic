import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, deleteFile } from '@/lib/supabase-storage'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('logo') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Use PNG, JPG, SVG or WebP.' }, { status: 400 })
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split('.').pop() || 'png'
    const filename = `logo-${Date.now()}.${ext}`
    const storagePath = filename

    // Delete old logo from Supabase if it exists
    const existing = await db.siteSetting.findUnique({ where: { key: 'logoUrl' } })
    if (existing?.value && existing.value.includes('supabase')) {
      const oldPath = existing.value.split('/logos/')[1]
      if (oldPath) {
        await deleteFile('logos', oldPath)
      }
    }

    // Upload to Supabase Storage
    const logoUrl = await uploadFile('logos', storagePath, buffer, file.type)

    if (!logoUrl) {
      return NextResponse.json({ error: 'Upload failed. Storage service may not be configured.' }, { status: 500 })
    }

    await db.siteSetting.upsert({
      where: { key: 'logoUrl' },
      update: { value: logoUrl },
      create: { key: 'logoUrl', value: logoUrl },
    })

    return NextResponse.json({ logoUrl })
  } catch (err) {
    console.error('Logo upload error:', err)
    return NextResponse.json({ error: 'Upload failed: ' + String(err) }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Delete from Supabase if stored there
  const existing = await db.siteSetting.findUnique({ where: { key: 'logoUrl' } })
  if (existing?.value && existing.value.includes('supabase')) {
    const oldPath = existing.value.split('/logos/')[1]
    if (oldPath) {
      await deleteFile('logos', oldPath)
    }
  }

  await db.siteSetting.deleteMany({ where: { key: 'logoUrl' } })
  return NextResponse.json({ success: true })
}
