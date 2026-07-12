<template>
  <div class="profile-modal" role="dialog" aria-modal="true">
    <section class="profile-modal__panel">
      <button
        type="button"
        class="profile-modal__close"
        aria-label="關閉頭像選擇視窗"
        @click="$emit('close')"
      >
        ×
      </button>
      <h2 class="profile-modal__title">選擇頭像</h2>
      <div class="profile-avatar-grid">
        <button
          v-for="avatar in guestAvatars"
          :key="avatar.id"
          type="button"
          class="profile-avatar-grid__item"
          :class="{ 'is-selected': avatar.id === draftAvatarId }"
          @click="draftAvatarId = avatar.id"
        >
          <img :src="avatar.image" :alt="avatar.name" />
          <span>{{ avatar.name }}</span>
        </button>
      </div>
      <p v-if="errorMessage" class="profile-modal__error">
        {{ errorMessage }}
      </p>
      <div class="profile-modal__actions">
        <button
          type="button"
          class="profile-modal__button profile-modal__button--ghost"
          @click="$emit('close')"
        >
          取消
        </button>
        <button
          type="button"
          class="profile-modal__button profile-modal__button--primary"
          :disabled="isSaving"
          @click="$emit('save', draftAvatarId)"
        >
          {{ isSaving ? "儲存中" : "儲存" }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, watch } from "vue"
import { guestAvatars } from "@/constants/guestOptions.js"

const props = defineProps({
  selectedAvatarId: {
    type: Number,
    default: 1,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
})

defineEmits(["close", "save"])

const draftAvatarId = ref(props.selectedAvatarId || 1)

watch(
  () => props.selectedAvatarId,
  (value) => {
    draftAvatarId.value = value || 1
  }
)
</script>

<style scoped>
.profile-modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: rgba(0, 19, 50, 0.56);
}

.profile-modal__panel {
  position: relative;
  width: min(460px, calc(100vw - 32px));
  border: 1px solid var(--brand-primary);
  background: rgba(255, 255, 255, 0.94);
  padding: 32px 28px 28px;
}

.profile-modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  border: 0;
  background: var(--brand-active);
  color: white;
  font-size: 24px;
  font-weight: 700;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.profile-modal__close:hover {
  background: var(--brand-hover);
  color: white;
  transform: translateY(-1px);
}

.profile-modal__close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--brand-focus);
}

.profile-modal__title {
  margin: 0 0 20px;
  color: var(--brand-navy);
  font-size: var(--text-xl);
  font-weight: 900;
  text-align: center;
}

.profile-avatar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.profile-avatar-grid__item {
  border: 1px solid rgba(134, 179, 224, 0.7);
  background: rgba(255, 255, 255, 0.5);
  padding: 10px 6px;
  color: var(--brand-navy);
  font-size: var(--text-xs);
  font-weight: 900;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.profile-avatar-grid__item:hover {
  background: var(--brand-hover);
  color: white;
}

.profile-avatar-grid__item.is-selected {
  border-color: var(--brand-hover);
  box-shadow: inset 0 0 0 3px var(--brand-focus);
}

.profile-avatar-grid__item img {
  display: block;
  width: 56px;
  height: 56px;
  margin: 0 auto 8px;
  border-radius: 999px;
  object-fit: cover;
}

.profile-modal__error {
  margin: 12px 0 0;
  color: var(--brand-hover);
  font-size: var(--text-sm);
  font-weight: 800;
}

.profile-modal__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 24px;
}

.profile-modal__button {
  min-height: 48px;
  border: 1px solid var(--brand-primary);
  font-size: var(--text-md);
  font-weight: 900;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.profile-modal__button:hover {
  background: var(--brand-hover);
  color: white;
}

.profile-modal__button--ghost {
  background: rgba(255, 255, 255, 0.48);
  color: var(--brand-active);
}

.profile-modal__button--primary {
  background: var(--brand-active);
  color: white;
}
</style>