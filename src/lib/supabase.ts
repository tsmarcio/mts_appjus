import { createClient } from '@supabase/supabase-js'

type RuntimeAppConfig = {
  supabaseUrl?: string
  supabaseAnonKey?: string
}

declare global {
  interface Window {
    __MTS_APPJUS_CONFIG__?: RuntimeAppConfig
  }
}

const runtimeConfig = typeof window === 'undefined' ? undefined : window.__MTS_APPJUS_CONFIG__
const supabaseUrl = runtimeConfig?.supabaseUrl || (import.meta.env.VITE_SUPABASE_URL as string | undefined)
const supabaseAnonKey =
  runtimeConfig?.supabaseAnonKey || (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null
