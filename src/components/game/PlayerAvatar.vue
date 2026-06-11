<script setup>
import { computed } from 'vue'
import bonusChequeTokenUrl from '@/assets/BonusChequeToken.png'

const props = defineProps({
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
  isCurrentPlayer: {
    type: Boolean,
    default: false,
  },
})

const isMatchWinner = computed(() => props.roundWins === 3)
</script>

<template>
  <section
    class="player-avatar flex items-center gap-[clamp(6px,1vw,12px)] text-white"
    :class="{
      'player-avatar--current': isCurrentPlayer,
      'player-avatar--winner': isMatchWinner,
    }"
    :aria-label="`${name}，已取得 ${roundWins}／3 枚年終支票`"
  >
    <div
      class="player-avatar__frame relative size-[clamp(58px,11.5vh,112px)] shrink-0 overflow-hidden border border-white/80 bg-[rgba(0,19,50,0.62)] shadow-[0_7px_20px_rgba(0,19,50,0.36)]"
    >
      <img
        :src="avatarUrl"
        alt=""
        aria-hidden="true"
        class="block size-full select-none object-contain"
        draggable="false"
      />
    </div>

    <div
      class="player-avatar__info relative min-w-0 border-l-2 border-white/72 bg-[rgba(0,19,50,0.68)] px-[clamp(7px,1vw,12px)] py-[clamp(5px,0.8vh,8px)] shadow-[0_5px_16px_rgba(0,19,50,0.28)] backdrop-blur-[6px]"
    >
      <span
        v-if="isMatchWinner"
        class="player-avatar__winner-label absolute right-0 bottom-full bg-[var(--winner-gold)] px-2 py-0.5 text-[10px] font-black tracking-[0.08em] text-[var(--brand-navy)]"
      >
        年度分紅得主
      </span>
      <p
        class="player-avatar__name m-0 max-w-[clamp(86px,12vw,148px)] truncate text-[var(--text-sm)] font-semibold tracking-[0.06em] text-white"
      >
        {{ name }}
      </p>
      <div
        class="player-avatar__cheques mt-1 flex items-center gap-[clamp(3px,0.5vw,6px)]"
        aria-hidden="true"
      >
        <span
          v-for="slot in 3"
          :key="slot"
          class="player-avatar__cheque-slot grid h-[clamp(18px,3.2vh,28px)] w-[clamp(28px,4.3vw,42px)] place-items-center border border-white/50 bg-[rgba(160,166,179,0.28)]"
          :class="{ 'player-avatar__cheque-slot--active': slot <= roundWins }"
        >
          <img
            :src="bonusChequeTokenUrl"
            alt=""
            class="block size-full select-none object-contain"
            draggable="false"
          />
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.player-avatar {
  --winner-gold: #e5a62b;
}

.player-avatar__cheque-slot img {
  filter: grayscale(1) brightness(0.58);
  opacity: 0.34;
}

.player-avatar__cheque-slot--active {
  border-color: var(--brand-primary);
  background: rgba(134, 179, 224, 0.18);
  box-shadow: 0 0 8px rgba(134, 179, 224, 0.34);
}

.player-avatar__cheque-slot--active img {
  filter: none;
  opacity: 1;
}

.player-avatar--current .player-avatar__frame {
  animation: current-player-glow 1.6s ease-in-out infinite;
  border-color: var(--brand-hover);
  box-shadow:
    0 0 0 3px var(--brand-focus),
    0 0 24px rgba(0, 70, 244, 0.62),
    0 8px 22px rgba(0, 19, 50, 0.42);
}

.player-avatar--current .player-avatar__info {
  border-left-color: var(--brand-hover);
  background: rgba(0, 19, 50, 0.82);
}

.player-avatar--winner .player-avatar__frame {
  border-color: var(--winner-gold);
  box-shadow:
    0 0 0 3px rgba(229, 166, 43, 0.22),
    0 0 24px rgba(229, 166, 43, 0.58),
    0 8px 22px rgba(0, 19, 50, 0.42);
}

.player-avatar--winner .player-avatar__info {
  border-left-color: var(--winner-gold);
  background: rgba(0, 19, 50, 0.86);
}

.player-avatar--winner .player-avatar__cheque-slot--active {
  border-color: var(--winner-gold);
  box-shadow: 0 0 9px rgba(229, 166, 43, 0.52);
}

.player-avatar--winner.player-avatar--current .player-avatar__frame {
  border-color: var(--brand-hover);
}

@keyframes current-player-glow {
  0%,
  100% {
    box-shadow:
      0 0 0 3px var(--brand-focus),
      0 0 18px rgba(0, 70, 244, 0.46),
      0 8px 22px rgba(0, 19, 50, 0.42);
  }

  50% {
    box-shadow:
      0 0 0 4px rgba(0, 70, 244, 0.28),
      0 0 28px rgba(0, 70, 244, 0.72),
      0 8px 22px rgba(0, 19, 50, 0.42);
  }
}

@media (prefers-reduced-motion: reduce) {
  .player-avatar--current .player-avatar__frame {
    animation: none;
    box-shadow:
      0 0 0 3px var(--brand-focus),
      0 0 20px rgba(0, 70, 244, 0.54),
      0 8px 22px rgba(0, 19, 50, 0.42);
  }
}

@media (max-height: 480px) and (orientation: landscape) {
  .player-avatar {
    gap: 4px;
  }

  .player-avatar__info {
    padding: 4px 5px;
  }

  .player-avatar__name {
    max-width: 78px;
  }

  .player-avatar__cheques {
    gap: 2px;
    margin-top: 3px;
  }

  .player-avatar__cheque-slot {
    width: 22px;
    height: 14px;
  }
}
</style>
