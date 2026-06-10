<script setup>
import { LogOut, X } from '@lucide/vue';
import matchingBackground from '@/assets/images/modal-matching-screen.png';
</script>

<template>
  <div
    class="matching-modal-backdrop absolute inset-0 z-[8] grid place-items-center overflow-hidden"
    aria-label="配對中彈窗"
  >
    <article class="matching-panel relative overflow-visible" aria-live="polite">
      <img
        class="matching-background pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
        :src="matchingBackground"
        alt=""
        aria-hidden="true"
      />

      <div class="matching-screen-content absolute left-1/2 z-[1] grid text-center">
        <section class="matching-loading-group flex min-h-0 flex-col items-center justify-center" aria-label="配對進度">
          <h2 class="matching-title">LOADING...</h2>

          <div class="matching-progress" aria-hidden="true"></div>
        </section>

        <footer class="matching-actions grid grid-cols-2">
          <button
            class="matching-action-button matching-action-button-blue relative flex cursor-pointer items-center justify-center"
            type="button"
          >
            <LogOut class="matching-action-icon" :stroke-width="2.5" />
            <span>返回大廳</span>
          </button>

          <button
            class="matching-action-button matching-action-button-red relative flex cursor-pointer items-center justify-center"
            type="button"
          >
            <X class="matching-action-icon" :stroke-width="3.2" />
            <span>取消遊戲</span>
          </button>
        </footer>
      </div>
    </article>
  </div>
</template>

<style scoped>
.matching-modal-backdrop {
  background: radial-gradient(circle at center, rgba(0, 19, 50, 0.16), rgba(0, 19, 50, 0.62) 72%);
  padding: 8px;
}

.matching-panel {
  width: min(100vw, calc(100svh * 1536 / 1024), 1536px);
  aspect-ratio: 1536 / 1024;
  font-family: var(--font-sans, Inter, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
  color: #f3f8ff;
}

.matching-screen-content {
  top: 17%;
  width: 58%;
  height: 61%;
  transform: translateX(-50%);
  grid-template-rows: 42% 26% 32%;
  align-items: center;
}

.matching-loading-group {
  grid-row: 2;
  align-self: center;
}

.matching-title {
  margin: 0;
  color: #eaf4ff;
  font-size: clamp(var(--text-md, 16px), 1.4vw, 26px);
  font-weight: 800;
  letter-spacing: 0.16em;
  line-height: 1;
  text-shadow:
    0 0 8px rgba(134, 179, 224, 0.95),
    0 0 22px rgba(0, 70, 244, 0.72);
}

.matching-progress {
  position: relative;
  width: 72%;
  max-width: 560px;
  height: clamp(4px, 0.48vw, 6px);
  margin-top: clamp(8px, 1.05vw, 16px);
  overflow: hidden;
  background:
    linear-gradient(#06152f 0 0) 0 / 0% no-repeat,
    rgba(1, 7, 18, 0.92);
  box-shadow:
    0 0 14px rgba(0, 70, 244, 0.48),
    inset 0 0 0 1px rgba(134, 179, 224, 0.22);
  animation: matching-progress-fill 2.2s linear infinite;
}

.matching-progress::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -22%;
  width: 22%;
  background: linear-gradient(90deg, transparent, #ffffff 45%, #86b3e0 65%, transparent);
  box-shadow:
    0 0 8px rgba(255, 255, 255, 0.95),
    0 0 18px rgba(0, 70, 244, 0.78);
  content: "";
  animation: matching-progress-scan 1.1s ease-in-out infinite;
}

@keyframes matching-progress-fill {
  100% {
    background-size: 100%;
  }
}

@keyframes matching-progress-scan {
  100% {
    left: 100%;
  }
}

.matching-actions {
  width: 68%;
  justify-self: center;
  align-self: center;
  grid-row: 3;
  gap: clamp(10px, 2vw, 28px);
}

.matching-action-button {
  --button-border: #86b3e0;
  --button-glow: rgba(0, 70, 244, 0.52);
  --button-bg: rgba(0, 19, 50, 0.68);

  min-height: clamp(24px, 2.2vw, 36px);
  gap: clamp(4px, 0.8vw, 10px);
  border: 1px solid var(--button-border);
  border-radius: var(--radius-md, 0);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 48%),
    var(--button-bg);
  color: #f3f8ff;
  font-family: var(--font-sans, Inter, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
  font-size: clamp(11px, 0.9vw, 14px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.08em;
  text-shadow: 0 0 10px var(--button-glow);
  box-shadow:
    0 0 14px rgba(0, 70, 244, 0.18),
    inset 0 0 18px rgba(0, 70, 244, 0.18);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease;
}

.matching-action-button::before,
.matching-action-button::after {
  position: absolute;
  width: 18%;
  height: 38%;
  pointer-events: none;
  content: "";
}

.matching-action-button::before {
  top: -1px;
  left: -1px;
  border-top: 2px solid var(--button-border);
  border-left: 2px solid var(--button-border);
}

.matching-action-button::after {
  right: -1px;
  bottom: -1px;
  border-right: 2px solid var(--button-border);
  border-bottom: 2px solid var(--button-border);
}

.matching-action-button-blue {
  --button-border: #1aa8ff;
  --button-glow: rgba(26, 168, 255, 0.72);
  --button-bg: rgba(0, 30, 76, 0.68);
}

.matching-action-button-red {
  --button-border: #ff3030;
  --button-glow: rgba(255, 48, 48, 0.68);
  --button-bg: rgba(48, 0, 16, 0.62);
}

.matching-action-icon {
  width: clamp(10px, 1vw, 16px);
  height: clamp(12px, 1.25vw, 18px);
  flex: 0 0 auto;
  filter: drop-shadow(0 0 8px var(--button-glow));
}

.matching-action-button:hover {
  transform: translateY(-2px);
  border-color: var(--brand-hover, #0046f4);
  background-color: rgba(0, 70, 244, 0.3);
  color: #ffffff;
  box-shadow:
    0 0 18px var(--button-glow),
    0 0 28px rgba(0, 70, 244, 0.38),
    inset 0 0 24px rgba(0, 70, 244, 0.28);
}

.matching-action-button-red:hover {
  border-color: #ff5252;
  background-color: rgba(255, 48, 48, 0.2);
  box-shadow:
    0 0 18px rgba(255, 48, 48, 0.62),
    0 0 28px rgba(255, 48, 48, 0.28),
    inset 0 0 24px rgba(255, 48, 48, 0.18);
}

.matching-action-button:active {
  transform: translateY(1px);
  border-color: var(--brand-active, #465563);
  background-color: rgba(70, 85, 99, 0.32);
  box-shadow:
    0 0 10px rgba(70, 85, 99, 0.36),
    inset 0 0 18px rgba(70, 85, 99, 0.22);
}

.matching-action-button:focus-visible {
  outline: 0;
  box-shadow:
    0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24)),
    0 0 18px var(--button-glow),
    inset 0 0 20px rgba(0, 70, 244, 0.18);
}

@media (min-width: 768px) {
  .matching-modal-backdrop {
    padding: 16px;
  }

  .matching-panel {
    width: min(100vw, calc(100svh * 1536 / 1024), 1536px);
  }
}

@media (min-width: 1024px) {
  .matching-modal-backdrop {
    padding: 24px;
  }

  .matching-panel {
    width: min(100vw, calc(100svh * 1536 / 1024), 1536px);
  }

  .matching-title {
    font-size: clamp(var(--text-md, 18px), 1.4vw, 26px);
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .matching-modal-backdrop {
    padding: 4px;
  }

  .matching-panel {
    width: min(calc(100vw - 8px), calc((100svh - 8px) * 1536 / 1024), 960px);
  }

  .matching-screen-content {
    grid-template-rows: 41% 27% 32%;
  }

  .matching-title {
    font-size: clamp(12px, 3vh, 17px);
    letter-spacing: 0.12em;
  }

  .matching-progress {
    /* width: 62%; */
    height: clamp(3px, 1.2vh, 5px);
    margin-top: clamp(5px, 1.5vh, 9px);
  }

  .matching-actions {
    width: 64%;
    gap: clamp(6px, 2vw, 20px);
  }

  .matching-action-button {
    min-height: clamp(20px, 5vh, 28px);
    gap: 4px;
    font-size: clamp(9px, 2.35vh, 11px);
  }

  .matching-action-icon {
    width: clamp(10px, 3vh, 13px);
    height: clamp(10px, 3vh, 13px);
  }
}
</style>
