<template>
  <main class="studio-page" :style="pageStyle">
    <div class="scene-mask" @click="goLobby"></div>

    <section class="settings-modal" role="dialog" aria-modal="true" aria-label="遊戲設定">
      <header class="modal-header">
        <div>
          <h1>遊戲設定</h1>
          <p>OFFICE POLITICS</p>
        </div>

        <div class="header-actions">
          <button
            v-if="!gamePreviewOpen"
            class="card-gallery-button"
            type="button"
            @click="cardGalleryOpen = true"
          >
            卡面總覽
          </button>
          <button
            v-if="!gamePreviewOpen"
            class="game-preview-button"
            type="button"
            @click="gamePreviewOpen = true"
          >
            遊戲內預覽
          </button>
          <button
            class="close-button"
            type="button"
            :aria-label="gamePreviewOpen ? '返回設定' : '關閉遊戲設定'"
            @click="handleClose"
          >
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <nav v-if="!gamePreviewOpen" class="category-tabs" aria-label="造型分類">
        <button
          v-for="category in equipmentSections"
          :key="category.id"
          type="button"
          :class="{ active: category.id === activeCategory }"
          @click="activeCategory = category.id"
        >
          {{ category.label }}
        </button>
      </nav>

      <div v-if="gamePreviewOpen" class="game-preview" :style="gamePreviewStyle">
        <div class="game-preview-shade"></div>
        <div class="opponent-zone">
          <div class="fake-avatar opponent-avatar">AI</div>
          <div class="opponent-cards">
            <img v-for="index in 3" :key="index" :src="gameCardBackImage" alt="對手手牌卡背" />
          </div>
        </div>

        <div class="table-pile">
          <img :src="gameCardBackImage" alt="牌堆卡背" />
          <span>牌堆</span>
        </div>

        <div class="player-zone">
          <img
            v-if="gameAvatarImage"
            class="fake-avatar player-avatar"
            :src="gameAvatarImage"
            alt="玩家頭像"
          />
          <div class="player-hand">
            <button
              v-for="(card, index) in gamePreviewCards"
              :key="card.key"
              type="button"
              class="hand-card"
              :style="{ '--card-index': index }"
              :aria-label="`查看 ${card.label} 預覽`"
              @click="openGameCardLightbox(card)"
            >
              <img class="skin-background" :src="card.previewImage" :alt="card.label" />
              <img v-if="card.frameImage" class="skin-frame" :src="card.frameImage" alt="" />
            </button>
          </div>
        </div>

        <div class="game-preview-label">
          <strong>遊戲內預覽</strong>
          <span>點擊卡牌可查看大圖預覽</span>
        </div>
      </div>

      <div v-else-if="errorMessage" class="status-message error" role="alert">
        {{ errorMessage }}
      </div>

      <div v-else-if="isLoading" class="status-message">正在載入個人造型...</div>

      <div v-else class="studio-content">
        <section class="selection-panel" aria-label="造型選擇">
          <div class="selection-scroll">
            <div v-if="activeItems.length" class="asset-grid">
              <button
                v-for="item in activeItems"
                :key="item.selectionId ?? item.shopItemId"
                type="button"
                class="asset-card"
                :class="{
                  selected: (item.selectionId ?? item.shopItemId) === selectedItemKey,
                  locked: item.isLocked,
                }"
                @click="handleSelectItem(item)"
              >
                <div class="asset-media" :class="activeCategory">
                  <img
                    v-if="item.previewImage"
                    :src="item.previewImage"
                    :alt="item.name"
                    :class="{ round: activeCategory === 'avatar' }"
                  />
                  <span v-else>NO PREVIEW</span>
                  <span v-if="item.isLocked" class="locked-badge">尚未解鎖</span>
                </div>
                <strong>{{ item.name }}</strong>
              </button>
            </div>

            <div v-else class="empty-state">{{ activeCategoryMeta?.emptyText }}</div>
          </div>
        </section>

        <aside class="preview-panel">
          <h2>預覽</h2>

          <div v-if="activeCategory === 'card_skin'" class="skin-preview-editor">
            <div class="large-skin-preview" :style="selectedPreviewBackgroundStyle">
              <button
                class="large-skin-card"
                type="button"
                :aria-label="`查看 ${selectedCardSkinPreview.label} 預覽`"
                @click="openCardSkinLightbox"
              >
                <img
                  class="skin-background"
                  :src="selectedCardSkinPreview.previewImage"
                  :alt="selectedCardSkinPreview.label"
                />
                <img
                  v-if="selectedCardSkinPreview.frameImage"
                  class="skin-frame"
                  :src="selectedCardSkinPreview.frameImage"
                  alt=""
                />
              </button>
            </div>

            <div class="skin-preview-grid" aria-label="卡面欄位切換">
              <button
                v-for="card in cardSkinPreviewCards"
                :key="card.key"
                type="button"
                :class="{ selected: card.key === selectedCardSlot }"
                @click="selectedCardSlot = card.key"
              >
                <span class="slot-name">{{ card.label }}</span>
              </button>
            </div>
          </div>

          <div
            v-else
            class="preview-stage"
            :class="[activeCategory, { clickable: selectedItem?.previewImage }]"
            :style="previewStageStyle"
            :role="selectedItem?.previewImage ? 'button' : undefined"
            :tabindex="selectedItem?.previewImage ? 0 : undefined"
            @click="openPreviewLightbox"
            @keydown.enter="openPreviewLightbox"
            @keydown.space.prevent="openPreviewLightbox"
          >
            <img
              v-if="selectedItem?.previewImage"
              class="main-preview-image"
              :class="activeCategory"
              :src="selectedItem.previewImage"
              :alt="selectedItem.name"
            />
            <p v-else>請先從左側選擇一個要預覽的造型。</p>
          </div>

          <div class="save-actions">
            <button
              v-if="activeCategory === 'card_skin'"
              class="apply-theme-button"
              type="button"
              :disabled="!selectedItem || isSaving"
              @click="applySelectedCardTheme"
            >
              套用整套卡面
            </button>
            <button
            class="save-button"
            type="button"
            :disabled="!selectedItem || isSaving"
            @click="saveSelection"
          >
            {{
              selectedItem?.isLocked
                ? "前往獲得"
                : isSaving
                  ? "儲存中..."
                  : activeCategory === "card_skin"
                    ? "儲存卡面"
                    : "儲存設定"
            }}
            </button>
          </div>
          <p v-if="saveFeedback" class="save-feedback" :class="{ error: saveFailed }">
            {{ saveFeedback }}
          </p>
        </aside>
      </div>

      <div
        v-if="cardGalleryOpen"
        class="card-gallery-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="卡面總覽"
      >
        <header class="card-gallery-header">
          <div>
            <h2>卡面總覽</h2>
            <p>可直接查看目前八張卡面的套用結果。</p>
          </div>
          <button type="button" aria-label="關閉卡面總覽" @click="cardGalleryOpen = false">×</button>
        </header>

        <div class="card-gallery-grid">
          <button
            v-for="card in gamePreviewCards"
            :key="card.key"
            type="button"
            :aria-label="`查看 ${card.label} 預覽`"
            @click="openGameCardLightbox(card)"
          >
            <span class="gallery-card">
              <img class="skin-background" :src="card.previewImage" :alt="card.label" />
              <img v-if="card.frameImage" class="skin-frame" :src="card.frameImage" alt="" />
            </span>
          </button>
        </div>
      </div>

      <div
        v-if="cardImageLightboxOpen"
        class="card-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="造型大圖預覽"
        @click.self="cardImageLightboxOpen = false"
      >
        <button
          class="lightbox-close"
          type="button"
          aria-label="關閉大圖預覽"
          @click="cardImageLightboxOpen = false"
        >
          ×
        </button>
        <div class="lightbox-card" :class="lightboxCategory || activeCategory">
          <img
            class="skin-background"
            :src="lightboxPreview.previewImage"
            :alt="lightboxPreview.label"
          />
          <img
            v-if="lightboxPreview.frameImage"
            class="skin-frame"
            :src="lightboxPreview.frameImage"
            alt=""
          />
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import defaultCardBackImage from "@/assets/images/card-bg-back.webp";
import defaultGameBackground from "@/assets/images/bg-game-table.webp";
import pageBackgroundImage from "@/assets/images/bg-setting.png";
import { cardAssetsByKey } from "@/constants/cardAssets.js";
import { guestAvatars } from "@/constants/guestOptions.js";
import { CARD_SKIN_SLOT_LABELS, CARD_SKIN_SLOT_ORDER } from "@/constants/cardSkinSlots.js";
import {
  CARD_SKIN_THEMES,
  getCardSkinThemeLogo,
  getCardSkinThemeSlotFrame,
  getCardSkinThemeSlotImage,
  resolveCardSkinThemeKey,
} from "@/constants/cardSkinThemes.js";
import {
  buildEquipmentSections,
  getEquipmentCategoryMeta,
  normalizeEquippedItems,
  patchEquippedState,
} from "@/models/equipmentModel.js";
import { updatePlayerAvatar } from "@/services/playerApi.js";
import {
  equipShopItem,
  getPlayerEquippedItems,
  getPlayerShopItems,
  getShopItems,
  unequipShopItem,
  updateCardSkinLoadout,
} from "@/services/shopApi.js";
import { useAppearanceStore } from "@/stores/appearanceStore.js";
import { useAuthStore } from "@/stores/authStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";
import { resolveImageAssetUrl } from "@/utils/assetUrlResolver.js";

const router = useRouter();
const authStore = useAuthStore();
const playerStore = usePlayerStore();
const appearanceStore = useAppearanceStore();

const activeCategory = ref("card_back");
const inventoryItems = ref([]);
const allShopItems = ref([]);
const equippedItems = ref(normalizeEquippedItems(null));
const selectedItemIdByCategory = ref({});
const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref("");
const saveFeedback = ref("");
const saveFailed = ref(false);
const selectedCardSlot = ref("intern");
const savedCardSkinSelections = ref({});
const gamePreviewOpen = ref(false);
const cardImageLightboxOpen = ref(false);
const cardGalleryOpen = ref(false);
const lightboxCategory = ref("");
const lightboxPreviewOverride = ref(null);

const sectionDisplay = [
  { id: "avatar", label: "頭像" },
  { id: "card_back", label: "卡背" },
  { id: "card_skin", label: "卡面" },
  { id: "board_skin", label: "遊戲背景" },
];

const DEFAULT_ITEM_SELECTIONS = {
  card_back: "default-card-back",
  card_skin: "default-card-skin",
  board_skin: "default-board-skin",
};

const CARD_SKIN_THEME_DISPLAY_NAMES = {
  "neon-hustle": "霓虹職場風格卡面",
  beach: "夏日風格卡面",
  lego: "樂高風格卡面",
  mario: "瑪利歐風格卡面",
  ukiyo: "浮世繪風格卡面",
  minimal: "簡約風格卡面",
  "pixel-office": "像素辦公室風格卡面",
  windows98: "Windows 98 風格卡面",
  tarot: "塔羅牌風格卡面",
};

const pageStyle = {
  backgroundImage: `url(${pageBackgroundImage})`,
};

const sourcePlayer = computed(() => authStore.currentPlayer || playerStore.currentPlayer || null);

const resolvedPlayerId = computed(() => {
  const playerId = Number(sourcePlayer.value?.id);
  return Number.isInteger(playerId) && playerId > 0 ? playerId : null;
});

const resolvedAvatarId = computed(() => {
  const avatarId = Number(sourcePlayer.value?.avatarId ?? sourcePlayer.value?.avatar_id);
  return Number.isInteger(avatarId) && avatarId > 0 ? avatarId : 1;
});

function createDefaultEquipmentItem(categoryId, categoryLabel) {
  const baseItem = {
    inventoryId: `default-${categoryId}`,
    shopItemId: null,
    playerId: resolvedPlayerId.value,
    quantity: 1,
    type: categoryId,
    categoryId,
    categoryLabel,
    price: 0,
    currency: "default",
    isOwned: true,
    isLocked: false,
  };

  if (categoryId === "card_back") {
    return {
      ...baseItem,
      selectionId: DEFAULT_ITEM_SELECTIONS.card_back,
      name: "預設卡背",
      description: "使用遊戲原本的標準卡背。",
      previewImage: defaultCardBackImage,
      isEquipped: !equippedItems.value.cardBackItemId,
    };
  }

  if (categoryId === "card_skin") {
    return {
      ...baseItem,
      selectionId: DEFAULT_ITEM_SELECTIONS.card_skin,
      name: "預設卡面",
      description: "使用遊戲原本的標準卡面樣式。",
      previewImage:
        cardAssetsByKey.intern?.backgroundUrl ||
        cardAssetsByKey[CARD_SKIN_SLOT_ORDER[0]]?.backgroundUrl ||
        "",
      isEquipped:
        !equippedItems.value.cardSkinItemId &&
        Object.keys(equippedItems.value.cardSkinOverrides || {}).length === 0,
    };
  }

  if (categoryId === "board_skin") {
    return {
      ...baseItem,
      selectionId: DEFAULT_ITEM_SELECTIONS.board_skin,
      name: "預設盤面",
      description: "使用遊戲原本的標準桌面背景。",
      previewImage: defaultGameBackground,
      isEquipped: !equippedItems.value.boardSkinItemId,
    };
  }

  return null;
}

function createFallbackCardSkinThemeItem(themeKey, categoryLabel) {
  const theme = CARD_SKIN_THEMES[themeKey];

  if (!theme) {
    return null;
  }

  return {
    selectionId: `theme-${themeKey}`,
    inventoryId: null,
    shopItemId: null,
    shopItem: {
      id: null,
      type: "card_skin",
      key: themeKey,
      name: CARD_SKIN_THEME_DISPLAY_NAMES[themeKey] || themeKey,
      description: `${CARD_SKIN_THEME_DISPLAY_NAMES[themeKey] || themeKey}尚未解鎖`,
      imageUrl: theme.logoUrl,
      image_url: theme.logoUrl,
    },
    playerId: resolvedPlayerId.value,
    quantity: 0,
    type: "card_skin",
    categoryId: "card_skin",
    categoryLabel,
    name: CARD_SKIN_THEME_DISPLAY_NAMES[themeKey] || themeKey,
    description: `${CARD_SKIN_THEME_DISPLAY_NAMES[themeKey] || themeKey}尚未解鎖`,
    previewImage: theme.logoUrl,
    price: null,
    currency: "gacha",
    isOwned: false,
    isLocked: true,
    isEquipped: false,
    themeKey,
    key: themeKey,
  };
}

const equipmentSections = computed(() => {
  const baseSections = buildEquipmentSections(inventoryItems.value, equippedItems.value);
  const sectionsById = Object.fromEntries(baseSections.map((section) => [section.id, section]));

  return sectionDisplay.map(({ id, label }) => {
    const section = { ...sectionsById[id], label };
    const ownedItemIds = new Set(section.items.map((item) => Number(item.shopItemId)));
    const lockedItems = allShopItems.value
      .filter((item) => item.type === section.id && !ownedItemIds.has(Number(item.id)))
      .map((item) => ({
        selectionId: `locked-${section.id}-${item.id}`,
        inventoryId: null,
        shopItemId: Number(item.id),
        shopItem: item,
        playerId: resolvedPlayerId.value,
        quantity: 0,
        type: section.id,
        categoryId: section.id,
        categoryLabel: label,
        name: item.name,
        description: item.description || "",
        previewImage:
          (section.id === "card_skin" ? getCardSkinThemeLogo(item) : "") ||
          resolveImageAssetUrl(item.imageUrl || item.image_url) ||
          "",
        price: item.price,
        currency: item.currency,
        isOwned: false,
        isLocked: true,
        isEquipped: false,
      }));

    const mergedThemeItems =
      section.id === "card_skin"
        ? Object.keys(CARD_SKIN_THEMES)
            .filter((themeKey) => {
              const alreadyListed = [...section.items, ...lockedItems].some((item) => {
                const source = item.shopItem || item;
                return resolveCardSkinThemeKey(source) === themeKey;
              });

              return !alreadyListed;
            })
            .map((themeKey) => createFallbackCardSkinThemeItem(themeKey, label))
            .filter(Boolean)
        : [];

    const mergedSection = {
      ...section,
      count: section.items.length + lockedItems.length + mergedThemeItems.length,
      items: [...section.items, ...lockedItems, ...mergedThemeItems],
    };

    if (section.id !== "avatar") {
      const defaultItem = createDefaultEquipmentItem(section.id, mergedSection.label);

      if (!defaultItem) {
        return mergedSection;
      }

      return {
        ...mergedSection,
        count: mergedSection.items.length + 1,
        items: [defaultItem, ...mergedSection.items],
      };
    }

    const presetAvatars = guestAvatars.map((avatar) => ({
      selectionId: `default-avatar-${avatar.id}`,
      inventoryId: `default-avatar-${avatar.id}`,
      shopItemId: null,
      avatarPresetId: avatar.id,
      playerId: resolvedPlayerId.value,
      quantity: 1,
      type: "avatar",
      categoryId: "avatar",
      categoryLabel: mergedSection.label,
      name: avatar.name,
      description: "?身閫?剖?",
      previewImage: avatar.image,
      price: 0,
      currency: "default",
      isOwned: true,
      isEquipped:
        !equippedItems.value.avatarItemId &&
        Number(equippedItems.value.avatarId ?? resolvedAvatarId.value) === Number(avatar.id),
    }));

    return {
      ...mergedSection,
      count: mergedSection.items.length + presetAvatars.length,
      items: [...presetAvatars, ...mergedSection.items],
    };
  });
});

const activeCategoryMeta = computed(() => getEquipmentCategoryMeta(activeCategory.value));

const activeItems = computed(() => {
  const section = equipmentSections.value.find((item) => item.id === activeCategory.value);
  return section?.items ?? [];
});

const selectedItemKey = computed(
  () => selectedItemIdByCategory.value[activeCategory.value] ?? null,
);

const selectedItem = computed(
  () =>
    activeItems.value.find(
      (item) => (item.selectionId ?? item.shopItemId) === selectedItemKey.value,
    ) ?? null,
);

function findSelectedItem(categoryId) {
  const section = equipmentSections.value.find((item) => item.id === categoryId);
  const selectionId = selectedItemIdByCategory.value[categoryId];

  return (
    section?.items.find((item) => (item.selectionId ?? item.shopItemId) === selectionId) ?? null
  );
}

function buildCardSkinPreview(themeItem, slotKey) {
  const themeSource = themeItem?.shopItem || themeItem;

  return {
    key: slotKey,
    label: CARD_SKIN_SLOT_LABELS[slotKey] || slotKey,
    previewImage:
      getCardSkinThemeSlotImage(themeSource, slotKey) || cardAssetsByKey[slotKey].backgroundUrl,
    frameImage:
      getCardSkinThemeSlotFrame(themeSource, slotKey) || cardAssetsByKey[slotKey].frameUrl,
  };
}

const cardSkinPreviewCards = computed(() => {
  return CARD_SKIN_SLOT_ORDER.map((slotKey) => buildCardSkinPreview(selectedItem.value, slotKey));
});

const selectedCardSkinPreview = computed(
  () =>
    cardSkinPreviewCards.value.find((card) => card.key === selectedCardSlot.value) ||
    cardSkinPreviewCards.value[0],
);

const lightboxPreview = computed(() => {
  if (lightboxPreviewOverride.value) return lightboxPreviewOverride.value;
  if (activeCategory.value === "card_skin") return selectedCardSkinPreview.value;

  return {
    label: selectedItem.value?.name || "蝝??汗",
    previewImage: selectedItem.value?.previewImage || "",
    frameImage: "",
  };
});

const equippedCardSkinItem = computed(() => {
  const section = equipmentSections.value.find((item) => item.id === "card_skin");
  return (
    section?.items.find(
      (item) => Number(item.shopItemId) === Number(equippedItems.value.cardSkinItemId),
    ) ?? null
  );
});

const gamePreviewCards = computed(() =>
  CARD_SKIN_SLOT_ORDER.map((slotKey) => {
    const savedItem = savedCardSkinSelections.value[slotKey];
    const equippedOverrideId = Number(equippedItems.value.cardSkinOverrides?.[slotKey]);
    const section = equipmentSections.value.find((item) => item.id === "card_skin");
    const overrideItem = section?.items.find(
      (item) => Number(item.shopItemId) === equippedOverrideId,
    );

    return buildCardSkinPreview(savedItem || overrideItem || equippedCardSkinItem.value, slotKey);
  }),
);

const gameAvatarImage = computed(() => findSelectedItem("avatar")?.previewImage || "");
const gameCardBackImage = computed(
  () => findSelectedItem("card_back")?.previewImage || defaultCardBackImage,
);
const selectedPreviewBackgroundStyle = computed(() => ({
  backgroundImage: `url(${findSelectedItem("board_skin")?.previewImage || pageBackgroundImage})`,
}));
const gamePreviewStyle = computed(() => ({
  backgroundImage: `url(${findSelectedItem("board_skin")?.previewImage || defaultGameBackground})`,
}));

const previewStageStyle = computed(() => {
  if (activeCategory.value === "board_skin" && selectedItem.value?.previewImage) {
    return { backgroundImage: `url(${selectedItem.value.previewImage})` };
  }

  return selectedPreviewBackgroundStyle.value;
});

watch(
  equipmentSections,
  (sections) => {
    const nextSelection = { ...selectedItemIdByCategory.value };

    sections.forEach((section) => {
      if (!section.items.length) {
        delete nextSelection[section.id];
        return;
      }

      const selectionExists = section.items.some(
        (item) => (item.selectionId ?? item.shopItemId) === nextSelection[section.id],
      );

      if (!selectionExists) {
        const equippedItem = section.items.find((item) => item.isEquipped);
        nextSelection[section.id] =
          equippedItem?.selectionId ??
          equippedItem?.shopItemId ??
          section.items[0].selectionId ??
          section.items[0].shopItemId;
      }
    });

    selectedItemIdByCategory.value = nextSelection;
  },
  { immediate: true },
);

function goLobby() {
  router.push({ name: "LobbyHome" });
}

function handleClose() {
  if (gamePreviewOpen.value) {
    gamePreviewOpen.value = false;
    return;
  }

  goLobby();
}

function handleSelectItem(item) {
  saveFeedback.value = "";
  selectedItemIdByCategory.value = {
    ...selectedItemIdByCategory.value,
    [item.categoryId]: item.selectionId ?? item.shopItemId,
  };
}

function openPreviewLightbox() {
  lightboxPreviewOverride.value = null;
  lightboxCategory.value = activeCategory.value;
  if (lightboxPreview.value.previewImage) cardImageLightboxOpen.value = true;
}

function openCardSkinLightbox() {
  lightboxPreviewOverride.value = selectedCardSkinPreview.value;
  lightboxCategory.value = "card_skin";
  cardImageLightboxOpen.value = true;
}

function openGameCardLightbox(card) {
  saveFeedback.value = "";
  selectedCardSlot.value = card.key;
  lightboxPreviewOverride.value = card;
  lightboxCategory.value = "card_skin";
  cardImageLightboxOpen.value = true;
}

async function reloadEquipment() {
  if (!resolvedPlayerId.value) {
    errorMessage.value = "找不到玩家資料，無法載入個人造型設定。";
    inventoryItems.value = [];
    allShopItems.value = [];
    equippedItems.value = normalizeEquippedItems(null);
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const [playerItemsResponse, equippedResponse, shopItemsResponse] = await Promise.all([
      getPlayerShopItems(resolvedPlayerId.value),
      getPlayerEquippedItems(resolvedPlayerId.value),
      getShopItems({ activeOnly: true }),
    ]);

    inventoryItems.value = playerItemsResponse.items || [];
    allShopItems.value = shopItemsResponse.items || [];
    equippedItems.value = normalizeEquippedItems(
      {
        ...(equippedResponse?.equipped || {}),
        avatarId: resolvedAvatarId.value,
      },
      resolvedPlayerId.value,
    );
  } catch (error) {
    allShopItems.value = [];
    errorMessage.value = error?.message || "載入個人造型資料失敗，請稍後再試。";
  } finally {
    isLoading.value = false;
  }
}

async function saveSelection() {
  if (
    !resolvedPlayerId.value ||
    !selectedItem.value ||
    isSaving.value
  ) {
    return;
  }

  isSaving.value = true;
  saveFeedback.value = "";
  saveFailed.value = false;

  try {
    if (selectedItem.value.isLocked) {
      const routeName =
        selectedItem.value.categoryId === "avatar"
          ? "Mall"
          : selectedItem.value.categoryId === "card_skin" &&
              (selectedItem.value.name?.includes("樂高") ||
                selectedItem.value.name?.includes("塔羅牌") ||
                selectedItem.value.name?.toLowerCase?.().includes("tarot"))
            ? "Gacha"
            : "Mall";
      await router.push({ name: routeName });
      return;
    }

    if (activeCategory.value === "card_skin") {
      const isDefaultCardSkin =
        selectedItem.value.selectionId === DEFAULT_ITEM_SELECTIONS.card_skin;

      if (isDefaultCardSkin) {
        const nextOverrides = { ...(equippedItems.value.cardSkinOverrides || {}) };
        delete nextOverrides[selectedCardSlot.value];

        const baseItemId = Number(equippedItems.value.cardSkinItemId) || null;
        const response = await updateCardSkinLoadout({
          playerId: resolvedPlayerId.value,
          cardSkinItemId: baseItemId,
          cardSkinOverrides: nextOverrides,
        });

        equippedItems.value = normalizeEquippedItems(
          {
            ...(response?.equipped || {
              ...equippedItems.value,
              cardSkinItemId: baseItemId,
              cardSkinOverrides: nextOverrides,
            }),
            avatarId: resolvedAvatarId.value,
          },
          resolvedPlayerId.value,
        );
        savedCardSkinSelections.value = {
          ...savedCardSkinSelections.value,
          [selectedCardSlot.value]: selectedItem.value,
        };
        await appearanceStore.hydrateForPlayer(resolvedPlayerId.value).catch(() => {});
        saveFeedback.value = `${CARD_SKIN_SLOT_LABELS[selectedCardSlot.value]} 卡面已儲存`;
        return;
      }

      if (!selectedItem.value.shopItemId) {
        throw new Error("目前無法儲存這個卡面選項。");
      }

      const baseItemId =
        Number(equippedItems.value.cardSkinItemId) || Number(selectedItem.value.shopItemId);
      const nextOverrides = {
        ...(equippedItems.value.cardSkinOverrides || {}),
        [selectedCardSlot.value]: Number(selectedItem.value.shopItemId),
      };
      const response = await updateCardSkinLoadout({
        playerId: resolvedPlayerId.value,
        cardSkinItemId: baseItemId,
        cardSkinOverrides: nextOverrides,
      });

      equippedItems.value = normalizeEquippedItems(
        {
          ...(response?.equipped || {
            ...equippedItems.value,
            cardSkinItemId: baseItemId,
            cardSkinOverrides: nextOverrides,
          }),
          avatarId: resolvedAvatarId.value,
        },
        resolvedPlayerId.value,
      );
      savedCardSkinSelections.value = {
        ...savedCardSkinSelections.value,
        [selectedCardSlot.value]: selectedItem.value,
      };
      await appearanceStore.hydrateForPlayer(resolvedPlayerId.value).catch(() => {});
      saveFeedback.value = `${CARD_SKIN_SLOT_LABELS[selectedCardSlot.value]} 卡面已儲存`;
      return;
    }

    if (activeCategory.value === "avatar" && selectedItem.value.avatarPresetId) {
      await updatePlayerAvatar(resolvedPlayerId.value, selectedItem.value.avatarPresetId);
      equippedItems.value = normalizeEquippedItems(
        {
          ...equippedItems.value,
          avatarId: selectedItem.value.avatarPresetId,
          avatarItemId: null,
        },
        resolvedPlayerId.value,
      );
      authStore.setCurrentPlayerAvatar(
        selectedItem.value.previewImage || "",
        selectedItem.value.avatarPresetId,
      );
      playerStore.setCurrentPlayerAvatar(
        selectedItem.value.previewImage || "",
        selectedItem.value.avatarPresetId,
      );
    } else if (!selectedItem.value.shopItemId) {
      const response = await unequipShopItem({
        playerId: resolvedPlayerId.value,
        categoryId: activeCategory.value,
      });

      equippedItems.value = normalizeEquippedItems(
        {
          ...(response?.equipped ||
            patchEquippedState(equippedItems.value, activeCategory.value, null)),
          avatarId: resolvedAvatarId.value,
        },
        resolvedPlayerId.value,
      );
    } else {
      const response = await equipShopItem({
        playerId: resolvedPlayerId.value,
        shopItemId: selectedItem.value.shopItemId,
      });
      equippedItems.value = normalizeEquippedItems(
        {
          ...(response?.equipped ||
            patchEquippedState(
              equippedItems.value,
              activeCategory.value,
              selectedItem.value.shopItemId,
            )),
          avatarId: resolvedAvatarId.value,
        },
        resolvedPlayerId.value,
      );

      if (activeCategory.value === "avatar") {
        authStore.setCurrentPlayerAvatar(
          selectedItem.value.previewImage || "",
          resolvedAvatarId.value,
        );
        playerStore.setCurrentPlayerAvatar(
          selectedItem.value.previewImage || "",
          resolvedAvatarId.value,
        );
      }
    }

    appearanceStore.setAppearanceByCategory(
      activeCategory.value,
      selectedItem.value.previewImage || "",
    );
    saveFeedback.value = "設定已儲存";
  } catch (error) {
    saveFailed.value = true;
    saveFeedback.value = error?.message || "儲存失敗，請稍後再試。";
  } finally {
    isSaving.value = false;
  }
}
async function applySelectedCardTheme() {
  const isDefaultCardSkin = selectedItem.value?.selectionId === DEFAULT_ITEM_SELECTIONS.card_skin;

  if (
    resolvedPlayerId.value &&
    activeCategory.value === "card_skin" &&
    isDefaultCardSkin &&
    !isSaving.value
  ) {
    isSaving.value = true;
    saveFeedback.value = "";
    saveFailed.value = false;

    try {
      const response = await updateCardSkinLoadout({
        playerId: resolvedPlayerId.value,
        cardSkinItemId: null,
        cardSkinOverrides: {},
      });

      equippedItems.value = normalizeEquippedItems(
        {
          ...(response?.equipped || {
            ...equippedItems.value,
            cardSkinItemId: null,
            cardSkinOverrides: {},
          }),
          avatarId: resolvedAvatarId.value,
        },
        resolvedPlayerId.value,
      );
      savedCardSkinSelections.value = {};
      await appearanceStore.hydrateForPlayer(resolvedPlayerId.value).catch(() => {});
      saveFeedback.value = "已套用預設卡面";
    } catch (error) {
      saveFailed.value = true;
      saveFeedback.value = error?.message || "套用主題失敗，請稍後再試。";
    } finally {
      isSaving.value = false;
    }

    return;
  }

  if (
    !resolvedPlayerId.value ||
    !selectedItem.value?.shopItemId ||
    activeCategory.value !== "card_skin" ||
    isSaving.value
  ) {
    return;
  }

  isSaving.value = true;
  saveFeedback.value = "";
  saveFailed.value = false;

  try {
    const cardSkinItemId = Number(selectedItem.value.shopItemId);
    const response = await updateCardSkinLoadout({
      playerId: resolvedPlayerId.value,
      cardSkinItemId,
      cardSkinOverrides: {},
    });

    equippedItems.value = normalizeEquippedItems(
      {
        ...(response?.equipped || {
          ...equippedItems.value,
          cardSkinItemId,
          cardSkinOverrides: {},
        }),
        avatarId: resolvedAvatarId.value,
      },
      resolvedPlayerId.value,
    );
    savedCardSkinSelections.value = {};
    await appearanceStore.hydrateForPlayer(resolvedPlayerId.value).catch(() => {});
    saveFeedback.value = `已將八張卡面統一套用「${selectedItem.value.name}」`;
  } catch (error) {
    saveFailed.value = true;
    saveFeedback.value = error?.message || "套用主題失敗，請稍後再試。";
  } finally {
    isSaving.value = false;
  }
}
onMounted(reloadEquipment);
</script>

<style scoped>
.studio-page {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  min-width: 320px;
  padding: 24px;
  overflow: hidden;
  background-color: #182231;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  font-family: "Noto Sans TC", "Microsoft JhengHei", sans-serif;
}

.scene-mask {
  position: absolute;
  inset: 0;
  background: rgba(10, 18, 30, 0.2);
  backdrop-filter: blur(1px);
}

.settings-modal {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: min(960px, calc(100vw - 48px));
  height: min(650px, calc(100dvh - 48px));
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 14px;
  background: rgba(248, 250, 253, 0.88);
  box-shadow: 0 26px 70px rgba(11, 22, 39, 0.28);
  backdrop-filter: blur(18px) saturate(1.08);
}

.modal-header {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 28px 12px;
}

.modal-header h1 {
  margin: 0;
  color: #142a4a;
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1;
}

.modal-header p {
  margin: 7px 0 0;
  color: #195cff;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.28em;
  line-height: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.game-preview-button,
.card-gallery-button {
  padding: 8px 13px;
  border: 1px solid rgba(37, 99, 235, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.76);
  color: #1757da;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease;
}

.game-preview-button:hover,
.card-gallery-button:hover {
  border-color: #2563eb;
  background: white;
}

.card-gallery-button {
  border-color: #193f72;
  background: #18375f;
  color: white;
}

.card-gallery-button:hover {
  background: #224a7d;
  color: white;
}

.close-button {
  position: relative;
  width: 36px;
  height: 36px;
  margin: -2px -4px 0 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.close-button:hover {
  background: rgba(20, 42, 74, 0.07);
}

.close-button span {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22px;
  height: 2px;
  border-radius: 2px;
  background: #1c3659;
  transform: translate(-50%, -50%) rotate(45deg);
}

.close-button span:last-child {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.category-tabs {
  display: flex;
  flex: 0 0 auto;
  gap: 34px;
  padding: 0 28px;
  overflow-x: auto;
  border-top: 1px solid rgba(203, 213, 225, 0.72);
  border-bottom: 1px solid rgba(203, 213, 225, 0.78);
  scrollbar-width: none;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.category-tabs button {
  position: relative;
  flex: 0 0 auto;
  padding: 13px 0 12px;
  border: 0;
  background: transparent;
  color: #2a374c;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.category-tabs button.active {
  color: #155dff;
}

.category-tabs button.active::after {
  position: absolute;
  right: -8px;
  bottom: 0;
  left: -8px;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: #1f64ff;
  content: "";
}

.studio-content {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.9fr);
  gap: 34px;
  min-height: 0;
  padding: 18px 28px 22px;
}

.selection-panel,
.selection-scroll,
.preview-panel {
  min-height: 0;
}

.selection-panel {
  overflow: hidden;
}

.selection-scroll {
  height: 100%;
  padding-right: 8px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-color: #aebdd2 transparent;
  scrollbar-width: thin;
}

.selection-scroll::-webkit-scrollbar {
  width: 6px;
}

.selection-scroll::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background: #aebdd2;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 1px 1px 8px;
}

.asset-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
  padding: 9px 9px 10px;
  overflow: visible;
  border: 1px solid #d8e0eb;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 5px 14px rgba(45, 65, 91, 0.05);
  color: #17243a;
  cursor: pointer;
  transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
}

.asset-card:hover {
  border-color: #b8c8dc;
  transform: translateY(-1px);
}

.asset-card.selected {
  border-color: #1c63ff;
  box-shadow: inset 0 0 0 1px #1c63ff, 0 8px 18px rgba(28, 99, 255, 0.12);
}

.asset-card.locked .asset-media img {
  filter: grayscale(0.72) brightness(0.58);
}

.asset-media .locked-badge {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: grid;
  width: auto;
  height: auto;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(14, 25, 42, 0.42);
  color: white;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
}

.asset-media {
  position: relative;
  display: grid;
  place-items: center;
  height: 128px;
  overflow: hidden;
  border: 1px solid #d7dee8;
  border-radius: 9px;
  background: linear-gradient(145deg, #f5f7fa, #e9eef4);
}

.asset-media.avatar {
  padding: 10px;
}

.asset-media.card_skin,
.asset-media.board_skin {
  height: 92px;
}

.asset-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.asset-media img.round {
  border-radius: 50%;
  object-fit: cover;
}

.asset-media.board_skin img,
.asset-media.card_skin img {
  object-fit: cover;
}

.asset-media span {
  color: #94a3b8;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.asset-card strong {
  overflow: hidden;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-panel {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.preview-panel h2 {
  flex: 0 0 auto;
  margin: 2px 0 10px;
  color: #17243a;
  font-size: 15px;
  font-weight: 900;
  text-align: center;
}

.preview-stage {
  position: relative;
  display: grid;
  flex: 1 1 auto;
  place-items: center;
  min-height: 0;
  overflow: hidden;
  border-radius: 13px;
  background: linear-gradient(#8bc8f3 0 61%, #6f6258 61% 100%);
  background-position: center;
  background-size: cover;
  box-shadow: inset 0 0 0 1px rgba(38, 58, 82, 0.08);
}

.preview-stage.board_skin {
  background-position: center;
  background-size: cover;
}

.preview-stage.clickable {
  cursor: zoom-in;
}

.preview-stage.clickable::after {
  position: absolute;
  z-index: 2;
  right: 10px;
  bottom: 10px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 50%;
  background: rgba(15, 31, 52, 0.58);
  color: white;
  content: "+";
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.window-lines {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(42, 61, 82, 0.78) 0 12px,
    transparent 12px 35%,
    rgba(42, 61, 82, 0.78) 35% calc(35% + 12px),
    transparent calc(35% + 12px) 72%,
    rgba(42, 61, 82, 0.78) 72% calc(72% + 12px),
    transparent calc(72% + 12px) calc(100% - 12px),
    rgba(42, 61, 82, 0.78) calc(100% - 12px)
  );
}

.office-floor {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 38%;
  background: linear-gradient(150deg, rgba(91, 74, 61, 0.92), #3f342e);
}

.main-preview-image {
  position: relative;
  z-index: 1;
  display: block;
  width: min(56%, 178px);
  max-height: 82%;
  object-fit: contain;
  filter: drop-shadow(0 18px 20px rgba(9, 20, 34, 0.3));
}

.main-preview-image.avatar {
  width: min(68%, 220px);
  aspect-ratio: 1;
  border: 5px solid white;
  border-radius: 50%;
  object-fit: cover;
}

.main-preview-image.board_skin {
  display: none;
}

.preview-stage p {
  position: relative;
  z-index: 1;
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  font-weight: 800;
  text-shadow: 0 2px 8px rgba(13, 29, 49, 0.35);
}

.skin-preview-editor {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.large-skin-preview {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  padding: 10px 20px;
  border-radius: 13px;
  background:
    radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.9), transparent 48%),
    linear-gradient(145deg, rgba(210, 225, 241, 0.9), rgba(239, 244, 249, 0.92));
  background-position: center;
  background-size: cover;
  box-shadow: inset 0 0 0 1px rgba(134, 153, 177, 0.22);
}

.large-skin-card {
  position: relative;
  height: min(100%, 278px);
  aspect-ratio: 0.67;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 9px;
  background: #22304a;
  box-shadow: 0 16px 24px rgba(20, 35, 55, 0.24);
  cursor: zoom-in;
  transition: box-shadow 150ms ease, transform 150ms ease;
}

.large-skin-card:hover {
  box-shadow: 0 20px 30px rgba(20, 35, 55, 0.3);
  transform: translateY(-2px);
}

.large-skin-card img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.skin-preview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.skin-preview-grid button {
  min-width: 0;
  padding: 7px 4px;
  border: 1px solid #cbd6e4;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.68);
  color: #40516a;
  cursor: pointer;
  font-size: 10px;
  font-weight: 900;
  text-align: center;
  transition: color 140ms ease, background 140ms ease, border-color 140ms ease;
}

.skin-preview-grid button:hover {
  border-color: #a9bdd8;
}

.skin-preview-grid button.selected {
  border-color: #1f64ff;
  background: rgba(235, 242, 255, 0.95);
  color: #1558e8;
  box-shadow: inset 0 0 0 1px #1f64ff;
}

.skin-frame {
  z-index: 1;
}

.skin-preview-grid .slot-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-preview {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  border-top: 1px solid rgba(203, 213, 225, 0.78);
  background-position: center;
  background-size: cover;
}

.game-preview-shade {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at center, transparent 10%, rgba(6, 15, 27, 0.22) 100%),
    linear-gradient(180deg, rgba(7, 18, 31, 0.08), rgba(7, 18, 31, 0.24));
}

.game-preview-label {
  position: absolute;
  top: 18px;
  right: 22px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 13px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 9px;
  background: rgba(12, 29, 49, 0.62);
  backdrop-filter: blur(8px);
  color: white;
  text-align: right;
}

.game-preview-label strong {
  font-size: 13px;
  font-weight: 900;
}

.game-preview-label span {
  color: rgba(255, 255, 255, 0.72);
  font-size: 9px;
}

.opponent-zone,
.player-zone,
.table-pile {
  position: absolute;
  z-index: 1;
}

.opponent-zone {
  top: 20px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 16px;
  transform: translateX(-50%);
}

.fake-avatar {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border: 3px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  background: #29394f;
  box-shadow: 0 8px 20px rgba(4, 12, 22, 0.32);
  color: white;
  font-size: 13px;
  font-weight: 900;
  object-fit: cover;
}

.opponent-cards {
  display: flex;
}

.opponent-cards img {
  width: 46px;
  aspect-ratio: 0.67;
  margin-left: -14px;
  border-radius: 5px;
  object-fit: cover;
  box-shadow: 0 5px 12px rgba(4, 12, 22, 0.3);
}

.opponent-cards img:first-child {
  margin-left: 0;
}

.table-pile {
  top: 47%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  transform: translate(-50%, -50%);
}

.table-pile img {
  width: 62px;
  aspect-ratio: 0.67;
  border: 2px solid rgba(255, 255, 255, 0.55);
  border-radius: 7px;
  object-fit: cover;
  box-shadow: -5px 6px 0 rgba(18, 31, 48, 0.7), 0 12px 20px rgba(4, 12, 22, 0.35);
}

.table-pile span {
  color: white;
  font-size: 10px;
  font-weight: 800;
  text-shadow: 0 2px 5px #000;
}

.player-zone {
  right: 0;
  bottom: 8px;
  left: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.player-avatar {
  position: absolute;
  bottom: 18px;
  left: 28px;
  width: 72px;
  height: 72px;
}

.player-hand {
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.hand-card {
  position: relative;
  width: 76px;
  aspect-ratio: 0.67;
  margin-left: -22px;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 7px;
  background: #22304a;
  box-shadow: 0 10px 18px rgba(3, 10, 19, 0.35);
  cursor: zoom-in;
  transform-origin: 50% 120%;
}

.hand-card:hover {
  z-index: 3;
  filter: brightness(1.08);
  outline: 2px solid rgba(255, 255, 255, 0.82);
  outline-offset: 2px;
}

.hand-card:first-child {
  margin-left: 0;
}

.hand-card:nth-child(1) { transform: translateY(18px) rotate(-12deg); }
.hand-card:nth-child(2) { transform: translateY(10px) rotate(-9deg); }
.hand-card:nth-child(3) { transform: translateY(4px) rotate(-6deg); }
.hand-card:nth-child(4) { transform: rotate(-2deg); }
.hand-card:nth-child(5) { transform: rotate(2deg); }
.hand-card:nth-child(6) { transform: translateY(4px) rotate(6deg); }
.hand-card:nth-child(7) { transform: translateY(10px) rotate(9deg); }
.hand-card:nth-child(8) { transform: translateY(18px) rotate(12deg); }

.hand-card img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-lightbox {
  position: absolute;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 28px;
  background: rgba(8, 17, 30, 0.76);
  backdrop-filter: blur(8px);
}

.card-gallery-overlay {
  position: absolute;
  z-index: 15;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 24px 34px 28px;
  background: rgba(238, 244, 251, 0.96);
  backdrop-filter: blur(16px);
}

.card-gallery-header {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.card-gallery-header h2 {
  margin: 0;
  color: #142a4a;
  font-size: 24px;
  font-weight: 900;
}

.card-gallery-header p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.card-gallery-header button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0 0 3px;
  border: 0;
  border-radius: 50%;
  background: rgba(20, 42, 74, 0.08);
  color: #1c3659;
  font-size: 27px;
  line-height: 1;
  cursor: pointer;
}

.card-gallery-grid {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px 18px;
  min-height: 0;
}

.card-gallery-grid > button {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #253650;
  cursor: zoom-in;
}

.card-gallery-grid > button:hover {
  box-shadow: 0 8px 20px rgba(31, 100, 255, 0.12);
}

.gallery-card {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 0.716;
  overflow: hidden;
  border-radius: 10px;
  background: transparent;
  box-shadow: 0 8px 16px rgba(20, 35, 55, 0.2);
}

.gallery-card img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.lightbox-card {
  position: relative;
  height: min(88%, 570px);
  aspect-ratio: 0.67;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 14px;
  background: #17243a;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.5);
}

.lightbox-card img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lightbox-card.avatar {
  width: min(70vh, 460px);
  height: auto;
  aspect-ratio: 1;
  border-radius: 50%;
}

.lightbox-card.avatar img {
  object-fit: cover;
}

.lightbox-card.board_skin {
  width: min(88%, 820px);
  height: auto;
  aspect-ratio: 16 / 10;
}

.lightbox-card.board_skin img {
  object-fit: cover;
}

.lightbox-close {
  position: absolute;
  z-index: 1;
  top: 18px;
  right: 20px;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0 0 3px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: white;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.22);
}

.save-actions {
  display: flex;
  flex: 0 0 auto;
  align-self: flex-end;
  gap: 8px;
  margin-top: 13px;
}

.save-button,
.apply-theme-button {
  flex: 0 0 auto;
  min-width: 120px;
  padding: 10px 20px;
  border: 0;
  border-radius: 7px;
  background: linear-gradient(135deg, #0e55ee, #2168ff);
  box-shadow: 0 10px 20px rgba(25, 94, 243, 0.22);
  color: white;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
}

.apply-theme-button {
  border: 1px solid #1f64ff;
  background: rgba(238, 244, 255, 0.94);
  box-shadow: none;
  color: #1558e8;
}

.apply-theme-button:hover {
  background: white;
}

.save-button:disabled,
.apply-theme-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}

.save-feedback {
  align-self: flex-end;
  min-height: 16px;
  margin: 6px 0 0;
  color: #15803d;
  font-size: 11px;
  font-weight: 800;
}

.save-feedback.error {
  color: #be123c;
}

.status-message,
.empty-state {
  display: grid;
  place-items: center;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

.status-message {
  flex: 1 1 auto;
  padding: 30px;
}

.status-message.error {
  color: #be123c;
}

.empty-state {
  min-height: 260px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
}

.settings-modal,
.game-preview-button,
.asset-card,
.asset-media,
.empty-state,
.preview-heading button,
.preview-stage,
.large-skin-preview,
.large-skin-card,
.skin-preview-grid button,
.save-button,
.game-preview-label,
.opponent-cards img,
.table-pile img,
.hand-card,
.card-gallery-grid > button,
.gallery-card,
.lightbox-card {
  border-radius: 0;
}

@media (max-width: 760px) {
  .studio-page {
    padding: 12px;
  }

  .settings-modal {
    width: calc(100vw - 24px);
    height: calc(100dvh - 24px);
  }

  .modal-header {
    padding: 16px 18px 11px;
  }

  .modal-header h1 {
    font-size: 23px;
  }

  .header-actions {
    gap: 4px;
  }

  .game-preview-button,
  .card-gallery-button {
    padding: 6px 7px;
    font-size: 9px;
  }

  .category-tabs {
    gap: 28px;
    padding: 0 18px;
  }

  .studio-content {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(150px, 0.8fr) minmax(260px, 1.2fr);
    gap: 14px;
    padding: 14px 18px 16px;
  }

  .asset-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .asset-media {
    height: 104px;
  }

  .asset-media.card_skin,
  .asset-media.board_skin {
    height: 76px;
  }

  .preview-panel h2 {
    margin-bottom: 7px;
  }

  .save-actions {
    gap: 5px;
    margin-top: 8px;
  }

  .save-button,
  .apply-theme-button {
    min-width: 0;
    padding: 9px 18px;
    font-size: 11px;
  }

  .large-skin-preview {
    min-height: 180px;
    padding: 8px 12px;
  }

  .large-skin-card {
    height: min(100%, 205px);
  }

  .skin-preview-grid {
    gap: 4px;
  }

  .skin-preview-grid button {
    padding: 6px 2px;
    font-size: 9px;
  }

  .card-lightbox {
    padding: 54px 18px 20px;
  }

  .lightbox-card {
    width: min(88vw, 360px);
    height: auto;
  }

  .lightbox-card.avatar {
    width: min(76vw, 330px);
  }

  .lightbox-card.board_skin {
    width: min(90vw, 560px);
  }

  .card-gallery-overlay {
    padding: 18px 16px 20px;
  }

  .card-gallery-header {
    margin-bottom: 12px;
  }

  .card-gallery-header h2 {
    font-size: 20px;
  }

  .card-gallery-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    overflow-y: auto;
  }

  .gallery-card {
    aspect-ratio: 0.716;
  }
}

@media (max-height: 620px) and (min-width: 761px) {
  .settings-modal {
    height: calc(100dvh - 24px);
  }

  .modal-header {
    padding-top: 13px;
    padding-bottom: 9px;
  }

  .studio-content {
    padding-top: 12px;
    padding-bottom: 14px;
  }

  .asset-media {
    height: 112px;
  }
}
</style>

