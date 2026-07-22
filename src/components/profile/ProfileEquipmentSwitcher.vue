<template>
  <section class="equipment-switcher flex flex-col">
    <header class="equipment-switcher__header">
      <div>
        <p class="equipment-switcher__eyebrow">STYLE STUDIO</p>
        <h2 class="equipment-switcher__title">個人風格切換</h2>
      </div>
      <p class="equipment-switcher__hint">
        從已擁有的造型中挑選你想展示的配件，預覽後直接套用到目前角色。
      </p>
    </header>

    <div class="equipment-switcher__tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        type="button"
        class="equipment-switcher__tab"
        :class="{ 'is-active': category.id === activeCategory }"
        @click="$emit('update:activeCategory', category.id)"
      >
        <span>{{ category.label }}</span>
        <span class="equipment-switcher__tab-count">{{ category.count }}</span>
      </button>
    </div>

    <div v-if="errorMessage" class="equipment-switcher__status is-error" role="alert">
      {{ errorMessage }}
    </div>

    <div v-else-if="isLoading" class="equipment-switcher__status">
      正在讀取風格資料...
    </div>

    <div v-else class="equipment-switcher__content">
      <div class="equipment-switcher__preview">
        <div class="equipment-switcher__preview-image">
          <img
            v-if="selectedItem?.previewImage"
            :src="selectedItem.previewImage"
            :alt="selectedItem.name"
          />
          <div v-else class="equipment-switcher__preview-empty">No Preview</div>
        </div>

        <div class="equipment-switcher__preview-copy">
          <div class="equipment-switcher__preview-badges">
            <span class="equipment-switcher__badge">{{ activeCategoryMeta?.label }}</span>
            <span
              v-if="selectedItem?.isEquipped"
              class="equipment-switcher__badge equipment-switcher__badge--equipped"
            >
              使用中
            </span>
          </div>

          <h3 class="equipment-switcher__preview-title">
            {{ selectedItem?.name || "請先選擇一個風格項目" }}
          </h3>

          <p class="equipment-switcher__preview-description">
            {{ selectedItem?.description || activeCategoryMeta?.emptyText }}
          </p>

          <button
            type="button"
            class="equipment-switcher__equip-button"
            :disabled="
              !selectedItem ||
              selectedItem.isEquipped ||
              equippingItemId === (selectedItem?.selectionId ?? selectedItem?.shopItemId)
            "
            @click="$emit('equip', selectedItem)"
          >
            {{
              equippingItemId === (selectedItem?.selectionId ?? selectedItem?.shopItemId)
                ? "套用中..."
                : selectedItem?.isEquipped
                  ? "目前使用中"
                  : "套用這個風格"
            }}
          </button>
        </div>
      </div>

      <div v-if="activeItems.length" class="equipment-switcher__grid">
        <button
          v-for="item in activeItems"
          :key="item.selectionId ?? item.shopItemId"
          type="button"
          class="equipment-switcher__card"
          :class="{
            'is-selected':
              (item.selectionId ?? item.shopItemId) ===
              (selectedItem?.selectionId ?? selectedItem?.shopItemId),
            'is-equipped': item.isEquipped,
          }"
          @click="$emit('select', item)"
        >
          <div class="equipment-switcher__card-image">
            <img v-if="item.previewImage" :src="item.previewImage" :alt="item.name" />
            <div v-else class="equipment-switcher__card-image-empty">No Image</div>
          </div>

          <div class="equipment-switcher__card-body">
            <div class="equipment-switcher__card-title">{{ item.name }}</div>
            <div class="equipment-switcher__card-meta">
              <span>x{{ item.quantity }}</span>
              <span v-if="item.isEquipped">使用中</span>
            </div>
          </div>
        </button>
      </div>

      <div v-else class="equipment-switcher__empty">
        {{ activeCategoryMeta?.emptyText }}
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  activeCategory: {
    type: String,
    required: true,
  },
  selectedItem: {
    type: Object,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
  equippingItemId: {
    type: [Number, String, null],
    default: null,
  },
});

defineEmits(["equip", "select", "update:activeCategory"]);

const activeCategoryMeta = computed(
  () => props.categories.find((category) => category.id === props.activeCategory) ?? null,
);

const activeItems = computed(() => activeCategoryMeta.value?.items ?? []);
</script>

<style scoped>
.equipment-switcher {
  gap: 16px;
  padding: 22px 24px 24px;
  color: #10233f;
}

.equipment-switcher__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.equipment-switcher__eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.28em;
  color: #60708a;
}

.equipment-switcher__title {
  margin: 4px 0 0;
  font-size: 26px;
  font-weight: 900;
  line-height: 1.05;
}

.equipment-switcher__hint {
  max-width: 340px;
  margin: 0;
  padding-top: 16px;
  font-size: 13px;
  line-height: 1.6;
  text-align: right;
  color: #60708a;
}

.equipment-switcher__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.equipment-switcher__tab {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(16, 35, 63, 0.12);
  background: rgba(255, 255, 255, 0.76);
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 800;
  color: #36506f;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.equipment-switcher__tab.is-active {
  border-color: #365f95;
  background: #365f95;
  color: #fff;
}

.equipment-switcher__tab-count {
  min-width: 24px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  padding: 2px 7px;
  text-align: center;
  font-size: 12px;
}

.equipment-switcher__status,
.equipment-switcher__empty {
  display: grid;
  min-height: 220px;
  place-items: center;
  border: 1px dashed rgba(16, 35, 63, 0.2);
  background: rgba(255, 255, 255, 0.68);
  padding: 24px;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: #5e6e86;
}

.equipment-switcher__status.is-error {
  border-color: rgba(180, 52, 52, 0.24);
  color: var(--feedback-error);
}

.equipment-switcher__content {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  align-items: start;
}

.equipment-switcher__preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid rgba(16, 35, 63, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(235, 242, 249, 0.9));
  padding: 12px;
}

.equipment-switcher__preview-image {
  display: grid;
  aspect-ratio: 3 / 4;
  place-items: center;
  overflow: hidden;
  background: linear-gradient(180deg, #dce7f4, #eef3f8);
  padding: 10px;
}

.equipment-switcher__preview-image img,
.equipment-switcher__card-image img {
  height: 100%;
  width: 100%;
  object-fit: contain;
  object-position: center;
}

.equipment-switcher__preview-empty,
.equipment-switcher__card-image-empty {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #70819a;
}

.equipment-switcher__preview-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.equipment-switcher__preview-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.equipment-switcher__badge {
  border: 1px solid rgba(54, 80, 111, 0.15);
  background: #edf3f9;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 800;
  color: #4b6381;
}

.equipment-switcher__badge--equipped {
  border-color: rgba(46, 102, 72, 0.18);
  background: #e7f4eb;
  color: #2f6f4a;
}

.equipment-switcher__preview-title {
  margin: 0;
  font-size: 19px;
  font-weight: 900;
  line-height: 1.15;
}

.equipment-switcher__preview-description {
  margin: 0;
  min-height: 48px;
  font-size: 12px;
  line-height: 1.55;
  color: #5c6d86;
}

.equipment-switcher__equip-button {
  margin-top: auto;
  border: 1px solid #365f95;
  background: #365f95;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 900;
  color: #fff;
}

.equipment-switcher__equip-button:disabled {
  cursor: not-allowed;
  border-color: rgba(114, 128, 148, 0.2);
  background: rgba(114, 128, 148, 0.18);
  color: #66778f;
}

.equipment-switcher__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-content: start;
  padding-right: 4px;
}

.equipment-switcher__card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(16, 35, 63, 0.12);
  background: rgba(255, 255, 255, 0.88);
  text-align: left;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.equipment-switcher__card.is-selected {
  transform: translateY(-1px);
  border-color: #365f95;
  box-shadow: 0 12px 24px rgba(28, 55, 91, 0.14);
}

.equipment-switcher__card.is-equipped {
  border-color: rgba(46, 102, 72, 0.26);
}

.equipment-switcher__card-image {
  aspect-ratio: 16 / 10;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: linear-gradient(180deg, #dce7f4, #eef3f8);
  padding: 8px;
}

.equipment-switcher__card-body {
  display: flex;
  min-height: 74px;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  padding: 10px;
}

.equipment-switcher__card-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.25;
  color: #183153;
}

.equipment-switcher__card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  font-weight: 800;
  color: #60708a;
}

@media (max-width: 1023px) {
  .equipment-switcher {
    padding: 18px 20px 24px;
  }

  .equipment-switcher__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .equipment-switcher__hint {
    max-width: none;
    padding-top: 0;
    text-align: left;
  }

  .equipment-switcher__content {
    grid-template-columns: 1fr;
  }

  .equipment-switcher__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .equipment-switcher__grid {
    grid-template-columns: 1fr;
  }
}
</style>
