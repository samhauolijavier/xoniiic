import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcryptjs from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Find the token
    const resetToken = await db.passwordResetToken.findUnique({ where: { token } })

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    if (resetToken.used) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Find the user
    const user = await db.user.findUnique({ where: { email: resetToken.email } })

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(password, 12)

    // Update user's password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
