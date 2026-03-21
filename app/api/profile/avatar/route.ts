import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }

    const formData = await req.formData()
    const file = formData.get('avatar') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' }, { status: 400 })
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 2MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${uuidv4()}.${ext}`
    const filepath = join(uploadDir, filename)

    await writeFile(filepath, buffer)

    const avatarUrl = `/uploads/avatars/${filename}`

    // Update profile
    await db.seekerProfile.update({
      where: { userId: user.id },
      data: { avatarUrl },
    })

    return NextResponse.json({ avatarUrl })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
