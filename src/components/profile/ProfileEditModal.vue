<template>
  <div class="profile-modal" role="dialog" aria-modal="true">
    <section class="profile-modal__panel">
      <button
        type="button"
        class="profile-modal__close"
        aria-label="關閉編輯視窗"
        @click="$emit('close')"
      >
        ×
      </button>
      <h2 class="profile-modal__title">編輯{{ field.label }}</h2>
      <textarea
        v-if="field.id === 'bio'"
        v-model="draftValue"
        class="profile-modal__input profile-modal__textarea"
        maxlength="120"
        placeholder="輸入自我介紹"
      ></textarea>
      <input
        v-else
        v-model="draftValue"
        class="profile-modal__input"
        type="text"
        maxlength="30"
        placeholder="輸入暱稱"
      />
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
          @click="$emit('save', draftValue)"
        >
          {{ isSaving ? "儲存中" : "儲存" }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, watch } from "vue"

const props = defineProps({
  field: {
    type: Object,
    required: true,
  },
  initialValue: {
    type: String,
    default: "",
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

const draftValue = ref(props.initialValue)

watch(
  () => props.initialValue,
  (value) => {
    draftValue.value = value
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
  width: min(420px, calc(100vw - 32px));
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
  font-size: var(--text-lg);
  font-weight: 900;
  text-align: center;
}

.profile-modal__input {
  width: 100%;
  border: 1px solid var(--brand-primary);
  background: rgba(255, 255, 255, 0.72);
  padding: 14px 16px;
  color: var(--brand-navy);
  font-size: var(--text-md);
  font-weight: 700;
  outline: none;
}

.profile-modal__textarea {
  min-height: 160px;
  resize: vertical;
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
  cursor: pointer;
  border: 1px solid var(--brand-primary);
  font-size: var(--text-md);
  font-weight: 900;
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

.profile-modal__button:disabled {
  cursor: wait;
  background: var(--brand-disabled);
}
</style>