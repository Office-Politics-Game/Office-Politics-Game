<template>
  <section class="product-section scroll-area min-h-0 overflow-y-auto bg-slate-950/90">
    <div class="product-area grid gap-2 p-2 xl:gap-2.5 xl:p-3">
      <MallFeaturedBanner
        v-if="featuredImage"
        :image="featuredImage"
        :title="featuredTitle"
        :alt="featuredAlt"
      />

      <div
        v-if="statusMessage"
        class="status-state border border-slate-600/70 bg-slate-950/80 px-4 py-3 text-sm font-bold text-slate-100"
        role="status"
      >
        {{ statusMessage }}
      </div>

      <div
        v-if="loading"
        class="empty-state border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center md:px-6 md:py-12"
      >
        <div
          class="text-lg font-bold tracking-[0.06em] text-slate-900 md:text-xl md:tracking-[0.08em]"
        >
          商城資料載入中
        </div>
        <p
          class="mt-2 text-xs leading-5 text-slate-500 md:mt-3 md:text-sm md:leading-6"
        >
          正在整理最新商品與持有狀態，請稍候。
        </p>
      </div>

      <div
        v-else-if="items.length === 0"
        class="empty-state border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center md:px-6 md:py-12"
      >
        <div
          class="text-lg font-bold tracking-[0.06em] text-slate-900 md:text-xl md:tracking-[0.08em]"
        >
          這個分類目前沒有商品
        </div>
        <p
          class="mt-2 text-xs leading-5 text-slate-500 md:mt-3 md:text-sm md:leading-6"
        >
          可以切換其他分類，看看更多可用造型與道具。
        </p>
      </div>

      <div
        v-else
        class="product-list grid gap-2 md:grid-cols-2 md:gap-3 xl:grid-cols-4"
      >
        <MallProductCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          :active="selectedItemId === item.id && detailOpen"
          :purchasing="purchasing"
          :purchase-disabled="purchasing"
          @purchase="$emit('purchase', $event)"
          @select="$emit('select', $event)"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import MallFeaturedBanner from "@/components/mall/MallFeaturedBanner.vue";
import MallProductCard from "@/components/mall/MallProductCard.vue";

defineProps({
  items: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  purchasing: {
    type: Boolean,
    default: false,
  },
  statusMessage: {
    type: String,
    default: "",
  },
  selectedItemId: {
    type: [String, Number],
    default: null,
  },
  detailOpen: {
    type: Boolean,
    default: false,
  },
  featuredImage: {
    type: String,
    default: "",
  },
  featuredTitle: {
    type: String,
    default: "",
  },
  featuredAlt: {
    type: String,
    default: "",
  },
});

defineEmits(["purchase", "select"]);
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

.product-section {
  background: rgba(3, 7, 18, 0.94);
}

.empty-state {
  border-color: rgba(148, 163, 184, 0.36);
  background: rgba(15, 23, 42, 0.82);
  color: rgba(226, 232, 240, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

@media (max-width: 1279px) {
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
}
</style>
