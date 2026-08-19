import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// A six-digit code is a million possibilities, which sounds like plenty until
// you can try them as fast as the network allows. Counting failures per account
// is what makes the code worth anything — after this many it is burned, and a
// new one has to be requested through an inbox an attacker does not control.
const MAX_ATTEMPTS = 8

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    // Looked up by email alone so a wrong code can be counted against the
    // account. Matching email AND code together — as this did before — means a
    // failed guess finds no row, and there is nothing to count.
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        emailVerified: true,
        verificationToken: true,
        verificationTokenExpiry: true,
        verificationAttempts: true,
      },
    })

    // Same answer whether the account exists or not. A different message here
    // turns this endpoint into a way to find out who has an account.
    if (!user || user.emailVerified) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    if (user.verificationAttempts >= MAX_ATTEMPTS) {
      return NextResponse.json({
        error: 'Too many incorrect codes. Ask for a new one and try again.',
      }, { status: 429 })
    }

    const expired = !user.verificationTokenExpiry || user.verificationTokenExpiry <= new Date()
    const matches = Boolean(user.verificationToken) && user.verificationToken === String(code).trim()

    if (!matches || expired) {
      await db.user.update({
        where: { id: user.id },
        data: { verificationAttempts: { increment: 1 } },
      })
      const left = MAX_ATTEMPTS - (user.verificationAttempts + 1)
      return NextResponse.json({
        error: left > 0
          ? `That code is not right. ${left} ${left === 1 ? 'try' : 'tries'} left before you need a new one.`
          : 'That code is not right, and you are out of tries. Ask for a new one.',
      }, { status: 400 })
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
        verificationAttempts: 0,
      },
    })

    return NextResponse.json({ message: 'Email verified successfully' })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
