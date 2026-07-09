import { getPlayerEquippedItems, getPlayerShopItems } from "@/services/shopApi.js";
import { normalizePlayerAvatar } from "@/utils/playerUtils.js";
import { sanitizeCardSkinOverrides } from "@/constants/cardSkinSlots.js";
import { resolveImageAssetUrl } from "@/utils/assetUrlResolver.js";

function getPreviewImageByItemId(playerItems = [], itemId, type) {
  const imageSource = (playerItems || []).find(
    (entry) =>
      entry?.item?.type === type &&
      Number(entry?.item?.id) === Number(itemId),
  )?.item;

  return resolveImageAssetUrl(imageSource?.imageUrl || imageSource?.image_url);
}

function mapCardSkinOverridesToUrls(playerItems = [], overrides = {}) {
  const normalizedOverrides = sanitizeCardSkinOverrides(overrides);

  return Object.fromEntries(
    Object.entries(normalizedOverrides)
      .map(([slotKey, itemId]) => [
        slotKey,
        getPreviewImageByItemId(playerItems, itemId, "card_skin"),
      ])
      .filter(([, imageUrl]) => Boolean(imageUrl)),
  );
}

async function getEquippedAppearance(playerId) {
  const numericPlayerId = Number(playerId);

  if (!Number.isInteger(numericPlayerId) || numericPlayerId <= 0) {
    return {
      avatarUrl: "",
      cardSkinUrl: "",
      cardSkinOverrides: {},
      cardBackUrl: "",
      boardSkinUrl: "",
    };
  }

  const [playerItemsResponse, equippedResponse] = await Promise.all([
    getPlayerShopItems(numericPlayerId),
    getPlayerEquippedItems(numericPlayerId),
  ]);

  const playerItems = playerItemsResponse?.items || [];
  const equipped = equippedResponse?.equipped || {};

  return {
    avatarUrl: getPreviewImageByItemId(playerItems, equipped.avatarItemId, "avatar"),
    cardSkinUrl: getPreviewImageByItemId(playerItems, equipped.cardSkinItemId, "card_skin"),
    cardSkinOverrides: mapCardSkinOverridesToUrls(playerItems, equipped.cardSkinOverrides),
    cardBackUrl: getPreviewImageByItemId(playerItems, equipped.cardBackItemId, "card_back"),
    boardSkinUrl: getPreviewImageByItemId(playerItems, equipped.boardSkinItemId, "board_skin"),
  };
}

async function hydratePlayerAppearanceBundle(player, index = 0) {
  if (!player || typeof player !== "object") {
    return {
      player,
      appearance: {
        avatarUrl: "",
        cardSkinUrl: "",
        cardSkinOverrides: {},
        cardBackUrl: "",
        boardSkinUrl: "",
      },
    };
  }

  try {
    const appearance = await getEquippedAppearance(player.id);

    return {
      player: normalizePlayerAvatar(
        {
          ...player,
          avatarUrl: appearance.avatarUrl || player.avatarUrl,
        },
        index,
      ),
      appearance,
    };
  } catch {
    return {
      player: normalizePlayerAvatar(player, index),
      appearance: {
        avatarUrl: "",
        cardSkinUrl: "",
        cardSkinOverrides: {},
        cardBackUrl: "",
        boardSkinUrl: "",
      },
    };
  }
}

async function hydratePlayerAppearance(player, index = 0) {
  const bundle = await hydratePlayerAppearanceBundle(player, index);
  return bundle.player;
}

async function getEquippedAvatarUrl(playerId) {
  const appearance = await getEquippedAppearance(playerId);
  return appearance.avatarUrl;
}

export {
  getEquippedAppearance,
  getEquippedAvatarUrl,
  hydratePlayerAppearance,
  hydratePlayerAppearanceBundle,
};
