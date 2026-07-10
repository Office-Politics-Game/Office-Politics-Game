import { apiClient } from "./apiClient.js"
import { getSupabaseClient } from "./supabaseClient.js"

const AUTH_API_PATH = "/auth"
const OAUTH_PROVIDERS = new Set(["google", "facebook"])

function register(payload) {
  return apiClient.post(`${AUTH_API_PATH}/register`, payload);
}

function login(payload) {
  return apiClient.post(`${AUTH_API_PATH}/login`, payload);
}

function verifyToken() {
  return apiClient.get(`${AUTH_API_PATH}/verify`);
}

function logout() {
  return apiClient.post(`${AUTH_API_PATH}/logout`);
}

function forgotPassword(payload) {
  return apiClient.post(`${AUTH_API_PATH}/forgot-password`, payload);
}

function resetPassword(payload) {
  return apiClient.post(`${AUTH_API_PATH}/reset-password`, payload);
}

async function startOAuthLogin(provider) {
  if (!OAUTH_PROVIDERS.has(provider)) {
    throw new Error("不支援的第三方登入方式")
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new Error(error.message || "無法啟動第三方登入")
  }
}

async function completeOAuthLogin() {
  const supabase = getSupabaseClient()
  const queryParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  const callbackError =
    queryParams.get("error_description") ||
    queryParams.get("error") ||
    hashParams.get("error_description") ||
    hashParams.get("error")

  if (callbackError) {
    throw new Error(callbackError)
  }

  const authCode = queryParams.get("code")
  let session = null

  if (authCode) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)

    if (error) {
      throw new Error(error.message || "第三方登入驗證失敗")
    }

    session = data.session
  }

  if (!session) {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw new Error(error.message || "第三方登入狀態讀取失敗")
    }

    session = data.session
  }

  if (!session?.access_token) {
    throw new Error("第三方登入狀態已失效，請重新登入")
  }

  return apiClient.post(`${AUTH_API_PATH}/oauth/callback`, {
    accessToken: session.access_token,
    expiresIn: session.expires_in,
  })
}

export {
  register,
  login,
  verifyToken,
  logout,
  forgotPassword,
  resetPassword,
  startOAuthLogin,
  completeOAuthLogin,
}
