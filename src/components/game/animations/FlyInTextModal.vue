<script setup>
import { computed, onBeforeUnmount, watch } from "vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "",
  },
  text: {
    type: String,
    required: true,
  },
  playerName: {
    type: String,
    default: "",
  },
  avatarUrl: {
    type: String,
    default: "",
  },
  tone: {
    type: String,
    default: "default",
    validator: (value) => ["default", "danger"].includes(value),
  },
  duration: {
    type: Number,
    default: 1600,
    validator: (value) => value >= 0,
  },
});

const emit = defineEmits(["close", "after-leave"]);

let closeTimer = null;

const hasTitle = computed(() => props.title.trim().length > 0);
const hasPlayer = computed(
  () => props.playerName.trim().length > 0 || props.avatarUrl.trim().length > 0,
);

function clearCloseTimer() {
  if (closeTimer) {
    window.clearTimeout(closeTimer);
    closeTimer = null;
  }
}

function scheduleClose() {
  clearCloseTimer();

  if (!props.isOpen || props.duration === 0) {
    return;
  }

  closeTimer = window.setTimeout(() => {
    emit("close");
  }, props.duration);
}

watch(
  () => [
    props.isOpen,
    props.duration,
    props.text,
    props.title,
    props.playerName,
    props.avatarUrl,
    props.tone,
  ],
  scheduleClose,
  { immediate: true },
);

onBeforeUnmount(clearCloseTimer);
</script>

<template>
  <Teleport to="body">
    <Transition name="fly-in-text-modal" @after-leave="emit('after-leave')">
      <div
        v-if="isOpen"
        class="fly-in-text-modal"
        :class="`fly-in-text-modal--${tone}`"
        role="status"
        aria-live="polite"
      >
        <section class="fly-in-text-modal__panel" aria-label="Game notice">
          <p v-if="hasTitle" class="fly-in-text-modal__title">{{ title }}</p>
          <figure v-if="hasPlayer" class="fly-in-text-modal__player">
            <img
              v-if="avatarUrl"
              class="fly-in-text-modal__avatar"
              :src="avatarUrl"
              :alt="playerName"
              draggable="false"
            />
            <figcaption v-if="playerName" class="fly-in-text-modal__name">
              {{ playerName }}
            </figcaption>
          </figure>
          <p class="fly-in-text-modal__text text-lg">{{ text }}</p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fly-in-text-modal {
  position: fixed;
  z-index: 120;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 18px;
  overflow: hidden;
  background: rgba(0, 19, 50, 0.78);
  backdrop-filter: blur(7px);
  pointer-events: none;
  --fly-in-player-accent: #facc15;
  --fly-in-player-border: rgba(250, 204, 21, 0.78);
  --fly-in-player-ring: rgba(250, 204, 21, 0.14);
  --fly-in-player-glow: rgba(250, 204, 21, 0.72);
  --fly-in-player-deep-glow: rgba(245, 158, 11, 0.48);
  --fly-in-player-name-glow: rgba(250, 204, 21, 0.24);
}

.fly-in-text-modal--danger {
  --fly-in-player-accent: #f87171;
  --fly-in-player-border: rgba(248, 113, 113, 0.86);
  --fly-in-player-ring: rgba(248, 113, 113, 0.16);
  --fly-in-player-glow: rgba(248, 113, 113, 0.78);
  --fly-in-player-deep-glow: rgba(220, 38, 38, 0.5);
  --fly-in-player-name-glow: rgba(248, 113, 113, 0.28);
}

.fly-in-text-modal__panel {
  display: grid;
  width: min(520px, 86vw);
  min-height: clamp(68px, 12vh, 118px);
  place-items: center;
  align-content: center;
  gap: 6px;
  padding: clamp(10px, 2vw, 18px);
  color: #f8fafc;
  background: linear-gradient(
    90deg,
    rgba(0, 19, 50, 0),
    rgba(15, 23, 42, 0.9) 24%,
    rgba(0, 19, 50, 0.94) 50%,
    rgba(15, 23, 42, 0.9) 76%,
    rgba(0, 19, 50, 0)
  );

  text-align: center;
  text-transform: uppercase;
  transform-origin: 50% 50%;
  will-change: transform, opacity, filter;
}

.fly-in-text-modal__title,
.fly-in-text-modal__text,
.fly-in-text-modal__player,
.fly-in-text-modal__name {
  margin: 0;
}

.fly-in-text-modal__title {
  color: #facc15;
  font-size: var(--text-xs);
  font-weight: 900;
  letter-spacing: 0.18em;
}

.fly-in-text-modal__text {
  max-width: 18ch;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 0.95;
  text-shadow:
    0 4px 18px rgba(0, 0, 0, 0.48),
    0 0 24px rgba(250, 204, 21, 0.28);
  overflow-wrap: anywhere;
}

.fly-in-text-modal__player {
  display: grid;
  place-items: center;
  gap: 8px;
}

.fly-in-text-modal__avatar {
  display: block;
  width: clamp(54px, 9vw, 82px);
  aspect-ratio: 1;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--fly-in-player-border);
  background: rgba(15, 23, 42, 0.8);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.36),
    0 0 0 6px var(--fly-in-player-ring),
    0 0 22px var(--fly-in-player-glow),
    0 0 54px var(--fly-in-player-deep-glow);
}

.fly-in-text-modal__name {
  color: var(--fly-in-player-accent);
  font-size: var(--text-md);
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1.1;
  text-transform: none;
  text-shadow:
    0 3px 12px rgba(0, 0, 0, 0.52),
    0 0 18px var(--fly-in-player-name-glow);
  overflow-wrap: anywhere;
}

.fly-in-text-modal-enter-active {
  transition: opacity 0.16s ease;
}

.fly-in-text-modal-leave-active {
  transition: opacity 0.22s ease;
}

.fly-in-text-modal-enter-active .fly-in-text-modal__panel {
  transition:
    transform 0.48s cubic-bezier(0.17, 0.84, 0.32, 1.18),
    opacity 0.22s ease,
    filter 0.48s ease;
}

.fly-in-text-modal-leave-active .fly-in-text-modal__panel {
  transition:
    transform 0.22s ease,
    opacity 0.22s ease,
    filter 0.22s ease;
}

.fly-in-text-modal-enter-from,
.fly-in-text-modal-leave-to {
  opacity: 0;
}

.fly-in-text-modal-enter-from .fly-in-text-modal__panel {
  opacity: 0;
  filter: blur(2px);
  transform: translate3d(-110vw, 0, 0) skewX(8deg);
}

.fly-in-text-modal-leave-to .fly-in-text-modal__panel {
  opacity: 0;
  filter: blur(1px);
  transform: translate3d(110vw, 0, 0) skewX(-8deg);
}

@media (max-width: 640px) {
  .fly-in-text-modal__panel {
    width: min(100%, 420px);
    min-height: 96px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fly-in-text-modal-enter-active,
  .fly-in-text-modal-leave-active,
  .fly-in-text-modal-enter-active .fly-in-text-modal__panel,
  .fly-in-text-modal-leave-active .fly-in-text-modal__panel {
    transition: opacity 0.16s ease;
  }

  .fly-in-text-modal-enter-from .fly-in-text-modal__panel,
  .fly-in-text-modal-leave-to .fly-in-text-modal__panel {
    transform: none;
  }
}
</style>
