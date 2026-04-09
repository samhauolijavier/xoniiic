import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'
import bcryptjs from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Find the token
    const resetToken = await withRetry(() => db.passwordResetToken.findUnique({ where: { token } }))

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 })
    }

    if (resetToken.used) {
      return NextResponse.json({ error: 'This reset link has already been used. Please request a new one.' }, { status: 400 })
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 })
    }

    // Find the user
    const user = await withRetry(() => db.user.findUnique({ where: { email: resetToken.email } }))

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(password, 12)

    // Update user's password and mark token as used in parallel
    await withRetry(() => db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
