/*
 * Hands the browser a signed URL for one testimonial video.
 *
 * It issues permission to write to exactly one path and nothing else. The path
 * is built from the session's own user id, never from anything the client sent,
 * so asking for a URL with somebody else's id in it is not a request this route
 * can express.
 */
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { signedUploadUrlFor } from '@/lib/supabase-storage'

export const dynamic = 'force-dynamic'

const TESTIMONIAL_BUCKET = 'testimonials'

/** Roughly two minutes of phone video. Past that it stops being a testimonial. */
const MAX_BYTES = 100 * 1024 * 1024

const ALLOWED = ['video/mp4', 'video/quicktime', 'video/webm']

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const me = session?.user as { id?: string } | undefined
  if (!me?.id) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  }

  let body: { contentType?: string; size?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const contentType = String(body.contentType ?? '')
  const size = Number(body.size ?? 0)

  if (!ALLOWED.includes(contentType)) {
    return NextResponse.json({
      error: 'That file is not a video we can play. Most phones record MP4 or MOV, which both work.',
    }, { status: 400 })
  }

  if (!size || size > MAX_BYTES) {
    return NextResponse.json({
      error: `Keep it under ${MAX_BYTES / 1024 / 1024}MB — about two minutes. If yours is longer, record a shorter one rather than compressing it.`,
    }, { status: 400 })
  }

  const ext = contentType === 'video/quicktime' ? 'mov'
    : contentType === 'video/webm' ? 'webm'
    : 'mp4'

  // One path per person. A second upload replaces the first rather than
  // leaving orphaned files nobody will ever look at or clean up.
  const path = `${me.id}/testimonial.${ext}`

  const signed = await signedUploadUrlFor(TESTIMONIAL_BUCKET, path)
  if (!signed) {
    return NextResponse.json({
      error: 'Could not start the upload. Try again in a moment.',
    }, { status: 500 })
  }

  return NextResponse.json(signed)
}
