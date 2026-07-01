<template>
  <main
    class="mall-view relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-[#1e1e1e] px-3 py-4 md:px-5"
    :style="{ backgroundImage: `url(${bgDashboard})` }"
  >
    <div class="absolute inset-0 bg-[rgba(0,19,50,0.36)]"></div>

    <section class="mall-shell relative z-10 flex h-[92vh] w-[95vw] max-w-[1360px] flex-col overflow-hidden border border-white/25 bg-white/82 shadow-2xl backdrop-blur-md">
      <header class="mall-topbar grid grid-cols-[1fr_auto] gap-4 border-b border-slate-300/80 px-4 py-4 md:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)_auto] md:px-6">
        <div class="min-w-0">
          <p class="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500 md:text-xs">
            OFFICE POLITICS
          </p>
          <h1 class="mt-1 font-display text-3xl font-black tracking-[0.08em] text-slate-900 md:text-5xl">
            商城
          </h1>
          <p class="mt-2 text-sm font-semibold tracking-[0.06em] text-slate-600 md:text-base">
            選擇你的辦公室風格
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
          <div
            v-for="metric in headerMetrics"
            :key="metric.label"
            class="border border-slate-300/70 bg-white/70 px-3 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
          >
            <div class="text-[11px] font-bold tracking-[0.14em] text-slate-500">
              {{ metric.label }}
            </div>
            <div class="mt-1 text-lg font-black text-slate-900 md:text-xl">
              {{ metric.value }}
            </div>
          </div>
        </div>

        <button
          type="button"
          class="btn-dark h-11 whitespace-nowrap px-4 py-2 text-sm font-bold"
          @click="router.push('/lobby')"
        >
          返回大廳
        </button>
      </header>

      <div class="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside class="scroll-area min-h-0 overflow-y-auto border-b border-slate-300/80 bg-[linear-gradient(180deg,rgba(238,244,251,0.96),rgba(221,230,241,0.9))] lg:border-b-0 lg:border-r">
          <div class="border-b border-slate-300/80 px-4 py-4 md:px-5">
            <div class="text-xs font-bold tracking-[0.2em] text-slate-500">
              分類導覽
            </div>
            <div class="mt-2 text-lg font-black text-slate-900">
              商品分類
            </div>
          </div>

          <nav class="grid gap-2 p-3 md:p-4">
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
                  <div class="text-sm font-black tracking-[0.08em]">
                    {{ category.name }}
                  </div>
                  <div class="mt-1 text-xs leading-5 text-slate-500">
                    {{ category.description }}
                  </div>
                </div>
                <span class="mt-0.5 border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600">
                  {{ category.count }}
                </span>
              </div>
            </button>
          </nav>
        </aside>

        <section class="scroll-area min-h-0 overflow-y-auto bg-[linear-gradient(180deg,rgba(247,250,253,0.92),rgba(235,241,247,0.9))]">
          <div class="grid gap-4 p-4 md:p-5">
            <article class="featured-panel overflow-hidden border border-slate-300/80 bg-[linear-gradient(130deg,rgba(6,29,55,0.96),rgba(69,87,104,0.92))] text-white">
              <div class="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_220px] md:p-6">
                <div>
                  <div class="inline-flex border border-white/25 bg-white/10 px-2 py-1 text-[11px] font-bold tracking-[0.18em] text-slate-100">
                    精選推薦
                  </div>
                  <h2 class="mt-3 font-display text-2xl font-black tracking-[0.08em] md:text-3xl">
                    {{ featuredItem.name }}
                  </h2>
                  <p class="mt-2 max-w-[38rem] text-sm leading-6 text-slate-200">
                    {{ featuredItem.summary }}
                  </p>
                </div>

                <div class="grid content-between gap-4 border border-white/16 bg-white/10 p-4 backdrop-blur-sm">
                  <div>
                    <div class="text-[11px] font-bold tracking-[0.18em] text-slate-200">
                      預算餘額
                    </div>
                    <div class="mt-2 text-3xl font-black text-white">
                      {{ budgetDisplay }}
                    </div>
                  </div>
                  <div>
                    <div class="text-[11px] font-bold tracking-[0.18em] text-slate-300">
                      目前分類
                    </div>
                    <div class="mt-2 inline-flex border border-white/25 bg-white/10 px-3 py-1 text-sm font-bold text-white">
                      {{ activeCategoryMeta.name }}
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <div
              v-if="filteredItems.length === 0"
              class="empty-state border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center"
            >
              <div class="text-xl font-black tracking-[0.08em] text-slate-900">
                目前沒有可顯示商品
              </div>
              <p class="mt-3 text-sm leading-6 text-slate-500">
                更多內容準備中，敬請期待
              </p>
            </div>

            <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
        class="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(0,19,50,0.42)] px-3 py-6 backdrop-blur-[2px]"
        @click.self="closeItemDetail"
      >
        <div class="modal-panel flex max-h-[88vh] w-full max-w-[840px] flex-col overflow-hidden border border-white/35 bg-white/92 shadow-2xl">
          <header class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-6">
            <div>
              <div class="text-[11px] font-bold tracking-[0.16em] text-slate-500">
                商品明細
              </div>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <h3 class="font-display text-3xl font-black tracking-[0.05em] text-slate-900">
                  {{ selectedItem.name }}
                </h3>
                <span class="border border-slate-300 bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
                  {{ selectedItem.categoryLabel }}
                </span>
              </div>
              <p class="mt-2 text-sm leading-6 text-slate-600">
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

          <div class="scroll-area min-h-0 overflow-y-auto px-5 py-5 md:px-6">
            <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
              <div class="grid gap-4">
                <div class="modal-preview">
                  <img
                    :src="selectedItem.previewImage"
                    :alt="`${selectedItem.name} 預覽圖`"
                    class="modal-preview__image"
                  />
                  <div class="modal-preview__overlay"></div>
                </div>

                <div class="grid gap-3 border border-slate-300 bg-white p-4">
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
              </div>

              <aside class="grid content-start gap-4">
                <div class="border border-slate-300 bg-[linear-gradient(180deg,#f9fbfd,#eef4f9)] p-4">
                  <div class="text-[11px] font-bold tracking-[0.16em] text-slate-500">
                    可用代幣
                  </div>
                  <div class="mt-1 text-3xl font-black text-slate-900">
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
    </Transition>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import MallProductCard from "@/components/mall/MallProductCard.vue";
import bgDashboard from "@/assets/images/bg-dashboard.webp";
import {
  mallCategories,
  mallHeaderMetrics,
  mallItems,
} from "@/mocks/mallMockData.js";

const router = useRouter();

const categories = mallCategories;
const mockItems = mallItems;
const headerMetrics = mallHeaderMetrics;

const activeCategory = ref(categories[0].id);
const selectedItem = ref(mockItems[0]);
const isDetailModalOpen = ref(false);

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

function openItemDetail(item) {
  selectedItem.value = item;
  isDetailModalOpen.value = true;
}

function closeItemDetail() {
  isDetailModalOpen.value = false;
}

function handleEscape(event) {
  if (event.key === "Escape" && isDetailModalOpen.value) {
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

.modal-preview {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border: 1px solid rgba(160, 166, 179, 0.45);
  background: linear-gradient(180deg, rgba(203, 213, 225, 0.4), rgba(148, 163, 184, 0.28));
}

.modal-preview__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.modal-preview__overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(0, 19, 50, 0.08), rgba(0, 19, 50, 0.48)),
    linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 48%);
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

@media (prefers-reduced-motion: reduce) {
  .modal-fade-up-enter-active,
  .modal-fade-up-leave-active,
  .modal-fade-up-enter-active .modal-panel,
  .modal-fade-up-leave-active .modal-panel {
    transition: none;
  }
}
</style>
