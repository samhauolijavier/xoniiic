import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { TERMS_VERSION } from '@/lib/legal'
import { sendVerificationEmail } from '@/lib/email'
import { REQUIRE_EMAIL_VERIFICATION } from '@/lib/constants'

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
    const { name, email, password, role, ref, marketingOptIn } = body

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
        // Opt-in only, and only if the box was actually ticked. The timestamp
        // is the evidence that it was, which is the thing that matters if
        // anybody ever asks.
        marketingOptIn: marketingOptIn === true,
        marketingOptInAt: marketingOptIn === true ? new Date() : null,
        // Recorded at the moment of agreement, with the version they saw.
        // "They ticked a box once" is worth little; "they agreed to this exact
        // text on this date" is a record.
        termsVersion: TERMS_VERSION,
        termsAcceptedAt: new Date(),
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

    // Credit whoever brought them. Wrapped because a referral is a bonus, not a
    // precondition — a bad or stale code must never cost someone their account.
    if (typeof ref === 'string' && ref.trim()) {
      try {
        const referrer = await db.user.findUnique({
          where: { referralCode: ref.trim().toUpperCase() },
          select: { id: true },
        })
        // Self-referral is the obvious way to farm free months, so it is the one
        // case checked here rather than left to whoever reads the desk.
        if (referrer && referrer.id !== user.id) {
          await db.referral.create({
            data: { referrerId: referrer.id, invitedId: user.id },
          })
        }
      } catch (error) {
        console.error('Referral capture failed (account still created):', error)
      }
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

    // Live now that Resend is verified. This was hibernated waiting on SES,
    // which never happened — meaning every address collected so far was taken
    // on trust. Wrapped because a mail failure must not cost somebody the
    // account they just made; they can ask for a new code from the dashboard.
    let emailSent = false
    try {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      await db.user.update({
        where: { id: user.id },
        data: {
          verificationToken: verificationCode,
          // One hour, not twenty-four. A six-digit code is a million guesses,
          // and the shorter the window the less use a guessing run is.
          verificationTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
          verificationAttempts: 0,
        },
      })
      // Only spend a send when the code is actually needed. With verification
      // off the account is usable immediately, and mailing a code nobody will
      // be asked for burns quota that the rest of the site needs.
      if (REQUIRE_EMAIL_VERIFICATION) {
        const result = await sendVerificationEmail(email, verificationCode, name)
        emailSent = result.ok
      }
    } catch (e) {
      console.error('Verification send failed (account still created):', e)
    }

    // Log activity event
    const activityType = role === 'seeker' ? 'new_seeker' : 'new_employer'
    await logActivity(activityType, user.id, { name })

    return NextResponse.json({
      message: 'Account created successfully',
      requiresVerification: REQUIRE_EMAIL_VERIFICATION,
      // False means the code never left. The client says so plainly rather
      // than sending somebody to an inbox that has nothing in it.
      emailSent,
      user: { id: user.id, email: user.email, role: user.role, username, foundingMemberNumber },
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
