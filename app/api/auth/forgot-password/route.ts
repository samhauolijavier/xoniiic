import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'
import crypto from 'crypto'
import { sendPasswordResetEmail, sendGoogleAccountNoticeEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: true })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const user = await withRetry(() => db.user.findUnique({ where: { email: normalizedEmail } }))

    // One answer for every case.
    //
    // This used to reply noEmail when an address was unknown and googleOnly
    // when it signed in with Google — so anybody could learn which addresses
    // have accounts here and how each one authenticates, just by asking. Both
    // now look identical to "we have sent you a link".
    const SAME_ANSWER = NextResponse.json({
      success: true,
      message: 'If an account exists for that address, a reset link is on its way.',
    })

    if (!user) return SAME_ANSWER

    // A Google account has no password to reset. They are told what to do
    // instead — by email, where only the account holder will read it.
    if (!user.password) {
      await sendGoogleAccountNoticeEmail({ email: user.email, name: user.name })
      return SAME_ANSWER
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Delete any existing reset tokens for this email
    await withRetry(() => db.passwordResetToken.deleteMany({ where: { email: user.email } }))

    // Create new token
    await withRetry(() => db.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expiresAt,
      },
    }))

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://virtualfreaks.co'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    // Sent to the inbox, never returned here.
    //
    // This used to respond with { resetUrl }, which meant anybody could post
    // any email address and be handed a working reset link for that account —
    // no inbox access required. Account takeover for every user on the
    // platform, including admins. The link travelling through email is the
    // only thing proving the person asking owns the address.
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    })

    // The same answer whether or not the address exists, so this cannot be
    // used to find out who has an account here.
    return SAME_ANSWER
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
