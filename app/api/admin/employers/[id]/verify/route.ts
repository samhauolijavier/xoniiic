import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const profile = await db.employerProfile.upsert({
      where: { userId: params.id },
      create: {
        userId: params.id,
        verified: true,
        verifiedAt: new Date(),
        newEmployer: true,
      },
      update: {
        verified: true,
        verifiedAt: new Date(),
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Employer verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
