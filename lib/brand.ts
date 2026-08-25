/**
 * The logo, for places that cannot use the React component.
 *
 * VFLogo fetches /api/site-settings from the browser, which is fine on a page
 * and useless inside an OG image — those render on the server with no client to
 * do the fetching. So the URL is read here instead.
 *
 * Returns null rather than throwing. A share card with the drawn mark instead
 * of the uploaded one is a small loss; a share card that fails to render is a
 * blank grey rectangle everywhere the link is posted.
 */
import { db } from '@/lib/db'

export async function getLogoUrl(): Promise<string | null> {
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: 'logoUrl' } })
    return setting?.value || null
  } catch {
    return null
  }
}
