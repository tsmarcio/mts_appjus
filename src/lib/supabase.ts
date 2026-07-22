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

function cleanConfigValue(value: string | undefined) {
  return value?.replace(/^\uFEFF/, '').trim()
}

const supabaseUrl = cleanConfigValue(
  runtimeConfig?.supabaseUrl || (import.meta.env.VITE_SUPABASE_URL as string | undefined),
)
const supabaseAnonKey = cleanConfigValue(
  runtimeConfig?.supabaseAnonKey || (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined),
)

export const supabaseConfig = {
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  missing: [
    !supabaseUrl ? 'VITE_SUPABASE_URL ou SUPABASE_URL' : '',
    !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY ou SUPABASE_ANON_KEY' : '',
  ].filter(Boolean),
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null
