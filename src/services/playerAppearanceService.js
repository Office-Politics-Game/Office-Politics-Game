import { getPlayerEquippedItems, getPlayerShopItems } from "@/services/shopApi.js";
import { normalizePlayerAvatar } from "@/utils/playerUtils.js";

async function getEquippedAvatarUrl(playerId) {
  const numericPlayerId = Number(playerId);

  if (!Number.isInteger(numericPlayerId) || numericPlayerId <= 0) {
    return "";
  }

  const [playerItemsResponse, equippedResponse] = await Promise.all([
    getPlayerShopItems(numericPlayerId),
    getPlayerEquippedItems(numericPlayerId),
  ]);

  const avatarItemId = equippedResponse?.equipped?.avatarItemId;
  const avatarInventoryEntry = (playerItemsResponse?.items || []).find(
    (entry) =>
      entry?.item?.type === "avatar" &&
      Number(entry?.item?.id) === Number(avatarItemId),
  );

  return avatarInventoryEntry?.item?.imageUrl || "";
}

async function hydratePlayerAppearance(player, index = 0) {
  if (!player || typeof player !== "object") {
    return player;
  }

  try {
    const equippedAvatarUrl = await getEquippedAvatarUrl(player.id);

    return normalizePlayerAvatar(
      {
        ...player,
        avatarUrl: equippedAvatarUrl || player.avatarUrl,
      },
      index,
    );
  } catch {
    return normalizePlayerAvatar(player, index);
  }
}

export { getEquippedAvatarUrl, hydratePlayerAppearance };
