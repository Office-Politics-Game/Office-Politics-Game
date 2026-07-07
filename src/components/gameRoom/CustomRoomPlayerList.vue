<script setup>
import { computed } from "vue";
import { UserPlus } from "@lucide/vue";
import waitingRoomPlayer from "@/assets/images/waiting-room-player.webp";

const props = defineProps({
  slots: {
    type: Array,
    required: true,
  },
});

defineEmits(["add-computer", "invite-friend", "remove-player", "toggle-ready"]);

function getMetaLabel(slot) {
  if (slot.level) {
    return `Lv. ${slot.level}`;
  }

  if (slot.isHost) {
    return "Host";
  }

  return slot.isReady ? "Ready" : "Not Ready";
}

const normalizedSlots = computed(() =>
  props.slots.map((slot) => ({
    ...slot,
    displayName: slot.name ?? slot.option1,
    metaLabel: getMetaLabel(slot),
    badgeLabel: slot.name && slot.isHost ? "房主" : "\u00A0",
  })),
);
</script>

<template>
  <section
    class="pointer-events-none flex justify-center"
    aria-label="房間玩家列表"
  >
    <div
      class="flex h-[232px] w-[572px] items-center justify-center gap-5 lg:h-[420px] lg:w-[1034px] lg:gap-4"
    >
      <article
        v-for="(slot, index) in normalizedSlots"
        :key="slot.id ?? `${slot.option1}-${index}`"
        class="room-player-slot pointer-events-auto grid aspect-[789/1462] h-full flex-none"
      >
        <img
          class="room-player-paper pointer-events-none col-start-1 row-start-1 h-full w-full object-contain"
          :src="waitingRoomPlayer"
          alt=""
          aria-hidden="true"
        />

        <div
          class="room-player-safe-zone col-start-1 row-start-1 mx-auto mt-[20%] flex h-[70%] w-[80%] flex-col items-center text-center"
        >
          <img
            v-if="slot.avatar"
            class="room-player-avatar-image mt-10 h-[42px] w-[42px] flex-none rounded-full border-2 border-white/70 object-cover lg:mt-20 lg:h-[76px] lg:w-[76px]"
            :src="slot.avatar"
            :alt="slot.displayName"
          />
          <UserPlus
            v-else
            class="room-player-avatar mt-10 h-[34px] w-[34px] flex-none lg:mt-20 lg:h-[68px] lg:w-[68px]"
            :stroke-width="1.9"
          />

          <template v-if="slot.name">
            <div class="room-player-info mt-[10px] flex w-full flex-col items-center lg:mt-[24px]">
              <p
                class="room-player-badge m-0 text-[11px] font-black leading-none lg:text-[16px]"
                :class="{ 'room-player-badge--host': slot.isHost }"
              >
                {{ slot.badgeLabel }}
              </p>

              <p
                class="room-player-title m-0 w-full text-center text-[14px] font-black leading-[1.12] lg:text-[28px]"
                :title="slot.displayName"
              >
                {{ slot.displayName }}
              </p>

              <p class="room-player-level m-0 text-[10px] font-extrabold leading-none lg:text-[14px]">
                {{ slot.metaLabel }}
              </p>
            </div>

            <div class="room-player-action-row mt-3 flex min-h-[30px] items-center justify-center lg:mt-6 lg:min-h-[42px]">
              <button
                v-if="!slot.isHost && slot.showActionButton !== false"
                class="btn-dark tap-pop room-ready-button relative z-[1] self-center rounded px-3 py-[5px] text-[11px] font-black leading-none lg:px-5 lg:py-2 lg:text-[15px]"
                type="button"
                @click="
                  slot.canToggleReady
                    ? $emit('toggle-ready', slot)
                    : $emit('remove-player', index)
                "
              >
                {{
                  slot.actionLabel ??
                  (slot.canToggleReady ? (slot.isReady ? '取消準備' : '準備') : '踢除')
                }}
              </button>
            </div>
          </template>

          <div
            v-else
            class="room-player-options mt-[10px] flex w-full flex-col items-center gap-[6px] lg:mt-[24px] lg:gap-[14px]"
          >
            <button
              class="room-player-option-button m-0 w-full whitespace-nowrap border-0 bg-transparent text-center text-[14px] font-black leading-[1.12] lg:text-[28px]"
              type="button"
              :disabled="slot.isActionDisabled"
              @click="$emit('add-computer', index)"
            >
              {{ slot.option1 }}
            </button>
            <button
              v-if="slot.option2"
              class="room-player-option-button m-0 w-full whitespace-nowrap border-0 bg-transparent text-center text-[14px] font-black leading-[1.12] lg:text-[28px]"
              type="button"
              :disabled="!slot.canInviteFriend"
              @click="$emit('invite-friend', index)"
            >
              {{ slot.option2 }}
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.room-player-slot {
  color: var(--brand-active, #465563);
}

.room-player-safe-zone {
  color: var(--brand-active, #465563);
  justify-content: center;
  padding-block: 4% 10%;
}

.room-player-avatar {
  color: var(--brand-active, #465563);
}

.room-player-avatar-image {
  box-shadow: 0 6px 14px rgba(0, 19, 50, 0.18);
}

.room-player-title,
.room-player-option-button {
  border-radius: var(--radius-md, 0);
  color: var(--brand-active, #465563);
}

.room-player-badge {
  min-height: 1em;
  margin-bottom: 8px;
  color: transparent;
}

.room-player-badge--host {
  color: var(--brand-hover, #0046f4);
}

.room-player-title {
  display: -webkit-box;
  min-height: 2.3em;
  overflow: hidden;
  padding-inline: 6px;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.room-player-level {
  min-height: 1.2em;
  margin-top: 8px;
  color: var(--brand-active, #465563);
}

.room-player-info,
.room-player-options {
  min-height: 96px;
  justify-content: flex-start;
}

.room-player-action-row {
  width: 100%;
}

.room-player-option-button {
  cursor: pointer;
  transition:
    color 180ms ease,
    opacity 180ms ease,
    transform 180ms ease;
}

.room-player-option-button:disabled {
  cursor: not-allowed;
  opacity: 0.46;
}

.room-player-option-button:hover:not(:disabled) {
  color: var(--brand-hover, #0046f4);
  opacity: 0.92;
  transform: translateY(-1px);
}

.room-player-option-button:active:not(:disabled) {
  color: var(--brand-active, #465563);
  transform: translateY(1px);
}

.room-player-option-button:focus-visible,
.room-ready-button:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
}

.room-ready-button {
  min-width: 92px;
  cursor: pointer;
  pointer-events: auto;
}

@media (min-width: 1024px) {
  .room-player-badge {
    margin-bottom: 14px;
  }

  .room-player-title {
    min-height: 2.45em;
    padding-inline: 10px;
  }

  .room-player-level {
    margin-top: 14px;
  }

  .room-player-info,
  .room-player-options {
    min-height: 132px;
  }

  .room-ready-button {
    min-width: 118px;
  }
}
</style>
