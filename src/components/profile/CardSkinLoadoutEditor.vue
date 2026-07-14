<template>
  <section class="card-skin-loadout">
    <div
      v-if="appliedSlots.length"
      class="card-skin-loadout__applied"
    >
      <div class="card-skin-loadout__header">
        <div>
          <p class="card-skin-loadout__eyebrow">CURRENT LOADOUT</p>
          <h3 class="card-skin-loadout__title">目前套用卡面總覽</h3>
        </div>

        <div class="card-skin-loadout__applied-meta">
          <strong>{{ appliedThemeName || "未套用卡面主題" }}</strong>
          <span>{{ appliedOverrideCount }} 張已個別指定</span>
        </div>
      </div>

      <div class="card-skin-loadout__grid is-summary">
        <article
          v-for="slot in appliedSlots"
          :key="`applied-${slot.key}`"
          class="card-skin-loadout__card"
        >
          <div class="card-skin-loadout__preview">
            <img
              class="card-skin-loadout__preview-layer"
              :src="slot.previewImage"
              :alt="slot.label"
            />
            <img
              v-if="slot.frameImage"
              class="card-skin-loadout__preview-layer"
              :src="slot.frameImage"
              alt=""
            />
          </div>

          <div class="card-skin-loadout__body">
            <div class="card-skin-loadout__meta">
              <strong>{{ slot.label }}</strong>
              <span>{{ slot.isOverridden ? "已個別指定" : "跟隨整套風格" }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div class="card-skin-loadout__header">
      <div>
        <p class="card-skin-loadout__eyebrow">CARD STYLE MIXER</p>
        <h3 class="card-skin-loadout__title">八張卡面混搭</h3>
      </div>

      <button
        type="button"
        class="card-skin-loadout__theme-button"
        :disabled="!selectedSkinItem || isSaving"
        @click="$emit('apply-theme', selectedSkinItem)"
      >
        {{ isSaving ? "儲存中..." : "套用為整套風格" }}
      </button>
    </div>

    <p class="card-skin-loadout__hint">
      先從右側選一個卡面風格，再把它套用到全部卡片，或單獨指定到其中幾張。
    </p>

    <div class="card-skin-loadout__grid">
      <article
        v-for="slot in slots"
        :key="slot.key"
        class="card-skin-loadout__card"
      >
        <div class="card-skin-loadout__preview">
          <img
            class="card-skin-loadout__preview-layer"
            :src="slot.previewImage"
            :alt="slot.label"
          />
          <img
            v-if="slot.frameImage"
            class="card-skin-loadout__preview-layer"
            :src="slot.frameImage"
            alt=""
          />
        </div>

        <div class="card-skin-loadout__body">
          <div class="card-skin-loadout__meta">
            <strong>{{ slot.label }}</strong>
            <span>{{ slot.isOverridden ? "單卡覆寫" : "跟隨整套風格" }}</span>
          </div>

          <div class="card-skin-loadout__actions">
            <button
              type="button"
              class="card-skin-loadout__action is-primary"
              :disabled="!selectedSkinItem || isSaving"
              @click="$emit('assign-slot', { slotKey: slot.key, item: selectedSkinItem })"
            >
              指定目前選擇
            </button>

            <button
              type="button"
              class="card-skin-loadout__action"
              :disabled="!slot.isOverridden || isSaving"
              @click="$emit('clear-slot', slot.key)"
            >
              清除覆寫
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  appliedThemeName: {
    type: String,
    default: "",
  },
  appliedOverrideCount: {
    type: Number,
    default: 0,
  },
  appliedSlots: {
    type: Array,
    default: () => [],
  },
  slots: {
    type: Array,
    default: () => [],
  },
  selectedSkinItem: {
    type: Object,
    default: null,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["apply-theme", "assign-slot", "clear-slot"]);
</script>

<style scoped>
.card-skin-loadout {
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  padding: 0 24px 24px;
}

.card-skin-loadout__applied {
  padding-top: 8px;
}

.card-skin-loadout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 8px;
}

.card-skin-loadout__eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.24em;
  color: #64748b;
}

.card-skin-loadout__title {
  margin: 4px 0 0;
  font-size: 24px;
  font-weight: 900;
  color: #0f172a;
}

.card-skin-loadout__applied-meta {
  display: grid;
  gap: 4px;
  text-align: right;
  color: #334155;
}

.card-skin-loadout__applied-meta span {
  font-size: 13px;
  color: #64748b;
}

.card-skin-loadout__hint {
  margin: 10px 0 0;
  color: #475569;
  line-height: 1.6;
}

.card-skin-loadout__theme-button,
.card-skin-loadout__action {
  border: 1px solid rgba(37, 99, 235, 0.18);
  background: #fff;
  padding: 10px 14px;
  font-weight: 800;
  color: #1d4ed8;
}

.card-skin-loadout__theme-button:disabled,
.card-skin-loadout__action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-skin-loadout__grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 18px;
}

.card-skin-loadout__grid.is-summary {
  margin-bottom: 28px;
}

.card-skin-loadout__card {
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.82);
}

.card-skin-loadout__preview {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #dbe4f0;
}

.card-skin-loadout__preview-layer {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.card-skin-loadout__body {
  display: grid;
  gap: 12px;
  padding: 12px;
}

.card-skin-loadout__meta {
  display: grid;
  gap: 4px;
  color: #334155;
}

.card-skin-loadout__meta span {
  font-size: 13px;
  color: #64748b;
}

.card-skin-loadout__actions {
  display: grid;
  gap: 8px;
}

.card-skin-loadout__action.is-primary {
  background: #1d4ed8;
  color: #fff;
}

@media (max-width: 1024px) {
  .card-skin-loadout__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .card-skin-loadout {
    padding: 0 16px 20px;
  }

  .card-skin-loadout__header {
    flex-direction: column;
    align-items: stretch;
  }

  .card-skin-loadout__applied-meta {
    text-align: left;
  }

  .card-skin-loadout__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
