/*
 * Emails that are not allowed back.
 *
 * Deactivating an account stops that account. It does nothing about the person
 * signing up again ninety seconds later with the same address, which is exactly
 * what somebody creating fake accounts does. The blocklist is the half that
 * makes removal stick.
 *
 * Kept in SiteSetting rather than its own table. A blocklist here will hold
 * tens of entries, not millions — the whole list loads in one row and is
 * checked in memory, and storing it this way means adding the feature needs no
 * schema change and no migration run against production.
 *
 * If it ever grows past a few thousand, move it to a table with an index. It
 * will not.
 */
import { db } from '@/lib/db'

const KEY = 'blockedEmails'

export interface BlockedEmail {
  /** What was typed, so the screen shows something an admin recognises. */
  email: string
  /** What is actually matched on. */
  normalized: string
  reason?: string
  /** The admin's email as text, so the record survives that admin being removed. */
  by?: string
  at: string
}

/*
 * Lowercase, and drop plus-addressing.
 *
 * Blocking fake+3@gmail.com has to also stop fake+4@gmail.com and
 * fake@gmail.com, because they are one mailbox and re-registering with a new
 * suffix is the first thing anybody tries.
 *
 * Gmail also ignores dots, so f.a.k.e@gmail.com is the same inbox again — but
 * that is true of Gmail and not of most providers, and stripping dots
 * everywhere would block real people whose addresses genuinely contain them.
 * Left alone deliberately: an admin can block the variant if it appears.
 */
export function normalizeEmail(raw: string): string {
  const e = String(raw ?? '').trim().toLowerCase()
  const at = e.lastIndexOf('@')
  if (at < 1) return e
  const local = e.slice(0, at).split('+')[0]
  return `${local}@${e.slice(at + 1)}`
}

export async function listBlocked(): Promise<BlockedEmail[]> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: KEY } })
    if (!row?.value) return []
    const parsed = JSON.parse(row.value)
    return Array.isArray(parsed) ? (parsed as BlockedEmail[]) : []
  } catch {
    // A corrupt row must not take the sign-up page down with it. Failing open
    // lets a blocked address through; failing closed locks everybody out.
    return []
  }
}

/**
 * Is this address blocked?
 *
 * Never throws. A database blip on the blocklist should not stop legitimate
 * people registering — the blocklist is a moderation convenience, not a
 * security control, and the accounts screen is still there either way.
 */
export async function isBlocked(email: string): Promise<boolean> {
  const target = normalizeEmail(email)
  if (!target) return false
  const list = await listBlocked()
  return list.some(b => b.normalized === target)
}

async function save(list: BlockedEmail[]): Promise<void> {
  const value = JSON.stringify(list)
  await db.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value },
    update: { value },
  })
}

/** Adding an address already on the list is a no-op, not an error. */
export async function blockEmail(
  email: string,
  opts: { reason?: string; by?: string } = {}
): Promise<BlockedEmail[]> {
  const normalized = normalizeEmail(email)
  if (!normalized) return listBlocked()

  const list = await listBlocked()
  if (list.some(b => b.normalized === normalized)) return list

  const next = [
    { email: String(email).trim(), normalized, reason: opts.reason, by: opts.by, at: new Date().toISOString() },
    ...list,
  ]
  await save(next)
  return next
}

export async function unblockEmail(normalized: string): Promise<BlockedEmail[]> {
  const target = normalizeEmail(normalized)
  const list = await listBlocked()
  const next = list.filter(b => b.normalized !== target)
  if (next.length !== list.length) await save(next)
  return next
}
