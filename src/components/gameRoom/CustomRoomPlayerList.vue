<script setup>
import { Award, Crown, UserPlus, X } from "@lucide/vue";
import waitingRoomPlayer from "@/assets/images/waiting-room-player.webp";

defineProps({
  slots: {
    type: Array,
    required: true,
  },
  isRestoring: {
    type: Boolean,
    default: false,
  },
  controlsDisabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["add-computer", "invite-friend", "remove-player"]);
</script>

<template>
  <section
    class="pointer-events-none flex justify-center"
    aria-label="等待房間玩家列表"
  >
    <div
      class="flex h-[232px] w-[572px] items-center justify-center gap-5 lg:h-[420px] lg:w-[1034px] lg:gap-4"
    >
      <article
        v-for="(slot, index) in slots"
        :key="slot.id ?? `${slot.option1}-${index}`"
        class="room-player-slot pointer-events-auto grid aspect-[789/1462] h-full flex-none"
        :class="{ 'room-player-slot--host': slot.isHost }"
      >
        <img
          class="room-player-paper pointer-events-none col-start-1 row-start-1 h-full w-full object-contain"
          :src="waitingRoomPlayer"
          alt=""
          aria-hidden="true"
        />

        <button
          v-if="slot.name && !slot.isPlaceholder && slot.canRemovePlayer"
          class="room-remove-button tap-pop col-start-1 row-start-1"
          type="button"
          aria-label="移除玩家"
          title="移除玩家"
          :disabled="controlsDisabled || !slot.canRemovePlayer"
          @click="$emit('remove-player', index)"
        >
          <X class="h-3.5 w-3.5 lg:h-5 lg:w-5" :stroke-width="3" />
        </button>

        <div
          class="room-player-safe-zone col-start-1 row-start-1 mx-auto mt-[20%] flex h-[70%] w-[80%] flex-col items-center text-center"
          :class="{
            'room-player-safe-zone--restoring': slot.isPlaceholder,
            'room-player-safe-zone--removing': slot.isPendingRemoval,
          }"
        >
          <div class="room-player-avatar-wrap mt-[23px] lg:mt-[52px]">
            <img
              v-if="slot.avatar"
              class="room-player-avatar-image h-[42px] w-[42px] flex-none rounded-full border-2 border-white/70 object-cover lg:h-[76px] lg:w-[76px]"
              :src="slot.avatar"
              :alt="slot.name"
            />
            <div
              v-else-if="slot.isPendingComputer"
              class="room-player-avatar room-player-avatar--pending h-[42px] w-[42px] lg:h-[76px] lg:w-[76px]"
            >
              <UserPlus
                class="h-[34px] w-[34px] flex-none lg:h-[68px] lg:w-[68px]"
                :stroke-width="1.9"
              />
            </div>
            <UserPlus
              v-else
              class="room-player-avatar h-[34px] w-[34px] flex-none lg:h-[68px] lg:w-[68px]"
              :class="{ 'room-player-avatar--restoring': slot.isPlaceholder }"
              :stroke-width="1.9"
            />
            <span
              v-if="slot.isHost && slot.name && !slot.isPlaceholder"
              class="room-host-badge"
              aria-label="房主"
              title="房主"
            >
              <Crown class="h-3 w-3 lg:h-4 lg:w-4" :stroke-width="2.8" />
            </span>
          </div>

          <div
            v-if="slot.name"
            class="room-player-info mt-[6px] flex w-full flex-col items-center gap-[6px] lg:mt-[14px] lg:gap-[14px]"
            :class="{
              'room-player-info--with-title': slot.title && !slot.isPlaceholder,
            }"
          >
            <p
              class="room-player-title m-0 w-full text-center text-[10px] font-black leading-[1.12] lg:text-[20px]"
              :title="slot.name ?? slot.option1"
              :class="{
                'room-player-title--restoring': slot.isPlaceholder,
                'room-player-title--removing': slot.isPendingRemoval,
              }"
            >
              {{ slot.name ?? slot.option1 }}
            </p>
            <p
              v-if="slot.title && !slot.isPlaceholder"
              class="room-player-achievement-title m-0"
              :title="slot.title"
            >
              <Award
                class="room-player-achievement-icon h-[11px] w-[11px] flex-none lg:h-[18px] lg:w-[18px]"
                :stroke-width="2.4"
                aria-hidden="true"
              />
              <span class="min-w-0 truncate">{{ slot.title }}</span>
            </p>
            <p
              v-if="slot.level"
              class="room-player-level m-0 text-[10px] font-extrabold leading-none lg:text-[14px]"
            >
              Lv. {{ slot.level }}
            </p>
            <p
              v-else-if="slot.placeholderLabel"
              class="room-player-level m-0 text-[10px] font-extrabold leading-none lg:text-[14px]"
              :class="{
                'room-player-level--restoring': slot.isPlaceholder,
                'room-player-level--pending': slot.isPendingComputer,
                'room-player-level--removing': slot.isPendingRemoval,
              }"
            >
              {{ slot.placeholderLabel }}
              <span
                v-if="slot.isPendingComputer || slot.isPendingRemoval"
                class="room-player-loading-dots"
                aria-hidden="true"
              ></span>
            </p>
          </div>

          <div
            v-else
            class="room-player-options mt-[10px] flex w-full flex-col items-center gap-[6px] lg:mt-[24px] lg:gap-[14px]"
          >
            <button
              class="room-player-option-button m-0 w-full whitespace-nowrap border-0 bg-transparent text-center text-[14px] font-black leading-[1.12] lg:text-[28px]"
              type="button"
              :disabled="controlsDisabled || !slot.canAddComputer"
              @click="$emit('add-computer', index)"
            >
              {{ slot.option1 }}
            </button>
            <button
              v-if="slot.option2"
              class="room-player-option-button m-0 w-full whitespace-nowrap border-0 bg-transparent text-center text-[14px] font-black leading-[1.12] lg:text-[28px]"
              type="button"
              :disabled="controlsDisabled || !slot.canInviteFriend"
              @click="$emit('invite-friend', index)"
            >
              {{ slot.option2 }}
            </button>
          </div>

          <div
            v-if="slot.name && !slot.isHost && !slot.isPlaceholder && !slot.isPendingRemoval"
            class="room-ready-stamp mt-auto pt-[6px] lg:pt-[14px]"
            :class="{ 'room-ready-stamp--pending': !slot.isReady }"
            :aria-label="slot.isReady ? '已打卡' : '未打卡'"
          >
            <span class="room-ready-stamp-icon">
              {{ slot.isReady ? "✓" : "×" }}
            </span>
            {{ slot.isReady ? "已打卡" : "未打卡" }}
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.room-player-slot {
  position: relative;
  color: var(--brand-active, #465563);
}

.room-player-safe-zone {
  position: relative;
  color: var(--brand-active, #465563);
}

.room-player-avatar {
  color: var(--brand-active, #465563);
}

.room-player-avatar--pending {
  position: relative;
  display: grid;
  place-items: center;
  border: 2px dashed rgba(70, 85, 99, 0.38);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  animation: room-pending-avatar-pulse 1.15s ease-in-out infinite;
}

.room-player-avatar--restoring,
.room-player-title--restoring,
.room-player-level--restoring,
.room-player-safe-zone--restoring .room-host-badge {
  animation: room-slot-breathe 1.2s ease-in-out infinite;
}

.room-player-safe-zone--removing {
  animation: room-removing-slot 0.9s ease-in-out infinite alternate;
}

.room-player-title--removing,
.room-player-level--removing {
  color: #8b4c48;
}

.room-remove-button {
  position: absolute;
  z-index: 2;
  top: 11.5%;
  right: 3.5%;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 2px solid rgba(70, 85, 99, 0.72);
  border-radius: 999px;
  color: var(--brand-active, #465563);
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 4px 10px rgba(0, 19, 50, 0.18);
  cursor: pointer;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.room-remove-button:hover {
  border-color: #b3261e;
  color: #b3261e;
  background: rgba(255, 245, 244, 0.95);
  transform: rotate(5deg) scale(1.06);
}

.room-remove-button:focus-visible {
  outline: 0;
  box-shadow:
    0 4px 10px rgba(0, 19, 50, 0.18),
    0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
}

.room-player-avatar-wrap {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 42px;
}

.room-player-avatar-image {
  box-shadow: 0 6px 14px rgba(0, 19, 50, 0.18);
}

.room-host-badge {
  position: absolute;
  top: -5px;
  right: -7px;
  display: grid;
  place-items: center;
  width: 19px;
  height: 19px;
  border: 2px solid rgba(255, 255, 255, 0.88);
  border-radius: 999px;
  color: #31220a;
  background: linear-gradient(180deg, #ffd96a, #d49a18);
  box-shadow:
    0 4px 8px rgba(0, 19, 50, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.room-player-title,
.room-player-option-button {
  border-radius: var(--radius-md, 0);
  color: var(--brand-active, #465563);
}

.room-player-title {
  display: -webkit-box;
  min-height: 2.3em;
  overflow: hidden;
  padding-inline: 6px;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
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

.room-player-option-button:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
}

.room-ready-stamp {
  display: inline-flex;
  align-items: center;
  gap: 0.32em;
  width: max-content;
  max-width: 92%;
  transform: rotate(-6deg);
  border: 2px solid #28733f;
  border-radius: 6px;
  padding: 0.2em 0.48em;
  color: #28733f;
  background:
    linear-gradient(135deg, rgba(40, 115, 63, 0.1), rgba(255, 255, 255, 0.18));
  box-shadow:
    inset 0 0 0 1px rgba(40, 115, 63, 0.2),
    0 4px 8px rgba(0, 19, 50, 0.12);
  font-size: 14px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.45);
}

.room-ready-stamp-icon {
  display: grid;
  place-items: center;
  width: 1.15em;
  height: 1.15em;
  border-radius: 999px;
  background: #28733f;
  color: #f6fff8;
  font-size: 0.78em;
  line-height: 1;
}

.room-ready-stamp--pending {
  transform: rotate(0deg);
  border-color: #8b4c48;
  color: #8b4c48;
  background:
    linear-gradient(135deg, rgba(139, 76, 72, 0.08), rgba(255, 255, 255, 0.16));
  box-shadow:
    inset 0 0 0 1px rgba(139, 76, 72, 0.18),
    0 4px 8px rgba(0, 19, 50, 0.1);
  opacity: 0.82;
}

.room-ready-stamp--pending .room-ready-stamp-icon {
  background: #8b4c48;
  color: #fff8f7;
}

.room-player-info--with-title .room-player-title {
  display: block;
  min-height: 1.12em;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.room-player-level {
  color: var(--brand-active, #465563);
}

.room-player-achievement-title {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: max-content;
  max-width: 112px;
  padding: 1px 3px;
  color: #657487;
  font-size: 9px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0.01em;
  text-align: center;
}

.room-player-achievement-icon {
  color: #f17822;
}

.room-player-level--pending {
  display: inline-flex;
  align-items: center;
  gap: 0.2em;
}

.room-player-level--removing {
  display: inline-flex;
  align-items: center;
  gap: 0.2em;
}

.room-player-loading-dots::after {
  content: "...";
  display: inline-block;
  width: 1.8em;
  overflow: hidden;
  vertical-align: bottom;
  animation: room-loading-dots 1s steps(4, end) infinite;
}

@media (min-width: 1024px) {
  .room-player-achievement-title {
    gap: 7px;
    max-width: 180px;
    padding: 2px 5px;
    font-size: 15px;
  }

  .room-player-title {
    min-height: 2.45em;
    padding-inline: 10px;
  }
}

.room-player-level--restoring {
  color: rgba(70, 85, 99, 0.72);
}

@keyframes room-slot-breathe {
  0%,
  100% {
    opacity: 0.52;
  }

  50% {
    opacity: 1;
  }
}

@keyframes room-pending-avatar-pulse {
  0%,
  100% {
    transform: scale(0.96);
    opacity: 0.7;
  }

  50% {
    transform: scale(1.03);
    opacity: 1;
  }
}

@keyframes room-loading-dots {
  0% {
    width: 0;
  }

  100% {
    width: 1.8em;
  }
}

@keyframes room-removing-slot {
  0% {
    opacity: 0.55;
    transform: translateY(0) scale(1);
  }

  100% {
    opacity: 0.92;
    transform: translateY(-2px) scale(0.985);
  }
}

@media (min-width: 1024px) {
  .room-remove-button {
    width: 32px;
    height: 32px;
    top: 10.9%;
    right: 3.4%;
  }

  .room-player-avatar-wrap {
    min-height: 76px;
  }

  .room-host-badge {
    right: 1px;
    bottom: -6px;
    width: 27px;
    height: 27px;
  }

  .room-ready-stamp {
    border-width: 3px;
    border-radius: 9px;
    padding: 0.28em 0.64em;
    font-size: 26px;
  }
}
</style>
