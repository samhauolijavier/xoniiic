import { db } from './db'

export async function isMonetizationEnabled(): Promise<boolean> {
  try {
    const setting = await db.siteSetting.findUnique({
      where: { key: 'monetization_enabled' }
    })
    return setting?.value === 'true'
  } catch (error) {
    console.error('Failed to check monetization setting:', error)
    // Default to OFF if DB query fails
    return false
  }
}
