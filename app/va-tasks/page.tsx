export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTasks, Task } from '@/lib/notion'
import { VAS, getCategoriesForVA, Category } from '@/lib/va-config'
import { TaskBoard } from '@/components/va-tasks/TaskBoard'

export const metadata = { title: 'VA Tasks' }

export default async function VATasksPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const user = session.user as { role: string }
  if (user.role !== 'admin') redirect('/')

  let tasks: Task[] = []
  let notionError = false

  try {
    tasks = await getTasks()
  } catch {
    notionError = true
  }

  const activeVAs = VAS.filter((v) => v.status !== 'inactive')
  const doneCount = tasks.filter((t) => t.status === 'Done').length
  const openCount = tasks.filter((t) => t.status !== 'Done').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
          VA <span className="bg-gradient-brand bg-clip-text text-transparent">Tasks</span>
        </h1>
        <p className="text-brand-muted mt-1 text-sm">
          Assign once, stay on track. Tasks auto-route to the right person.
        </p>
      </div>

      {/* Notion not configured */}
      {notionError && (
        <div className="bg-yellow-950/40 border border-yellow-800/40 rounded-xl p-5 mb-6">
          <p className="text-yellow-300 font-semibold text-sm">Notion not connected yet</p>
          <p className="text-yellow-200/70 text-xs mt-1 leading-relaxed">
            Run the setup script to create your Notion database, then add{' '}
            <code className="bg-yellow-900/40 px-1 rounded">NOTION_TOKEN</code> and{' '}
            <code className="bg-yellow-900/40 px-1 rounded">NOTION_TASKS_DATABASE_ID</code> to{' '}
            your <code className="bg-yellow-900/40 px-1 rounded">.env.local</code>.
          </p>
          <pre className="mt-3 text-xs bg-brand-bg/60 rounded-lg p-3 text-brand-muted overflow-x-auto">
            {`npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/setup-notion.ts`}
          </pre>
        </div>
      )}

      {/* Quick stats */}
      {!notionError && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Open Tasks" value={openCount} color="text-brand-purple" />
          <StatCard label="Done" value={doneCount} color="text-emerald-400" />
          {activeVAs.map((va) => {
            const count = tasks.filter(
              (t) => t.assignedTo === va.name && t.status !== 'Done'
            ).length
            return (
              <StatCard
                key={va.id}
                label={`${va.name}'s Queue`}
                value={count}
                color="text-brand-orange"
                badge={va.status === 'upcoming' ? 'joining soon' : undefined}
              />
            )
          })}
        </div>
      )}

      {/* VA responsibility overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {activeVAs.map((va) => {
          const cats = getCategoriesForVA(va.id)
          return (
            <div
              key={va.id}
              className="bg-brand-card border border-brand-border rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${va.color}`}
                >
                  {va.initials}
                </span>
                <div>
                  <p className="font-semibold text-brand-text text-sm">{va.name}</p>
                  {va.status === 'upcoming' && (
                    <span className="text-xs text-orange-400">Joining soon</span>
                  )}
                </div>
              </div>
              <ul className="space-y-1">
                {cats.map((cat: Category) => (
                  <li key={cat.id} className="flex items-start gap-2">
                    <span className="text-brand-purple mt-0.5 text-xs">•</span>
                    <span className="text-xs text-brand-muted">
                      {cat.label}
                      {cat.note && (
                        <span className="ml-1 text-orange-400/70 italic">({cat.note})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Task board */}
      {!notionError && <TaskBoard initialTasks={tasks} vas={activeVAs} />}
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
  badge,
}: {
  label: string
  value: number
  color: string
  badge?: string
}) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-4">
      <p className="text-xs text-brand-muted mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <p className={`text-2xl font-black ${color}`}>{value}</p>
        {badge && (
          <span className="text-xs text-orange-400 bg-orange-950/40 px-1.5 py-0.5 rounded-full mb-0.5">
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}
