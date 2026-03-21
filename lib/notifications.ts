import { db } from '@/lib/db'

export type NotificationType =
  | 'contact_request'
  | 'message'
  | 'profile_view'
  | 'job_interest'
  | 'badge_earned'
  | 'system'
  | 'subscription'
  | 'report_filed'
  | 'report_resolved'
  | 'review_received'

export interface NotificationPreferences {
  contact_request: boolean
  profile_view: boolean
  message: boolean
  system: boolean // always true, cannot be turned off
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  contact_request: true,
  profile_view: true,
  message: true,
  system: true,
}

export function getNotificationPreferences(json: string | null): NotificationPreferences {
  if (!json) return { ...DEFAULT_NOTIFICATION_PREFERENCES }
  try {
    const parsed = JSON.parse(json)
    return {
      contact_request: parsed.contact_request ?? true,
      profile_view: parsed.profile_view ?? true,
      message: parsed.message ?? true,
      system: true, // always on
    }
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES }
  }
}

/**
 * Map notification type to a preference key.
 * Types that don't map to a toggleable preference return null (always allowed).
 */
function preferenceKeyForType(type: string): keyof NotificationPreferences | null {
  switch (type) {
    case 'contact_request':
      return 'contact_request'
    case 'profile_view':
      return 'profile_view'
    case 'message':
      return 'message'
    case 'system':
    case 'report_filed':
    case 'report_resolved':
      return 'system'
    default:
      return null // subscription, badge_earned, job_interest, review_received — always sent
  }
}

/**
 * Create a notification for a user, respecting their preferences.
 * Returns the notification if created, or null if the user opted out.
 */
export async function createNotification(params: {
  userId: string
  type: string
  title: string
  message: string
  actionUrl?: string
  relatedId?: string
}) {
  try {
    // Check user preferences
    const prefKey = preferenceKeyForType(params.type)
    if (prefKey) {
      const user = await db.user.findUnique({
        where: { id: params.userId },
        select: { notificationPreferences: true },
      })
      const prefs = getNotificationPreferences(user?.notificationPreferences ?? null)
      if (!prefs[prefKey]) return null
    }

    const notification = await db.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl ?? null,
        relatedId: params.relatedId ?? null,
      },
    })

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

/**
 * NOTE: When sending a message via the messaging system, call:
 *
 *   await createNotification({
 *     userId: recipientUserId,
 *     type: 'message',
 *     title: 'New Message',
 *     message: `${senderName} sent you a message`,
 *     actionUrl: `/messages/${conversationId}`,
 *   })
 *
 * This should be added to the message sending API route.
 * (Not added here because another agent is handling messaging routes.)
 */
