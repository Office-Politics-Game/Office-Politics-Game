import crypto from "node:crypto"

function createServiceError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function getRequiredEnv(name) {
  const value = String(process.env[name] || "").trim()

  if (!value) {
    throw createServiceError("圖片上傳服務設定不完整", 500)
  }

  return value
}

function sanitizePathSegment(value) {
  return String(value || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
}

function sanitizeTags(tags = []) {
  if (!Array.isArray(tags)) {
    return []
  }

  return tags
    .map((tag) => String(tag || "").trim())
    .filter(Boolean)
    .slice(0, 20)
}

function sanitizeContext(context = {}) {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(context)
      .map(([key, value]) => [String(key || "").trim(), String(value || "").trim()])
      .filter(([key, value]) => key && value),
  )
}

function buildContextString(context = {}) {
  return Object.entries(context)
    .map(([key, value]) => `${key}=${value}`)
    .join("|")
}

function buildSignaturePayload(params = {}) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")
}

function getCloudinaryConfig() {
  const cloudName = getRequiredEnv("CLOUDINARY_CLOUD_NAME")
  const apiKey = getRequiredEnv("CLOUDINARY_API_KEY")
  const apiSecret = getRequiredEnv("CLOUDINARY_API_SECRET")
  const baseFolder = sanitizePathSegment(
    process.env.CLOUDINARY_BASE_FOLDER || "office-politics-game",
  )

  return {
    cloudName,
    apiKey,
    apiSecret,
    baseFolder,
  }
}

function getCloudinaryUploadConfig() {
  const { cloudName, apiKey, baseFolder } = getCloudinaryConfig()

  return {
    cloudName,
    apiKey,
    baseFolder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  }
}

function createCloudinaryUploadSignature({
  folder = "",
  publicId = "",
  tags = [],
  context = {},
} = {}) {
  const { cloudName, apiKey, apiSecret, baseFolder } = getCloudinaryConfig()
  const timestamp = Math.floor(Date.now() / 1000)
  const normalizedFolder = sanitizePathSegment(folder)
  const resolvedFolder = sanitizePathSegment(
    normalizedFolder ? `${baseFolder}/${normalizedFolder}` : baseFolder,
  )
  const normalizedPublicId = sanitizePathSegment(publicId)
  const normalizedTags = sanitizeTags(tags)
  const normalizedContext = sanitizeContext(context)

  const signatureParams = {
    folder: resolvedFolder,
    timestamp,
  }

  if (normalizedPublicId) {
    signatureParams.public_id = normalizedPublicId
  }

  if (normalizedTags.length > 0) {
    signatureParams.tags = normalizedTags.join(",")
  }

  const contextString = buildContextString(normalizedContext)

  if (contextString) {
    signatureParams.context = contextString
  }

  const signaturePayload = buildSignaturePayload(signatureParams)
  const signature = crypto
    .createHash("sha1")
    .update(`${signaturePayload}${apiSecret}`)
    .digest("hex")

  return {
    cloudName,
    apiKey,
    timestamp,
    folder: resolvedFolder,
    publicId: normalizedPublicId,
    tags: normalizedTags,
    context: normalizedContext,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  }
}

export {
  createCloudinaryUploadSignature,
  getCloudinaryUploadConfig,
}
