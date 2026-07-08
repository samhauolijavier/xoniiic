# Spec: Standalone Discord Billing-Request Tracker + Google Calendar Draft Events

**This is a self-contained, greenfield project.** It shares no code, no database, and no environment variables with any existing application. Build it as its own repo and its own deployment. This document is everything needed to build it — it can be handed directly to a developer or pasted into a fresh Claude Code session.

---

## 1. Problem & Goal

Team members request ad-spend billing changes (pause / cancel / adjust) in a company Discord, and requests slip through the cracks. Build a small web service that provides:

1. **Capture** — a Discord slash command `/billing-request` that reliably logs every request.
2. **Tracking** — a `BillingRequest` database table + a password-protected admin page at `/admin` with a status lifecycle: `open → scheduled → done | cancelled`.
3. **Calendar draft** — on capture, generate a **pre-filled Google Calendar event link** (title, date, details, and a configurable guest list already filled in) and post it to a private Discord ops channel. The owner clicks the link, reviews/edits the event, and hits Save to make it live and invite the guests. Google Calendar has no native "draft event" concept — the pre-filled `render?action=TEMPLATE` link is the zero-OAuth way to get one.
4. **Safety net** — a daily cron digest posted to the ops channel: open requests, due-soon, overdue, and unscheduled >24h.

### Architecture decisions (already made — build within these)

- **Stack:** Next.js 14+ (App Router, TypeScript) + Prisma + hosted Postgres (Neon, Supabase, or Vercel Postgres free tier all work). Deploy to Vercel (free tier is sufficient).
- **HTTP Interactions endpoint, NOT a gateway bot.** Discord POSTs slash-command interactions to an API route. No persistent process, no bot hosting.
- **Command options, not a modal.** Options are typed, validated by the Discord client, support choices for the request type, and arrive in a single request.
- **Synchronous response, no deferral.** The handler is one DB insert + one webhook POST — well within Discord's 3-second budget.
- **Owner notification = private channel webhook, not DM.** One unauthenticated POST to a secret URL, no bot presence needed, permanent linkable message, reused by the cron digest.
- **Capture first, notify second.** The DB insert happens before the ops-channel post; a notification failure must never lose a request. The daily digest is the backstop.
- **Admin auth = single shared password** (env var) checked via a signed cookie. This is an internal single-owner tool; no user accounts, no OAuth.

---

## 2. Project scaffold

```bash
npx create-next-app@latest billing-request-tracker --typescript --app --tailwind --eslint --no-src-dir
cd billing-request-tracker
npm i @prisma/client discord-interactions
npm i -D prisma tsx
npx prisma init
```

`discord-interactions` provides `verifyKey` (Ed25519 signature verification). Do **not** add discord.js — everything else is plain `fetch` against Discord's REST API.

---

## 3. Database schema

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model BillingRequest {
  id              String    @id @default(cuid())
  requestType     String    // "pause" | "cancel" | "adjust"
  platform        String    // e.g. "Meta", "Google Ads", "TikTok" (free text)
  details         String    // amount / what to change
  notes           String?
  effectiveDate   DateTime? // desired effective date/deadline (date-only, midnight UTC)
  status          String    @default("open") // open -> scheduled -> done | cancelled
  requesterId     String    // Discord user snowflake
  requesterHandle String    // Discord username at time of request
  guildId         String?
  channelId       String?   // ops-channel id of the notification message
  messageId       String?   // ops-channel message id (for discord.com/channels/{guild}/{channel}/{message})
  calendarLink    String?   // pre-filled Google Calendar TEMPLATE url
  calendarEventId String?   // reserved for Phase 2 (Calendar API) — unused in v1
  scheduledAt     DateTime? // set when status -> scheduled
  resolvedAt      DateTime? // set when status -> done/cancelled
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([status])
  @@index([effectiveDate])
  @@index([createdAt])
}
```

Apply with `npx prisma db push`. No relations, no user table — requesters are Discord users identified by snowflake + handle.

---

## 4. Files to create

### 4.1 `lib/db.ts` — Prisma singleton (serverless-safe)

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const db = globalForPrisma.prisma ?? new PrismaClient()
globalForPrisma.prisma = db
```

### 4.2 `lib/discord.ts` — Discord helpers

```ts
import { verifyKey } from 'discord-interactions'

export function verifyDiscordRequest(
  rawBody: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  if (!signature || !timestamp) return false
  return verifyKey(rawBody, signature, timestamp, process.env.DISCORD_PUBLIC_KEY!)
}

// Posts to the private ops channel webhook. `?wait=true` makes Discord return
// the created message object so messageId/channelId can be stored.
// Never throws — notification failure must not fail capture.
export async function postOpsMessage(payload: {
  content?: string
  embeds?: unknown[]
}): Promise<{ id: string; channel_id: string } | null> {
  const url = process.env.DISCORD_OPS_WEBHOOK_URL
  if (!url) return null
  try {
    const res = await fetch(`${url}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.error('Discord ops webhook post failed:', err)
    return null
  }
}

export function getOption(
  options: Array<{ name: string; value?: unknown }> | undefined,
  name: string
): string | undefined {
  const opt = options?.find(o => o.name === name)
  return typeof opt?.value === 'string' ? opt.value : undefined
}

export const STATUS_LABELS: Record<string, string> = {
  open: '🟡 Open',
  scheduled: '🗓️ Scheduled',
  done: '✅ Done',
  cancelled: '⛔ Cancelled',
}

export const TYPE_LABELS: Record<string, string> = {
  pause: '⏸️ Pause',
  cancel: '🛑 Cancel',
  adjust: '🔧 Adjust',
}
```

### 4.3 `lib/calendar-link.ts` — pre-filled Google Calendar link builder

```ts
// Builds https://calendar.google.com/calendar/render?action=TEMPLATE&...
// All-day event on the effective date (dates=YYYYMMDD/YYYYMMDD+1) — the
// all-day format avoids timezone ambiguity entirely. Defaults to tomorrow
// when no effective date was given.
export function buildCalendarLink(params: {
  title: string
  date?: Date | null
  details: string
  guests: string[]
}): string {
  const start = params.date ?? new Date(Date.now() + 24 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')

  const qs = new URLSearchParams({
    action: 'TEMPLATE',
    text: params.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: params.details,
  })
  if (params.guests.length > 0) {
    // NOTE: guests go in ONE `add` param, comma-separated
    qs.set('add', params.guests.join(','))
  }
  return `https://calendar.google.com/calendar/render?${qs.toString()}`
}

export function getBillingGuests(): string[] {
  return (process.env.CALENDAR_GUESTS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}
```

Title convention: `[Billing] Pause — Meta — @handle`.
Details body: request type, platform, details, notes, requester handle, and a link to `${APP_URL}/admin`.

### 4.4 `app/api/discord/interactions/route.ts` — the interactions endpoint

```
export const dynamic = 'force-dynamic'

POST /api/discord/interactions
  1. const body = await req.text()                    // RAW body first — required for verification
  2. Verify X-Signature-Ed25519 + X-Signature-Timestamp via verifyDiscordRequest()
     → invalid: return 401. MANDATORY: Discord's endpoint validation deliberately
       sends invalid signatures and rejects your URL if you accept them.
  3. const interaction = JSON.parse(body)
  4. type === 1 (PING)  → return NextResponse.json({ type: 1 })   // PONG
  5. type === 2 (APPLICATION_COMMAND) && data.name === 'billing-request':
     a. requester = interaction.member?.user ?? interaction.user  // guild vs DM shapes
     b. Extract options: type, platform, details, effective_date, notes
     c. Parse effective_date "YYYY-MM-DD" LENIENTLY — if unparseable, store
        effectiveDate: null and append the raw string to notes.
        Capture must NEVER fail on bad input.
     d. Compute calendarLink (buildCalendarLink + getBillingGuests)
     e. db.billingRequest.create({ ...allFields, calendarLink })  // CAPTURE FIRST
     f. postOpsMessage() — embed with all fields, a
        [Open pre-filled calendar event](calendarLink) markdown link,
        and a link to ${APP_URL}/admin. Best-effort.
     g. If the webhook returned a message: update the row with messageId + channel_id.
     h. Return { type: 4, data: { flags: 64, content:
        '✅ Captured billing request: pause Meta by 2026-07-15. The owner has been notified.' } }
        // flags: 64 = ephemeral, only the requester sees it
  6. Anything else → { type: 4, data: { flags: 64, content: 'Unknown command' } }
```

### 4.5 `scripts/register-commands.ts` — one-time command registration

Run with `npx tsx scripts/register-commands.ts`. Add npm script `"discord:register": "tsx scripts/register-commands.ts"`.

```
PUT https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/guilds/${DISCORD_GUILD_ID}/commands
Authorization: Bot ${DISCORD_BOT_TOKEN}
Body: [command]   // PUT replaces all guild commands — idempotent, safe to rerun
```

**Guild-scoped, not global** — guild commands update instantly (global takes up to an hour) and this is a single-server internal tool.

Command definition:

```json
{
  "name": "billing-request",
  "description": "Request a pause, cancellation, or adjustment of billing / ad spend",
  "options": [
    { "type": 3, "name": "type", "description": "What should happen", "required": true,
      "choices": [
        { "name": "Pause", "value": "pause" },
        { "name": "Cancel", "value": "cancel" },
        { "name": "Adjust", "value": "adjust" }
      ] },
    { "type": 3, "name": "platform", "description": "Platform/account, e.g. Meta, Google Ads, TikTok", "required": true, "max_length": 100 },
    { "type": 3, "name": "details", "description": "Amount / what to change", "required": true, "max_length": 500 },
    { "type": 3, "name": "effective_date", "description": "Desired date/deadline, YYYY-MM-DD", "required": false, "max_length": 10 },
    { "type": 3, "name": "notes", "description": "Anything else", "required": false, "max_length": 500 }
  ]
}
```

### 4.6 Admin auth — `lib/admin-auth.ts` + `app/admin/login/page.tsx` + `app/api/admin/login/route.ts`

Single shared password, no user accounts:

- `POST /api/admin/login` with `{ password }`; compare against `ADMIN_PASSWORD` env var; on match set an HTTP-only, `Secure`, `SameSite=Lax` cookie `admin_session` containing an HMAC-SHA256 of a constant string keyed by `ADMIN_SESSION_SECRET` (use Node's `crypto`), `maxAge` 30 days.
- `lib/admin-auth.ts` exports `isAdminRequest(req)` — recompute the HMAC and constant-time-compare with the cookie value. Used by every admin API route.
- `app/admin/login/page.tsx` — minimal password form.
- Redirect unauthenticated visits to `/admin` → `/admin/login` (check the cookie in the admin page's server component).

### 4.7 `app/api/admin/requests/route.ts` — GET list

- Guard with `isAdminRequest` → 403.
- Query params: `status` (default `all`).
- Returns `{ requests, stats }` where stats = counts for: **open**, **scheduled**, **due ≤3 days** (effectiveDate ≤ now+3d and status open/scheduled), **unscheduled >24h** (status open and createdAt < now−24h).
- Order by `createdAt desc`.

### 4.8 `app/api/admin/requests/[id]/route.ts` — PATCH status

- Guard with `isAdminRequest` → 403.
- Body `{ status }` validated against `['open', 'scheduled', 'done', 'cancelled']`.
- `→ scheduled`: set `scheduledAt: new Date()`. `→ done | cancelled`: set `resolvedAt: new Date()`. `→ open` (reopen): clear both.

### 4.9 `app/admin/page.tsx` — tracking dashboard

Simple client component (fetches the two API routes above):

- **Stat cards:** Open / Scheduled / Due ≤3 days / Unscheduled >24h.
- **Filter chips:** All / Open / Scheduled / Done / Cancelled.
- **Table columns:** type badge, platform, details (truncated with `title` attr), requester handle, effective date (highlighted red when past or ≤3 days out and unresolved), status badge, created date, actions.
- **Row actions:**
  - Status transition buttons → PATCH endpoint.
  - "Calendar" link → opens `calendarLink` in a new tab (the owner's approve-and-save flow).
  - "Discord" link → `https://discord.com/channels/{guildId}/{channelId}/{messageId}` (hide when messageId is null).

Plain Tailwind; no component library needed.

### 4.10 `app/api/cron/digest/route.ts` — daily digest

- GET, `export const dynamic = 'force-dynamic'`.
- Guard: `req.headers.get('authorization') !== \`Bearer ${process.env.CRON_SECRET}\`` → 401. (When a `CRON_SECRET` env var exists on the Vercel project, Vercel automatically attaches this header to cron invocations.)
- Fetch `status in ['open', 'scheduled']`, bucket into:
  - **Overdue** — effectiveDate < now
  - **Due soon** — effectiveDate ≤ now + 3 days
  - **Unscheduled >24h** — status open and createdAt < now − 24h
  - **Open** — everything else still open
- All buckets empty → return `{ ok: true, posted: false }` **without posting** (no noise).
- Otherwise `postOpsMessage` with a digest embed: bucket counts + up to ~10 line items (`⏸️ pause Meta — @handle — due 2026-07-15 — [calendar](url)`) + link to `${APP_URL}/admin`.

### 4.11 `vercel.json` (repo root)

```json
{
  "crons": [
    { "path": "/api/cron/digest", "schedule": "0 13 * * *" }
  ]
}
```

Schedule is UTC — `0 13 * * *` ≈ morning US time; adjust to the owner's timezone.

---

## 5. Environment variables (all new — nothing shared with any other app)

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Neon / Supabase / Vercel Postgres) |
| `DISCORD_PUBLIC_KEY` | Ed25519 verification of interaction signatures |
| `DISCORD_APPLICATION_ID` | Command registration |
| `DISCORD_BOT_TOKEN` | Auth for command registration only |
| `DISCORD_GUILD_ID` | Guild-scoped command registration + Discord message links |
| `DISCORD_OPS_WEBHOOK_URL` | Secret webhook URL of the private ops channel |
| `CALENDAR_GUESTS` | Comma-separated guest emails pre-added to every calendar draft |
| `ADMIN_PASSWORD` | Shared password for the `/admin` dashboard |
| `ADMIN_SESSION_SECRET` | HMAC key for the admin session cookie (any long random string) |
| `CRON_SECRET` | Protects the digest route (Vercel attaches it to cron calls) |
| `APP_URL` | Deployed base URL, used in links (e.g. `https://billing.example.com`) |

Commit a `.env.example` listing all of these with placeholder values.

---

## 6. Discord developer portal setup (owner checklist, ~10 min)

1. [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application** (e.g. "Billing Bot").
2. General Information: copy **Application ID** → `DISCORD_APPLICATION_ID`, **Public Key** → `DISCORD_PUBLIC_KEY`.
3. **Bot** tab → Reset Token → copy → `DISCORD_BOT_TOKEN`. No privileged intents needed.
4. OAuth2 → URL Generator → scopes `applications.commands` + `bot` (no bot permissions) → open the generated URL → install to the server. With Discord developer mode on, right-click the server → Copy Server ID → `DISCORD_GUILD_ID`.
5. Create a private ops channel (e.g. `#billing-ops`, visible to the owner only) → channel settings → Integrations → Webhooks → New Webhook → copy URL → `DISCORD_OPS_WEBHOOK_URL`.
6. Set all env vars in Vercel and **deploy first**, then: General Information → **Interactions Endpoint URL** = `https://<deployed-domain>/api/discord/interactions` → Save. Discord validates immediately (PING + deliberate bad-signature probes); Save only succeeds if the route responds correctly.
7. Run `npm run discord:register` (with env vars set locally) — `/billing-request` appears in the server instantly.
8. Optional: restrict who can use the command via Server Settings → Integrations → the app → command permissions.

---

## 7. Verification plan

**Local:**
1. `npx prisma db push` against the dev DB; confirm the `BillingRequest` table in `npx prisma studio`.
2. `npm run build` passes.
3. Unsigned request rejected: `curl -X POST localhost:3000/api/discord/interactions -d '{}'` → **401**.
4. Tunnel test: `npm run dev` + `ngrok http 3000` (or `cloudflared`), point the Discord app's Interactions Endpoint URL at the tunnel — Discord's **Save** button doubles as the PING/PONG + bad-signature test.
5. Run `/billing-request` in a test server, verify:
   - ephemeral confirmation appears (only to the requester),
   - DB row created with correct fields,
   - ops-channel embed posted and `messageId`/`channelId` stored,
   - calendar link opens Google Calendar fully pre-filled **including guests**,
   - an invalid `effective_date` like "next friday" still creates the row (date null, raw text preserved in notes).
6. Cron: `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/digest` → digest posts; with everything marked done → `posted: false`, no message; wrong/missing header → 401.
7. Admin: wrong password rejected; correct password → dashboard; filter and flip statuses; confirm `scheduledAt`/`resolvedAt` get set; Calendar and Discord links work.

**Production end-to-end:** deploy → point Interactions Endpoint URL at prod → re-run register script → one real `/billing-request` → click the calendar link → Save the event → mark the row "scheduled" in admin → confirm the next cron digest reflects it.

---

## 8. Build order (shippable slices)

1. Scaffold + schema + `db push` + `lib/` helpers
2. Interactions route + register script — **capture works end-to-end here; most of the value**
3. Admin auth + admin API + dashboard
4. Cron digest + `vercel.json`

---

## 9. Explicitly deferred (Phase 2 — do NOT build now)

- **Real Google Calendar API tentative events.** Requires a Google Cloud project, OAuth consent screen, a `calendar.events`-scoped OAuth flow for the owner, and refresh-token storage. When built: `/api/google/connect` OAuth route, store the refresh token, create events with `status: 'tentative'`, populate `calendarEventId`.
- **Keyword auto-detection** of unstructured chat requests ("hey can we pause Meta?"). Requires an always-on gateway bot host (Railway/Fly, ~$5/mo). The slash command is the official path for v1.
- DM-to-owner path (ops channel covers it), per-request escalation pings, email notifications, multi-guild support.
