/**
 * Notifications into the Virtual Freaks Discord.
 *
 * A webhook rather than a bot: this traffic only ever goes one way, into a
 * channel. A bot would need a process holding a gateway connection open and a
 * token with real permissions on the server. A webhook is a URL that can post
 * to exactly one channel and nothing else — less to run, and far less to lose
 * if it leaks.
 *
 * Nothing here is allowed to break the thing that triggered it. A learner's
 * payment must land whether or not Discord is reachable, so every failure is
 * logged and swallowed.
 */

const TIMEOUT_MS = 4000

export type Field = { name: string; value: string; inline?: boolean }

export type Notice = {
  title: string
  description?: string
  fields?: Field[]
  url?: string
  /** Rendered as the embed's colour stripe. */
  tone?: 'action' | 'good' | 'warn'
}

const TONE_COLOUR: Record<NonNullable<Notice['tone']>, number> = {
  action: 0x0f6b45,
  good: 0x2f855a,
  warn: 0xa86a12,
}

export async function notifyDiscord(notice: Notice): Promise<boolean> {
  const url = process.env.DISCORD_SEAT_WEBHOOK
  if (!url) return false

  const body = {
    // Overriding the name here means one webhook can carry several kinds of
    // notice and still be legible in the channel.
    username: 'Virtual Freaks',
    embeds: [{
      title: notice.title,
      description: notice.description,
      url: notice.url,
      color: TONE_COLOUR[notice.tone ?? 'action'],
      fields: notice.fields ?? [],
      timestamp: new Date().toISOString(),
    }],
  }

  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abort.signal,
    })
    if (!res.ok) {
      console.error('Discord notify failed:', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (error) {
    console.error('Discord notify error:', error)
    return false
  } finally {
    clearTimeout(timer)
  }
}
