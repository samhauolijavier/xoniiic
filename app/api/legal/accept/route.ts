import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TERMS_VERSION } from '@/lib/legal'

export const dynamic = 'force-dynamic'

/** Records that this member has accepted the current version. */
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const me = session.user as { id: string }

  try {
    await db.user.update({
      where: { id: me.id },
      data: { termsVersion: TERMS_VERSION, termsAcceptedAt: new Date() },
    })
    return NextResponse.json({ message: 'Thank you.' })
  } catch (error) {
    console.error('Terms acceptance error:', error)
    return NextResponse.json({ error: 'Could not save that.' }, { status: 500 })
  }
}
