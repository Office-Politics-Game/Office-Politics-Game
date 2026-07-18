<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useButtonClickAudio } from "@/composables/UseButtonClickAudio";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  musicEnabled: {
    type: Boolean,
    required: true,
  },
  musicVolume: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 100,
  },
  soundEnabled: {
    type: Boolean,
    required: true,
  },
  soundVolume: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 100,
  },
});

const emit = defineEmits([
  "close",
  "update:musicEnabled",
  "update:musicVolume",
  "update:soundEnabled",
  "update:soundVolume",
  "return-lobby",
  "restart-game",
]);

const { handleButtonClick } = useButtonClickAudio();
const dialog = ref(null);
const closeButton = ref(null);
const confirmationAction = ref(null);
const isSubmittingAction = ref(false);
let previouslyFocusedElement = null;

const confirmationContent = computed(() => {
  if (confirmationAction.value === "return-lobby") {
    return {
      title: "返回大廳？",
      description: "目前對局將會中斷，確認後返回大廳。",
      confirmLabel: "確認返回",
    };
  }

  if (confirmationAction.value === "restart-game") {
    return {
      title: "重新開始？",
      description:
        "目前對局進度將會重設。這個版本只會送出重新開始事件，不會直接修改遊戲資料。",
      confirmLabel: "確認重開",
    };
  }

  return null;
});

function requestClose() {
  if (!isSubmittingAction.value) {
    emit("close");
  }
}

function updateVolume(eventName, event) {
  emit(eventName, Number(event.target.value));
}

function openConfirmation(action) {
  confirmationAction.value = action;
  nextTick(() => closeButton.value?.focus());
}

function cancelConfirmation() {
  confirmationAction.value = null;
  nextTick(() => closeButton.value?.focus());
}

function confirmAction() {
  if (!confirmationAction.value || isSubmittingAction.value) {
    return;
  }

  isSubmittingAction.value = true;
  emit(confirmationAction.value);
  emit("close");
}

function getFocusableElements() {
  if (!dialog.value) {
    return [];
  }

  return Array.from(
    dialog.value.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("aria-hidden"));
}

function handleKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    requestClose();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusableElements = getFocusableElements();

  if (focusableElements.length === 0) {
    event.preventDefault();
    dialog.value?.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocusedElement = document.activeElement;
      confirmationAction.value = null;
      isSubmittingAction.value = false;
      await nextTick();
      closeButton.value?.focus();
      return;
    }

    confirmationAction.value = null;
    isSubmittingAction.value = false;
    await nextTick();

    if (previouslyFocusedElement instanceof HTMLElement) {
      previouslyFocusedElement.focus();
    }

    previouslyFocusedElement = null;
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="settings-modal">
      <div
        v-if="isOpen"
        class="settings-overlay"
        @click.capture="handleButtonClick"
        @click.self="requestClose"
      >
        <section
          ref="dialog"
          class="settings-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-settings-title"
          tabindex="-1"
          @keydown="handleKeydown"
        >
          <header class="settings-header">
            <div>
              <p class="settings-eyebrow">OFFICE POLITICS</p>
              <h2 id="game-settings-title" class="settings-title">
                {{ confirmationContent?.title ?? "遊戲設定" }}
              </h2>
            </div>

            <button
              ref="closeButton"
              type="button"
              class="icon-button"
              aria-label="關閉遊戲設定"
              :disabled="isSubmittingAction"
              @click="requestClose"
            >
              關閉
            </button>
          </header>

          <div v-if="!confirmationContent" class="settings-content">
            <section
              class="audio-section"
              aria-labelledby="audio-settings-title"
            >
              <div class="section-heading">
                <div>
                  <p class="section-kicker">AUDIO</p>
                  <h3 id="audio-settings-title">音訊</h3>
                </div>
                <span>各項音量獨立控制</span>
              </div>

              <div class="audio-grid">
                <article class="audio-control">
                  <div class="audio-control-header">
                    <div class="audio-label">
                      <span>音樂</span>
                    </div>

                    <button
                      type="button"
                      class="toggle-button"
                      :class="{ 'is-enabled': musicEnabled }"
                      :aria-pressed="musicEnabled"
                      :aria-label="`音樂${musicEnabled ? '已開啟' : '已關閉'}`"
                      @click="emit('update:musicEnabled', !musicEnabled)"
                    >
                      {{ musicEnabled ? "開啟" : "關閉" }}
                    </button>
                  </div>

                  <label class="volume-control">
                    <span>
                      <span>音量</span>
                      <output>{{ musicVolume }}</output>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      :value="musicVolume"
                      :disabled="!musicEnabled"
                      aria-label="音樂音量"
                      @input="updateVolume('update:musicVolume', $event)"
                    />
                  </label>
                </article>

                <article class="audio-control">
                  <div class="audio-control-header">
                    <div class="audio-label">
                      <span>音效</span>
                    </div>

                    <button
                      type="button"
                      class="toggle-button"
                      :class="{ 'is-enabled': soundEnabled }"
                      :aria-pressed="soundEnabled"
                      :aria-label="`音效${soundEnabled ? '已開啟' : '已關閉'}`"
                      @click="emit('update:soundEnabled', !soundEnabled)"
                    >
                      {{ soundEnabled ? "開啟" : "關閉" }}
                    </button>
                  </div>

                  <label class="volume-control">
                    <span>
                      <span>音量</span>
                      <output>{{ soundVolume }}</output>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      :value="soundVolume"
                      :disabled="!soundEnabled"
                      aria-label="音效音量"
                      @input="updateVolume('update:soundVolume', $event)"
                    />
                  </label>
                </article>
              </div>
            </section>

            <section class="game-actions" aria-labelledby="game-actions-title">
              <div class="section-heading compact">
                <div>
                  <p class="section-kicker">GAME</p>
                  <h3 id="game-actions-title">對局操作</h3>
                </div>
              </div>

              <div class="action-grid">
                <button
                  type="button"
                  class="glass-button"
                  @click="openConfirmation('return-lobby')"
                >
                  返回大廳
                </button>
                <button
                  type="button"
                  class="glass-button danger-button"
                  @click="openConfirmation('restart-game')"
                >
                  重新開始
                </button>
              </div>
            </section>
          </div>

          <div v-else class="confirmation-content">
            <p class="confirmation-eyebrow">CONFIRM ACTION</p>
            <p>{{ confirmationContent.description }}</p>

            <div class="confirmation-actions">
              <button
                type="button"
                class="glass-button"
                :disabled="isSubmittingAction"
                @click="cancelConfirmation"
              >
                取消
              </button>
              <button
                type="button"
                class="glass-button danger-button"
                :disabled="isSubmittingAction"
                @click="confirmAction"
              >
                {{ confirmationContent.confirmLabel }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 10px;
  overflow: hidden;
  background: rgba(0, 19, 50, 0.72);
  backdrop-filter: blur(7px);
}

.settings-dialog {
  width: min(640px, 100%);
  max-height: calc(100dvh - 20px);
  overflow-y: auto;
  color: var(--brand-navy);
  border: 1px solid rgba(214, 215, 220, 0.92);
  border-radius: 0;
  background:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.92),
      rgba(214, 215, 220, 0.82)
    ),
    var(--surface-glass-hover);
  box-shadow:
    var(--shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(18px);
}

.settings-dialog:focus {
  outline: none;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 76px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(70, 85, 99, 0.28);
  background: rgba(255, 255, 255, 0.28);
}

.settings-eyebrow,
.section-kicker {
  margin: 0 0 3px;
  color: var(--brand-hover);
  font-size: var(--text-xs);
  font-weight: 900;
  letter-spacing: 0.14em;
}

.settings-title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 900;
  letter-spacing: 0.03em;
  line-height: 1.1;
}

.icon-button,
.toggle-button,
.glass-button {
  border-radius: 0;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.icon-button {
  display: inline-flex;
  width: auto;
  min-width: 68px;
  height: 48px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  color: var(--brand-navy);
  border: 1px solid rgba(70, 85, 99, 0.32);
  background: var(--surface-glass);
  font-size: var(--text-sm);
  font-weight: 800;
  letter-spacing: 0.04em;
}

.icon-button:hover,
.toggle-button:hover,
.glass-button:hover {
  color: white;
  border-color: var(--brand-hover);
  background: var(--brand-hover);
  transform: translateY(-1px);
}

.icon-button:active,
.toggle-button:active,
.glass-button:active {
  color: white;
  border-color: var(--brand-active);
  background: var(--brand-active);
  transform: translateY(1px);
}

.icon-button:focus-visible,
.toggle-button:focus-visible,
.glass-button:focus-visible,
.volume-control input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 5px var(--brand-focus);
}

.settings-content {
  display: grid;
  gap: 20px;
  padding: 20px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.section-heading.compact {
  margin-bottom: 10px;
}

.section-heading h3 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 800;
}

.section-heading > span {
  color: var(--gray-500);
  font-size: var(--text-xs);
  font-weight: 600;
}

.audio-grid,
.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.audio-control {
  padding: 14px;
  border: 1px solid rgba(70, 85, 99, 0.24);
  border-radius: 0;
  background: rgba(255, 255, 255, 0.48);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.audio-control-header,
.audio-label,
.volume-control > span {
  display: flex;
  align-items: center;
}

.audio-control-header,
.volume-control > span {
  justify-content: space-between;
}

.audio-label {
  gap: 8px;
  font-size: var(--text-md);
  font-weight: 800;
}

.toggle-button {
  min-width: 68px;
  min-height: 40px;
  padding: 8px 12px;
  color: var(--gray-500);
  border: 1px solid var(--gray-300);
  background: rgba(255, 255, 255, 0.52);
  font-size: var(--text-sm);
  font-weight: 800;
  letter-spacing: 0.04em;
}

.toggle-button.is-enabled {
  color: white;
  border-color: var(--brand-hover);
  background: var(--brand-hover);
}

.volume-control {
  display: grid;
  gap: 7px;
  margin-top: 12px;
  color: var(--gray-500);
  font-size: var(--text-sm);
  font-weight: 700;
}

.volume-control output {
  min-width: 3ch;
  color: var(--brand-navy);
  text-align: right;
  font-weight: 900;
}

.volume-control input {
  width: 100%;
  height: 24px;
  margin: 0;
  cursor: pointer;
  appearance: none;
  background: transparent;
}

.volume-control input::-webkit-slider-runnable-track {
  height: 6px;
  border: 1px solid rgba(70, 85, 99, 0.32);
  border-radius: 0;
  background: var(--gray-100);
}

.volume-control input::-webkit-slider-thumb {
  width: 18px;
  height: 18px;
  margin-top: -7px;
  appearance: none;
  border: 2px solid white;
  border-radius: 0;
  background: var(--brand-hover);
  box-shadow: 0 2px 8px rgba(0, 19, 50, 0.32);
}

.volume-control input::-moz-range-track {
  height: 6px;
  border: 1px solid rgba(70, 85, 99, 0.32);
  border-radius: 0;
  background: var(--gray-100);
}

.volume-control input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border: 2px solid white;
  border-radius: 0;
  background: var(--brand-hover);
  box-shadow: 0 2px 8px rgba(0, 19, 50, 0.32);
}

.volume-control input:disabled {
  cursor: not-allowed;
  opacity: 0.46;
}

.glass-button {
  display: inline-flex;
  min-width: 144px;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px 22px;
  color: var(--brand-navy);
  border: 1px solid rgba(255, 255, 255, 0.82);
  background: var(--surface-glass);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 8px 20px rgba(0, 19, 50, 0.12);
  font-size: var(--text-sm);
  font-weight: 800;
  letter-spacing: 0.04em;
}

.danger-button {
  color: white;
  border-color: var(--brand-active);
  background: var(--brand-active);
}

.icon-button:disabled,
.toggle-button:disabled,
.glass-button:disabled {
  cursor: not-allowed;
  color: white;
  border-color: transparent;
  background: rgba(160, 166, 179, 0.62);
  box-shadow: none;
  transform: none;
}

.confirmation-content {
  display: grid;
  min-height: 250px;
  place-items: center;
  align-content: center;
  gap: 18px;
  padding: 30px 24px;
  text-align: center;
}

.confirmation-eyebrow {
  margin: 0;
  color: var(--brand-hover);
  font-size: var(--text-xs);
  font-weight: 900;
  letter-spacing: 0.14em;
}

.confirmation-content p {
  max-width: 480px;
  margin: 0;
  color: var(--gray-500);
  font-size: var(--text-md);
  font-weight: 600;
  line-height: 1.65;
}

.confirmation-actions {
  display: grid;
  width: min(380px, 100%);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.settings-modal-enter-active,
.settings-modal-leave-active {
  transition: opacity 0.18s ease;
}

.settings-modal-enter-active .settings-dialog,
.settings-modal-leave-active .settings-dialog {
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}

.settings-modal-enter-from,
.settings-modal-leave-to,
.settings-modal-enter-from .settings-dialog,
.settings-modal-leave-to .settings-dialog {
  opacity: 0;
}

.settings-modal-enter-from .settings-dialog {
  transform: translateY(10px);
}

.settings-modal-leave-to .settings-dialog {
  transform: translateY(-6px);
}

@media (max-width: 760px) {
  .settings-dialog {
    width: 100%;
  }

  .settings-header,
  .settings-content {
    padding-right: 14px;
    padding-left: 14px;
  }

  .audio-grid {
    grid-template-columns: 1fr;
  }

  .glass-button {
    width: 100%;
  }
}

@media (max-height: 480px) and (orientation: landscape) {
  .settings-header {
    min-height: 62px;
    padding-top: 9px;
    padding-bottom: 9px;
  }

  .settings-title {
    font-size: var(--text-lg);
  }

  .settings-content {
    gap: 12px;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .section-heading {
    margin-bottom: 7px;
  }

  .section-kicker,
  .section-heading > span {
    display: none;
  }

  .audio-control {
    padding: 10px 12px;
  }

  .volume-control {
    margin-top: 7px;
  }

  .confirmation-content {
    min-height: 220px;
    gap: 12px;
    padding: 18px;
  }
}
</style>
