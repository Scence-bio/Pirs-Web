import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY

export const hasSupabase =
  typeof url === 'string' &&
  url.trim().length > 0 &&
  typeof key === 'string' &&
  key.trim().length > 0

export const supabase = hasSupabase ? createClient(url.trim(), key.trim()) : null
