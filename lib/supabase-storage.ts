import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    return null
  }

  _supabase = createClient(supabaseUrl, supabaseServiceKey)
  return _supabase
}

export async function uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<string | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true,
    })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return urlData.publicUrl
}

export async function deleteFile(bucket: string, path: string) {
  const supabase = getSupabase()
  if (!supabase) return
  await supabase.storage.from(bucket).remove([path])
}

/**
 * For files that are nobody else's business.
 *
 * uploadFile above returns a permanent public URL, which is right for an avatar
 * and wrong for a payment receipt — a GCash screenshot carries a real name, an
 * amount, and part of a phone number. These go in a private bucket and are read
 * back only through short-lived signed links, so a URL that leaks out of an
 * admin screen stops working within the hour.
 *
 * Returns the storage PATH, not a URL. Nothing is readable without signing.
 */
export async function uploadPrivateFile(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string
): Promise<string | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: false })

  if (error) {
    console.error('Private upload error:', error)
    return null
  }
  return path
}

const SIGNED_URL_SECONDS = 60 * 60

export async function signedUrlFor(bucket: string, path: string): Promise<string | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_SECONDS)

  if (error) {
    console.error('Signed URL error:', error)
    return null
  }
  return data?.signedUrl ?? null
}

/**
 * A URL the browser can upload straight to, skipping us entirely.
 *
 * Every other upload here posts the file to a route handler, which works fine
 * for an avatar and not at all for video: a serverless request body is capped
 * around 4.5MB and a minute of phone footage is ten times that. The file would
 * be rejected before any of our code ran.
 *
 * So the browser gets a short-lived signed URL and sends the file to Supabase
 * directly. We never touch the bytes. The path is decided here rather than by
 * the client, which is what stops somebody uploading over another person's
 * video by asking for a URL with their id in it.
 */
export async function signedUploadUrlFor(
  bucket: string,
  path: string,
): Promise<{ uploadUrl: string; token: string; publicUrl: string } | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path)

  if (error || !data) {
    console.error('Signed upload URL error:', error)
    return null
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

  return {
    uploadUrl: data.signedUrl,
    token: data.token,
    publicUrl: urlData.publicUrl,
  }
}
