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
  const file = formData.get('favicon') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const allowedTypes = [
    'image/png',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/svg+xml',
  ]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Use PNG, ICO, or SVG.' },
      { status: 400 }
    )
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split('.').pop() || 'png'
    const filename = `favicon-${Date.now()}.${ext}`
    const storagePath = filename

    // Delete old favicon from Supabase if it exists
    const existing = await db.siteSetting.findUnique({ where: { key: 'faviconUrl' } })
    if (existing?.value && existing.value.includes('supabase')) {
      const oldPath = existing.value.split('/favicons/')[1]
      if (oldPath) {
        await deleteFile('favicons', oldPath)
      }
    }

    // Upload to Supabase Storage
    const faviconUrl = await uploadFile('favicons', storagePath, buffer, file.type)

    if (!faviconUrl) {
      return NextResponse.json(
        { error: 'Upload failed. Storage service may not be configured.' },
        { status: 500 }
      )
    }

    await db.siteSetting.upsert({
      where: { key: 'faviconUrl' },
      update: { value: faviconUrl },
      create: { key: 'faviconUrl', value: faviconUrl },
    })

    return NextResponse.json({ faviconUrl })
  } catch (err) {
    console.error('Favicon upload error:', err)
    return NextResponse.json(
      { error: 'Upload failed: ' + String(err) },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Delete from Supabase if stored there
  const existing = await db.siteSetting.findUnique({ where: { key: 'faviconUrl' } })
  if (existing?.value && existing.value.includes('supabase')) {
    const oldPath = existing.value.split('/favicons/')[1]
    if (oldPath) {
      await deleteFile('favicons', oldPath)
    }
  }

  await db.siteSetting.deleteMany({ where: { key: 'faviconUrl' } })
  return NextResponse.json({ success: true })
}
