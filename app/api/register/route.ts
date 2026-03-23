import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { sendVerificationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function generateUniqueUsername(baseName: string): Promise<string> {
  const base = slugify(baseName)
  let username = base
  let count = 1

  while (true) {
    const existing = await db.seekerProfile.findUnique({ where: { username } })
    if (!existing) return username
    username = `${base}-${count}`
    count++
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, role } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!['seeker', 'employer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    })

    // Create role-specific profile
    let username: string | null = null
    if (role === 'seeker') {
      username = await generateUniqueUsername(name)
      await db.seekerProfile.create({
        data: {
          userId: user.id,
          username,
          availability: 'open',
          englishRating: 5,
        },
      })
    } else if (role === 'employer') {
      await db.employerProfile.create({
        data: {
          userId: user.id,
          newEmployer: true,
        },
      })
    }

    // Auto-assign founding member number (11-250, skip 1-10 reserved for admin)
    let foundingMemberNumber: number | null = null
    try {
      const takenNumbers = await db.user.findMany({
        where: { foundingMemberNumber: { not: null } },
        select: { foundingMemberNumber: true },
      })
      const taken = new Set(takenNumbers.map(u => u.foundingMemberNumber))
      let nextNumber: number | null = null
      for (let i = 11; i <= 250; i++) {
        if (!taken.has(i)) {
          nextNumber = i
          break
        }
      }
      if (nextNumber) {
        await db.user.update({
          where: { id: user.id },
          data: { foundingMemberNumber: nextNumber },
        })
        foundingMemberNumber = nextNumber
      }
    } catch (e) {
      // Never let founding member assignment break registration
      console.error('Founding member assignment error:', e)
    }

    // Generate verification code and send email
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    await db.user.update({
      where: { id: user.id },
      data: {
        verificationToken: verificationCode,
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })
    await sendVerificationEmail(email, verificationCode, name)

    // Log activity event
    const activityType = role === 'seeker' ? 'new_seeker' : 'new_employer'
    await logActivity(activityType, user.id, { name })

    return NextResponse.json({
      message: 'Account created successfully',
      requiresVerification: true,
      user: { id: user.id, email: user.email, role: user.role, username, foundingMemberNumber },
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
