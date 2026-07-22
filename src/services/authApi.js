import { apiClient } from "./apiClient.js"
import { getOptionalSupabaseClient, getSupabaseClient } from "./supabaseClient.js"

const AUTH_API_PATH = "/auth"
const OAUTH_PROVIDERS = new Set(["google", "discord"])
const OAUTH_PROVIDER_OPTIONS = {
  discord: {
    scopes: "identify email"
  }
}

function register(payload) {
  return apiClient.post(`${AUTH_API_PATH}/register`, payload);
}

function login(payload) {
  return apiClient.post(`${AUTH_API_PATH}/login`, payload);
}

function verifyToken() {
  return apiClient.get(`${AUTH_API_PATH}/verify`);
}

function getSession() {
  return apiClient.get(`${AUTH_API_PATH}/session`);
}

async function logout() {
  const response = await apiClient.post(`${AUTH_API_PATH}/logout`)
  const supabase = getOptionalSupabaseClient()

  if (!supabase) {
    return response
  }

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.warn("Supabase session 清除失敗", error)
    }
  } catch (error) {
    console.warn("Supabase session 清除失敗", error)
  }

  return response
}

function forgotPassword(payload) {
  return apiClient.post(`${AUTH_API_PATH}/forgot-password`, payload);
}

function resetPassword(payload) {
  return apiClient.post(`${AUTH_API_PATH}/reset-password`, payload);
}

function changePassword(payload) {
  return apiClient.patch(`${AUTH_API_PATH}/password`, payload);
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
      ...OAUTH_PROVIDER_OPTIONS[provider],
    },
  })

  if (error) {
    throw new Error(error.message || "無法啟動第三方登入")
  }
}

async function resolvePasswordResetToken() {
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

  const queryToken = queryParams.get("access_token")
  const hashToken = hashParams.get("access_token")

  if (queryToken || hashToken) {
    return queryToken || hashToken
  }

  const authCode = queryParams.get("code")

  if (!authCode) {
    return ""
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)

  if (error) {
    throw new Error(error.message || "重設密碼連結驗證失敗")
  }

  return data.session?.access_token || ""
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
  getSession,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  startOAuthLogin,
  completeOAuthLogin,
  resolvePasswordResetToken
}
