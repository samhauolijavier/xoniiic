import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as { id: string; role: string }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const profile = await db.employerProfile.findUnique({
    where: { userId: params.id },
  })

  if (!profile) {
    return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })
  }

  await db.employerProfile.update({
    where: { userId: params.id },
    data: {
      verified: true,
      verifiedAt: new Date(),
      verificationTier: 'vf_verified',
      newEmployer: false,
    },
  })

  // Send notification to the employer
  await db.notification.create({
    data: {
      userId: params.id,
      type: 'vf_verified',
      title: 'VF Verified Badge Awarded!',
      message: 'Congratulations! You have been personally verified by the Virtual Freaks team. Your profile now shows the highest trust badge on the platform.',
      actionUrl: '/employer-profile',
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as { id: string; role: string }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  await db.employerProfile.updateMany({
    where: { userId: params.id },
    data: {
      verificationTier: null,
    },
  })

  return NextResponse.json({ success: true })
}
