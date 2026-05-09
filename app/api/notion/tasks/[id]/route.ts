import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateTask, updateTaskStatus, archiveTask } from '@/lib/notion'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return false
  const user = session.user as { role: string }
  return user.role === 'admin'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { status, ...rest } = body

    if (status && Object.keys(rest).length === 0) {
      await updateTaskStatus(params.id, status)
    } else {
      await updateTask(params.id, body)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[notion/tasks PATCH]', err)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await archiveTask(params.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[notion/tasks DELETE]', err)
    return NextResponse.json({ error: 'Failed to archive task' }, { status: 500 })
  }
}
