import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await db.user.findFirst({
      where: { email, emailVerified: false },
    })

    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({ message: 'If an account exists, a new code has been sent' })
    }

    // Rate limit: check if token was set less than 2 minutes ago
    if (user.verificationTokenExpiry) {
      const tokenSetAt = new Date(user.verificationTokenExpiry.getTime() - 24 * 60 * 60 * 1000)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
      if (tokenSetAt > twoMinutesAgo) {
        return NextResponse.json(
          { error: 'Please wait before requesting another code' },
          { status: 429 }
        )
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()

    await db.user.update({
      where: { id: user.id },
      data: {
        verificationToken: code,
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    await sendVerificationEmail(email, code, user.name ?? undefined)

    return NextResponse.json({ message: 'Verification code sent' })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
