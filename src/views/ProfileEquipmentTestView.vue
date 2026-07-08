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
          <p class="mt-1 text-sm text-slate-600">
            玩家 ID：{{ resolvedPlayerId ?? "未取得" }}
          </p>
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
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import ProfileEquipmentSwitcher from "@/components/profile/ProfileEquipmentSwitcher.vue";
import {
  buildEquipmentSections,
  normalizeEquippedItems,
  patchEquippedState,
} from "@/models/equipmentModel.js";
import bgPersonal from "@/assets/images/bg-personal.webp";
import { useAuthStore } from "@/stores/authStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";
import {
  equipShopItem,
  getPlayerEquippedItems,
  getPlayerShopItems,
} from "@/services/shopApi.js";

const router = useRouter();
const authStore = useAuthStore();
const playerStore = usePlayerStore();

const activeCategory = ref("avatar");
const inventoryItems = ref([]);
const equippedItems = ref(normalizeEquippedItems(null));
const selectedItemIdByCategory = ref({});
const isLoading = ref(false);
const equippingItemId = ref(null);
const errorMessage = ref("");
let restoreBodyOverflow = "";
let restoreHtmlOverflow = "";

const storedGuestPlayer = computed(() => {
  try {
    return JSON.parse(localStorage.getItem("guestPlayer") || "null");
  } catch {
    return null;
  }
});

const resolvedPlayerId = computed(() => {
  const player =
    authStore.currentPlayer ||
    playerStore.currentPlayer ||
    storedGuestPlayer.value ||
    null;

  const playerId = Number(player?.id);
  return Number.isInteger(playerId) && playerId > 0 ? playerId : null;
});

const equipmentSections = computed(() =>
  buildEquipmentSections(inventoryItems.value, equippedItems.value),
);

const selectedItem = computed(() => {
  const activeSection = equipmentSections.value.find(
    (section) => section.id === activeCategory.value,
  );

  if (!activeSection) {
    return null;
  }

  const selectedId = selectedItemIdByCategory.value[activeCategory.value];

  return (
    activeSection.items.find((item) => item.shopItemId === selectedId) ||
    activeSection.items.find((item) => item.isEquipped) ||
    activeSection.items[0] ||
    null
  );
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

      const hasSelectedItem = section.items.some(
        (item) => item.shopItemId === nextSelection[section.id],
      );

      if (!hasSelectedItem) {
        nextSelection[section.id] =
          section.items.find((item) => item.isEquipped)?.shopItemId ??
          section.items[0].shopItemId;
      }
    });

    selectedItemIdByCategory.value = nextSelection;
  },
  { immediate: true },
);

async function reloadEquipment() {
  if (!resolvedPlayerId.value) {
    errorMessage.value = "目前找不到玩家 ID，請先登入後再測試。";
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
      equippedResponse.equipped,
      resolvedPlayerId.value,
    );
  } catch (error) {
    errorMessage.value = error?.message || "讀取配件資料失敗。";
  } finally {
    isLoading.value = false;
  }
}

function handleSelectItem(item) {
  selectedItemIdByCategory.value = {
    ...selectedItemIdByCategory.value,
    [item.categoryId]: item.shopItemId,
  };
}

async function handleEquipItem(item) {
  if (!resolvedPlayerId.value || !item || equippingItemId.value) {
    return;
  }

  equippingItemId.value = item.shopItemId;
  errorMessage.value = "";

  try {
    const response = await equipShopItem({
      playerId: resolvedPlayerId.value,
      shopItemId: item.shopItemId,
    });

    equippedItems.value = normalizeEquippedItems(
      response.equipped ||
        patchEquippedState(equippedItems.value, item.categoryId, item.shopItemId),
      resolvedPlayerId.value,
    );
  } catch (error) {
    errorMessage.value = error?.message || "套用配件失敗。";
  } finally {
    equippingItemId.value = null;
  }
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
