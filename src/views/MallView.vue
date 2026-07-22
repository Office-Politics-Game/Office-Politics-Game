<template>
  <main
    class="mall-view relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-[#1e1e1e] px-1 py-1 md:px-5 md:py-4"
    :style="{ backgroundImage: `url(${bgDashboard})` }"
    @click.capture="handleButtonClick"
  >
    <div class="absolute inset-0 bg-[rgba(0,19,50,0.36)]"></div>
    <section
      class="mall-shell relative z-10 flex h-[98svh] w-[98vw] max-w-[1360px] flex-col overflow-hidden border border-white/25 bg-white/82 shadow-2xl backdrop-blur-md md:h-[92vh] md:w-[95vw]"
    >
      <header class="mobile-storebar xl:hidden">
        <div class="min-w-0">
          <p
            class="m-0 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500"
          >
            OFFICE POLITICS
          </p>
          <div class="mt-0.5 flex items-center">
            <h1
              class="font-sans text-2xl font-bold tracking-[0.05em] text-slate-900"
            >
              商城
            </h1>
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
            class="return-icon-button tablet-storebar-return"
            aria-label="返回大廳"
            @click="goLobby"
          >
            <X :size="26" :stroke-width="1.8" />
          </button>
        </div>
      </header>

      <Transition name="drawer-fade">
        <div
          v-if="false && isMenuOpen"
          class="mobile-menu-layer xl:hidden"
          @click.self="isMenuOpen = false"
        >
          <aside class="mobile-menu-panel" aria-label="商城選單">
            <div
              class="flex items-start justify-between gap-3 border-b border-slate-300/80 pb-3"
            >
              <div>
                <p
                  class="m-0 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500"
                >
                  OFFICE POLITICS
                </p>
                <h2
                  class="mt-1 font-sans text-xl font-bold tracking-[0.06em] text-slate-900"
                >
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

            <div class="mt-3 border border-slate-300 bg-slate-100 p-3">
              <div
                class="text-[10px] font-bold tracking-[0.12em] text-slate-500"
              >
                目前分類
              </div>
              <div class="mt-1 text-base font-bold text-slate-900">
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

      <header
        class="mall-topbar hidden grid-cols-[minmax(0,1fr)_auto] gap-1.5 border-b border-slate-300/80 px-2 py-2 xl:grid xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)_auto] xl:gap-4 xl:px-6 xl:py-4"
      >
        <div class="order-1 min-w-0 md:order-none">
          <p
            class="hidden text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500 xl:block xl:text-xs"
          >
            OFFICE POLITICS
          </p>
          <h1
            class="font-sans text-xl font-bold tracking-[0.06em] text-slate-900 xl:mt-1 xl:text-5xl xl:tracking-[0.08em]"
          >
            商城
          </h1>
          <p
            class="hidden mt-1 text-xs font-semibold tracking-[0.04em] text-slate-600 xl:mt-2 xl:block xl:text-base xl:tracking-[0.06em]"
          >
            選擇你的辦公室風格與專屬造型。
          </p>
        </div>

        <div
          class="mall-topbar-tools order-3 col-span-2 grid grid-cols-3 gap-1 self-center xl:order-none xl:col-span-1 xl:gap-2 xl:self-center"
        >
          <CurrencyBar
            class="mall-topbar-currency col-span-3 justify-self-end"
            :items="['coins', 'gems', 'tickets']"
            tooltip-size="small"
          />
        </div>

        <button
          type="button"
          class="return-icon-button order-2 xl:order-none"
          aria-label="返回大廳"
          @click="goLobby"
        >
          <X :size="26" :stroke-width="1.8" />
        </button>
      </header>

      <div
        class="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)]"
      >
        <MallCategorySidebar
          v-model="activeCategory"
          :categories="categoriesWithCount"
        />

        <MallProductGrid
          :items="filteredItems"
          :loading="isShopLoading"
          :status-message="statusMessage"
          :status-type="statusType"
          :selected-item-id="selectedItem?.id"
          :detail-open="isDetailModalOpen"
          :featured-image="featuredBannerImage"
          :featured-title="featuredBannerTitle"
          :featured-alt="`${activeCategoryMeta.name}精選推薦`"
          @purchase="purchaseItem"
          @select="openItemDetail"
        />
      </div>
    </section>

    <MallProductDetailModal
      :open="isDetailModalOpen"
      :item="selectedItem"
      :budget-display="budgetDisplay"
      :purchasing="isPurchasing"
      @close="closeItemDetail"
      @preview="openImagePreview"
      @purchase="purchaseSelectedItem"
    />
    <MallImagePreview
      :open="isImagePreviewOpen && Boolean(selectedItem)"
      :image="selectedItem?.previewImage"
      :alt="selectedItem ? `${selectedItem.name} large preview` : ''"
      @close="closeImagePreview"
    />
  </main>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { X } from "lucide-vue-next";
import CurrencyBar from "@/components/common/CurrencyBar.vue";
import MallCategorySidebar from "@/components/mall/MallCategorySidebar.vue";
import MallImagePreview from "@/components/mall/MallImagePreview.vue";
import MallProductDetailModal from "@/components/mall/MallProductDetailModal.vue";
import MallProductGrid from "@/components/mall/MallProductGrid.vue";
import { useButtonClickAudio } from "@/composables/UseButtonClickAudio";
import { useMallShop } from "@/composables/useMallShop.js";
import { usePreGameAudio } from "@/composables/UsePreGameAudio";
import bgDashboard from "@/assets/images/bg-dashboard.webp";

const router = useRouter();
const { handleButtonClick } = useButtonClickAudio();
const { playPreGameSound } = usePreGameAudio();
const MALL_ENTRANCE_BELL_DELAY_MS = 200;
let mallEntranceBellTimerId = null;

const {
  activeCategory,
  activeCategoryMeta,
  budgetDisplay,
  categoriesWithCount,
  closeImagePreview,
  closeItemDetail,
  featuredBannerImage,
  featuredBannerTitle,
  filteredItems,
  isDetailModalOpen,
  isImagePreviewOpen,
  isPurchasing,
  isShopLoading,
  openImagePreview,
  openItemDetail,
  purchaseItem,
  purchaseSelectedItem,
  selectedItem,
  statusMessage,
  statusType,
} = useMallShop();

const isMenuOpen = ref(false);

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

onMounted(() => {
  window.addEventListener("keydown", handleEscape);
  mallEntranceBellTimerId = window.setTimeout(() => {
    mallEntranceBellTimerId = null;
    playPreGameSound("mall-entrance-bell");
  }, MALL_ENTRANCE_BELL_DELAY_MS);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleEscape);

  if (mallEntranceBellTimerId !== null) {
    window.clearTimeout(mallEntranceBellTimerId);
    mallEntranceBellTimerId = null;
  }
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
  background: rgba(0, 19, 50, 0.18);
  pointer-events: none;
}

.mall-shell {
  box-shadow:
    0 28px 70px rgba(0, 0, 0, 0.44),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.mall-shell {
  border-color: rgba(148, 163, 184, 0.38);
  background: rgba(3, 7, 18, 0.94);
}

.mall-topbar {
  position: relative;
  overflow: hidden;
  border-color: rgba(148, 163, 184, 0.32);
  background: rgba(2, 6, 23, 0.98);
}

.mall-topbar::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  content: "";
  background: var(--brand-hover);
}

.mall-topbar h1,
.mall-topbar p {
  color: white;
}

.mall-topbar h1 + p {
  display: none !important;
}

.mall-topbar > div:nth-child(2) > div {
  border-color: rgba(148, 163, 184, 0.36);
  background: rgba(15, 23, 42, 0.9);
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
  background: var(--brand-hover);
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
  background: var(--brand-hover);
}

.scroll-area::-webkit-scrollbar-thumb:hover {
  background: var(--brand-primary);
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
  background: rgba(2, 6, 23, 0.98);
  padding: 8px 10px 8px 12px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.22);
}

.mobile-storebar p,
.mobile-storebar h1 {
  color: white;
}

.mobile-storebar__category-badge {
  border-color: rgba(0, 70, 244, 0.52);
  background: rgba(0, 70, 244, 0.16);
  color: rgb(134, 179, 224);
}

.tablet-storebar-actions {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-self: end;
  gap: 8px;
}

.return-icon-button {
  display: inline-grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: white;
  font-size: 0;
  font-weight: 900;
  line-height: 1;
  box-shadow: none;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
  cursor: pointer;
}

.return-icon-button:hover {
  transform: translateY(-1px);
  background: var(--brand-hover);
  color: white;
}

.return-icon-button:active {
  transform: translateY(1px);
  background: var(--brand-active);
  color: white;
}

.return-icon-button:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 4px var(--brand-focus);
}

.mall-topbar > .return-icon-button {
  align-self: center;
  justify-self: end;
  width: 34px;
  height: 34px;
  flex-basis: 34px;
}

.mall-topbar-tools {
  align-items: center;
  justify-items: end;
  line-height: 1;
}

.tablet-storebar-currency {
  width: min(52vw, 260px);
}

.tablet-storebar-currency:deep(section) {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
  gap: 5px;
}

.tablet-storebar-currency:deep(section > div) {
  width: 100% !important;
  min-width: 0 !important;
  height: 24px !important;
  padding: 0 4px !important;
}

.tablet-storebar-currency:deep(section > div > div) {
  min-width: 0;
  justify-content: center;
  gap: 3px !important;
}

.tablet-storebar-currency:deep(section > div > div > span:first-child) {
  width: 14px !important;
  height: 14px !important;
  flex: 0 0 14px !important;
}

.tablet-storebar-currency:deep(section > div > div > span:last-child) {
  min-width: 0 !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 9px !important;
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

.mobile-menu-button,
.mobile-menu-layer {
  display: none !important;
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
  background: rgba(2, 6, 23, 0.98);
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
  cursor: pointer;
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

  .scroll-area::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .close-button {
    width: 30px;
    height: 30px;
    font-size: 20px;
  }
}
</style>
