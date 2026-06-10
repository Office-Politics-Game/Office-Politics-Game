<script setup>
import { ref } from 'vue';
import { DoorOpen } from '@lucide/vue';
import joinRoomBackground from '@/assets/WaitingRoom.png';

const roomId = ref("")
</script>

<template>
  <div class="lobby-modal-backdrop absolute inset-0 z-[8] grid place-items-center" aria-label="加入房間彈窗">
    <article class="lobby-modal-paper join-room-panel relative overflow-visible">
      <img
        class="modal-paper-image pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
        :src="joinRoomBackground"
        alt=""
        aria-hidden="true"
      />

      <header class="text-center">
        <div class="join-room-title-row flex items-center justify-center">
          <span class="join-room-title-rule block h-px min-w-7 flex-1"></span>
          <h2 class="join-room-title leading-none tracking-normal">
            加入房間
          </h2>
          <span class="join-room-title-rule block h-px min-w-7 flex-1"></span>
        </div>
      </header>

      <section class="join-room-form" aria-label="輸入房號">
        <label class="join-room-label flex items-center" for="roomId">
          <DoorOpen class="join-room-label-icon" :stroke-width="2.2" />
          請輸入房間 ID：
        </label>

        <div class="join-room-input grid grid-cols-1 items-center">
          <input
                id="roomId"
                v-model="roomId"
                class="join-room-real-input min-w-0 w-full border-0 bg-transparent outline-0"
                type="text"
                placeholder="ABCD12"
          />
        </div>
      </section>

      <footer class="join-room-actions grid grid-cols-2">
        <button
          class="modal-action-button modal-action-button-light relative flex cursor-pointer items-center justify-center"
          type="button"
        >
          <span>取消</span>
        </button>
        <button
          class="modal-action-button modal-action-button-primary relative flex cursor-pointer items-center justify-center"
          type="button"
        >
          <span>加入</span>
        </button>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.lobby-modal-backdrop {
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.22), rgba(0, 19, 50, 0.38) 70%);
  padding: 8px;
}

.lobby-modal-paper {
  width: min(55vw, calc((100svh - 16px) * 1361 / 801), 900px);
  color: var(--brand-active, #465563);
  font-family: var(--font-sans, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
}

.join-room-panel {
  aspect-ratio: 1361 / 801;
}

.join-room-panel > header {
  position: absolute;
  top: 22%;
  left: 50%;
  z-index: 1;
  width: 54%;
  transform: translateX(-50%);
}

.join-room-title-row {
  gap: clamp(6px, 1vw, 12px);
  color: var(--brand-active, #465563);
}

.join-room-title-rule {
  background: var(--brand-primary, #86b3e0);
}

.join-room-title {
  color: var(--brand-active, #465563);
  font-size: clamp(20px, 2.6vw, 32px);
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.join-room-form {
  position: absolute;
  top: 40%;
  left: 50%;
  z-index: 1;
  width: 54%;
  transform: translateX(-50%);
}

.join-room-label {
  gap: 8px;
  color: var(--brand-active, #465563);
  font-size: clamp(13px, 1.35vw, 18px);
  font-weight: 700;
  line-height: 1.2;
}

.join-room-label-icon {
  width: 1.2em;
  height: 1.2em;
  color: var(--brand-primary, #86b3e0);
}

.join-room-input {
  min-height: clamp(34px, 3.8vw, 48px);
  margin-top: clamp(10px, 1.6vw, 16px);
  border: 1px solid var(--brand-primary, #86b3e0);
  border-radius: var(--radius-md, 0);
  background: rgba(255, 255, 255, 0.54);
  color: var(--brand-active, #465563);
  font-family: var(--font-sans, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
  font-weight: 500;
  letter-spacing: 0.08em;
  box-shadow: 0 10px 20px rgba(0, 19, 50, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.72);
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.join-room-input:focus-within {
  border-color: var(--brand-hover, #0046f4);
  background: var(--surface-glass-hover, rgba(255, 255, 255, 0.72));
  box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
}

.join-room-real-input {
  color: var(--brand-active, #465563);
  padding: 0 clamp(10px, 1.2vw, 14px);
  font-family: var(--font-sans, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
  font-size: clamp(15px, 1.7vw, 22px);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.join-room-real-input::placeholder {
  color: var(--brand-disabled, #a0a6b3);
}

.join-room-actions {
  position: absolute;
  bottom: 15%;
  left: 50%;
  z-index: 1;
  gap: clamp(10px, 1.4vw, 16px);
  width: 40%;
  transform: translateX(-50%);
}

.modal-action-button {
  min-height: clamp(30px, 3.4vw, 42px);
  border: 1px solid var(--brand-primary, #86b3e0);
  border-radius: var(--radius-md, 0);
  background: var(--surface-glass, rgba(255, 255, 255, 0.3));
  color: var(--brand-active, #465563);
  font-family: var(--font-sans, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
  font-size: clamp(13px, 1.2vw, 15px);
  font-weight: 700;
  line-height: 1;
  text-shadow: none;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease;
}

.modal-action-button span {
  position: relative;
  z-index: 1;
}

.modal-action-button-light {
  background: var(--surface-glass, rgba(255, 255, 255, 0.3));
}

.modal-action-button-primary {
  background: rgba(134, 179, 224, 0.34);
}

.modal-action-button:hover {
  transform: translateY(-2px);
  border-color: var(--brand-hover, #0046f4);
  background: var(--brand-hover, #0046f4);
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(0, 70, 244, 0.24);
}

.modal-action-button:active {
  transform: translateY(1px);
  border-color: var(--brand-active, #465563);
  background: var(--brand-active, #465563);
  color: #ffffff;
  box-shadow: 0 6px 14px rgba(70, 85, 99, 0.24);
}

.modal-action-button:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
}

@media (min-width: 768px) {
  .lobby-modal-paper {
    width: min(55vw, calc((100svh - 48px) * 1361 / 801), 760px);
  }

  .join-room-title-row {
    gap: 12px;
  }

  .join-room-title {
    font-size: clamp(24px, 2.6vw, 30px);
  }

  .join-room-form {
    top: 40%;
    width: 54%;
  }

  .join-room-label {
    gap: 10px;
    font-size: 16px;
  }

  .join-room-input {
    min-height: 44px;
    margin-top: 14px;
  }

  .join-room-real-input {
    letter-spacing: 0.1em;
    padding: 0 14px;
    font-size: 18px;
  }

  .join-room-actions {
    bottom: 15%;
    gap: 14px;
    width: 40%;
  }

  .modal-action-button {
    min-height: 38px;
    font-size: 14px;
  }
}

@media (min-width: 1024px) {
  .lobby-modal-paper {
    width: min(55vw, calc((100svh - 64px) * 1361 / 801), 900px);
  }

  .join-room-title {
    font-size: 32px;
  }

  .join-room-form {
    top: 40%;
    width: 52%;
  }

  .join-room-label {
    font-size: 18px;
  }

  .join-room-input {
    min-height: 48px;
    margin-top: 16px;
  }

  .join-room-real-input {
    letter-spacing: 0.12em;
    font-size: 22px;
    padding: 0 16px;
  }

  .join-room-actions {
    bottom: 15%;
    gap: 16px;
    width: 38%;
  }

  .modal-action-button {
    min-height: 42px;
    font-size: 15px;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .lobby-modal-backdrop {
    padding: 4px;
  }

  .lobby-modal-paper {
    width: min(55vw, calc((100svh - 8px) * 1361 / 801), 680px);
  }

  .join-room-panel > header {
    top: 21%;
    width: 54%;
  }

  .join-room-title-row {
    gap: 8px;
  }

  .join-room-title-rule {
    min-width: 20px;
  }

  .join-room-title {
    font-size: clamp(16px, 2.8vw, 22px);
  }

  .join-room-form {
    top: 39%;
    width: 54%;
  }

  .join-room-label {
    gap: 6px;
    font-size: clamp(12px, 2vw, 14px);
  }

  .join-room-input {
    min-height: clamp(26px, 6.4vh, 32px);
    margin-top: clamp(8px, 2.4vh, 12px);
  }

  .join-room-real-input {
    padding: 0 10px;
    font-size: clamp(14px, 2.6vw, 16px);
  }

  .join-room-actions {
    bottom: 14%;
    gap: clamp(8px, 2vw, 10px);
    width: 40%;
  }

  .modal-action-button {
    min-height: clamp(24px, 5.8vh, 30px);
    font-size: clamp(12px, 2.4vw, 13px);
  }
}
</style>
