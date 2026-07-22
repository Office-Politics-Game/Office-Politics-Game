<template>
  <main
    class="min-h-screen w-screen overflow-y-auto bg-[#0f1726] bg-cover bg-center px-4 py-6"
    :style="{
      backgroundImage: `linear-gradient(rgba(8, 18, 35, 0.62), rgba(8, 18, 35, 0.68)), url(${bgPersonal})`,
    }"
  >
    <section
      class="mx-auto flex w-full max-w-[1320px] flex-col border border-white/20 bg-white/86 shadow-2xl backdrop-blur-md"
    >
      <header
        class="flex items-center justify-between gap-4 border-b border-slate-300/80 px-6 py-4 max-md:flex-col max-md:items-start"
      >
        <div>
          <p class="m-0 text-[11px] font-black tracking-[0.28em] text-slate-500">
            PROFILE LOADOUT
          </p>
          <h1 class="mt-1 text-3xl font-black text-slate-900">配件切換測試頁</h1>
          <p class="mt-1 text-sm text-slate-600">玩家 ID : {{ resolvedPlayerId ?? "未登入" }}</p>
        </div>

        <div class="flex items-center gap-3 max-sm:w-full max-sm:flex-col">
          <button
            type="button"
            class="border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 max-sm:w-full"
            @click="reloadEquipment"
          >
            重新載入
          </button>
          <button
            type="button"
            class="border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-white max-sm:w-full"
            @click="router.push('/profile')"
          >
            返回個人頁
          </button>
        </div>
      </header>

      <section class="border-b border-slate-300/80 bg-slate-50/90 px-6 py-4">
        <div class="flex items-start justify-between gap-4 max-lg:flex-col">
          <div>
            <p class="m-0 text-[11px] font-black tracking-[0.28em] text-slate-500">
              CLOUDINARY LAB
            </p>
            <h2 class="mt-1 text-xl font-black text-slate-900">Cloudinary 上傳測試</h2>
            <p class="mt-1 text-sm text-slate-600">
              選圖上傳到 Cloudinary，拿到 `public_id` 和 `secure_url` 後就能寫進 shop。
            </p>
          </div>

          <div class="grid gap-2 text-sm text-slate-600">
            <span>目前 folder：{{ cloudinaryFolder }}</span>
            <span v-if="selectedUploadFile">已選檔案：{{ selectedUploadFile.name }}</span>
          </div>
        </div>

        <div class="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
          <label class="grid gap-1 text-sm font-bold text-slate-700">
            Folder
            <input
              v-model="cloudinaryFolder"
              type="text"
              class="border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800"
              placeholder="shop/neon-hustle-style"
            >
          </label>

          <label class="grid gap-1 text-sm font-bold text-slate-700">
            Public ID
            <input
              v-model="cloudinaryPublicId"
              type="text"
              class="border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800"
              placeholder="neon-hustle-ceo-avatar"
            >
          </label>

          <button
            type="button"
            class="border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 lg:self-end"
            :disabled="isUploadingToCloudinary"
            @click="openCloudinaryFilePicker"
          >
            {{ selectedUploadFile ? "重新選圖" : "選擇圖片" }}
          </button>

          <button
            type="button"
            class="border border-sky-700 bg-sky-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 lg:self-end"
            :disabled="!selectedUploadFile || isUploadingToCloudinary"
            @click="uploadSelectedFileToCloudinary"
          >
            {{ isUploadingToCloudinary ? "上傳中..." : "上傳到 Cloudinary" }}
          </button>
        </div>

        <input
          ref="cloudinaryFileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleCloudinaryFileChange"
        >

        <p
          v-if="cloudinaryUploadError"
          class="mt-3 text-sm font-bold text-[var(--feedback-error)]"
        >
          {{ cloudinaryUploadError }}
        </p>

        <div
          v-if="cloudinaryUploadResult"
          class="mt-4 grid gap-4 rounded border border-slate-200 bg-white p-4 lg:grid-cols-[220px_minmax(0,1fr)]"
        >
          <img
            :src="cloudinaryUploadResult.secureUrl"
            alt="Cloudinary upload preview"
            class="aspect-[3/4] w-full border border-slate-200 object-cover"
          >

          <div class="grid gap-2 text-sm text-slate-700">
            <div>
              <strong class="mr-2 text-slate-900">public_id</strong>
              <span class="break-all">{{ cloudinaryUploadResult.publicId }}</span>
            </div>
            <div>
              <strong class="mr-2 text-slate-900">secure_url</strong>
              <span class="break-all">{{ cloudinaryUploadResult.secureUrl }}</span>
            </div>
            <div>
              <strong class="mr-2 text-slate-900">shop image_url 建議值</strong>
              <span class="break-all">{{ cloudinaryUploadResult.publicId }}</span>
            </div>
          </div>
        </div>
      </section>

      <ProfileEquipmentSwitcher
        v-model:active-category="activeCategory"
        :categories="equipmentSections"
        :selected-item="selectedItem"
        :is-loading="isLoading"
        :error-message="errorMessage"
        :equipping-item-id="equippingItemId"
        @select="handleSelectItem"
        @equip="handleEquipItem"
      />

      <CardSkinLoadoutEditor
        v-if="activeCategory === 'card_skin'"
        :applied-theme-name="appliedCardSkinThemeName"
        :applied-override-count="appliedCardSkinOverrideCount"
        :applied-slots="appliedCardSkinSlotRows"
        :slots="cardSkinSlotRows"
        :selected-skin-item="selectedCardSkinItem"
        :is-saving="Boolean(equippingItemId)"
        @apply-theme="handleApplyCardSkinTheme"
        @assign-slot="handleAssignCardSkinSlot"
        @clear-slot="handleClearCardSkinSlot"
      />
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import bgPersonal from "@/assets/images/bg-personal.webp";
import CardSkinLoadoutEditor from "@/components/profile/CardSkinLoadoutEditor.vue";
import ProfileEquipmentSwitcher from "@/components/profile/ProfileEquipmentSwitcher.vue";
import { cardAssetsByKey } from "@/constants/cardAssets.js";
import { CARD_SKIN_SLOT_LABELS, CARD_SKIN_SLOT_ORDER } from "@/constants/cardSkinSlots.js";
import {
  getCardSkinThemeLogo,
  getCardSkinThemeSlotFrame,
  getCardSkinThemeSlotImage,
  resolveCardSkinThemeKey,
} from "@/constants/cardSkinThemes.js";
import { guestAvatars } from "@/constants/guestOptions.js";
import {
  buildEquipmentSections,
  normalizeEquippedItems,
  patchEquippedState,
} from "@/models/equipmentModel.js";
import { updatePlayerAvatar } from "@/services/playerApi.js";
import {
  createCloudinaryUploadSignature,
  equipShopItem,
  getCloudinaryUploadConfig,
  getPlayerEquippedItems,
  getPlayerShopItems,
  updateCardSkinLoadout,
} from "@/services/shopApi.js";
import { useAppearanceStore } from "@/stores/appearanceStore.js";
import { useAuthStore } from "@/stores/authStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";
import { getDisplayErrorMessage } from "@/utils/errorMessages.js";

const router = useRouter();
const authStore = useAuthStore();
const appearanceStore = useAppearanceStore();
const playerStore = usePlayerStore();

const activeCategory = ref("avatar");
const inventoryItems = ref([]);
const equippedItems = ref(normalizeEquippedItems(null));
const selectedItemIdByCategory = ref({});
const isLoading = ref(false);
const equippingItemId = ref(null);
const errorMessage = ref("");
const cloudinaryFileInput = ref(null);
const selectedUploadFile = ref(null);
const isUploadingToCloudinary = ref(false);
const cloudinaryUploadError = ref("");
const cloudinaryUploadResult = ref(null);
const cloudinaryFolder = ref("shop/neon-hustle-style");
const cloudinaryPublicId = ref("");
let restoreBodyOverflow = "";
let restoreHtmlOverflow = "";

const storedGuestPlayer = computed(() => {
  try {
    return JSON.parse(localStorage.getItem("guestPlayer") || "null");
  } catch {
    return null;
  }
});

const sourcePlayer = computed(
  () =>
    authStore.currentPlayer ||
    playerStore.currentPlayer ||
    storedGuestPlayer.value ||
    null,
);

const resolvedPlayerId = computed(() => {
  const playerId = Number(sourcePlayer.value?.id);
  return Number.isInteger(playerId) && playerId > 0 ? playerId : null;
});

const resolvedAvatarId = computed(() => {
  const avatarId = Number(sourcePlayer.value?.avatarId ?? sourcePlayer.value?.avatar_id);
  return Number.isInteger(avatarId) && avatarId > 0 ? avatarId : 1;
});

const equipmentSections = computed(() => {
  const baseSections = buildEquipmentSections(inventoryItems.value, equippedItems.value);

  return baseSections.map((section) => {
    if (section.id !== "avatar") {
      return section;
    }

    const presetAvatarItems = guestAvatars.map((avatar) => ({
      selectionId: `default-avatar-${avatar.id}`,
      inventoryId: `default-avatar-${avatar.id}`,
      shopItemId: null,
      avatarPresetId: avatar.id,
      playerId: resolvedPlayerId.value,
      quantity: 1,
      type: "avatar",
      categoryId: "avatar",
      categoryLabel: section.label,
      name: avatar.name,
      description: "預設頭像，可直接切換使用。",
      previewImage: avatar.image,
      price: 0,
      currency: "default",
      isOwned: true,
      isEquipped:
        !equippedItems.value.avatarItemId &&
        Number(equippedItems.value.avatarId ?? resolvedAvatarId.value) === Number(avatar.id),
    }));

    return {
      ...section,
      count: section.items.length + presetAvatarItems.length,
      items: [...presetAvatarItems, ...section.items],
    };
  });
});

const selectedItem = computed(() => {
  const activeSection = equipmentSections.value.find(
    (section) => section.id === activeCategory.value,
  );

  if (!activeSection) {
    return null;
  }

  const selectedId = selectedItemIdByCategory.value[activeCategory.value];

  return (
    activeSection.items.find(
      (item) => (item.selectionId ?? item.shopItemId) === selectedId,
    ) ||
    activeSection.items.find((item) => item.isEquipped) ||
    activeSection.items[0] ||
    null
  );
});

const selectedCardSkinItem = computed(() => {
  if (activeCategory.value !== "card_skin") {
    return null;
  }

  return selectedItem.value?.categoryId === "card_skin" ? selectedItem.value : null;
});

const cardSkinInventoryItems = computed(() => {
  const cardSkinSection = equipmentSections.value.find((section) => section.id === "card_skin");
  return cardSkinSection?.items ?? [];
});

const cardSkinPreviewByItemId = computed(() =>
  Object.fromEntries(
    cardSkinInventoryItems.value.map((item) => [
      Number(item.shopItemId),
      getCardSkinThemeLogo(item.shopItem || item) || item.previewImage || "",
    ]),
  ),
);

const cardSkinSourceByItemId = computed(() =>
  Object.fromEntries(
    cardSkinInventoryItems.value.map((item) => [
      Number(item.shopItemId),
      resolveCardSkinThemeKey(item.shopItem || item) ||
        cardSkinPreviewByItemId.value[Number(item.shopItemId)] ||
        "",
    ]),
  ),
);

function buildCardSkinSlotRows(baseItemId, overrides = {}) {
  const basePreviewImage = cardSkinPreviewByItemId.value[Number(baseItemId)] || "";
  const baseSourceItem = cardSkinInventoryItems.value.find(
    (item) => Number(item.shopItemId) === Number(baseItemId),
  );

  return CARD_SKIN_SLOT_ORDER.map((slotKey) => {
    const overrideItemId = Number(overrides[slotKey]);
    const isOverridden = Number.isInteger(overrideItemId) && overrideItemId > 0;
    const overrideSourceItem = cardSkinInventoryItems.value.find(
      (item) => Number(item.shopItemId) === overrideItemId,
    );
    const effectiveSourceItem = isOverridden ? overrideSourceItem : baseSourceItem;
    const effectiveThemeSource = effectiveSourceItem?.shopItem || effectiveSourceItem;
    const defaultPreviewImage =
      cardAssetsByKey[slotKey]?.backgroundUrl || cardAssetsByKey.intern.backgroundUrl;
    const defaultFrameImage =
      cardAssetsByKey[slotKey]?.frameUrl || cardAssetsByKey.intern.frameUrl;
    const fallbackPreviewImage = isOverridden
      ? cardSkinPreviewByItemId.value[overrideItemId]
      : basePreviewImage;

    return {
      key: slotKey,
      label: CARD_SKIN_SLOT_LABELS[slotKey] || slotKey,
      isOverridden,
      previewImage:
        getCardSkinThemeSlotImage(effectiveThemeSource, slotKey) ||
        fallbackPreviewImage ||
        defaultPreviewImage,
      frameImage:
        getCardSkinThemeSlotFrame(effectiveThemeSource, slotKey) || defaultFrameImage,
      overrideItemId: isOverridden ? overrideItemId : null,
    };
  });
}

const cardSkinSlotRows = computed(() => {
  const overrides = equippedItems.value.cardSkinOverrides || {};
  const previewBaseItemId =
    Number(selectedCardSkinItem.value?.shopItemId) || Number(equippedItems.value.cardSkinItemId);

  return buildCardSkinSlotRows(previewBaseItemId, overrides);
});

const appliedCardSkinBaseItem = computed(() =>
  cardSkinInventoryItems.value.find(
    (item) => Number(item.shopItemId) === Number(equippedItems.value.cardSkinItemId),
  ) || null,
);

const appliedCardSkinThemeName = computed(() => appliedCardSkinBaseItem.value?.name || "");

const appliedCardSkinOverrideCount = computed(
  () =>
    Object.values(equippedItems.value.cardSkinOverrides || {}).filter(
      (itemId) => Number.isInteger(Number(itemId)) && Number(itemId) > 0,
    ).length,
);

const appliedCardSkinSlotRows = computed(() =>
  buildCardSkinSlotRows(
    equippedItems.value.cardSkinItemId,
    equippedItems.value.cardSkinOverrides || {},
  ),
);

function openCloudinaryFilePicker() {
  cloudinaryFileInput.value?.click();
}

function normalizePublicIdFromFileName(fileName = "") {
  return String(fileName || "")
    .trim()
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

function handleCloudinaryFileChange(event) {
  const file = event?.target?.files?.[0] || null;

  selectedUploadFile.value = file;
  cloudinaryUploadError.value = "";

  if (!file) {
    return;
  }

  if (!cloudinaryPublicId.value.trim()) {
    cloudinaryPublicId.value = normalizePublicIdFromFileName(file.name);
  }
}

async function uploadSelectedFileToCloudinary() {
  if (!selectedUploadFile.value) {
    cloudinaryUploadError.value = "請先選擇圖片";
    return;
  }

  isUploadingToCloudinary.value = true;
  cloudinaryUploadError.value = "";

  try {
    const [configResponse, signatureResponse] = await Promise.all([
      getCloudinaryUploadConfig(),
      createCloudinaryUploadSignature({
        folder: cloudinaryFolder.value,
        publicId: cloudinaryPublicId.value,
        tags: ["shop", "test-upload"],
      }),
    ]);

    const uploadUrl = configResponse?.uploadUrl || signatureResponse?.uploadUrl;

    if (!uploadUrl) {
      throw new Error("找不到圖片上傳網址");
    }

    const formData = new FormData();
    formData.append("file", selectedUploadFile.value);
    formData.append("api_key", signatureResponse.apiKey);
    formData.append("timestamp", String(signatureResponse.timestamp));
    formData.append("signature", signatureResponse.signature);
    formData.append("folder", signatureResponse.folder);

    if (signatureResponse.publicId) {
      formData.append("public_id", signatureResponse.publicId);
    }

    if (Array.isArray(signatureResponse.tags) && signatureResponse.tags.length > 0) {
      formData.append("tags", signatureResponse.tags.join(","));
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(getDisplayErrorMessage(uploadResult?.error, "圖片上傳失敗"));
    }

    cloudinaryUploadResult.value = {
      publicId: uploadResult.public_id || "",
      secureUrl: uploadResult.secure_url || "",
    };
  } catch (error) {
    cloudinaryUploadError.value = getDisplayErrorMessage(error, "圖片上傳失敗");
  } finally {
    isUploadingToCloudinary.value = false;
  }
}

watch(
  equipmentSections,
  (sections) => {
    const nextSelection = { ...selectedItemIdByCategory.value };

    sections.forEach((section) => {
      if (!section.items.length) {
        delete nextSelection[section.id];
        return;
      }

      const hasSelectedItem = section.items.some(
        (item) => (item.selectionId ?? item.shopItemId) === nextSelection[section.id],
      );

      if (!hasSelectedItem) {
        nextSelection[section.id] =
          section.items.find((item) => item.isEquipped)?.selectionId ??
          section.items[0].selectionId ??
          section.items.find((item) => item.isEquipped)?.shopItemId ??
          section.items[0].shopItemId;
      }
    });

    selectedItemIdByCategory.value = nextSelection;
  },
  { immediate: true },
);

function applyCardSkinAppearance(baseItemId, overrides = {}) {
  const baseUrl = cardSkinSourceByItemId.value[Number(baseItemId)] || "";
  const overrideUrls = Object.fromEntries(
    Object.entries(overrides)
      .map(([slotKey, itemId]) => [slotKey, cardSkinSourceByItemId.value[Number(itemId)] || ""])
      .filter(([, imageUrl]) => Boolean(imageUrl)),
  );

  appearanceStore.setCardSkinLoadout({
    baseUrl,
    overrides: overrideUrls,
  });
}

async function persistCardSkinLoadout(baseItemId, overrides = {}) {
  if (!resolvedPlayerId.value) {
    return;
  }

  equippingItemId.value = `card-skin-loadout-${Date.now()}`;
  errorMessage.value = "";

  try {
    const response = await updateCardSkinLoadout({
      playerId: resolvedPlayerId.value,
      cardSkinItemId: baseItemId,
      cardSkinOverrides: overrides,
    });

    equippedItems.value = normalizeEquippedItems(
      {
        ...(response?.equipped || {}),
        avatarId: resolvedAvatarId.value,
      },
      resolvedPlayerId.value,
    );

    applyCardSkinAppearance(
      response?.equipped?.cardSkinItemId ?? baseItemId,
      response?.equipped?.cardSkinOverrides ?? overrides,
    );
  } catch (error) {
    errorMessage.value = getDisplayErrorMessage(error, "儲存卡面配置失敗");
  } finally {
    equippingItemId.value = null;
  }
}

async function reloadEquipment() {
  if (!resolvedPlayerId.value) {
    errorMessage.value = "找不到玩家ID，請先登入再測試";
    inventoryItems.value = [];
    equippedItems.value = normalizeEquippedItems(null);
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const [playerItemsResponse, equippedResponse] = await Promise.all([
      getPlayerShopItems(resolvedPlayerId.value),
      getPlayerEquippedItems(resolvedPlayerId.value),
    ]);

    inventoryItems.value = playerItemsResponse.items || [];
    equippedItems.value = normalizeEquippedItems(
      {
        ...(equippedResponse?.equipped || {}),
        avatarId: resolvedAvatarId.value,
      },
      resolvedPlayerId.value,
    );
  } catch (error) {
    errorMessage.value = getDisplayErrorMessage(error, "讀取配件資料失敗");
  } finally {
    isLoading.value = false;
  }
}

function handleSelectItem(item) {
  selectedItemIdByCategory.value = {
    ...selectedItemIdByCategory.value,
    [item.categoryId]: item.selectionId ?? item.shopItemId,
  };
}

async function handleEquipItem(item) {
  if (!resolvedPlayerId.value || !item || equippingItemId.value) {
    return;
  }

  if (item.categoryId === "card_skin") {
    await persistCardSkinLoadout(item.shopItemId, equippedItems.value.cardSkinOverrides || {});
    return;
  }

  equippingItemId.value = item.selectionId ?? item.shopItemId;
  errorMessage.value = "";

  try {
    if (item.categoryId === "avatar" && item.avatarPresetId) {
      await updatePlayerAvatar(resolvedPlayerId.value, item.avatarPresetId);

      equippedItems.value = normalizeEquippedItems(
        {
          ...equippedItems.value,
          avatarId: item.avatarPresetId,
          avatarItemId: null,
        },
        resolvedPlayerId.value,
      );

      authStore.setCurrentPlayerAvatar(item.previewImage || "", item.avatarPresetId);
      playerStore.setCurrentPlayerAvatar(item.previewImage || "", item.avatarPresetId);
      appearanceStore.setAppearanceByCategory("avatar", item.previewImage || "");
      return;
    }

    const response = await equipShopItem({
      playerId: resolvedPlayerId.value,
      shopItemId: item.shopItemId,
    });

    equippedItems.value = normalizeEquippedItems(
      {
        ...(response.equipped ||
          patchEquippedState(equippedItems.value, item.categoryId, item.shopItemId)),
        avatarId: resolvedAvatarId.value,
      },
      resolvedPlayerId.value,
    );

    if (item.categoryId === "avatar") {
      authStore.setCurrentPlayerAvatar(item.previewImage || "", resolvedAvatarId.value);
      playerStore.setCurrentPlayerAvatar(item.previewImage || "", resolvedAvatarId.value);
    }

    appearanceStore.setAppearanceByCategory(item.categoryId, item.previewImage || "");
  } catch (error) {
    errorMessage.value = getDisplayErrorMessage(error, "套用配件失敗");
  } finally {
    equippingItemId.value = null;
  }
}

async function handleApplyCardSkinTheme(item) {
  if (!item?.shopItemId) {
    return;
  }

  await persistCardSkinLoadout(item.shopItemId, {});
}

async function handleAssignCardSkinSlot({ slotKey, item }) {
  if (!slotKey || !item?.shopItemId) {
    return;
  }

  await persistCardSkinLoadout(
    equippedItems.value.cardSkinItemId ?? item.shopItemId,
    {
      ...(equippedItems.value.cardSkinOverrides || {}),
      [slotKey]: item.shopItemId,
    },
  );
}

async function handleClearCardSkinSlot(slotKey) {
  const nextOverrides = { ...(equippedItems.value.cardSkinOverrides || {}) };
  delete nextOverrides[slotKey];

  await persistCardSkinLoadout(equippedItems.value.cardSkinItemId, nextOverrides);
}

onMounted(() => {
  restoreBodyOverflow = document.body.style.overflow;
  restoreHtmlOverflow = document.documentElement.style.overflow;
  document.body.style.overflow = "auto";
  document.documentElement.style.overflow = "auto";
  reloadEquipment();
});

onBeforeUnmount(() => {
  document.body.style.overflow = restoreBodyOverflow;
  document.documentElement.style.overflow = restoreHtmlOverflow;
});
</script>
