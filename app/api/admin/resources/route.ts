import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'
import { uploadFile, deleteFile } from '@/lib/supabase-storage'
import type { ResourceKind } from '@prisma/client'

export const dynamic = 'force-dynamic'

const BUCKET = 'resources'

// Practice materials are meant to be downloaded, so the ceiling is generous.
// It exists to stop somebody putting a raw video file through the uploader by
// mistake, not to be stingy — Vercel's own request limit is the real wall.
const MAX_BYTES = 25 * 1024 * 1024

const ALLOWED = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/msword',
  'text/csv',
  'text/plain',
  'image/png',
  'image/jpeg',
  'application/zip',
])

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const admin = session.user as { id: string; role: string }
  if (admin.role !== 'admin') return { error: NextResponse.json({ error: 'Admin only' }, { status: 403 }) }
  return { admin }
}

/** Readable, stable, and safe in a URL. Collisions get a short suffix. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'resource'
}

export async function GET() {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  try {
    const resources = await withRetry(() => db.resource.findMany({
      orderBy: [{ track: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
    }))
    const tracks = Array.from(new Set(resources.map(r => r.track))).sort()
    return NextResponse.json({ resources, tracks })
  } catch (error) {
    console.error('Resource list error:', error)
    return NextResponse.json({ error: 'Database connection failed. Please try again.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected a form upload.' }, { status: 400 })
  }

  const title = String(form.get('title') ?? '').trim()
  const track = String(form.get('track') ?? '').trim()
  const kind = String(form.get('kind') ?? '') as ResourceKind
  const summary = String(form.get('summary') ?? '').trim() || null
  const videoUrl = String(form.get('videoUrl') ?? '').trim() || null
  const file = form.get('file')

  if (!title) return NextResponse.json({ error: 'Give it a title.' }, { status: 400 })
  if (!track) return NextResponse.json({ error: 'Pick a track — that is how it is grouped on the page.' }, { status: 400 })
  if (!['video', 'document', 'scenario'].includes(kind)) {
    return NextResponse.json({ error: 'Kind must be video, document, or scenario.' }, { status: 400 })
  }
  if (kind === 'video' && !videoUrl) {
    return NextResponse.json({ error: 'A video needs a link.' }, { status: 400 })
  }
  if (kind !== 'video' && !(file instanceof File)) {
    return NextResponse.json({ error: 'Attach the file people will download.' }, { status: 400 })
  }

  let filePath: string | null = null
  let fileName: string | null = null
  let fileSize: number | null = null

  if (file instanceof File) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json({
        error: `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is ${MAX_BYTES / 1024 / 1024}MB.`,
      }, { status: 400 })
    }
    if (file.type && !ALLOWED.has(file.type)) {
      return NextResponse.json({
        error: `${file.type} is not a file type people can practise with here. PDF, Word, Excel, CSV, images, or a zip.`,
      }, { status: 400 })
    }

    // The stored name is deliberately not the uploaded one: two scenarios both
    // called "brief.pdf" must not overwrite each other, and an uploaded name can
    // carry path characters. The original is kept separately for the download.
    const stamp = `${slugify(title)}-${Math.random().toString(36).slice(2, 8)}`
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.slice(0, 8) : 'bin'
    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadFile(BUCKET, `${stamp}.${ext}`, buffer, file.type || 'application/octet-stream')
    if (!url) {
      return NextResponse.json({
        error: `Upload failed. Check that a public storage bucket named "${BUCKET}" exists in Supabase.`,
      }, { status: 500 })
    }
    filePath = url
    fileName = file.name
    fileSize = file.size
  }

  try {
    let slug = slugify(title)
    if (await withRetry(() => db.resource.findUnique({ where: { slug }, select: { id: true } }))) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
    }

    const last = await withRetry(() => db.resource.findFirst({
      where: { track },
      orderBy: { position: 'desc' },
      select: { position: true },
    }))

    const resource = await withRetry(() => db.resource.create({
      data: {
        title, slug, summary, track, kind, videoUrl,
        filePath, fileName, fileSize,
        position: (last?.position ?? 0) + 1,
        // Drafts by default. A resource that publishes the instant it uploads
        // is a half-written scenario being read while it is written.
        published: false,
      },
    }))

    return NextResponse.json({ message: 'Saved as a draft. Publish it when it is ready.', resource })
  } catch (error) {
    console.error('Resource create error:', error)
    return NextResponse.json({ error: 'Database connection failed. Please try again.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const body = await req.json().catch(() => ({}))
  const id = String(body.id ?? '')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (typeof body.published === 'boolean') data.published = body.published
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim()
  if (typeof body.summary === 'string') data.summary = body.summary.trim() || null
  if (typeof body.track === 'string' && body.track.trim()) data.track = body.track.trim()
  if (Number.isFinite(body.position)) data.position = Number(body.position)

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 })
  }

  try {
    const resource = await withRetry(() => db.resource.update({ where: { id }, data }))
    return NextResponse.json({
      message: data.published === true ? 'Published — it is on the resources page now.'
        : data.published === false ? 'Unpublished. Nobody can see it.'
        : 'Saved.',
      resource,
    })
  } catch (error) {
    console.error('Resource update error:', error)
    return NextResponse.json({ error: 'Could not save that.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  try {
    const existing = await withRetry(() => db.resource.findUnique({
      where: { id },
      select: { filePath: true },
    }))
    if (!existing) return NextResponse.json({ error: 'Already gone.' }, { status: 404 })

    await withRetry(() => db.resource.delete({ where: { id } }))

    // The row is the record; the file is just bytes. Removing the row first
    // means a storage hiccup leaves an orphaned file rather than a resource
    // that still lists but cannot be downloaded.
    if (existing.filePath) {
      const name = existing.filePath.split('/').pop()
      if (name) await deleteFile(BUCKET, name)
    }

    return NextResponse.json({ message: 'Deleted.' })
  } catch (error) {
    console.error('Resource delete error:', error)
    return NextResponse.json({ error: 'Could not delete that.' }, { status: 500 })
  }
}
