import { resolveImageAssetUrl } from "@/utils/assetUrlResolver.js";

const CARD_SKIN_ROLE_KEYS = [
  "intern",
  "cleaner",
  "manager",
  "senior",
  "pm",
  "hr",
  "advisor",
  "ceo",
];

function localShopAsset(folder, fileName) {
  return `/images/shop/${folder}/${fileName}`;
}

function createRoleAssetMap({ folder, prefix, suffix }) {
  return Object.fromEntries(
    CARD_SKIN_ROLE_KEYS.map((roleKey) => [
      roleKey,
      localShopAsset(folder, `${prefix}-${roleKey}-${suffix}.webp`),
    ]),
  );
}

function createTheme({
  key,
  aliases = [],
  folder,
  prefix,
  logoFileName,
  hasFrames = false,
}) {
  return {
    key,
    aliases: [key, `${key}-style`, folder, ...aliases],
    logoUrl: localShopAsset(folder, logoFileName),
    slotImages: createRoleAssetMap({ folder, prefix, suffix: "card-skin" }),
    slotFrames: hasFrames
      ? createRoleAssetMap({ folder, prefix, suffix: "card-frame" })
      : {},
  };
}

const CARD_SKIN_THEMES = {
  "neon-hustle": createTheme({
    key: "neon-hustle",
    aliases: ["neon", "neon hustle", "霓虹"],
    folder: "neon-hustle-style",
    prefix: "neon-hustle",
    logoFileName: "neon-hustle-logo.webp",
    hasFrames: true,
  }),
  beach: createTheme({
    key: "beach",
    aliases: ["summer", "beach style", "夏日", "海灘"],
    folder: "beach-style",
    prefix: "beach",
    logoFileName: "beach-theme.webp",
  }),
  lego: createTheme({
    key: "lego",
    aliases: ["brick", "樂高", "積木"],
    folder: "lego-style",
    prefix: "lego",
    logoFileName: "lego-theme.webp",
    hasFrames: true,
  }),
  mario: createTheme({
    key: "mario",
    aliases: ["super mario", "瑪利歐", "瑪力歐", "馬力歐", "超級瑪利歐"],
    folder: "mario-style",
    prefix: "mario",
    logoFileName: "mario-logo.webp",
  }),
  ukiyo: createTheme({
    key: "ukiyo",
    aliases: ["ukiyo-e", "japanese", "浮世繪", "浮世絵", "和風"],
    folder: "ukiyo-style",
    prefix: "ukiyo",
    logoFileName: "ukiyo-theme.webp",
    hasFrames: true,
  }),
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
    source?.description,
    source?.previewImage,
    source?.imageUrl,
    source?.image_url,
    source,
  ].map((value) => normalizeThemeKey(value));

  for (const [themeKey, theme] of Object.entries(CARD_SKIN_THEMES)) {
    const matchers = theme.aliases.map((value) => normalizeThemeKey(value));
    if (candidates.some((candidate) => matchers.some((matcher) => candidate.includes(matcher)))) {
      return themeKey;
    }
  }

  return "";
}

function getCardSkinTheme(themeSource) {
  return CARD_SKIN_THEMES[resolveCardSkinThemeKey(themeSource)] ?? null;
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

function getCardSkinThemeSlotFrame(themeSource, slotKey) {
  return getCardSkinTheme(themeSource)?.slotFrames?.[slotKey] || "";
}

function getCardSkinThemeSlotAsset(themeSource, slotKey) {
  return {
    backgroundUrl: getCardSkinThemeSlotImage(themeSource, slotKey),
    frameUrl: getCardSkinThemeSlotFrame(themeSource, slotKey),
  };
}

function getCardSkinThemeSlotImages(themeSource) {
  return getCardSkinTheme(themeSource)?.slotImages || {};
}

function getCardSkinThemeSlotFrames(themeSource) {
  return getCardSkinTheme(themeSource)?.slotFrames || {};
}

export {
  CARD_SKIN_THEMES,
  getCardSkinTheme,
  getCardSkinThemeLogo,
  getCardSkinThemeSlotAsset,
  getCardSkinThemeSlotFrame,
  getCardSkinThemeSlotFrames,
  getCardSkinThemeSlotImage,
  getCardSkinThemeSlotImages,
  resolveCardSkinThemeKey,
};
