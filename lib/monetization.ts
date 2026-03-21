import { db } from './db'

export async function isMonetizationEnabled(): Promise<boolean> {
  const setting = await db.siteSetting.findUnique({
    where: { key: 'monetization_enabled' }
  })
  return setting?.value === 'true'
}
