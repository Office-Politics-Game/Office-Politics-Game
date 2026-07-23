<template>
  <Transition name="modal-fade-up">
    <div
      v-if="open && item"
      class="modal-layer absolute inset-0 z-30 flex items-center justify-center bg-[rgba(0,19,50,0.42)] px-2 py-2 backdrop-blur-[2px] md:px-3 md:py-6"
      @click.self="$emit('close')"
    >
      <div
        class="modal-panel flex max-h-[88vh] w-full max-w-[840px] flex-col overflow-hidden border border-white/35 bg-white/92 shadow-2xl"
      >
        <header
          class="flex items-start justify-between gap-2 border-b border-slate-200 px-2.5 py-2 md:gap-4 md:px-6 md:py-4"
        >
          <div>
            <div
              class="text-[9px] font-bold tracking-[0.1em] text-slate-500 md:text-[11px] md:tracking-[0.16em]"
            >
              商品明細
            </div>
            <div
              class="mt-1 flex flex-wrap items-center gap-1.5 md:mt-2 md:gap-2"
            >
              <h3
                class="font-sans text-xl font-bold tracking-[0.03em] text-slate-900 md:text-3xl md:tracking-[0.05em]"
              >
                {{ item.name }}
              </h3>
              <span
                class="border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 md:px-2 md:py-1 md:text-[11px]"
              >
                {{ item.categoryLabel }}
              </span>
            </div>
            <p
              class="hidden mt-1.5 text-xs leading-5 text-slate-600 md:mt-2 md:block md:text-sm md:leading-6"
            >
              {{ item.description }}
            </p>
          </div>

          <button
            type="button"
            class="return-icon-button modal-detail-close"
            aria-label="關閉商品明細"
            @click="$emit('close')"
          >
            <X :size="26" :stroke-width="1.8" />
          </button>
        </header>

        <div
          class="scroll-area min-h-0 overflow-y-auto px-2.5 py-2.5 md:px-6 md:py-5"
        >
          <div class="modal-detail-card">
            <div class="modal-detail-card__media">
              <button
                type="button"
                class="modal-preview"
                aria-label="檢視商品大圖"
                @click="$emit('preview')"
              >
                <img
                  :src="item.previewImage"
                  :alt="item.name + ' preview'"
                  class="modal-preview__image"
                />
                <div class="modal-preview__overlay"></div>
              </button>
            </div>
            <div class="modal-detail-card__info">
              <div class="modal-detail-card__rows">
                <div class="detail-row">
                  <span>分類</span>
                  <strong>{{ item.categoryLabel }}</strong>
                </div>
                <div class="detail-row">
                  <span>價格</span>
                  <strong>{{ item.price }}</strong>
                </div>
                <div class="detail-row">
                  <span>狀態</span>
                  <strong>{{ item.actionLabel }}</strong>
                </div>
              </div>

              <aside class="modal-detail-card__purchase">
                <div
                  class="modal-budget-row border border-slate-300 bg-slate-900 p-2.5 md:p-4"
                >
                  <img
                    :src="item.currency === 'coin' ? officeToken : stockToken"
                    :alt="item.currency === 'coin' ? '金幣' : '股份'"
                    class="modal-budget-row__icon"
                    :class="{
                      'modal-budget-row__icon--stock': item.currency !== 'coin',
                    }"
                  />
                  <div
                    class="modal-budget-row__amount text-lg font-bold text-slate-900 md:text-3xl"
                  >
                    {{ budgetDisplay }}
                  </div>
                </div>

                <button
                  type="button"
                  class="item-action item-action--modal"
                  :class="`item-action--${item.actionState}`"
                  :disabled="item.actionState !== 'buy' || purchasing"
                  @click="$emit('purchase')"
                >
                  {{ purchasing ? "購買中..." : item.actionLabel }}
                </button>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { X } from "@lucide/vue";
import officeToken from "@/assets/images/office-token.webp";
import stockToken from "@/assets/images/stock-token.webp";

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  item: {
    type: Object,
    default: null,
  },
  budgetDisplay: {
    type: [String, Number],
    default: "0",
  },
  purchasing: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["close", "preview", "purchase"]);
</script>

<style scoped>
.scroll-area {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 70, 244, 0.72) rgba(15, 23, 42, 0.7);
}

.scroll-area::-webkit-scrollbar {
  width: 11px;
  height: 11px;
}

.scroll-area::-webkit-scrollbar-track {
  border-left: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.78);
}

.scroll-area::-webkit-scrollbar-thumb {
  border: 2px solid rgba(15, 23, 42, 0.75);
  background: var(--brand-hover);
}

.scroll-area::-webkit-scrollbar-thumb:hover {
  background: var(--brand-primary);
}

.modal-panel {
  border-color: rgba(148, 163, 184, 0.38);
  background: rgba(2, 6, 23, 0.98);
  color: rgba(226, 232, 240, 0.92);
  box-shadow:
    0 28px 70px rgba(0, 0, 0, 0.44),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.modal-panel > header {
  border-color: rgba(148, 163, 184, 0.26);
  background: rgba(2, 6, 23, 0.98);
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
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.return-icon-button:hover {
  background: var(--brand-hover);
  color: white;
  transform: translateY(-1px);
}

.return-icon-button:active {
  background: var(--brand-active);
  color: white;
  transform: translateY(1px);
}

.return-icon-button:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 4px var(--brand-focus);
}

.modal-detail-close {
  flex: 0 0 38px;
}

.modal-detail-card {
  display: grid;
  grid-template-columns: minmax(220px, 1.08fr) minmax(260px, 0.92fr);
  align-items: start;
  gap: 18px;
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
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.36);
  background: rgba(15, 23, 42, 0.82);
}

.modal-detail-card__purchase {
  display: grid;
  gap: 8px;
}

.modal-detail-card__purchase > div {
  border-color: rgba(148, 163, 184, 0.36);
  background: rgba(15, 23, 42, 0.94);
}

.modal-budget-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal-budget-row__icon {
  display: block;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  object-fit: contain;
  object-position: center;
}

.modal-budget-row__icon--stock {
  transform: scale(1.25);
  transform-origin: center;
}

.modal-budget-row__amount {
  color: rgb(134, 179, 224);
  line-height: 1;
  text-align: right;
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
  background: rgba(2, 6, 23, 0.9);
  cursor: zoom-in;
}

.modal-preview__image {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 8px;
  object-fit: contain;
  object-position: center;
  box-shadow: 0 16px 34px rgba(0, 19, 50, 0.16);
}

.modal-preview__overlay {
  position: absolute;
  inset: 0;
  display: block;
  background: rgba(0, 19, 50, 0.28);
  pointer-events: none;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  color: rgba(203, 213, 225, 0.82);
  font-size: 13px;
}

.detail-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.detail-row strong {
  color: white;
  font-size: 14px;
  text-align: right;
}

.item-action {
  padding: 10px 16px;
  border: 1px solid transparent;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.item-action--modal {
  width: 100%;
}

.item-action--buy {
  border-color: rgba(0, 70, 244, 0.75);
  background: var(--brand-hover);
  color: white;
  cursor: pointer;
}

.item-action--buy:hover {
  background: var(--brand-primary);
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
  opacity: 0;
  transform: translateY(18px);
}

.modal-fade-up-enter-active .modal-panel,
.modal-fade-up-leave-active .modal-panel {
  transition:
    transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 220ms ease;
}

@media (max-width: 767px) {
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

  .item-action {
    min-width: 82px;
    align-self: stretch;
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
