const neonHustleBasePath = "/images/shop/neon-hustle-style";

const CARD_SKIN_THEMES = {
  "neon-hustle": {
    key: "neon-hustle",
    logoUrl: `${neonHustleBasePath}/neon-hustle-logo.webp`,
    slotImages: {
      intern: `${neonHustleBasePath}/neon-hustle-intern-card-skin.webp`,
      cleaner: `${neonHustleBasePath}/neon-hustle-cleaner-card-skin.webp`,
      manager: `${neonHustleBasePath}/neon-hustle-manager-card-skin.webp`,
      senior: `${neonHustleBasePath}/neon-hustle-senior-card-skin.webp`,
      pm: `${neonHustleBasePath}/neon-hustle-pm-card-skin.webp`,
      hr: `${neonHustleBasePath}/neon-hustle-hr-card-skin.webp`,
      advisor: `${neonHustleBasePath}/neon-hustle-advisor-card-skin.webp`,
      ceo: `${neonHustleBasePath}/neon-hustle-ceo-card-skin.webp`,
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

    const matchedThemeKey = Object.keys(CARD_SKIN_THEMES).find((themeKey) =>
      candidate.includes(themeKey),
    );

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
  return getCardSkinTheme(themeSource)?.logoUrl || "";
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
