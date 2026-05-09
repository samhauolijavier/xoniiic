import { Client } from '@notionhq/client'
import type { QueryDatabaseParameters } from '@notionhq/client/build/src/api-endpoints'
import { getVAForCategory } from './va-config'

type NotionFilter = NonNullable<QueryDatabaseParameters['filter']>

const notion = new Client({ auth: process.env.NOTION_TOKEN })

function getDb(): string {
  const id = process.env.NOTION_TASKS_DATABASE_ID
  if (!id) throw new Error('NOTION_TASKS_DATABASE_ID is not set')
  return id
}

export type TaskStatus = 'Not Started' | 'In Progress' | 'Done' | 'Blocked'
export type TaskPriority = 'High' | 'Medium' | 'Low'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  categoryId: string
  categoryLabel: string
  assignedTo: string
  project: string
  notes: string
  createdAt: string
}

export interface TaskFilters {
  assignedTo?: string
  status?: TaskStatus
  project?: string
}

export async function getTasks(filters: TaskFilters = {}): Promise<Task[]> {
  type Condition = Extract<NotionFilter, { and: unknown[] }>['and'][number]
  const conditions: Condition[] = []

  if (filters.assignedTo) {
    conditions.push({ property: 'Assigned To', select: { equals: filters.assignedTo } })
  }
  if (filters.status) {
    conditions.push({ property: 'Status', select: { equals: filters.status } })
  }
  if (filters.project) {
    conditions.push({ property: 'Project', select: { equals: filters.project } })
  }

  const filter: NotionFilter | undefined =
    conditions.length > 0 ? { and: conditions } : undefined

  const response = await notion.databases.query({
    database_id: getDb(),
    filter,
    sorts: [
      { property: 'Status', direction: 'ascending' },
      { property: 'Priority', direction: 'ascending' },
      { timestamp: 'created_time', direction: 'descending' },
    ],
  })

  return response.results.map(pageToTask)
}

export async function createTask(data: {
  title: string
  priority: TaskPriority
  categoryId: string
  categoryLabel: string
  project: string
  notes?: string
}): Promise<Task> {
  const va = getVAForCategory(data.categoryId)
  const assignedTo = va?.name ?? 'Unassigned'

  const page = await notion.pages.create({
    parent: { database_id: getDb() },
    properties: {
      Name: { title: [{ text: { content: data.title } }] },
      Status: { select: { name: 'Not Started' } },
      Priority: { select: { name: data.priority } },
      'Category ID': { rich_text: [{ text: { content: data.categoryId } }] },
      Category: { select: { name: data.categoryLabel } },
      'Assigned To': { select: { name: assignedTo } },
      Project: { select: { name: data.project } },
      Notes: { rich_text: data.notes ? [{ text: { content: data.notes } }] : [] },
    },
  })

  return pageToTask(page)
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  await notion.pages.update({
    page_id: id,
    properties: { Status: { select: { name: status } } },
  })
}

export async function updateTask(
  id: string,
  data: Partial<{ title: string; status: TaskStatus; priority: TaskPriority; notes: string }>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: Record<string, any> = {}

  if (data.title) properties.Name = { title: [{ text: { content: data.title } }] }
  if (data.status) properties.Status = { select: { name: data.status } }
  if (data.priority) properties.Priority = { select: { name: data.priority } }
  if (data.notes !== undefined) {
    properties.Notes = { rich_text: [{ text: { content: data.notes } }] }
  }

  await notion.pages.update({ page_id: id, properties })
}

export async function archiveTask(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, archived: true })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pageToTask(page: any): Task {
  const p = page.properties
  return {
    id: page.id,
    title: p.Name?.title?.[0]?.plain_text ?? '',
    status: (p.Status?.select?.name ?? 'Not Started') as TaskStatus,
    priority: (p.Priority?.select?.name ?? 'Medium') as TaskPriority,
    categoryId: p['Category ID']?.rich_text?.[0]?.plain_text ?? '',
    categoryLabel: p.Category?.select?.name ?? '',
    assignedTo: p['Assigned To']?.select?.name ?? 'Unassigned',
    project: p.Project?.select?.name ?? '',
    notes: p.Notes?.rich_text?.[0]?.plain_text ?? '',
    createdAt: page.created_time,
  }
}
