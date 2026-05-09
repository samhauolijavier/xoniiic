import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTasks, createTask, TaskFilters } from '@/lib/notion'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return false
  const user = session.user as { role: string }
  return user.role === 'admin'
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const filters: TaskFilters = {}

  const assignedTo = searchParams.get('assignedTo')
  const status = searchParams.get('status')
  const project = searchParams.get('project')

  if (assignedTo) filters.assignedTo = assignedTo
  if (status) filters.status = status as TaskFilters['status']
  if (project) filters.project = project

  try {
    const tasks = await getTasks(filters)
    return NextResponse.json(tasks)
  } catch (err) {
    console.error('[notion/tasks GET]', err)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { title, priority, categoryId, categoryLabel, project, notes } = body

    if (!title || !priority || !categoryId || !categoryLabel || !project) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const task = await createTask({ title, priority, categoryId, categoryLabel, project, notes })
    return NextResponse.json(task, { status: 201 })
  } catch (err) {
    console.error('[notion/tasks POST]', err)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
