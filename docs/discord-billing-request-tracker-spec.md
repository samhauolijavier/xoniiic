# Spec: Discord Billing-Request Tracker + Google Calendar Draft Events

**Repo:** virtualfreaks (Next.js 14 App Router, TypeScript, Prisma/Postgres, deployed on Vercel)
**Branch:** `claude/discord-billing-request-tracking-hi6mjq`

---

## 1. Problem & Goal

Team members request ad-spend billing changes (pause / cancel / adjust) in the company Discord, and requests slip through the cracks. Build:

1. **Capture** — a Discord slash command `/billing-request` that reliably logs every request.
2. **Tracking** — a `BillingRequest` table + admin page at `/admin/billing-requests` with a status lifecycle: `open → scheduled → done | cancelled`.
3. **Calendar draft** — on capture, generate a **pre-filled Google Calendar event link** (with title, date, details, and specific guests) and post it to a private ops channel. The owner clicks the link, reviews/edits the event, and hits Save to make it live and invite guests. Google Calendar has no native "draft event" concept — the pre-filled `render?action=TEMPLATE` link is the zero-OAuth way to fake one.
4. **Safety net** — a daily Vercel cron digest posted to the ops channel: open requests, due-soon, overdue, unscheduled >24h.

### Architecture decisions (already made — build within these)

- **HTTP Interactions endpoint, NOT a gateway bot.** The app runs on Vercel serverless; a persistent gateway bot won't work there. Discord POSTs slash-command interactions to a Next.js API route. No extra hosting needed.
- **Command options, not a modal.** Options are typed, validated by the Discord client, support choices for the request type, and arrive in a single request (a modal needs two interactions and can't have select menus).
- **Synchronous response, no deferral.** The handler is one DB insert + one webhook POST — well within Discord's 3-second budget.
- **Owner notification = private channel webhook, not DM.** A channel webhook is one unauthenticated POST to a secret URL, needs no bot presence, gives a permanent linkable message, and is reused by the cron digest.
- **Capture first, notify second.** The DB insert happens before the ops-channel post; a notification failure must never lose a request. The daily digest is the backstop for missed notifications.

---

## 2. New dependency (one)

```bash
npm i discord-interactions
```

Provides `verifyKey` (Ed25519 signature verification) and interaction type constants. Do **not** add discord.js — everything else is plain `fetch` against Discord's REST API.

---

## 3. Prisma schema

Append to `prisma/schema.prisma`, then run `npm run db:push`. Match existing schema style: string statuses (like `ContactRequest.status`, `Report.status`), cuid ids, `createdAt`/`updatedAt`. Deliberately **no relation to `User`** — requesters are Discord users, not app users.

```prisma
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

---

## 4. Files to create / modify

### 4.1 New: `lib/discord.ts` — shared Discord helpers

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
// the created message object so we can store messageId/channelId.
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

### 4.2 New: `lib/calendar-link.ts` — pre-filled Google Calendar link builder

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
  return (process.env.BILLING_CALENDAR_GUESTS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}
```

Title convention: `[Billing] Pause — Meta — @handle`.
Details body: request type, platform, details, notes, requester handle, and a link to `${NEXTAUTH_URL}/admin/billing-requests`.

### 4.3 New: `app/api/discord/interactions/route.ts` — the interactions endpoint

Mirror the existing Stripe webhook pattern (`app/api/stripe/webhook/route.ts`): `export const dynamic = 'force-dynamic'`, **read the raw body before parsing** (required for signature verification), switch on type.

Flow:

```
POST /api/discord/interactions
  1. const body = await req.text()                    // RAW body first
  2. Verify X-Signature-Ed25519 + X-Signature-Timestamp via verifyDiscordRequest()
     → invalid: return 401. MANDATORY: Discord's endpoint validation deliberately
       sends invalid signatures and rejects your URL if you accept them.
  3. const interaction = JSON.parse(body)
  4. type === 1 (PING)  → return NextResponse.json({ type: 1 })   // PONG
  5. type === 2 (APPLICATION_COMMAND) && data.name === 'billing-request':
     a. requester = interaction.member?.user ?? interaction.user  // guild vs DM
     b. Extract options: type, platform, details, effective_date, notes
     c. Parse effective_date "YYYY-MM-DD" LENIENTLY — if unparseable, store
        effectiveDate: null and append the raw string to notes.
        Capture must NEVER fail on bad input.
     d. Compute calendarLink (buildCalendarLink + getBillingGuests)
     e. db.billingRequest.create({ ...allFields, calendarLink })  // CAPTURE FIRST
     f. postOpsMessage() — embed with all fields + [Open pre-filled calendar event](link)
        + link to /admin/billing-requests. Best-effort.
     g. If the webhook returned a message: db.billingRequest.update with
        messageId + channelId.
     h. Return { type: 4, data: { flags: 64, content:
        '✅ Captured billing request: pause Meta by 2026-07-15. The owner has been notified.' } }
        // flags: 64 = ephemeral, only the requester sees it
  6. Anything else → { type: 4, data: { flags: 64, content: 'Unknown command' } }
```

### 4.4 New: `scripts/register-discord-commands.ts` — one-time command registration

Create the `scripts/` directory (doesn't exist yet). Plain `fetch`, run with ts-node (already a devDependency). Add to `package.json` scripts:

```json
"discord:register": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' scripts/register-discord-commands.ts"
```

The script:

```
PUT https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/guilds/${DISCORD_GUILD_ID}/commands
Authorization: Bot ${DISCORD_BOT_TOKEN}
Body: [command] — PUT replaces all guild commands, idempotent
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

### 4.5 New: `app/api/admin/billing-requests/route.ts` — GET list

Copy the admin guard + response shape from `app/api/admin/leads/route.ts`:
`getServerSession(authOptions)` → `user.role !== 'admin'` → 403; `export const dynamic = 'force-dynamic'`.

- Query params: `status` (default `all`), `page`, `limit`.
- Returns `{ requests, stats, pagination }` where stats = counts for: open, scheduled, due in ≤3 days (effectiveDate ≤ now+3d and status not done/cancelled), unscheduled >24h (status open and createdAt < now−24h).
- Order by `createdAt desc`; the status filter chips on the page do the rest — don't over-engineer sorting.

### 4.6 New: `app/api/admin/billing-requests/[id]/route.ts` — PATCH status

Copy the pattern from `app/api/admin/reports/[id]/route.ts`.

- Body `{ status }` validated against `['open', 'scheduled', 'done', 'cancelled']`.
- `status → scheduled`: set `scheduledAt: new Date()`.
- `status → done | cancelled`: set `resolvedAt: new Date()`.
- `status → open` (reopen): clear both.

### 4.7 New: `app/admin/billing-requests/page.tsx` — admin tracking page

Client component modeled directly on `app/admin/leads/page.tsx` (same `useSession` admin check, stat cards, filter chips, `card` table, brand Tailwind classes).

- **Stat cards:** Open / Scheduled / Due ≤3 days / Unscheduled >24h.
- **Filter chips:** All / Open / Scheduled / Done / Cancelled.
- **Columns:** type badge, platform, details (truncated with `title` attr), requester handle, effective date (red when past or ≤3 days out and not resolved), status badge, created date, actions.
- **Row actions:**
  - Status transition buttons/dropdown → PATCH endpoint.
  - "Calendar" link → opens `calendarLink` in a new tab (the owner's approve-and-save flow).
  - "Discord" link → `https://discord.com/channels/{guildId}/{channelId}/{messageId}` (hide when messageId is null).

**No middleware change needed** — `middleware.ts` matcher `/admin/:path*` already requires `role === 'admin'` for the page; API routes are guarded in-route like all existing admin APIs.

### 4.8 Modified: `app/admin/page.tsx`

Add one nav link next to the existing admin nav buttons:

```tsx
<Link href="/admin/billing-requests" className="btn-secondary text-sm">Billing Requests</Link>
```

### 4.9 New: `app/api/cron/billing-digest/route.ts` — daily digest

- GET, `export const dynamic = 'force-dynamic'`.
- Guard: `req.headers.get('authorization') !== \`Bearer ${process.env.CRON_SECRET}\`` → 401. (When a `CRON_SECRET` env var exists on the Vercel project, Vercel automatically attaches this header to cron invocations.)
- Fetch requests with `status in ['open', 'scheduled']`, bucket into:
  - **Overdue** — effectiveDate < now
  - **Due soon** — effectiveDate ≤ now + 3 days
  - **Unscheduled >24h** — status open and createdAt < now − 24h
  - **Open** — everything else still open
- If all buckets are empty → return `{ ok: true, posted: false }` **without posting** (no noise).
- Otherwise `postOpsMessage` with a digest embed: bucket counts + up to ~10 line items (`⏸️ pause Meta — @handle — due 2026-07-15 — [calendar](url)`) + link to `/admin/billing-requests`.

### 4.10 New: `vercel.json` (repo root — doesn't exist yet)

```json
{
  "crons": [
    { "path": "/api/cron/billing-digest", "schedule": "0 13 * * *" }
  ]
}
```

Schedule is UTC — `0 13 * * *` ≈ morning US time; adjust to the owner's timezone.

---

## 5. Environment variables (set in Vercel)

| Var | Purpose |
|---|---|
| `DISCORD_PUBLIC_KEY` | Ed25519 verification of interaction signatures |
| `DISCORD_APPLICATION_ID` | Command registration URL |
| `DISCORD_BOT_TOKEN` | Auth for command registration only (and Phase-2 DMs) |
| `DISCORD_GUILD_ID` | Guild-scoped command registration + Discord message links |
| `DISCORD_OPS_WEBHOOK_URL` | Secret webhook URL of the private ops channel |
| `BILLING_CALENDAR_GUESTS` | Comma-separated guest emails pre-added to the calendar draft |
| `CRON_SECRET` | Protects the digest route (Vercel attaches it to cron calls) |
| `NEXTAUTH_URL` *(existing)* | Base URL for admin-page links in Discord/calendar text |

---

## 6. Discord developer portal setup (owner checklist, ~10 min)

1. [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application** (e.g. "Billing Bot").
2. General Information: copy **Application ID** → `DISCORD_APPLICATION_ID`, **Public Key** → `DISCORD_PUBLIC_KEY`.
3. **Bot** tab → Reset Token → copy → `DISCORD_BOT_TOKEN`. No privileged intents needed.
4. OAuth2 → URL Generator → scopes `applications.commands` + `bot` (no bot permissions) → open the generated URL → install to the server. With Discord developer mode on, right-click the server → Copy Server ID → `DISCORD_GUILD_ID`.
5. Create a private ops channel (e.g. `#billing-ops`, visible to the owner only) → channel settings → Integrations → Webhooks → New Webhook → copy URL → `DISCORD_OPS_WEBHOOK_URL`.
6. Set all env vars in Vercel and **deploy first**, then: General Information → **Interactions Endpoint URL** = `https://<prod-domain>/api/discord/interactions` → Save. Discord validates immediately (PING + deliberate bad-signature probes); Save only succeeds if the route responds correctly.
7. Run `npm run discord:register` (with env vars set locally) — `/billing-request` appears in the server instantly.
8. Optional: restrict who can use the command via Server Settings → Integrations → the app → command permissions.

---

## 7. Verification plan

**Local:**
1. `npm run db:push` against a dev DB; confirm the `BillingRequest` table in `npm run db:studio`.
2. `npm run build` passes.
3. Unsigned request rejected: `curl -X POST localhost:3000/api/discord/interactions -d '{}'` → **401**.
4. Tunnel test: `npm run dev` + `ngrok http 3000` (or `cloudflared`), point the Discord app's Interactions Endpoint URL at the tunnel — Discord's **Save** button doubles as the PING/PONG + bad-signature test.
5. Run `/billing-request` in a test server, verify:
   - ephemeral confirmation appears (only to the requester),
   - DB row created with correct fields,
   - ops-channel embed posted and `messageId`/`channelId` stored,
   - calendar link opens Google Calendar fully pre-filled **including guests**,
   - an invalid `effective_date` like "next friday" still creates the row (date null, raw text preserved in notes).
6. Cron: `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/billing-digest` → digest posts; with everything marked done → `posted: false`, no message; wrong/missing header → 401.
7. Admin page: as admin, filter and flip statuses; confirm `scheduledAt`/`resolvedAt` get set; Calendar and Discord links work; non-admin is redirected by middleware.

**Production end-to-end:** deploy → point Interactions Endpoint URL at prod → re-run register script → one real `/billing-request` → click the calendar link → Save the event → mark the row "scheduled" in admin → confirm the next cron digest reflects it.

---

## 8. Build order (shippable slices)

1. Schema + `db:push` + `lib/calendar-link.ts` + `lib/discord.ts`
2. Interactions route + register script — **capture works end-to-end here; most of the value**
3. Admin API routes + admin page + nav link
4. Cron digest + `vercel.json`

---

## 9. Explicitly deferred (Phase 2 — do NOT build now)

- **Real Google Calendar API tentative events.** Requires a second OAuth flow with `calendar.events` scope + refresh-token storage. The existing NextAuth Google provider (`lib/auth.ts`) is login-only with JWT sessions and no token storage — **do not widen its scopes**. When built: standalone `/api/google-calendar/connect` OAuth route, store the refresh token, create events with `status: 'tentative'`, populate `calendarEventId`.
- **Keyword auto-detection** of unstructured chat requests ("hey can we pause Meta?"). Requires an always-on gateway bot host (Railway/Fly, ~$5/mo). The slash command is the official path for v1.
- DM-to-owner path (ops channel covers it), admin-configurable guest list (env var is enough), per-request escalation pings, email notifications via `lib/email.ts`.
