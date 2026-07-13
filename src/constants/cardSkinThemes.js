import {
  buildCloudinaryImageUrl,
  resolveImageAssetUrl,
} from "@/utils/assetUrlResolver.js";

function themeAssetUrl({ publicId, fallbackBasePath, fallbackFileName }) {
  return buildCloudinaryImageUrl(publicId) || `${fallbackBasePath}/${fallbackFileName}`;
}

const CARD_SKIN_THEMES = {
  "neon-hustle": {
    key: "neon-hustle",
    aliases: ["neon-hustle", "霓虹風格", "霓虹風格卡面"],
    logoUrl: themeAssetUrl({
      publicId: "office-politics-game/shop/neon-hustle-style/neon-hustle-logo",
      fallbackBasePath: "/images/shop/neon-hustle-style",
      fallbackFileName: "neon-hustle-logo.webp",
    }),
    slotImages: {
      intern: themeAssetUrl({
        publicId: "neon-hustle-intern-card-skin.png_tucpe4",
        fallbackBasePath: "/images/shop/neon-hustle-style",
        fallbackFileName: "neon-hustle-intern-card-skin.webp",
      }),
      cleaner: themeAssetUrl({
        publicId: "neon-hustle-cleaner-card-skin.png_wuac5g",
        fallbackBasePath: "/images/shop/neon-hustle-style",
        fallbackFileName: "neon-hustle-cleaner-card-skin.webp",
      }),
      manager: themeAssetUrl({
        publicId: "neon-hustle-manager-card-skin_b8y38o",
        fallbackBasePath: "/images/shop/neon-hustle-style",
        fallbackFileName: "neon-hustle-manager-card-skin.webp",
      }),
      senior: themeAssetUrl({
        publicId: "neon-hustle-senior-card-skin.png_dyqrzv",
        fallbackBasePath: "/images/shop/neon-hustle-style",
        fallbackFileName: "neon-hustle-senior-card-skin.webp",
      }),
      pm: themeAssetUrl({
        publicId: "neon-hustle-pm-card-skin_slejup",
        fallbackBasePath: "/images/shop/neon-hustle-style",
        fallbackFileName: "neon-hustle-pm-card-skin.webp",
      }),
      hr: themeAssetUrl({
        publicId: "neon-hustle-hr-card-skin_gylcqi",
        fallbackBasePath: "/images/shop/neon-hustle-style",
        fallbackFileName: "neon-hustle-hr-card-skin.webp",
      }),
      advisor: themeAssetUrl({
        publicId: "neon-hustle-advisor-card-skin_ujucmz",
        fallbackBasePath: "/images/shop/neon-hustle-style",
        fallbackFileName: "neon-hustle-advisor-card-skin.webp",
      }),
      ceo: themeAssetUrl({
        publicId: "neon-hustle-ceo-card-skin.png_pqfvog",
        fallbackBasePath: "/images/shop/neon-hustle-style",
        fallbackFileName: "neon-hustle-ceo-card-skin.webp",
      }),
    },
  },
  "beach": {
    key: "beach",
    aliases: ["beach", "夏日風格", "夏日風格卡面"],
    logoUrl: themeAssetUrl({
      publicId: "beach-Logo",
      fallbackBasePath: "/images/shop/beach-style",
      fallbackFileName: "beach-logo.webp",
    }),
    slotImages: {
      intern: themeAssetUrl({
        publicId: "beach-intern-card-skin_gxe0ej",
        fallbackBasePath: "/images/shop/beach-style",
        fallbackFileName: "beach-intern-card-skin.webp",
      }),
      cleaner: themeAssetUrl({
        publicId: "beach-cleaner-card-skin_fyd64r",
        fallbackBasePath: "/images/shop/beach-style",
        fallbackFileName: "beach-cleaner-card-skin.webp",
      }),
      manager: themeAssetUrl({
        publicId: "beach-manager-card-skin_sdcjso",
        fallbackBasePath: "/images/shop/beach-style",
        fallbackFileName: "beach-manager-card-skin.webp",
      }),
      senior: themeAssetUrl({
        publicId: "beach-senior-card-skin_nn2onj",
        fallbackBasePath: "/images/shop/beach-style",
        fallbackFileName: "beach-senior-card-skin.webp",
      }),
      pm: themeAssetUrl({
        publicId: "beach-pm-card-skin_zil33h",
        fallbackBasePath: "/images/shop/beach-style",
        fallbackFileName: "beach-pm-card-skin.webp",
      }),
      hr: themeAssetUrl({
        publicId: "beach-hr-card-skin_buspol",
        fallbackBasePath: "/images/shop/beach-style",
        fallbackFileName: "beach-hr-card-skin.webp",
      }),
      advisor: themeAssetUrl({
        publicId: "beach-advisor-card-skin_cvrocj",
        fallbackBasePath: "/images/shop/beach-style",
        fallbackFileName: "beach-advisor-card-skin.webp",
      }),
      ceo: themeAssetUrl({
        publicId: "beach-ceo-card-skin_pvo9pf",
        fallbackBasePath: "/images/shop/beach-style",
        fallbackFileName: "beach-ceo-card-skin.webp",
      }),
    },
  },
};

function normalizeThemeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
}

function resolveCardSkinThemeKey(source) {
  const themeKeyEntries = Object.entries(CARD_SKIN_THEMES).map(([themeKey, theme]) => ({
    themeKey,
    matchers: [themeKey, ...(Array.isArray(theme.aliases) ? theme.aliases : [])]
      .map((value) => normalizeThemeKey(value))
      .filter(Boolean),
  }));

  const candidates = [
    source?.themeKey,
    source?.key,
    source?.name,
    source?.previewImage,
    source?.imageUrl,
    source?.image_url,
    source,
  ];

  for (const candidate of candidates.map((value) => normalizeThemeKey(value))) {
    if (!candidate) {
      continue;
    }

    const matchedThemeKey = themeKeyEntries.find(({ matchers }) =>
      matchers.some((matcher) => candidate.includes(matcher)),
    )?.themeKey;

    if (matchedThemeKey) {
      return matchedThemeKey;
    }
  }

  return "";
}

function getCardSkinTheme(themeSource) {
  const themeKey = resolveCardSkinThemeKey(themeSource);

  return CARD_SKIN_THEMES[themeKey] ?? null;
}

function getCardSkinThemeLogo(themeSource) {
  const sourceLogoUrl = resolveImageAssetUrl(
    themeSource?.imageUrl || themeSource?.image_url || themeSource?.previewImage,
  );

  return sourceLogoUrl || getCardSkinTheme(themeSource)?.logoUrl || "";
}

function getCardSkinThemeSlotImage(themeSource, slotKey) {
  return getCardSkinTheme(themeSource)?.slotImages?.[slotKey] || "";
}

function getCardSkinThemeSlotImages(themeSource) {
  return getCardSkinTheme(themeSource)?.slotImages || {};
}

export {
  CARD_SKIN_THEMES,
  getCardSkinTheme,
  getCardSkinThemeLogo,
  getCardSkinThemeSlotImage,
  getCardSkinThemeSlotImages,
  resolveCardSkinThemeKey,
};
