import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: true })
    }

    // Always return success to avoid revealing if an email exists
    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

      // Delete any existing reset tokens for this email
      await db.passwordResetToken.deleteMany({ where: { email: user.email } })

      // Create new token
      await db.passwordResetToken.create({
        data: {
          email: user.email,
          token,
          expiresAt,
        },
      })

      // Log the reset URL since email isn't configured yet
      console.log('PASSWORD RESET LINK:', `http://localhost:3000/reset-password?token=${token}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
