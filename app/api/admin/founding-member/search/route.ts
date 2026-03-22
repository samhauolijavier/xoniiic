import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = session.user as { id: string; role: string }
  if (admin.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true, foundingMemberNumber: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'No user found with that email' }, { status: 404 })
  }

  if (user.foundingMemberNumber !== null) {
    return NextResponse.json({ error: `User already has Founding Member #${user.foundingMemberNumber}` }, { status: 409 })
  }

  return NextResponse.json({ userId: user.id, name: user.name, email: user.email, role: user.role })
}
