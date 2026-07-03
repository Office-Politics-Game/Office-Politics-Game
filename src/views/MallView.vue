<template>
  <main
    class="mall-view relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-[#1e1e1e] px-1 py-1 md:px-5 md:py-4"
    :style="{ backgroundImage: `url(${bgDashboard})` }"
  >
    <div class="absolute inset-0 bg-[rgba(0,19,50,0.36)]"></div>

    <section class="mall-shell relative z-10 flex h-[98svh] w-[98vw] max-w-[1360px] flex-col overflow-hidden border border-white/25 bg-white/82 shadow-2xl backdrop-blur-md md:h-[92vh] md:w-[95vw]">
      <button
        type="button"
        class="mobile-menu-button md:hidden"
        :aria-expanded="isMenuOpen"
        aria-label="開啟選單"
        @click="isMenuOpen = true"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <Transition name="drawer-fade">
        <div
          v-if="isMenuOpen"
          class="mobile-menu-layer md:hidden"
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
                  選擇你的辦公室風格
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
              class="mt-3"
              :items="['coins', 'gems', 'tickets']"
            />

            <div class="mt-3 grid grid-cols-3 gap-2">
              <div
                v-for="metric in headerMetrics"
                :key="metric.label"
                class="border border-slate-300/70 bg-white/75 px-2 py-1.5 text-right"
              >
                <div class="text-[9px] font-bold tracking-[0.08em] text-slate-500">
                  {{ metric.label }}
                </div>
                <div class="mt-0.5 text-sm font-black text-slate-900">
                  {{ metric.value }}
                </div>
              </div>
            </div>

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

      <header class="mall-topbar hidden grid-cols-[minmax(0,1fr)_auto] gap-1.5 border-b border-slate-300/80 px-2 py-2 md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)_auto] md:gap-4 md:px-6 md:py-4">
        <div class="order-1 min-w-0 md:order-none">
          <p class="hidden text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500 md:block md:text-xs">
            OFFICE POLITICS
          </p>
          <h1 class="font-display text-xl font-black tracking-[0.06em] text-slate-900 md:mt-1 md:text-5xl md:tracking-[0.08em]">
            商城
          </h1>
          <p class="hidden mt-1 text-xs font-semibold tracking-[0.04em] text-slate-600 md:mt-2 md:block md:text-base md:tracking-[0.06em]">
            選擇你的辦公室風格
          </p>
        </div>

        <div class="order-3 col-span-2 grid grid-cols-3 gap-1 md:order-none md:col-span-1 md:gap-2">
          <CurrencyBar
            class="col-span-3 -translate-x-2 justify-self-end md:-translate-x-3"
            :items="['coins', 'gems', 'tickets']"
          />

          <div
            v-for="metric in headerMetrics"
            :key="metric.label"
            class="border border-slate-300/70 bg-white/70 px-1.5 py-1 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] md:px-3 md:py-2"
          >
            <div class="text-[9px] font-bold tracking-[0.06em] text-slate-500 md:text-[11px] md:tracking-[0.14em]">
              {{ metric.label }}
            </div>
            <div class="text-sm font-black text-slate-900 md:mt-1 md:text-xl">
              {{ metric.value }}
            </div>
          </div>
        </div>

        <button
          type="button"
          class="btn-dark order-2 h-8 whitespace-nowrap px-2.5 py-1 text-xs font-bold md:order-none md:h-11 md:px-4 md:py-2 md:text-sm"
          @click="router.push('/lobby')"
        >
          返回大廳
        </button>
      </header>

      <div class="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside class="scroll-area min-h-0 overflow-y-auto border-b border-slate-300/80 bg-[linear-gradient(180deg,rgba(238,244,251,0.96),rgba(221,230,241,0.9))] lg:border-b-0 lg:border-r">
          <div class="hidden border-b border-slate-300/80 px-3 py-3 md:block md:px-5 md:py-4">
            <div class="text-[11px] font-bold tracking-[0.16em] text-slate-500 md:text-xs md:tracking-[0.2em]">
              分類導覽
            </div>
            <div class="mt-1 text-base font-black text-slate-900 md:mt-2 md:text-lg">
              商品分類
            </div>
          </div>

          <nav class="category-list grid gap-1.5 p-1.5 md:gap-2 md:p-4">
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
                  <div class="text-xs font-black tracking-[0.06em] md:text-sm md:tracking-[0.08em]">
                    {{ category.name }}
                  </div>
                  <div class="hidden mt-1 text-[11px] leading-4 text-slate-500 md:block md:text-xs md:leading-5">
                    {{ category.description }}
                  </div>
                </div>
                <span class="mt-0.5 border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600 md:px-2 md:text-[11px]">
                  {{ category.count }}
                </span>
              </div>
            </button>
          </nav>
        </aside>

        <section class="scroll-area min-h-0 overflow-y-auto bg-[linear-gradient(180deg,rgba(247,250,253,0.92),rgba(235,241,247,0.9))]">
          <div class="grid gap-2 p-2 md:gap-4 md:p-5">
            <article class="featured-panel overflow-hidden border border-slate-300/80 bg-[linear-gradient(130deg,rgba(6,29,55,0.96),rgba(69,87,104,0.92))] text-white">
              <div class="grid gap-2 p-2.5 md:grid-cols-[minmax(0,1fr)_220px] md:gap-4 md:p-6">
                <div>
                  <div class="inline-flex border border-white/25 bg-white/10 px-2 py-0.5 text-[9px] font-bold tracking-[0.1em] text-slate-100 md:py-1 md:text-[11px] md:tracking-[0.18em]">
                    精選推薦
                  </div>
                  <h2 class="mt-1 font-display text-base font-black tracking-[0.04em] md:mt-3 md:text-3xl md:tracking-[0.08em]">
                    {{ featuredItem.name }}
                  </h2>
                  <p class="hidden mt-1.5 max-w-[38rem] text-xs leading-5 text-slate-200 md:mt-2 md:block md:text-sm md:leading-6">
                    {{ featuredItem.summary }}
                  </p>
                </div>

                <div class="hidden content-between gap-3 border border-white/16 bg-white/10 p-3 backdrop-blur-sm md:grid md:gap-4 md:p-4">
                  <div>
                    <div class="text-[10px] font-bold tracking-[0.14em] text-slate-200 md:text-[11px] md:tracking-[0.18em]">
                      預算餘額
                    </div>
                    <div class="mt-1 text-2xl font-black text-white md:mt-2 md:text-3xl">
                      {{ budgetDisplay }}
                    </div>
                  </div>
                  <div>
                    <div class="text-[10px] font-bold tracking-[0.14em] text-slate-300 md:text-[11px] md:tracking-[0.18em]">
                      目前分類
                    </div>
                    <div class="mt-1 inline-flex border border-white/25 bg-white/10 px-2.5 py-1 text-xs font-bold text-white md:mt-2 md:px-3 md:text-sm">
                      {{ activeCategoryMeta.name }}
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <div
              v-if="filteredItems.length === 0"
              class="empty-state border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center md:px-6 md:py-12"
            >
              <div class="text-lg font-black tracking-[0.06em] text-slate-900 md:text-xl md:tracking-[0.08em]">
                目前沒有可顯示商品
              </div>
              <p class="mt-2 text-xs leading-5 text-slate-500 md:mt-3 md:text-sm md:leading-6">
                更多內容準備中，敬請期待
              </p>
            </div>

            <div v-else class="grid gap-2 md:gap-3 md:grid-cols-2 xl:grid-cols-3">
              <MallProductCard
                v-for="item in filteredItems"
                :key="item.id"
                :item="item"
                :active="selectedItem?.id === item.id && isDetailModalOpen"
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
              aria-label="關閉明細"
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
                    :alt="`${selectedItem.name} 預覽圖`"
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
                  :disabled="selectedItem.actionState !== 'buy'"
                >
                  {{ selectedItem.actionLabel }}
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
import { useRouter } from "vue-router";
import CurrencyBar from "@/components/common/CurrencyBar.vue";
import MallProductCard from "@/components/mall/MallProductCard.vue";
import bgDashboard from "@/assets/images/bg-dashboard.webp";
import {
  mallCategories,
  mallHeaderMetrics,
  mallItems,
} from "@/mocks/mallMockData.js";
import { useAuthStore } from "@/stores/authStore.js";
import { useCurrencyStore } from "@/stores/currencyStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";

const router = useRouter();
const authStore = useAuthStore();
const currencyStore = useCurrencyStore();
const playerStore = usePlayerStore();

const categories = mallCategories;
const mockItems = mallItems;
const headerMetrics = mallHeaderMetrics;

const activeCategory = ref(categories[0].id);
const selectedItem = ref(mockItems[0]);
const isDetailModalOpen = ref(false);
const isMenuOpen = ref(false);
const isImagePreviewOpen = ref(false);

const categoriesWithCount = computed(() =>
  categories.map((category) => ({
    ...category,
    count: mockItems.filter((item) => item.category === category.id).length,
  })),
);

const filteredItems = computed(() =>
  mockItems.filter((item) => item.category === activeCategory.value),
);

const activeCategoryMeta = computed(
  () =>
    categoriesWithCount.value.find(
      (category) => category.id === activeCategory.value,
    ) ?? categoriesWithCount.value[0],
);

const featuredItem = computed(() => filteredItems.value[0] ?? mockItems[0]);
const budgetDisplay = computed(() => "2,400");

function getCurrentPlayerId() {
  return authStore.currentPlayer?.id ?? playerStore.currentPlayerId;
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

    if (!nextItems.some((item) => item.id === selectedItem.value?.id)) {
      selectedItem.value = nextItems[0];
    }
  },
  { immediate: true },
);

watch(
  getCurrentPlayerId,
  (playerId) => {
    if (!playerId) {
      return;
    }

    currencyStore.fetchPlayerCurrency(playerId).catch(() => {});
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
  background-position: center;
  background-size: cover;
}

.mall-shell,
.modal-panel {
  box-shadow:
    0 28px 70px rgba(0, 19, 50, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
}

.mall-topbar {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(240, 245, 250, 0.82)),
    rgba(255, 255, 255, 0.72);
}

.scroll-area {
  scrollbar-width: thin;
  scrollbar-color: rgba(70, 85, 99, 0.7) rgba(214, 220, 228, 0.55);
}

.scroll-area::-webkit-scrollbar {
  width: 11px;
  height: 11px;
}

.scroll-area::-webkit-scrollbar-track {
  background: rgba(214, 220, 228, 0.55);
  border-left: 1px solid rgba(160, 166, 179, 0.22);
}

.scroll-area::-webkit-scrollbar-thumb {
  border: 2px solid rgba(214, 220, 228, 0.75);
  background: linear-gradient(180deg, rgba(70, 85, 99, 0.92), rgba(0, 19, 50, 0.82));
}

.scroll-area::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(0, 70, 244, 0.8), rgba(70, 85, 99, 0.92));
}

.category-card {
  border: 1px solid rgba(160, 166, 179, 0.65);
  background: rgba(255, 255, 255, 0.72);
  padding: 14px;
  color: var(--brand-active);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.category-card:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 70, 244, 0.3);
  background: rgba(255, 255, 255, 0.92);
}

.category-card.active {
  border-color: var(--brand-hover);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(219, 232, 245, 0.92));
  box-shadow: inset 3px 0 0 var(--brand-hover);
  color: var(--brand-navy);
}

.featured-panel {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 18px 34px rgba(0, 19, 50, 0.18);
}

.mobile-menu-button {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 20;
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 8px 20px rgba(0, 19, 50, 0.14);
}

.mobile-menu-button span {
  display: block;
  width: 16px;
  height: 2px;
  background: var(--brand-active);
}

.mobile-menu-layer {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 19, 50, 0.34);
  backdrop-filter: blur(2px);
}

.mobile-menu-panel {
  width: min(78vw, 280px);
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid rgba(255, 255, 255, 0.5);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(235, 241, 247, 0.94)),
    rgba(255, 255, 255, 0.92);
  padding: 14px;
  box-shadow: -18px 0 42px rgba(0, 19, 50, 0.22);
}

.mobile-menu-close {
  flex: 0 0 auto;
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
  border: 1px solid rgba(160, 166, 179, 0.45);
  background: rgba(255, 255, 255, 0.82);
  padding: 14px;
}

.modal-detail-card__purchase {
  display: grid;
  gap: 8px;
}

.modal-preview {
  position: relative;
  display: grid;
  width: 100%;
  min-height: 240px;
  place-items: center;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  padding: 0;
  border: 1px solid rgba(160, 166, 179, 0.45);
  background: linear-gradient(180deg, rgba(203, 213, 225, 0.4), rgba(148, 163, 184, 0.28));
  cursor: zoom-in;
}

.modal-preview__image {
  display: block;
  width: auto;
  height: auto;
  max-width: calc(100% - 12px);
  max-height: calc(100% - 12px);
  object-fit: contain;
  object-position: center;
  position: relative;
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
  background: var(--brand-active);
  color: white;
}

.item-action--buy:hover {
  background: var(--brand-hover);
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
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  padding-bottom: 10px;
  font-size: 13px;
  color: rgb(71, 85, 105);
}

.detail-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.detail-row strong {
  text-align: right;
  font-size: 14px;
  color: rgb(15, 23, 42);
}

.close-button {
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--gray-200);
  background: rgba(255, 255, 255, 0.72);
  color: var(--brand-active);
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
  border-color: var(--brand-hover);
  background: var(--brand-hover);
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

@media (min-width: 1024px) {
  .mobile-menu-button,
  .mobile-menu-layer {
    display: none !important;
  }
}

@media (max-width: 767px) {
  .mall-topbar {
    align-items: start;
  }

  .category-list {
    display: flex;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scroll-snap-type: x proximity;
  }

  .category-card {
    width: min(46vw, 140px);
    flex: 0 0 auto;
    scroll-snap-align: start;
    padding: 8px;
  }

  .category-card:hover {
    transform: none;
  }

  .scroll-area::-webkit-scrollbar {
    width: 8px;
    height: 8px;
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
    min-height: 104px;
    aspect-ratio: auto;
  }

  .modal-preview__image {
    max-width: calc(100% - 8px);
    max-height: calc(100% - 8px);
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
