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
      />
      <div class="item-card__preview-overlay"></div>
    </div>

    <div class="mt-4">
      <div class="text-lg font-black tracking-[0.05em] text-slate-900">
        {{ item.name }}
      </div>
    </div>

    <div class="mt-4 flex items-center justify-between gap-3">
      <div>
        <div class="text-[11px] font-bold tracking-[0.16em] text-slate-500">
          價格
        </div>
        <div class="mt-1 text-2xl font-black text-slate-900">
          {{ item.price }}
        </div>
      </div>

      <button
        type="button"
        class="item-action"
        :class="`item-action--${item.actionState}`"
        :disabled="item.actionState !== 'buy'"
        @click.stop="$emit('select', item)"
      >
        {{ item.actionLabel }}
      </button>
    </div>
  </button>
</template>

<script setup>
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

defineEmits(["select"]);
</script>

<style scoped>
.item-card {
  border: 1px solid rgba(160, 166, 179, 0.56);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 247, 251, 0.9));
  padding: 18px;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.item-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 70, 244, 0.28);
  box-shadow: 0 16px 28px rgba(0, 19, 50, 0.08);
}

.item-card.active {
  border-color: rgba(0, 70, 244, 0.4);
  box-shadow:
    inset 0 0 0 1px rgba(0, 70, 244, 0.08),
    0 18px 30px rgba(0, 19, 50, 0.1);
}

.item-card__preview {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border: 1px solid rgba(160, 166, 179, 0.45);
  background: linear-gradient(180deg, rgba(203, 213, 225, 0.4), rgba(148, 163, 184, 0.28));
}

.item-card__preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.item-card__preview-overlay {
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
</style>
