<template>
  <aside
    class="category-sidebar scroll-area min-h-0 overflow-y-auto border-b border-slate-300/80 bg-slate-950/95 xl:border-b-0 xl:border-r"
  >
    <div class="category-sidebar__header">
      <div class="text-base font-bold xl:text-lg">商品分類</div>
    </div>

    <nav class="category-list grid gap-1.5 p-1.5 xl:gap-2 xl:p-4">
      <button
        v-for="category in categories"
        :key="category.id"
        type="button"
        class="category-card text-left"
        :class="{ active: modelValue === category.id }"
        :style="category.style"
        @click="$emit('update:modelValue', category.id)"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <div
              class="text-xs font-bold tracking-[0.06em] xl:text-sm xl:tracking-[0.08em]"
            >
              {{ category.name }}
            </div>
            <div
              class="category-description mt-1 text-[11px] leading-4 text-slate-500 xl:text-xs xl:leading-5"
            >
              {{ category.description }}
            </div>
          </div>
          <span
            class="mt-0.5 border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600 xl:px-2 xl:text-[11px]"
          >
            {{ category.count }}
          </span>
        </div>
      </button>
    </nav>
  </aside>
</template>

<script setup>
defineProps({
  categories: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
});

defineEmits(["update:modelValue"]);
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

.category-sidebar {
  border-color: rgba(148, 163, 184, 0.24);
  background: rgba(2, 6, 23, 0.95);
}

.category-sidebar__header {
  display: none;
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(0, 0, 0, 0.18);
  padding: 12px;
  color: rgba(226, 232, 240, 0.92);
}

.category-card {
  position: relative;
  min-height: 52px;
  padding: 12px 14px 12px 16px;
  border: 1px solid rgba(0, 70, 244, 0.56);
  border-radius: var(--radius-md);
  background: rgba(12, 32, 48, 0.94);
  color: rgba(226, 232, 240, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 10px 24px rgba(0, 19, 50, 0.12);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.category-card::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: rgba(0, 70, 244, 0.95);
  content: "";
}

@media (hover: hover) and (pointer: fine) {
  .category-card:hover {
    border-color: rgba(0, 70, 244, 0.85);
    background: var(--brand-hover);
    color: white;
    transform: translateY(-1px);
  }
}

.category-card.active {
  border-color: rgba(0, 70, 244, 0.95);
  background: rgba(0, 70, 244, 0.92);
  color: white;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.34),
    inset 4px 0 0 var(--brand-primary),
    0 0 0 3px rgba(0, 70, 244, 0.1);
  transform: translateY(1px);
}

.category-card:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 5px var(--brand-focus),
    inset 0 1px 0 rgba(255, 255, 255, 0.34);
}

.category-card span {
  border-color: rgba(0, 70, 244, 0.32);
  border-radius: var(--radius-md);
  background: rgba(2, 6, 23, 0.42);
  color: currentColor;
}

.category-description {
  display: none !important;
}

@media (min-width: 1280px) {
  .category-sidebar__header {
    display: block;
    padding: 16px 20px;
  }

}

@media (max-width: 1279px) {
  .category-list {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scroll-snap-type: x proximity;
    padding: 8px;
  }

  .category-card {
    width: clamp(104px, 22vw, 152px);
    min-height: 44px;
    flex: 0 0 auto;
    scroll-snap-align: start;
    padding: 8px 10px 8px 12px;
  }
}

@media (min-width: 768px) and (max-width: 1279px) and (orientation: landscape) {
  .category-sidebar {
    border-right: 1px solid rgba(160, 166, 179, 0.8);
    border-bottom: 0;
  }

  .category-list {
    display: grid;
    gap: 8px;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 10px;
    scroll-snap-type: none;
  }

  .category-card {
    width: auto;
    min-height: 48px;
    padding: 10px 12px 10px 14px;
  }
}

@media (max-width: 767px) {
  .category-card {
    width: min(40vw, 124px);
    min-height: 42px;
    padding: 8px 9px 8px 11px;
  }

  .scroll-area::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
}
</style>
