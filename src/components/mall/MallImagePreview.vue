<template>
  <Transition name="image-preview-fade">
    <div v-if="open" class="image-preview-layer" @click.self="$emit('close')">
      <button
        type="button"
        class="image-preview-close"
        aria-label="關閉商品大圖"
        @click="$emit('close')"
      >
        ×
      </button>
      <img :src="image" :alt="alt" class="image-preview-image" />
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
    default: "",
  },
  alt: {
    type: String,
    default: "",
  },
});

defineEmits(["close"]);
</script>

<style scoped>
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
  display: inline-grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid rgba(148, 163, 184, 0.72);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.92);
  color: var(--brand-active);
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.image-preview-close:hover {
  border-color: var(--brand-hover);
  background: var(--brand-hover);
  color: white;
  transform: translateY(-1px);
}

.image-preview-close:active {
  transform: translateY(1px);
}

.image-preview-close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 5px var(--brand-focus);
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

.image-preview-fade-enter-active,
.image-preview-fade-leave-active {
  transition: opacity 220ms ease;
}

.image-preview-fade-enter-from,
.image-preview-fade-leave-to {
  opacity: 0;
}

@media (max-width: 1279px) {
  .image-preview-close {
    width: 30px;
    height: 30px;
    font-size: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .image-preview-fade-enter-active,
  .image-preview-fade-leave-active {
    transition: none;
  }
}
</style>
