import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = session.user as { id: string; role: string }
  if (admin.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const foundingMembers = await db.user.findMany({
    where: { foundingMemberNumber: { not: null } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      foundingMemberNumber: true,
      createdAt: true,
    },
    orderBy: { foundingMemberNumber: 'asc' },
  })

  const totalAssigned = foundingMembers.length
  const reservedSlots = Array.from({ length: 10 }, (_, i) => {
    const num = i + 1
    const assigned = foundingMembers.find(m => m.foundingMemberNumber === num)
    return {
      number: num,
      assigned: assigned ? { id: assigned.id, name: assigned.name, email: assigned.email, role: assigned.role } : null,
    }
  })

  return NextResponse.json({
    totalAssigned,
    maxSlots: 250,
    reservedSlots,
    foundingMembers: foundingMembers.map(m => ({
      number: m.foundingMemberNumber,
      name: m.name,
      email: m.email,
      role: m.role,
      userId: m.id,
      joinedAt: m.createdAt,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = session.user as { id: string; role: string }
  if (admin.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, number } = body

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  // Allow null to remove assignment
  if (number === null) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, foundingMemberNumber: true } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    await db.user.update({
      where: { id: userId },
      data: { foundingMemberNumber: null },
    })
    return NextResponse.json({ message: 'Founding member badge removed' })
  }

  // Validate number is 1-10 for admin assignment
  if (typeof number !== 'number' || number < 1 || number > 10) {
    return NextResponse.json({ error: 'Admin can only assign numbers 1-10' }, { status: 400 })
  }

  const targetUser = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } })
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if number is already taken
  const existing = await db.user.findUnique({ where: { foundingMemberNumber: number } })
  if (existing) {
    return NextResponse.json({ error: `Number #${number} is already assigned to ${existing.id}` }, { status: 409 })
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { foundingMemberNumber: number },
    select: { id: true, name: true, email: true, foundingMemberNumber: true },
  })

  return NextResponse.json({ message: `Assigned Founding Member #${number}`, user: updated })
}
