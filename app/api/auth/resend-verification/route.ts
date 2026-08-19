import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Must match the expiry used when an account is created.
const CODE_TTL_MS = 60 * 60 * 1000

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

    // Rate limit: refuse if the current code still has almost all of its life
    // left, which means it was issued moments ago.
    //
    // This used to work out the send time by subtracting twenty-four hours from
    // the expiry. Codes last an hour now, so that arithmetic put every send
    // twenty-three hours in the past and the limit never fired once — an open
    // door to using this endpoint to post mail at somebody.
    if (user.verificationTokenExpiry) {
      const issuedAt = new Date(user.verificationTokenExpiry.getTime() - CODE_TTL_MS)
      if (issuedAt > new Date(Date.now() - 2 * 60 * 1000)) {
        return NextResponse.json(
          { error: 'Please wait a couple of minutes before asking for another code' },
          { status: 429 }
        )
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()

    await db.user.update({
      where: { id: user.id },
      data: {
        verificationToken: code,
        verificationTokenExpiry: new Date(Date.now() + CODE_TTL_MS),
        // Cleared with the new code. Without this, somebody who mistyped their
        // way to the attempt limit stays locked out no matter how many fresh
        // codes they ask for.
        verificationAttempts: 0,
      },
    })

    await sendVerificationEmail(email, code, user.name ?? undefined)

    return NextResponse.json({ message: 'Verification code sent' })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
