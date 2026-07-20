<template>
  <button
    type="button"
    class="item-card text-left"
    :class="{ active }"
    @click="$emit('select', item)"
  >
    <div class="item-card__preview">
      <img
        :src="item.previewImage"
        :alt="`${item.name} 預覽圖`"
        class="item-card__preview-image"
        :class="item.previewImageClass"
      />
      <div class="item-card__preview-overlay"></div>
    </div>

    <div class="item-card__content mt-4">
      <div class="item-card__title text-lg font-bold tracking-[0.05em] text-slate-900">
        {{ item.name }}
      </div>
    </div>

    <div class="item-card__footer mt-4 flex items-center justify-between gap-3">
      <div>
        <div class="item-card__price-label text-[11px] font-bold tracking-[0.16em] text-slate-500">
          價格
        </div>
        <div class="item-card__price-row">
          <img
            v-if="['coin', 'ticket'].includes(item.currency)"
            :src="item.currency === 'ticket' ? stockTokenImage : officeTokenImage"
            :alt="item.currency === 'ticket' ? '抽卡券' : '金幣'"
            class="item-card__price-icon"
            :class="{ 'item-card__price-icon--stock': item.currency === 'ticket' }"
          />
          <div class="item-card__price text-2xl font-bold text-slate-900">
            {{ item.price }}
          </div>
        </div>
      </div>

      <button
        type="button"
        class="item-action"
        :class="`item-action--${item.actionState}`"
        :disabled="item.actionState !== 'buy'"
        @click.stop="$emit('purchase', item)"
      >
        {{ item.actionLabel }}
      </button>
    </div>
  </button>
</template>

<script setup>
import officeTokenImage from "@/assets/images/office-token.webp";
import stockTokenImage from "@/assets/images/stock-token.webp";

defineProps({
  item: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["purchase", "select"]);
</script>

<style scoped>
.item-card {
  display: grid;
  align-content: start;
  overflow: hidden;
  border: 1px solid rgba(12, 24, 38, 0.86);
  background: #000000;
  color: white;
  font-weight: 700;
  padding: 0;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 10px 24px rgba(0, 19, 50, 0.2);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
  cursor: pointer;
}

.item-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 70, 244, 0.72);
  box-shadow:
    inset 0 0 0 1px rgba(0, 70, 244, 0.18),
    0 16px 28px rgba(0, 0, 0, 0.26);
}

.item-card.active {
  border-color: rgba(0, 70, 244, 0.9);
  box-shadow:
    inset 0 0 0 1px rgba(0, 70, 244, 0.32),
    0 0 0 3px rgba(0, 70, 244, 0.16),
    0 18px 30px rgba(0, 0, 0, 0.28);
}

.item-card__preview {
  order: 2;
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.96);
}

.item-card__preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 8px;
}

.item-card__preview-image--stock-single {
  padding: 12px;
  transform: scale(1.08);
}

.item-card__preview-image--stock-stack {
  padding: 10px;
  transform: translateX(2px) scale(1.16);
}

.item-card__preview-image--stock-bundle {
  padding: 8px;
  transform: translate(10px, 8px) scale(1.18);
}

.item-card__preview-image--ticket {
  padding: 12px;
  transform: none;
}

.item-card__preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 19, 50, 0.28);
}

.item-card__content {
  order: 1;
  margin-top: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.9);
  padding: 8px 10px;
  text-align: left;
}

.item-card__title {
  display: -webkit-box;
  overflow: hidden;
  min-height: 38px;
  color: white;
  font-size: 15px;
  line-height: 1.25;
  letter-spacing: 0.04em;
  font-weight: 700;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.item-card__footer {
  order: 3;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 8px;
  margin-top: 0;
  padding: 10px;
  text-align: left;
}

.item-card__price-label {
  color: rgba(203, 213, 225, 0.78);
  font-size: 10px;
  letter-spacing: 0.1em;
  font-weight: 700;
}

.item-card__price {
  color: rgb(134, 179, 224);
  font-size: 22px;
  font-weight: 700;
  text-shadow: 0 0 12px rgba(0, 70, 244, 0.45);
}

.item-card__price-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
}

.item-card__price-icon {
  display: block;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  object-fit: contain;
  object-position: center;
}

.item-card__price-icon--stock {
  width: 30px;
  height: 30px;
  flex-basis: 30px;
  margin-block: -4px;
  transform: scale(1.25);
  transform-origin: center;
}

.item-action {
  width: auto;
  min-width: 82px;
  min-height: 34px;
  border: 1px solid rgba(0, 70, 244, 0.75);
  background: var(--brand-hover);
  padding: 7px 8px;
  color: white;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.06em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

@media (min-width: 1280px) {
  .item-card__preview {
    height: 132px;
    aspect-ratio: auto;
  }

  .item-card__title {
    font-size: 16px;
  }

  .item-card__price {
    font-size: 22px;
  }
}

.item-action--buy {
  background: var(--brand-hover);
  color: white;
  cursor: pointer;
}

.item-action:disabled {
  cursor: not-allowed;
}

.item-action--buy:hover {
  background: var(--brand-primary);
}

.item-action--owned {
  border-color: rgba(148, 163, 184, 0.72);
  background: var(--gray-200);
  color: rgb(30, 41, 59);
}

.item-action--coming {
  border-color: rgba(245, 158, 11, 0.75);
  background: var(--brand-active);
  color: rgb(67, 20, 7);
}

@media (max-width: 1279px) {
  .item-card {
    min-height: 292px;
  }

  .item-card:hover {
    transform: none;
  }

  .item-card__preview {
    width: 100%;
    height: 132px;
    aspect-ratio: auto;
  }

  .item-card__preview-image {
    object-fit: contain;
    padding: 8px;
  }

}

@media (min-width: 768px) and (max-width: 1279px) and (orientation: landscape) {
  .item-card {
    min-height: 316px;
  }

  .item-card__preview {
    height: 150px;
  }

  .item-card__footer {
    padding: 12px;
  }

  .item-card__title {
    font-size: 17px;
  }

  .item-card__price {
    font-size: 20px;
  }

  .item-action {
    min-height: 34px;
    font-size: 11px;
  }
}

@media (max-width: 767px) {
  .item-card {
    min-height: 268px;
  }

  .item-card__preview {
    height: 116px;
  }

  .item-card__title {
    min-height: 34px;
    font-size: 13px;
  }

  .item-card__price {
    font-size: 19px;
  }

  .item-action {
    min-width: 68px;
    min-height: 32px;
    padding: 6px 7px;
    font-size: 10px;
  }
}
</style>
