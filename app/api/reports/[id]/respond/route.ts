import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string }
    const { message } = await req.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'A response message is required' }, { status: 400 })
    }

    // Fetch the report with related profiles to verify the current user is the accused
    const report = await db.report.findUnique({
      where: { id: params.id },
      include: {
        seekerProfile: { select: { userId: true } },
        employerProfile: { select: { userId: true } },
        response: true,
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Verify the current user is the accused party
    const accusedUserId =
      report.seekerProfile?.userId ?? report.employerProfile?.userId ?? null

    if (!accusedUserId || accusedUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden — you are not the reported party' }, { status: 403 })
    }

    // Only one response allowed per report
    if (report.response) {
      return NextResponse.json({ error: 'You have already submitted a response for this report' }, { status: 409 })
    }

    const response = await db.reportResponse.create({
      data: {
        reportId: params.id,
        userId: user.id,
        message: message.trim(),
      },
    })

    // Notify admin (log for now as specified)
    console.log('Defense response submitted for report:', params.id)

    return NextResponse.json({ success: true, response })
  } catch (error) {
    console.error('Report respond POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
