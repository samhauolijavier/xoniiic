import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: true })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const user = await withRetry(() => db.user.findUnique({ where: { email: normalizedEmail } }))

    if (!user) {
      // Don't reveal whether email exists — but since email is hibernated,
      // we need to tell users we can't find the account so they don't wait for nothing
      return NextResponse.json({ success: true, noEmail: true })
    }

    // Google-only accounts don't have passwords to reset
    if (!user.password) {
      return NextResponse.json({
        success: true,
        googleOnly: true,
        message: 'This account uses Google sign-in. Please use the "Continue with Google" button on the login page.'
      })
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

    // TODO: Send email when email service is active
    // For now, return the reset URL directly since email is hibernated
    console.log('PASSWORD RESET LINK:', resetUrl)

    return NextResponse.json({ success: true, resetUrl })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
