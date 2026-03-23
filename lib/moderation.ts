/**
 * Image moderation using Sightengine API (free tier: 500 scans/month)
 * Only used for profile picture uploads to catch NSFW content.
 *
 * Set SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET in environment variables.
 * If not configured, moderation is skipped (uploads proceed normally).
 */

interface ModerationResult {
  safe: boolean
  reason?: string
}

export async function moderateImage(buffer: Buffer, contentType: string): Promise<ModerationResult> {
  const apiUser = process.env.SIGHTENGINE_API_USER
  const apiSecret = process.env.SIGHTENGINE_API_SECRET

  // If Sightengine isn't configured, skip moderation
  if (!apiUser || !apiSecret) {
    return { safe: true }
  }

  try {
    const formData = new FormData()
    const blob = new Blob([buffer], { type: contentType })
    formData.append('media', blob, 'image.jpg')
    formData.append('models', 'nudity-2.1,offensive2')
    formData.append('api_user', apiUser)
    formData.append('api_secret', apiSecret)

    const response = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      console.error('Sightengine API error:', response.status)
      // On API failure, allow the upload (don't block users due to moderation downtime)
      return { safe: true }
    }

    const data = await response.json()

    // Check nudity scores
    // nudity-2.1 returns: sexual_activity, sexual_display, erotica, very_suggestive, suggestive, mild_suggestive, none
    const nudity = data.nudity || {}
    const nsfwScore = (nudity.sexual_activity || 0) + (nudity.sexual_display || 0) + (nudity.erotica || 0)
    const suggestiveScore = nudity.very_suggestive || 0

    if (nsfwScore > 0.3) {
      return { safe: false, reason: 'Image contains inappropriate content (nudity/sexual)' }
    }

    if (suggestiveScore > 0.7) {
      return { safe: false, reason: 'Image is too suggestive for a professional profile' }
    }

    // Check offensive content
    const offensive = data.offensive || {}
    if ((offensive.prob || 0) > 0.7) {
      return { safe: false, reason: 'Image contains offensive content' }
    }

    return { safe: true }
  } catch (error) {
    console.error('Image moderation error:', error)
    // On error, allow the upload
    return { safe: true }
  }
}
