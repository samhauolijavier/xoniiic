import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as { id: string }
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { premium: true, premiumUntil: true },
  })

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    premium: dbUser.premium,
    premiumUntil: dbUser.premiumUntil?.toISOString() ?? null,
  })
}
