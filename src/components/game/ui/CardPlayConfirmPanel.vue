<script setup>
import { computed } from "vue";
import CardGuessSelector from "./CardGuessSelector.vue";

const props = defineProps({
  pendingPlay: {
    type: Object,
    required: true,
  },
  pendingRequiresTarget: {
    type: Boolean,
    default: false,
  },
  pendingRequiresGuess: {
    type: Boolean,
    default: false,
  },
  selectedTargetPlayer: {
    type: Object,
    default: null,
  },
  selectedGuessRank: {
    type: Number,
    default: null,
  },
  guessOptions: {
    type: Array,
    required: true,
  },
  canConfirmPendingPlay: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select-guess", "confirm", "cancel"]);

const selectedGuessOption = computed(
  () =>
    props.guessOptions.find(
      (option) => option.rank === props.selectedGuessRank,
    ) ?? null,
);
</script>

<template>
  <section class="play-confirm-panel" aria-label="出牌確認">
    <div class="play-confirm-panel__summary">
      <span>準備出牌</span>
      <strong>{{ pendingPlay.card.name }}</strong>
      <small>
        {{
          pendingRequiresTarget
            ? selectedTargetPlayer
              ? `目標：${selectedTargetPlayer.name}`
              : "請點選玩家頭像"
            : "此牌不需要指定目標"
        }}
      </small>
    </div>

    <CardGuessSelector
      v-if="pendingRequiresGuess"
      :guess-options="guessOptions"
      :selected-rank="selectedGuessRank"
      :excluded-ranks="[1]"
      @select="emit('select-guess', $event)"
    />

    <p v-if="pendingRequiresGuess" class="play-confirm-panel__hint">
      {{
        selectedGuessOption
          ? `猜測：${selectedGuessOption.name}`
          : "實習生不能猜實習生，請選擇 2-8 的牌。"
      }}
    </p>

    <div class="play-confirm-panel__actions">
      <button type="button" @click="emit('cancel')">取消</button>
      <button
        type="button"
        class="play-confirm-panel__confirm"
        :disabled="!canConfirmPendingPlay"
        @click="emit('confirm')"
      >
        確認出牌
      </button>
    </div>
  </section>
</template>

<style scoped>
.play-confirm-panel {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 78;
  display: grid;
  gap: 12px;
  width: min(340px, calc(100vw - 32px));
  max-height: min(420px, calc(100dvh - 224px));
  overflow: auto;
  border: 1px solid rgba(250, 204, 21, 0.58);
  border-radius: var(--radius-md, 0);
  padding: 16px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(7, 17, 29, 0.9)),
    rgba(7, 17, 29, 0.82);
  box-shadow:
    0 0 24px rgba(250, 204, 21, 0.16),
    0 22px 48px rgba(0, 0, 0, 0.46);
  color: #f8fafc;
  backdrop-filter: blur(10px);
}

.play-confirm-panel__summary {
  display: grid;
  gap: 4px;
}

.play-confirm-panel__summary span {
  color: #facc15;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.play-confirm-panel__summary strong {
  font-size: 24px;
  line-height: 1.05;
}

.play-confirm-panel__summary small,
.play-confirm-panel__hint {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;
}

.play-confirm-panel__hint {
  margin: 0;
}

.play-confirm-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.play-confirm-panel__actions button {
  min-height: 38px;
  border: 1px solid rgba(148, 163, 184, 0.48);
  border-radius: var(--radius-md, 0);
  padding: 0 12px;
  cursor: pointer;
  background: rgba(15, 23, 42, 0.72);
  color: #f8fafc;
  font-size: 13px;
  font-weight: 900;
}

.play-confirm-panel__confirm {
  border-color: rgba(250, 204, 21, 0.72) !important;
  background: rgba(250, 204, 21, 0.18) !important;
}

.play-confirm-panel__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
