import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = session.user as { id: string; role: string }
  if (admin.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const targetUser = await db.user.findUnique({
    where: { id: params.id },
    select: { id: true, premium: true },
  })

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const now = new Date()
  const newPremium = !targetUser.premium

  const updated = await db.user.update({
    where: { id: params.id },
    data: {
      premium: newPremium,
      premiumSince: newPremium ? now : null,
      premiumUntil: newPremium ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) : null,
    },
    select: { id: true, name: true, email: true, premium: true, premiumUntil: true },
  })

  return NextResponse.json(updated)
}
