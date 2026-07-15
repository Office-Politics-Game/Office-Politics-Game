import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          flowType: "pkce",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null

function getSupabaseClient() {
  if (!supabaseClient) {
    throw new Error("缺少第三方登入設定，請確認 Supabase 環境變數")
  }

  return supabaseClient
}

function getOptionalSupabaseClient() {
  return supabaseClient
}

export { getSupabaseClient, getOptionalSupabaseClient }