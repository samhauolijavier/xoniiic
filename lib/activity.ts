import { db } from '@/lib/db'

export async function logActivity(
  type: string,
  actorId?: string,
  metadata?: Record<string, any>,
  isPublic: boolean = true
) {
  try {
    await db.activityEvent.create({
      data: {
        type,
        actorId: actorId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        isPublic,
      },
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}
