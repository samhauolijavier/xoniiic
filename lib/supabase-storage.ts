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
