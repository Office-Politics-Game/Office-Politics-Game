<script setup>
import bonusChequeTokenUrl from "@/assets/images/bonus-cheque-token.png";

defineProps({
  name: {
    type: String,
    required: true,
  },
  avatarUrl: {
    type: String,
    required: true,
  },
  roundWins: {
    type: Number,
    required: true,
    validator: (value) => Number.isInteger(value) && value >= 0 && value <= 3,
  },
  level: {
    type: [Number, String],
    default: 12,
  },
  isCurrentPlayer: {
    type: Boolean,
    default: false,
  },
  isTurnPlayer: {
    type: Boolean,
    default: false,
  },
  isMirrored: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <section
    class="player-avatar flex items-center gap-1.5 text-white lg:gap-3"
    :class="{
      'player-avatar--current': isCurrentPlayer,
      'player-avatar--turn': isTurnPlayer,
      'player-avatar--mirrored': isMirrored,
      'flex-row-reverse': isMirrored,
    }"
    :aria-label="`${name}，已取得 ${roundWins}／3 枚年終支票`"
  >
    <div class="player-avatar__portrait relative z-20">
      <div
        class="player-avatar__frame relative z-10 size-13 overflow-hidden rounded-full border-1 border-white bg-[rgba(0,19,50,0.62)] shadow-[0_7px_20px_rgba(0,19,50,0.36)] lg:size-21 lg:border-3"
      >
        <img
          :src="avatarUrl"
          alt=""
          aria-hidden="true"
          class="block size-full select-none rounded-full object-contain"
          draggable="false"
        />
      </div>

      <span
        class="player-avatar__level absolute -right-1 -bottom-1 z-20 grid size-6 place-items-center rounded-full bg-white text-sm font-black italic leading-none text-[var(--brand-active)] shadow-[0_5px_14px_rgba(0,19,50,0.32)] lg:-right-2 lg:-bottom-2 lg:size-10 lg:text-lg"
        aria-hidden="true"
      >
        {{ level }}
      </span>
    </div>

    <div
      class="player-avatar__info relative z-0 w-40 px-2 py-1 backdrop-blur-1.5 -translate-x-10 lg:px-3 lg:py-2 lg:w-60"
      :class="{
        'player-avatar__info--mirrored': isMirrored,
        'text-left translate-x-10': isMirrored,
      }"
    >
      <p
        class="player-avatar__name m-0 max-w-23 truncate text-sm font-medium tracking-[0.06em] text-white lg:max-w-37 lg:text-md"
        :class="
          isMirrored
            ? 'text-right translate-x-4 lg:translate-x-10'
            : 'translate-x-10'
        "
      >
        {{ name }}
      </p>
      <div
        class="player-avatar__cheques flex items-center gap-1.5 lg:gap-3"
        :class="{ 'justify-start': isMirrored }"
        aria-hidden="true"
      >
        <span
          v-for="slot in 3"
          :key="slot"
          class="player-avatar__cheque-slot grid size-5 place-items-center lg:size-10"
          :class="
            isMirrored ? 'translate-x-9 lg:translate-x-11' : 'translate-x-10'
          "
        >
          <img
            v-if="slot <= roundWins"
            :src="bonusChequeTokenUrl"
            alt=""
            class="block size-6 select-none object-contain lg:size-8 lg:translate-y-0"
            draggable="false"
          />
          <span
            v-else
            class="player-avatar__cheque-placeholder block size-4 rounded-full border border-dashed border-white/70 lg:size-7"
          />
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.player-avatar__info {
  background: linear-gradient(
    90deg,
    rgba(0, 19, 50, 0.82) 0%,
    rgba(0, 19, 50, 0.62) 30%,
    rgba(0, 19, 50, 0) 100%
  );
}

.player-avatar__info--mirrored {
  background: linear-gradient(
    270deg,
    rgba(0, 19, 50, 0.82) 0%,
    rgba(0, 19, 50, 0.62) 48%,
    rgba(0, 19, 50, 0) 100%
  );
}

.player-avatar__cheque-slot img {
  transform: rotate(-15deg) scale(1.15);
}

.player-avatar--turn .player-avatar__frame {
  animation: current-player-glow 1.05s ease-in-out infinite;
  border-color: #ffffff;
  box-shadow:
    0 0 0 6px rgba(0, 70, 244, 0.26),
    0 0 0 10px rgba(255, 255, 255, 0.12),
    0 0 38px rgba(0, 70, 244, 0.72),
    0 8px 22px rgba(0, 19, 50, 0.42);
}

.player-avatar--turn .player-avatar__portrait::before,
.player-avatar--turn .player-avatar__portrait::after {
  content: "";
  position: absolute;
  z-index: 0;
  border-radius: 9999px;
  pointer-events: none;
}

.player-avatar--turn .player-avatar__portrait::before {
  inset: -6px;
  background:
    conic-gradient(
      from 0deg,
      rgba(255, 255, 255, 0.88),
      rgba(0, 70, 244, 0.92),
      rgba(134, 179, 224, 0.78),
      rgba(255, 255, 255, 0.88)
    );
  filter: drop-shadow(0 0 6px rgba(0, 70, 244, 0.5));
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 2px),
    #000 calc(100% - 1px)
  );
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 2px),
    #000 calc(100% - 1px)
  );
  animation: turn-player-ring-spin 2.2s linear infinite;
}

.player-avatar--turn .player-avatar__portrait::after {
  inset: -15px;
  background: radial-gradient(
    circle,
    rgba(134, 179, 224, 0.46),
    rgba(0, 70, 244, 0.24) 48%,
    transparent 72%
  );
  filter: blur(2px);
  animation: turn-player-pulse 1.2s ease-in-out infinite;
}

.player-avatar--turn .player-avatar__level {
  border: 2px solid #ffffff;
  background: var(--brand-hover);
  color: #ffffff;
  box-shadow:
    0 0 0 3px rgba(0, 70, 244, 0.24),
    0 0 22px rgba(0, 70, 244, 0.66),
    0 5px 14px rgba(0, 19, 50, 0.32);
}

.player-avatar--turn .player-avatar__info {
  background: linear-gradient(
    90deg,
    rgba(0, 19, 50, 0.9) 0%,
    rgba(0, 70, 244, 0.34) 36%,
    rgba(0, 19, 50, 0.08) 100%
  );
  box-shadow:
    inset 3px 0 0 rgba(134, 179, 224, 0.92),
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 0 18px rgba(0, 70, 244, 0.24);
}

.player-avatar--turn .player-avatar__info--mirrored {
  background: linear-gradient(
    270deg,
    rgba(0, 19, 50, 0.9) 0%,
    rgba(0, 70, 244, 0.34) 42%,
    rgba(0, 19, 50, 0.08) 100%
  );
  box-shadow:
    inset -3px 0 0 rgba(134, 179, 224, 0.92),
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 0 18px rgba(0, 70, 244, 0.24);
}

@media (max-width: 767px) {
  .player-avatar {
    transform: scale(0.85);
    transform-origin: center center;
  }
}

@keyframes current-player-glow {
  0%,
  100% {
    box-shadow:
      0 0 0 5px rgba(0, 70, 244, 0.22),
      0 0 0 9px rgba(255, 255, 255, 0.1),
      0 0 34px rgba(0, 70, 244, 0.58),
      0 8px 22px rgba(0, 19, 50, 0.42);
  }

  50% {
    box-shadow:
      0 0 0 8px rgba(0, 70, 244, 0.34),
      0 0 0 13px rgba(255, 255, 255, 0.18),
      0 0 50px rgba(0, 70, 244, 0.84),
      0 8px 22px rgba(0, 19, 50, 0.42);
  }
}

@keyframes turn-player-ring-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes turn-player-pulse {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(0.97);
  }

  50% {
    opacity: 1;
    transform: scale(1.04);
  }
}
</style>
