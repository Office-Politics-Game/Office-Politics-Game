<template>
  <div class="profile-modal" role="dialog" aria-modal="true">
    <section class="profile-modal__panel">
      <button
        type="button"
        class="profile-modal__close"
        aria-label="關閉修改密碼視窗"
        @click="$emit('close')"
      >
        ×
      </button>
      <h2 class="profile-modal__title">修改密碼</h2>
      <p class="profile-modal__message">
        修改密碼功能將於會員安全流程開放。
      </p>
      <div class="profile-modal__actions profile-modal__actions--single">
        <button
          type="button"
          class="profile-modal__button profile-modal__button--primary"
          @click="$emit('close')"
        >
          確認
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
defineEmits(["close"]);
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

.profile-modal__close,
.profile-modal__button {
  cursor: pointer;
}

.profile-modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
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

.profile-modal__message {
  margin: 0;
  color: var(--gray-500);
  font-size: var(--text-sm);
  font-weight: 800;
  line-height: 1.7;
  text-align: center;
}

.profile-modal__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 24px;
}

.profile-modal__actions--single {
  grid-template-columns: 1fr;
}

.profile-modal__button {
  min-height: 48px;
  border: 1px solid var(--brand-primary);
  font-size: var(--text-md);
  font-weight: 900;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.profile-modal__button:hover {
  background: var(--brand-hover);
  color: white;
  transform: translateY(-1px);
}

.profile-modal__button--primary {
  background: var(--brand-active);
  color: white;
}
</style>