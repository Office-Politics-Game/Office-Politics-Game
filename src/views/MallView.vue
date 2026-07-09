<template>
  <main
    class="mall-view relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-[#1e1e1e] px-1 py-1 md:px-5 md:py-4"
    :style="{ backgroundImage: `url(${bgDashboard})` }"
  >
    <div class="absolute inset-0 bg-[rgba(0,19,50,0.36)]"></div>
    <section class="mall-shell relative z-10 flex h-[98svh] w-[98vw] max-w-[1360px] flex-col overflow-hidden border border-white/25 bg-white/82 shadow-2xl backdrop-blur-md md:h-[92vh] md:w-[95vw]">
      <header class="mobile-storebar xl:hidden">
        <div class="min-w-0">
          <p class="m-0 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
            OFFICE POLITICS
          </p>
          <div class="mt-0.5 flex items-center gap-2">
            <h1 class="font-display text-2xl font-black tracking-[0.05em] text-slate-900">
              商城
            </h1>
            <span class="border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
              {{ activeCategoryMeta.name }}
            </span>
          </div>
        </div>

        <button
          type="button"
          class="mobile-menu-button"
          :aria-expanded="isMenuOpen"
          aria-label="開啟選單"
          @click="isMenuOpen = true"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div class="tablet-storebar-actions">
          <CurrencyBar
            class="tablet-storebar-currency"
            :items="['coins', 'gems', 'tickets']"
            tooltip-size="small"
          />
          <button
            type="button"
            class="btn-dark tablet-storebar-return h-11 translate-y-1 whitespace-nowrap px-4 py-2 text-sm font-bold"
            @click="goLobby"
          >
            返回大廳
          </button>
        </div>
      </header>

      <Transition name="drawer-fade">
        <div
          v-if="isMenuOpen"
          class="mobile-menu-layer xl:hidden"
          @click.self="isMenuOpen = false"
        >
          <aside class="mobile-menu-panel" aria-label="商城選單">
            <div class="flex items-start justify-between gap-3 border-b border-slate-300/80 pb-3">
              <div>
                <p class="m-0 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  OFFICE POLITICS
                </p>
                <h2 class="mt-1 font-display text-xl font-black tracking-[0.06em] text-slate-900">
                  商城
                </h2>
                <p class="mt-1 text-xs font-semibold text-slate-600">
                  選擇你的辦公室風格與專屬造型。
                </p>
              </div>

              <button
                type="button"
                class="close-button mobile-menu-close"
                aria-label="關閉選單"
                @click="isMenuOpen = false"
              >
                ×
              </button>
            </div>

            <CurrencyBar
              class="mobile-menu-currencybar mt-3"
              :items="['coins', 'gems', 'tickets']"
              tooltip-size="small"
            />

            <div class="mt-3 border border-slate-300 bg-[linear-gradient(180deg,#f9fbfd,#eef4f9)] p-3">
              <div class="text-[10px] font-bold tracking-[0.12em] text-slate-500">
                目前分類
              </div>
              <div class="mt-1 text-base font-black text-slate-900">
                {{ activeCategoryMeta.name }}
              </div>
            </div>

            <button
              type="button"
              class="btn-dark mt-3 h-9 w-full text-xs font-bold"
              @click="goLobby"
            >
              返回大廳
            </button>
          </aside>
        </div>
      </Transition>

      <header class="mall-topbar hidden grid-cols-[minmax(0,1fr)_auto] gap-1.5 border-b border-slate-300/80 px-2 py-2 xl:grid xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)_auto] xl:gap-4 xl:px-6 xl:py-4">
        <div class="order-1 min-w-0 md:order-none">
          <p class="hidden text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500 xl:block xl:text-xs">
            OFFICE POLITICS
          </p>
          <h1 class="font-display text-xl font-black tracking-[0.06em] text-slate-900 xl:mt-1 xl:text-5xl xl:tracking-[0.08em]">
            商城
          </h1>
          <p class="hidden mt-1 text-xs font-semibold tracking-[0.04em] text-slate-600 xl:mt-2 xl:block xl:text-base xl:tracking-[0.06em]">
            選擇你的辦公室風格與專屬造型。
          </p>
        </div>

        <div class="order-3 col-span-2 grid grid-cols-3 gap-1 self-center xl:order-none xl:col-span-1 xl:gap-2 xl:self-start xl:pt-2">
          <CurrencyBar
            class="mall-topbar-currency col-span-3 mt-2 justify-self-end"
            :items="['coins', 'gems', 'tickets']"
            tooltip-size="small"
          />

        </div>

        <button
          type="button"
          class="btn-dark order-2 h-8 translate-y-1 whitespace-nowrap px-2.5 py-1 text-xs font-bold xl:order-none xl:h-11 xl:px-4 xl:py-2 xl:text-sm"
          @click="router.push('/lobby')"
        >
          返回大廳
        </button>
      </header>

      <div class="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside class="scroll-area min-h-0 overflow-y-auto border-b border-slate-300/80 bg-[linear-gradient(180deg,rgba(238,244,251,0.96),rgba(221,230,241,0.9))] xl:border-b-0 xl:border-r">
          <div class="hidden border-b border-slate-300/80 px-3 py-3 xl:block xl:px-5 xl:py-4">
            <div class="text-[11px] font-bold tracking-[0.16em] text-slate-500 xl:text-xs xl:tracking-[0.2em]">
              分類導覽
            </div>
            <div class="mt-1 text-base font-black text-slate-900 xl:mt-2 xl:text-lg">
              商品分類
            </div>
          </div>

          <nav class="category-list grid gap-1.5 p-1.5 xl:gap-2 xl:p-4">
            <button
              v-for="category in categoriesWithCount"
              :key="category.id"
              type="button"
              class="category-card text-left"
              :class="{ active: activeCategory === category.id }"
              @click="activeCategory = category.id"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-xs font-black tracking-[0.06em] xl:text-sm xl:tracking-[0.08em]">
                    {{ category.name }}
                  </div>
                  <div class="hidden mt-1 text-[11px] leading-4 text-slate-500 xl:block xl:text-xs xl:leading-5">
                    {{ category.description }}
                  </div>
                </div>
                <span class="mt-0.5 border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600 xl:px-2 xl:text-[11px]">
                  {{ category.count }}
                </span>
              </div>
            </button>
          </nav>
        </aside>

        <section class="scroll-area min-h-0 overflow-y-auto bg-[linear-gradient(180deg,rgba(247,250,253,0.92),rgba(235,241,247,0.9))]">
          <div class="product-area grid gap-2 p-2 xl:gap-2.5 xl:p-3">
            <article class="featured-panel overflow-hidden border border-slate-300/80 bg-[linear-gradient(130deg,rgba(6,29,55,0.96),rgba(69,87,104,0.92))] text-white">
              <div class="grid gap-2 p-2.5 xl:grid-cols-[minmax(0,1fr)_150px] xl:gap-2.5 xl:p-3">
                <div>
                  <div class="inline-flex border border-white/25 bg-white/10 px-2 py-0.5 text-[9px] font-bold tracking-[0.1em] text-slate-100 md:text-[9px] md:tracking-[0.14em]">
                    精選推薦
                  </div>
                  <h2 class="mt-1 font-display text-base font-black tracking-[0.04em] md:mt-1.5 md:text-xl md:tracking-[0.05em]">
                    {{ featuredItem.name }}
                  </h2>
                  <p class="featured-summary hidden mt-1 max-w-[38rem] text-[11px] leading-4 text-slate-200 xl:block">
                    {{ featuredItem.summary }}
                  </p>
                </div>

                <div class="hidden content-between gap-1.5 border border-white/16 bg-white/10 p-2.5 backdrop-blur-sm xl:grid">
                  <div>
                    <div class="text-[9px] font-bold tracking-[0.1em] text-slate-200">
                      可用代幣
                    </div>
                    <div class="mt-0.5 text-xl font-black text-white">
                      {{ budgetDisplay }}
                    </div>
                  </div>
                  <div>
                    <div class="text-[9px] font-bold tracking-[0.1em] text-slate-300">
                      目前分類
                    </div>
                    <div class="mt-0.5 inline-flex border border-white/25 bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white">
                      {{ activeCategoryMeta.name }}
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <div
              v-if="statusMessage"
              class="status-state border border-slate-600/70 bg-slate-950/80 px-4 py-3 text-sm font-bold text-slate-100"
              role="status"
            >
              {{ statusMessage }}
            </div>

            <div
              v-if="isShopLoading"
              class="empty-state border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center md:px-6 md:py-12"
            >
              <div class="text-lg font-black tracking-[0.06em] text-slate-900 md:text-xl md:tracking-[0.08em]">
                商城資料載入中
              </div>
              <p class="mt-2 text-xs leading-5 text-slate-500 md:mt-3 md:text-sm md:leading-6">
                正在整理最新商品與持有狀態，請稍候。
              </p>
            </div>

            <div
              v-else-if="filteredItems.length === 0"
              class="empty-state border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center md:px-6 md:py-12"
            >
              <div class="text-lg font-black tracking-[0.06em] text-slate-900 md:text-xl md:tracking-[0.08em]">
                這個分類目前沒有商品
              </div>
              <p class="mt-2 text-xs leading-5 text-slate-500 md:mt-3 md:text-sm md:leading-6">
                可以切換其他分類，看看更多可用造型與道具。
              </p>
            </div>

            <div v-else class="product-list grid gap-2 md:gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MallProductCard
                v-for="item in filteredItems"
                :key="item.id"
                :item="item"
                :active="selectedItem?.id === item.id && isDetailModalOpen"
                @purchase="purchaseItem"
                @select="openItemDetail"
              />
            </div>
          </div>
        </section>
      </div>
    </section>

    <Transition name="modal-fade-up">
      <div
        v-if="isDetailModalOpen && selectedItem"
        class="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(0,19,50,0.42)] px-2 py-2 backdrop-blur-[2px] md:px-3 md:py-6"
        @click.self="closeItemDetail"
      >
        <div class="modal-panel flex max-h-[88vh] w-full max-w-[840px] flex-col overflow-hidden border border-white/35 bg-white/92 shadow-2xl">
          <header class="flex items-start justify-between gap-2 border-b border-slate-200 px-2.5 py-2 md:gap-4 md:px-6 md:py-4">
            <div>
              <div class="text-[9px] font-bold tracking-[0.1em] text-slate-500 md:text-[11px] md:tracking-[0.16em]">
                商品明細
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-1.5 md:mt-2 md:gap-2">
                <h3 class="font-display text-xl font-black tracking-[0.03em] text-slate-900 md:text-3xl md:tracking-[0.05em]">
                  {{ selectedItem.name }}
                </h3>
                <span class="border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 md:px-2 md:py-1 md:text-[11px]">
                  {{ selectedItem.categoryLabel }}
                </span>
              </div>
              <p class="hidden mt-1.5 text-xs leading-5 text-slate-600 md:mt-2 md:block md:text-sm md:leading-6">
                {{ selectedItem.description }}
              </p>
            </div>

            <button
              type="button"
              class="close-button"
              aria-label="關閉商品明細"
              @click="closeItemDetail"
            >
              ×
            </button>
          </header>

          <div class="scroll-area min-h-0 overflow-y-auto px-2.5 py-2.5 md:px-6 md:py-5">
            <div class="modal-detail-card">
              <div class="modal-detail-card__media">
                <button
                  type="button"
                  class="modal-preview"
                  aria-label="檢視商品大圖"
                  @click="openImagePreview"
                >
                  <img
                    :src="selectedItem.previewImage"
                    :alt="selectedItem.name + ' preview'"
                    class="modal-preview__image"
                  />
                  <div class="modal-preview__overlay"></div>
                </button>
              </div>
              <div class="modal-detail-card__info">
                <div class="modal-detail-card__rows">
                  <div class="detail-row">
                    <span>分類</span>
                    <strong>{{ selectedItem.categoryLabel }}</strong>
                  </div>
                  <div class="detail-row">
                    <span>價格</span>
                    <strong>{{ selectedItem.price }}</strong>
                  </div>
                  <div class="detail-row">
                    <span>狀態</span>
                    <strong>{{ selectedItem.actionLabel }}</strong>
                  </div>
                </div>

                <aside class="modal-detail-card__purchase">
                  <div class="border border-slate-300 bg-[linear-gradient(180deg,#f9fbfd,#eef4f9)] p-2.5 md:p-4">
                    <div class="text-[9px] font-bold tracking-[0.1em] text-slate-500 md:text-[11px] md:tracking-[0.16em]">
                      可用代幣
                    </div>
                    <div class="mt-0.5 text-lg font-black text-slate-900 md:mt-1 md:text-3xl">
                      {{ budgetDisplay }}
                    </div>
                  </div>

                  <button
                    type="button"
                    class="item-action item-action--modal"
                    :class="`item-action--${selectedItem.actionState}`"
                    :disabled="selectedItem.actionState !== 'buy' || isPurchasing"
                    @click="purchaseSelectedItem"
                  >
                    {{ isPurchasing ? '購買中...' : selectedItem.actionLabel }}
                  </button>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <Transition name="modal-fade-up">
      <div
        v-if="isImagePreviewOpen && selectedItem"
        class="image-preview-layer"
        @click.self="closeImagePreview"
      >
        <button
          type="button"
          class="close-button image-preview-close"
          aria-label="關閉商品大圖"
          @click="closeImagePreview"
        >
          ×
        </button>
        <img
          :src="selectedItem.previewImage"
          :alt="`${selectedItem.name} large preview`"
          class="image-preview-image"
        />
      </div>
    </Transition>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import CurrencyBar from "@/components/common/CurrencyBar.vue";
import MallProductCard from "@/components/mall/MallProductCard.vue";
import bgDashboard from "@/assets/images/bg-dashboard.webp";
import stockToken from "@/assets/images/stock-token.webp";
import stockTokenBundle from "@/assets/images/stock-token-bundle.webp";
import stockTokenStack from "@/assets/images/stock-token-stack.webp";
import {
  mallCategories,
  mallItems,
} from "@/mocks/mallMockData.js";
import {
  getPlayerShopItems,
  getShopItems,
  purchaseShopItem,
} from "@/services/shopApi.js";
import {
  formatNumber,
  getCurrencyBalance,
  getOwnedShopItemIdSet,
  normalizeShopItem,
  shopTypeCategoryMap,
} from "@/services/shopItemMapper.js";
import { useAuthStore } from "@/stores/authStore.js";
import { useCurrencyStore } from "@/stores/currencyStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const currencyStore = useCurrencyStore();
const playerStore = usePlayerStore();

const categories = mallCategories;
const fallbackItems = mallItems;
const shopItems = ref([]);
const playerItems = ref([]);
const isShopLoading = ref(false);
const isPurchasing = ref(false);
const statusMessage = ref("");

const activeCategory = ref(categories[0].id);
const selectedItem = ref(null);
const isDetailModalOpen = ref(false);
const isMenuOpen = ref(false);
const isImagePreviewOpen = ref(false);

const topUpItems = [
  {
    id: "gems_60",
    category: "top-up",
    categoryLabel: "購買股份",
    name: "60 股份",
    description: "小額股份方案，適合先試用儲值流程。",
    summary: "取得 60 股份。",
    price: "NT$ 30",
    rawPrice: 30,
    currency: "diamond",
    actionLabel: "前往儲值",
    actionState: "buy",
    previewImage: stockToken,
    previewImageClass: "item-card__preview-image--stock-single",
  },
  {
    id: "gems_300",
    category: "top-up",
    categoryLabel: "購買股份",
    name: "300 股份",
    description: "標準股份方案，取得更多商城可用股份。",
    summary: "取得 300 股份。",
    price: "NT$ 150",
    rawPrice: 150,
    currency: "diamond",
    actionLabel: "前往儲值",
    actionState: "buy",
    previewImage: stockTokenStack,
    previewImageClass: "item-card__preview-image--stock-stack",
  },
  {
    id: "gems_680",
    category: "top-up",
    categoryLabel: "購買股份",
    name: "680 股份",
    description: "大量股份方案，適合一次補足商城購買額度。",
    summary: "取得 680 股份。",
    price: "NT$ 330",
    rawPrice: 330,
    currency: "diamond",
    actionLabel: "前往儲值",
    actionState: "buy",
    previewImage: stockTokenBundle,
    previewImageClass: "item-card__preview-image--stock-bundle",
  },
];

function getStoredGuestPlayer() {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem("guestPlayer") || "null");
  } catch {
    return null;
  }
}

const currentPlayerId = computed(() => {
  const routePlayerId = Number(route.query.playerId);

  if (Number.isInteger(routePlayerId) && routePlayerId > 0) {
    return routePlayerId;
  }

  const storedGuestPlayer = getStoredGuestPlayer();

  return (
    authStore.currentPlayer?.id ??
    playerStore.currentPlayerId ??
    storedGuestPlayer?.id ??
    null
  );
});

const fallbackImageByCategory = computed(() =>
  fallbackItems.reduce((accumulator, item) => {
    if (!accumulator[item.category]) {
      accumulator[item.category] = item.previewImage;
    }

    return accumulator;
  }, {}),
);

const ownedShopItemIds = computed(() => getOwnedShopItemIdSet(playerItems.value));

const normalizedItems = computed(() => [
  ...shopItems.value.map((item) => {
    const category = shopTypeCategoryMap[item.type];

    return normalizeShopItem(item, {
      categories,
      fallbackImage:
        fallbackImageByCategory.value[category] ?? fallbackItems[0]?.previewImage,
      ownedShopItemIds: ownedShopItemIds.value,
    });
  }),
  ...topUpItems,
]);

const categoriesWithCount = computed(() =>
  categories.map((category) => ({
    ...category,
    count: normalizedItems.value.filter((item) => item.category === category.id).length,
  })),
);

const filteredItems = computed(() =>
  normalizedItems.value.filter((item) => item.category === activeCategory.value),
);

const activeCategoryMeta = computed(
  () =>
    categoriesWithCount.value.find(
      (category) => category.id === activeCategory.value,
    ) ?? categoriesWithCount.value[0],
);

const featuredItem = computed(
  () => filteredItems.value[0] ?? normalizedItems.value[0] ?? fallbackItems[0],
);
const budgetDisplay = computed(() =>
  formatNumber(
    getCurrencyBalance(selectedItem.value?.currency ?? "coin", {
      coins: currencyStore.coins,
      gems: currencyStore.gems,
      tickets: currencyStore.tickets,
    }),
  ),
);

function getErrorMessage(error, fallbackMessage) {
  return error?.data?.message || error?.message || fallbackMessage;
}

async function loadShopData() {
  const playerId = currentPlayerId.value;

  isShopLoading.value = true;
  statusMessage.value = "";

  try {
    const [shopData, ownedData] = await Promise.all([
      getShopItems({ activeOnly: true }),
      playerId ? getPlayerShopItems(playerId) : Promise.resolve({ items: [] }),
      playerId ? currencyStore.fetchPlayerCurrency(playerId) : Promise.resolve(null),
    ]);

    shopItems.value = shopData.items ?? [];
    playerItems.value = ownedData.items ?? [];

    if (!playerId) {
      statusMessage.value = "尚未取得玩家 ID，商品可瀏覽但無法購買。";
    }
  } catch (error) {
    statusMessage.value = getErrorMessage(error, "商城資料載入失敗，請稍後再試。");
    shopItems.value = [];
    playerItems.value = [];
  } finally {
    isShopLoading.value = false;
  }
}

function openItemDetail(item) {
  selectedItem.value = item;
  isDetailModalOpen.value = true;
}

function closeItemDetail() {
  isDetailModalOpen.value = false;
  isImagePreviewOpen.value = false;
}

function openImagePreview() {
  isImagePreviewOpen.value = true;
}

function closeImagePreview() {
  isImagePreviewOpen.value = false;
}

function goLobby() {
  isMenuOpen.value = false;
  router.push("/lobby");
}

async function purchaseItem(item) {
  if (item.category === "top-up") {
    statusMessage.value = "儲值付款流程下一步接上。";
    return;
  }

  if (!currentPlayerId.value) {
    statusMessage.value = "尚未取得玩家 ID，請重新登入後再購買商品。";
    return;
  }

  if (item.actionState !== "buy" || isPurchasing.value) {
    return;
  }

  isPurchasing.value = true;
  statusMessage.value = "";

  try {
    const result = await purchaseShopItem({
      playerId: currentPlayerId.value,
      shopItemId: item.id,
      quantity: 1,
    });

    if (result.currency) {
      currencyStore.coins = result.currency.coins ?? currencyStore.coins;
      currencyStore.gems = result.currency.gems ?? currencyStore.gems;
      currencyStore.tickets = result.currency.tickets ?? currencyStore.tickets;
    }

    await Promise.all([
      getPlayerShopItems(currentPlayerId.value).then((data) => {
        playerItems.value = data.items ?? [];
      }),
      getShopItems({ activeOnly: true }).then((data) => {
        shopItems.value = data.items ?? [];
      }),
    ]);

    statusMessage.value = "購買成功，已更新持有狀態與貨幣餘額。";
  } catch (error) {
    statusMessage.value = getErrorMessage(error, "購買失敗，請檢查餘額或稍後再試。");
  } finally {
    isPurchasing.value = false;
  }
}

function purchaseSelectedItem() {
  if (selectedItem.value) {
    purchaseItem(selectedItem.value);
  }
}

function handleEscape(event) {
  if (event.key !== "Escape") {
    return;
  }

  if (isMenuOpen.value) {
    isMenuOpen.value = false;
    return;
  }

  if (isImagePreviewOpen.value) {
    closeImagePreview();
    return;
  }

  if (isDetailModalOpen.value) {
    closeItemDetail();
  }
}

watch(
  filteredItems,
  (nextItems) => {
    if (!nextItems.length) {
      isDetailModalOpen.value = false;
      return;
    }

    const nextSelectedItem = nextItems.find(
      (item) => item.id === selectedItem.value?.id,
    );

    if (nextSelectedItem) {
      selectedItem.value = nextSelectedItem;
      return;
    }

    selectedItem.value = nextItems[0];
  },
  { immediate: true },
);

watch(
  currentPlayerId,
  () => {
    loadShopData();
  },
  { immediate: true },
);

onMounted(() => {
  window.addEventListener("keydown", handleEscape);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleEscape);
});
</script>

<style scoped>
@reference "tailwindcss";

.mall-view {
  background-color: #030712;
  background-position: center;
  background-size: cover;
}

.mall-view::before {
  position: absolute;
  inset: 0;
  content: "";
  background:
    linear-gradient(116deg, transparent 0 31%, rgba(54, 83, 143, 0.38) 31.2% 55%, transparent 55.2%),
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.045) 0 1px, transparent 1px 5px),
    radial-gradient(circle at 78% 24%, rgba(0, 70, 244, 0.18), transparent 28%),
    radial-gradient(circle at 18% 80%, rgba(168, 85, 247, 0.18), transparent 30%);
  pointer-events: none;
}

.mall-shell,
.modal-panel {
  box-shadow:
    0 28px 70px rgba(0, 0, 0, 0.44),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.mall-shell {
  border-color: rgba(148, 163, 184, 0.38);
  background:
    linear-gradient(135deg, rgba(4, 12, 24, 0.94), rgba(13, 22, 42, 0.9)),
    rgba(3, 7, 18, 0.92);
}

.mall-topbar {
  position: relative;
  overflow: hidden;
  border-color: rgba(148, 163, 184, 0.32);
  background:
    linear-gradient(108deg, rgba(2, 6, 23, 0.98) 0 42%, rgba(30, 58, 138, 0.72) 42.2% 64%, rgba(2, 6, 23, 0.96) 64.2%),
    rgba(2, 6, 23, 0.94);
}

.mall-topbar::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  content: "";
  background: linear-gradient(90deg, transparent, rgba(0, 70, 244, 0.95), transparent);
}

.mall-topbar h1,
.mall-topbar p {
  color: white;
}

.mall-topbar > div:nth-child(2) > div {
  border-color: rgba(148, 163, 184, 0.36);
  background: linear-gradient(180deg, rgba(71, 85, 105, 0.82), rgba(15, 23, 42, 0.9));
}

.mall-topbar > div:nth-child(2) > div > div:first-child {
  color: rgba(203, 213, 225, 0.82);
}

.mall-topbar > div:nth-child(2) > div > div:last-child {
  color: rgb(134, 179, 224);
  text-shadow: 0 0 14px rgba(0, 70, 244, 0.45);
}

.mall-topbar .btn-dark,
.tablet-storebar-actions .btn-dark,
.mobile-menu-panel .btn-dark {
  border-color: rgba(0, 70, 244, 0.7);
  background: linear-gradient(180deg, rgba(0, 70, 244, 0.95), rgba(70, 85, 99, 0.95));
  color: white;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.42);
}

.scroll-area {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 70, 244, 0.72) rgba(15, 23, 42, 0.7);
}

.scroll-area::-webkit-scrollbar {
  width: 11px;
  height: 11px;
}

.scroll-area::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.78);
  border-left: 1px solid rgba(148, 163, 184, 0.16);
}

.scroll-area::-webkit-scrollbar-thumb {
  border: 2px solid rgba(15, 23, 42, 0.75);
  background: linear-gradient(180deg, rgba(0, 70, 244, 0.9), rgba(70, 85, 99, 0.88));
}

.scroll-area::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(134, 179, 224, 0.95), rgba(0, 70, 244, 0.92));
}

.mall-shell > .grid > aside {
  border-color: rgba(148, 163, 184, 0.24);
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.95), rgba(15, 23, 42, 0.9)),
    rgba(2, 6, 23, 0.92);
}

.mall-shell > .grid > section {
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(3, 7, 18, 0.9)),
    rgba(2, 6, 23, 0.9);
}

.mall-shell > .grid > aside > div:first-child {
  border-color: rgba(148, 163, 184, 0.24);
  background: rgba(0, 0, 0, 0.18);
}

.mall-shell > .grid > aside > div:first-child div {
  color: rgba(226, 232, 240, 0.92);
}

.category-card {
  border: 1px solid rgba(71, 85, 105, 0.78);
  background: linear-gradient(180deg, rgba(19, 51, 68, 0.92), rgba(12, 32, 48, 0.94));
  padding: 14px;
  color: rgba(226, 232, 240, 0.92);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.category-card:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 70, 244, 0.72);
  background: linear-gradient(180deg, rgba(30, 75, 90, 0.98), rgba(15, 46, 62, 0.98));
}

.category-card.active {
  border-color: rgba(0, 70, 244, 0.95);
  background: linear-gradient(180deg, rgba(0, 70, 244, 0.92), rgba(70, 85, 99, 0.92));
  box-shadow:
    inset 4px 0 0 rgba(134, 179, 224, 0.98),
    0 0 22px rgba(0, 70, 244, 0.34);
  color: white;
}

.category-card span {
  border-color: rgba(0, 70, 244, 0.32);
  background: rgba(2, 6, 23, 0.42);
  color: currentColor;
}

.featured-panel {
  border-color: rgba(0, 70, 244, 0.28);
  background:
    linear-gradient(110deg, rgba(2, 6, 23, 0.96) 0 42%, rgba(30, 58, 138, 0.42) 42.2% 67%, rgba(2, 6, 23, 0.94) 67.2%),
    rgba(2, 6, 23, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 18px 34px rgba(0, 0, 0, 0.32);
}

.featured-summary {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.mobile-storebar {
  position: relative;
  z-index: 25;
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.32);
  background:
    linear-gradient(108deg, rgba(2, 6, 23, 0.98) 0 58%, rgba(30, 58, 138, 0.78) 58.2% 72%, rgba(2, 6, 23, 0.96) 72.2%),
    rgba(2, 6, 23, 0.94);
  padding: 8px 10px 8px 12px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.22);
}

.mobile-storebar p,
.mobile-storebar h1 {
  color: white;
}

.mobile-storebar span:not(.mobile-menu-button span) {
  border-color: rgba(0, 70, 244, 0.52);
  background: rgba(0, 70, 244, 0.16);
  color: rgb(134, 179, 224);
}

.tablet-storebar-actions {
  display: none;
}

.mobile-menu-button {
  position: relative;
  z-index: 20;
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid rgba(0, 70, 244, 0.55);
  background: rgba(15, 23, 42, 0.9);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.mobile-menu-button span {
  display: block;
  width: 16px;
  height: 2px;
  background: rgb(134, 179, 224);
}

.mobile-menu-layer {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(4px);
}

.mobile-menu-panel {
  width: min(78vw, 280px);
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid rgba(0, 70, 244, 0.38);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.96)),
    rgba(2, 6, 23, 0.96);
  padding: 14px;
  box-shadow: -18px 0 42px rgba(0, 0, 0, 0.42);
}

.mobile-menu-panel h2,
.mobile-menu-panel p,
.mobile-menu-panel div {
  color: rgba(226, 232, 240, 0.92);
}

.mobile-menu-panel > div:nth-child(2) > div,
.mobile-menu-panel > div:nth-child(3) {
  border-color: rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.76);
}

.mobile-menu-close {
  flex: 0 0 auto;
}

.mobile-menu-currencybar {
  width: 100%;
  margin-inline: auto;
}

.mobile-menu-currencybar:deep(section) {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
}

.mobile-menu-currencybar:deep(section > div) {
  width: 100% !important;
  min-width: 0 !important;
}

.mobile-menu-currencybar:deep(section > div > div) {
  min-width: 0;
  justify-content: center;
}

.mobile-menu-currencybar:deep(section > div > div > span:first-child) {
  flex-shrink: 0;
}

.mobile-menu-currencybar:deep(section > div > div > span:last-child) {
  min-width: 0 !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 8px !important;
}

.mobile-menu-currencybar:deep(section > div > div:last-child),
.tablet-storebar-currency:deep(section > div > div:last-child),
.mall-topbar-currency:deep(section > div > div:last-child) {
  top: 100% !important;
  bottom: auto !important;
  margin-top: 8px !important;
  margin-bottom: 0 !important;
}

.mall-topbar-currency {
  width: min(100%, 300px);
}

.mall-topbar-currency:deep(section) {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
  gap: 6px;
}

.mall-topbar-currency:deep(section > div) {
  width: 100% !important;
  min-width: 0 !important;
  height: 24px !important;
  padding: 0 5px !important;
}

.mall-topbar-currency:deep(section > div > div:first-child) {
  min-width: 0;
  gap: 4px !important;
}

.mall-topbar-currency:deep(section > div > div:first-child > span:first-child) {
  width: 15px !important;
  height: 15px !important;
  flex: 0 0 15px !important;
}

.mall-topbar-currency:deep(section > div > div:first-child > span:last-child) {
  min-width: 0 !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px !important;
}

.modal-detail-card {
  display: grid;
  grid-template-columns: minmax(220px, 1.08fr) minmax(260px, 0.92fr);
  gap: 18px;
  align-items: start;
}

.modal-detail-card__media,
.modal-detail-card__info,
.modal-detail-card__purchase {
  min-width: 0;
}

.modal-detail-card__info {
  display: grid;
  gap: 10px;
}

.modal-detail-card__rows {
  border: 1px solid rgba(148, 163, 184, 0.36);
  background: rgba(15, 23, 42, 0.82);
  padding: 14px;
}

.modal-detail-card__purchase {
  display: grid;
  gap: 8px;
}

.modal-panel {
  border-color: rgba(148, 163, 184, 0.38);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.95)),
    rgba(2, 6, 23, 0.96);
  color: rgba(226, 232, 240, 0.92);
}

.modal-panel > header {
  border-color: rgba(148, 163, 184, 0.26);
  background:
    linear-gradient(108deg, rgba(2, 6, 23, 0.98), rgba(30, 58, 138, 0.56), rgba(2, 6, 23, 0.96));
}

.modal-panel h3 {
  color: white;
}

.modal-panel header p {
  color: rgba(203, 213, 225, 0.86);
}

.modal-panel header span {
  border-color: rgba(0, 70, 244, 0.45);
  background: rgba(0, 70, 244, 0.16);
  color: rgb(134, 179, 224);
}

.modal-detail-card__purchase > div {
  border-color: rgba(148, 163, 184, 0.36);
  background:
    linear-gradient(180deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9));
}

.modal-detail-card__purchase > div > div:first-child {
  color: rgba(203, 213, 225, 0.78);
}

.modal-detail-card__purchase > div > div:last-child {
  color: rgb(134, 179, 224);
  text-shadow: 0 0 14px rgba(0, 70, 244, 0.45);
}

.modal-preview {
  position: relative;
  display: grid;
  width: 100%;
  height: min(54vh, 420px);
  min-height: 300px;
  place-items: center;
  overflow: hidden;
  aspect-ratio: auto;
  padding: 0;
  border: 1px solid rgba(148, 163, 184, 0.36);
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(30, 58, 138, 0.34)),
    rgba(2, 6, 23, 0.76);
  cursor: zoom-in;
}

.modal-preview__image {
  display: block;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 8px;
  object-fit: contain;
  object-position: center;
  z-index: 1;
  box-shadow: 0 16px 34px rgba(0, 19, 50, 0.16);
}

.modal-preview__overlay {
  display: block;
  pointer-events: none;
}

.modal-preview__overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(0, 19, 50, 0.08), rgba(0, 19, 50, 0.48)),
    linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 48%);
}

.image-preview-layer {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 22px;
  background: rgba(0, 19, 50, 0.78);
  backdrop-filter: blur(6px);
}

.image-preview-close {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 2;
  background: rgba(255, 255, 255, 0.92);
}

.image-preview-image {
  display: block;
  width: auto;
  height: auto;
  max-width: min(92vw, 980px);
  max-height: 88svh;
  object-fit: contain;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.36);
}

.item-action {
  border: 1px solid transparent;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.item-action--modal {
  width: 100%;
}

.item-action--buy {
  border-color: rgba(0, 70, 244, 0.75);
  background: linear-gradient(180deg, rgba(0, 70, 244, 0.95), rgba(70, 85, 99, 0.95));
  color: white;
}

.item-action--buy:hover {
  background: linear-gradient(180deg, rgba(134, 179, 224, 0.98), rgba(0, 70, 244, 0.95));
}

.item-action--owned {
  border-color: rgba(148, 163, 184, 0.7);
  background: rgba(226, 232, 240, 0.9);
  color: rgb(71, 85, 105);
}

.item-action--coming {
  border-color: rgba(245, 158, 11, 0.42);
  background: rgba(254, 243, 199, 0.9);
  color: rgb(146, 64, 14);
}

.empty-state {
  border-color: rgba(148, 163, 184, 0.36);
  background: rgba(15, 23, 42, 0.82);
  color: rgba(226, 232, 240, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  padding-bottom: 10px;
  font-size: 13px;
  color: rgba(203, 213, 225, 0.82);
}

.detail-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.detail-row strong {
  text-align: right;
  font-size: 14px;
  color: white;
}

.close-button {
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(148, 163, 184, 0.48);
  background: rgba(15, 23, 42, 0.84);
  color: rgba(226, 232, 240, 0.95);
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.close-button:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 70, 244, 0.8);
  background: rgba(0, 70, 244, 0.9);
  color: white;
}

.close-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 5px var(--brand-focus);
}

.modal-fade-up-enter-active,
.modal-fade-up-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.modal-fade-up-enter-from,
.modal-fade-up-leave-to {
  opacity: 0;
}

.modal-fade-up-enter-from .modal-panel,
.modal-fade-up-leave-to .modal-panel {
  transform: translateY(18px);
  opacity: 0;
}

.modal-fade-up-enter-active .modal-panel,
.modal-fade-up-leave-active .modal-panel {
  transition:
    transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 220ms ease;
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 180ms ease;
}

.drawer-fade-enter-active .mobile-menu-panel,
.drawer-fade-leave-active .mobile-menu-panel {
  transition: transform 200ms ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-fade-enter-from .mobile-menu-panel,
.drawer-fade-leave-to .mobile-menu-panel {
  transform: translateX(100%);
}

@media (min-width: 1280px) {
  .mobile-storebar,
  .mobile-menu-button,
  .mobile-menu-layer {
    display: none !important;
  }
}

@media (max-width: 1279px) {
  .mall-shell {
    height: 98svh;
    width: 98vw;
  }

  .mobile-menu-layer {
    top: 0;
  }

  .category-list {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scroll-snap-type: x proximity;
    padding: 8px 10px;
  }

  .category-card {
    width: clamp(112px, 22vw, 160px);
    flex: 0 0 auto;
    scroll-snap-align: start;
    padding: 8px 10px;
  }

  .category-card:hover {
    transform: none;
  }

  .featured-panel {
    display: none;
  }

  .product-area {
    min-height: 0;
    gap: 8px;
    padding: 10px;
  }

  .product-list {
    display: flex;
    min-height: 0;
    gap: 8px;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-inline: contain;
    scroll-snap-type: x mandatory;
    padding: 4px 4px 12px;
  }

  .product-list > * {
    flex: 0 0 calc((100% - 24px) / 4);
    scroll-snap-align: start;
  }
}

@media (min-width: 768px) and (max-width: 1279px) and (orientation: landscape) {
  .mall-shell {
    height: 94svh;
    width: 96vw;
  }

  .mobile-storebar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    min-height: 64px;
    align-items: center;
    padding: 8px 14px;
  }

  .mobile-storebar h1 {
    font-size: 24px;
  }

  .mobile-storebar .mobile-menu-button {
    display: none;
  }

  .mobile-menu-layer {
    display: none !important;
  }

  .tablet-storebar-actions {
    display: flex;
    align-items: center;
    justify-self: end;
    gap: 10px;
  }

  .tablet-storebar-currency {
    width: min(35vw, 300px);
  }

  .tablet-storebar-currency:deep(section) {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
    gap: 6px;
  }

  .tablet-storebar-currency:deep(section > div) {
    width: 100% !important;
    min-width: 0 !important;
    height: 24px !important;
    padding: 0 5px !important;
  }

  .tablet-storebar-currency:deep(section > div > div) {
    min-width: 0;
    justify-content: center;
    gap: 4px !important;
  }

  .tablet-storebar-currency:deep(section > div > div > span:first-child) {
    width: 15px !important;
    height: 15px !important;
    flex: 0 0 15px !important;
  }

  .tablet-storebar-currency:deep(section > div > div > span:last-child) {
    min-width: 0 !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 10px !important;
  }

  .mobile-menu-currencybar {
    width: 94%;
  }

  .mobile-menu-currencybar:deep(section) {
    gap: 5px;
  }

  .mobile-menu-currencybar:deep(section > div) {
    height: 22px !important;
    padding: 0 3px !important;
  }

  .mobile-menu-currencybar:deep(section > div > div) {
    gap: 3px !important;
  }

  .mobile-menu-currencybar:deep(section > div > div > span:first-child) {
    width: 13px !important;
    height: 13px !important;
    flex-basis: 13px !important;
  }

  .mobile-menu-currencybar:deep(section > div > div > span:last-child) {
    font-size: 9px !important;
  }

  .mall-shell > .grid {
    grid-template-columns: 176px minmax(0, 1fr);
  }

  .mall-shell > .grid > aside {
    border-right: 1px solid rgba(160, 166, 179, 0.8);
    border-bottom: 0;
  }

  .category-list {
    display: grid;
    gap: 7px;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 10px;
    scroll-snap-type: none;
  }

  .category-card {
    width: auto;
    padding: 9px;
  }

  .product-area {
    padding: 10px;
  }

  .product-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    overflow: visible;
    padding: 0;
    scroll-snap-type: none;
  }

  .product-list > * {
    min-width: 0;
    scroll-snap-align: none;
  }
}

@media (max-width: 767px) {
  .mobile-menu-currencybar {
    width: 92%;
  }

  .mobile-menu-currencybar:deep(section) {
    gap: 4px;
  }

  .mobile-menu-currencybar:deep(section > div) {
    height: 20px !important;
    padding: 0 2px !important;
  }

  .mobile-menu-currencybar:deep(section > div > div) {
    gap: 2px !important;
  }

  .mobile-menu-currencybar:deep(section > div > div > span:first-child) {
    width: 12px !important;
    height: 12px !important;
    flex-basis: 12px !important;
  }

  .mobile-menu-currencybar:deep(section > div > div > span:last-child) {
    font-size: 8px !important;
  }

  .mall-topbar {
    align-items: start;
  }

  .category-card {
    width: min(42vw, 132px);
    padding: 8px;
  }

  .scroll-area::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .product-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    overflow: visible;
    padding: 0;
    scroll-snap-type: none;
  }

  .product-list > * {
    min-width: 0;
    scroll-snap-align: none;
  }

  .modal-panel {
    width: min(94vw, 360px);
    max-height: 86svh;
  }

  .modal-detail-card {
    grid-template-columns: minmax(104px, 0.72fr) minmax(0, 1fr);
    gap: 8px;
  }

  .modal-detail-card__info {
    gap: 6px;
  }

  .modal-detail-card__rows {
    padding: 8px;
  }

  .modal-preview {
    height: 116px;
    min-height: 116px;
  }

  .modal-preview__image {
    padding: 6px;
  }

  .modal-detail-card__purchase {
    gap: 6px;
  }

  .detail-row {
    gap: 6px;
    padding-bottom: 6px;
    font-size: 10px;
  }

  .detail-row strong {
    font-size: var(--text-xs);
  }

  .close-button {
    width: 30px;
    height: 30px;
    font-size: 20px;
  }

  .item-action {
    align-self: stretch;
    min-width: 82px;
    padding: 7px 10px;
    font-size: 10px;
    letter-spacing: 0.05em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .modal-fade-up-enter-active,
  .modal-fade-up-leave-active,
  .modal-fade-up-enter-active .modal-panel,
  .modal-fade-up-leave-active .modal-panel {
    transition: none;
  }
}
</style>

