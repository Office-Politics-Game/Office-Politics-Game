const CLOUDINARY_CLOUD_NAME = String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "").trim();
const CLOUDINARY_BASE_FOLDER = String(
  import.meta.env.VITE_CLOUDINARY_BASE_FOLDER || "office-politics-game",
).trim().replace(/^\/+|\/+$/g, "");

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function isLocalAssetPath(value) {
  return String(value || "").trim().startsWith("/");
}

function looksLikeCloudinaryPublicId(value) {
  const normalized = String(value || "").trim();

  if (!normalized || isAbsoluteUrl(normalized) || isLocalAssetPath(normalized)) {
    return false;
  }

  return normalized.includes("/");
}

function getCloudinaryDeliveryBase() {
  if (!CLOUDINARY_CLOUD_NAME) {
    return "";
  }

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
}

function buildCloudinaryImageUrl(publicId, transformations = ["f_auto", "q_auto"]) {
  const normalizedPublicId = String(publicId || "").trim().replace(/^\/+/, "");
  const deliveryBase = getCloudinaryDeliveryBase();

  if (!deliveryBase || !normalizedPublicId) {
    return "";
  }

  const normalizedTransformations = transformations.filter(Boolean).join(",");
  const transformationPath = normalizedTransformations ? `${normalizedTransformations}/` : "";

  return `${deliveryBase}/${transformationPath}${normalizedPublicId}`;
}

function getCloudinaryAssetPublicId(relativePath) {
  const normalizedPath = String(relativePath || "").trim().replace(/^\/+|\/+$/g, "");

  if (!normalizedPath) {
    return "";
  }

  return CLOUDINARY_BASE_FOLDER ? `${CLOUDINARY_BASE_FOLDER}/${normalizedPath}` : normalizedPath;
}

function resolveImageAssetUrl(source, transformations) {
  const value = String(source || "").trim();

  if (!value) {
    return "";
  }

  if (isAbsoluteUrl(value) || isLocalAssetPath(value)) {
    return value;
  }

  if (looksLikeCloudinaryPublicId(value)) {
    return buildCloudinaryImageUrl(value, transformations) || value;
  }

  return value;
}

export {
  buildCloudinaryImageUrl,
  CLOUDINARY_BASE_FOLDER,
  CLOUDINARY_CLOUD_NAME,
  getCloudinaryAssetPublicId,
  getCloudinaryDeliveryBase,
  resolveImageAssetUrl,
};
