<script setup>
import { nextTick, ref } from "vue";
import gameTableBackgroundUrl from "@/assets/images/bg-game-table.webp";
import gameLogoUrl from "@/assets/images/logo-en-white.png";
import { useAudioSettings } from "@/composables/UseAudioSettings";
import CardDrawAnimation from "./CardDrawAnimation.vue";
import GameSettingsIcon from "./GameSettingsIcon.vue";
import GameSettingsModal from "./GameSettingsModal.vue";
import PlayerHand from "./PlayerHand.vue";
import PlayerSeats from "./PlayerSeats.vue";
import RotateDeviceNotice from "./RotateDeviceNotice.vue";
import TableCardPiles from "./TableCardPiles.vue";
import TurnStatus from "./TurnStatus.vue";

const props = defineProps({
  roundNumber: {
    type: [Number, String],
    required: true,
  },
  currentPhase: {
    type: String,
    required: true,
  },
  currentStep: {
    type: String,
    required: true,
  },
  deckCount: {
    type: [Number, String],
    required: true,
  },
  discardCard: {
    type: Object,
    required: true,
  },
  players: {
    type: Array,
    required: true,
  },
  handCards: {
    type: Array,
    required: true,
    validator: (cards) =>
      cards.every(
        (card) =>
          typeof card?.id === "string" &&
          typeof card?.name === "string" &&
          typeof card?.backgroundUrl === "string" &&
          typeof card?.frameUrl === "string",
      ),
  },
  drawCard: {
    type: Object,
    default: null,
    validator: (card) =>
      card === null ||
      (typeof card?.id === "string" &&
        typeof card?.name === "string" &&
        typeof card?.backgroundUrl === "string" &&
        typeof card?.frameUrl === "string"),
  },
});

const emit = defineEmits(["return-lobby", "restart-game", "draw-complete"]);
const isSettingsOpen = ref(false);
const isDrawAnimating = ref(false);
const activeDrawCard = ref(null);
const tableCardPiles = ref(null);
const playerHand = ref(null);
const cardDrawAnimation = ref(null);
const {
  musicEnabled,
  musicVolume,
  soundEnabled,
  soundVolume,
  setMusicEnabled,
  setMusicVolume,
  setSoundEnabled,
  setSoundVolume,
} = useAudioSettings();

function openSettings() {
  isSettingsOpen.value = true;
}

function closeSettings() {
  isSettingsOpen.value = false;
}

function handleReturnLobby() {
  emit("return-lobby");
}

function handleRestartGame() {
  emit("restart-game");
}

async function playDrawAnimation() {
  if (isDrawAnimating.value || !props.drawCard) {
    return;
  }

  isDrawAnimating.value = true;
  activeDrawCard.value = { ...props.drawCard };
  playerHand.value?.prepareDrawTarget();
  await nextTick();

  const startRect = tableCardPiles.value?.getDeckRect();
  const targetRect = playerHand.value?.getDrawTargetRect();

  if (!startRect || !targetRect) {
    playerHand.value?.finishDraw();
    activeDrawCard.value = null;
    isDrawAnimating.value = false;
    return;
  }

  try {
    await cardDrawAnimation.value?.play({
      startRect,
      targetRect,
      onLanded: () => emit("draw-complete", activeDrawCard.value),
    });
    await nextTick();
  } finally {
    playerHand.value?.finishDraw();
    activeDrawCard.value = null;
    isDrawAnimating.value = false;
  }
}

defineExpose({
  playDrawAnimation,
});
</script>

<template>
  <main
    class="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--brand-navy)]"
  >
    <section
      class="game-stage relative hidden h-[100dvh] w-[100dvw] overflow-hidden bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${gameTableBackgroundUrl})` }"
      aria-label="Office Politics 遊戲桌"
    >
      <PlayerSeats :players="players" />

      <div class="turn-controls absolute top-5 left-3 lg:top-8 lg:left-6">
        <TurnStatus
          :round-number="roundNumber"
          :current-phase="currentPhase"
          :current-step="currentStep"
        />
      </div>

      <div
        class="game-brand-tools absolute top-2 right-3 flex items-center gap-2 lg:top-4 lg:right-4 lg:gap-6"
      >
        <img
          :src="gameLogoUrl"
          alt="Office Politics"
          class="block h-auto w-24 select-none object-contain drop-shadow-[0_3px_10px_rgba(0,19,50,0.48)] lg:w-40"
          draggable="false"
        />
        <GameSettingsIcon @open="openSettings" />
      </div>

      <div
        class="table-card-piles absolute top-[42%] left-1/2 -translate-x-1/2"
      >
        <TableCardPiles
          ref="tableCardPiles"
          :deck-count="deckCount"
          :discard-card="discardCard"
          :is-draw-disabled="isDrawAnimating || !drawCard"
          @draw="playDrawAnimation"
        />
      </div>

      <div class="absolute -bottom-10 left-1/2 z-20 -translate-x-1/2">
        <PlayerHand ref="playerHand" :cards="handCards" />
      </div>

      <CardDrawAnimation ref="cardDrawAnimation" :card="activeDrawCard" />
    </section>

    <GameSettingsModal
      :is-open="isSettingsOpen"
      :music-enabled="musicEnabled"
      :music-volume="musicVolume"
      :sound-enabled="soundEnabled"
      :sound-volume="soundVolume"
      @close="closeSettings"
      @update:music-enabled="setMusicEnabled"
      @update:music-volume="setMusicVolume"
      @update:sound-enabled="setSoundEnabled"
      @update:sound-volume="setSoundVolume"
      @return-lobby="handleReturnLobby"
      @restart-game="handleRestartGame"
    />

    <RotateDeviceNotice />
  </main>
</template>

<style scoped>
@media (orientation: landscape), (min-width: 768px) {
  .game-stage {
    display: block;
  }
}
</style>
