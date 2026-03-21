import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function generateUniqueUsername(baseName: string): Promise<string> {
  const base = slugify(baseName) || 'user'
  let username = base
  let count = 1
  while (true) {
    const existing = await db.seekerProfile.findUnique({ where: { username } })
    if (!existing) return username
    username = `${base}-${count}`
    count++
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }
    const body = await req.json()
    const { role } = body

    if (!['seeker', 'employer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Update user role
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { role },
    })

    // If becoming a seeker, create their profile
    if (role === 'seeker') {
      const existingProfile = await db.seekerProfile.findUnique({ where: { userId: user.id } })
      if (!existingProfile) {
        const username = await generateUniqueUsername(updatedUser.name || updatedUser.email.split('@')[0])
        await db.seekerProfile.create({
          data: {
            userId: user.id,
            username,
            availability: 'open',
            englishRating: 5,
          },
        })
      }
    }

    return NextResponse.json({ success: true, role })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
