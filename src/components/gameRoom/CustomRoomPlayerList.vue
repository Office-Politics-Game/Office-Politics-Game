<script setup>
import { UserPlus } from "@lucide/vue";
import waitingRoomPlayer from "@/assets/images/waiting-room-player.webp";

defineProps({
  slots: {
    type: Array,
    required: true,
  },
});

defineEmits(["add-computer", "toggle-ready"]);
</script>

<template>
  <section
    class="pointer-events-none flex justify-center"
    aria-label="Room players"
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

        <div
          class="room-player-safe-zone col-start-1 row-start-1 mx-auto mt-[20%] flex h-[70%] w-[80%] flex-col items-center justify-center text-center"
        >
          <img
            v-if="slot.avatar"
            class="room-player-avatar-image mt-10 h-[42px] w-[42px] flex-none rounded-full border-2 border-white/70 object-cover lg:mt-20 lg:h-[76px] lg:w-[76px]"
            :src="slot.avatar"
            :alt="slot.name"
          />
          <UserPlus
            v-else
            class="room-player-avatar mt-10 h-[34px] w-[34px] flex-none lg:mt-20 lg:h-[68px] lg:w-[68px]"
            :stroke-width="1.9"
          />

          <div
            v-if="slot.name"
            class="room-player-options mt-[10px] flex w-full flex-col items-center gap-[6px] lg:mt-[24px] lg:gap-[14px]"
          >
            <p
              v-if="slot.isHost"
              class="room-host-label m-0 text-[11px] font-black leading-none lg:text-[16px]"
            >
              HOST
            </p>
            <p
              class="room-player-title m-0 w-full whitespace-nowrap text-center text-[14px] font-black leading-[1.12] lg:text-[28px]"
            >
              {{ slot.name }}
            </p>
            <p
              class="room-player-level m-0 text-[10px] font-extrabold leading-none lg:text-[14px]"
            >
              {{ slot.isReady ? "Ready" : "Not Ready" }}
            </p>
          </div>

          <div
            v-else
            class="room-player-options mt-[10px] flex w-full flex-col items-center gap-[6px] lg:mt-[24px] lg:gap-[14px]"
          >
            <button
              class="room-player-option-button m-0 w-full whitespace-nowrap border-0 bg-transparent text-center text-[14px] font-black leading-[1.12] lg:text-[28px]"
              type="button"
              @click="$emit('add-computer', index)"
            >
              {{ slot.option1 }}
            </button>
            <button
              v-if="slot.option2"
              class="room-player-option-button m-0 w-full whitespace-nowrap border-0 bg-transparent text-center text-[14px] font-black leading-[1.12] lg:text-[28px]"
              type="button"
            >
              {{ slot.option2 }}
            </button>
          </div>

          <button
            v-if="slot.canToggleReady"
            class="btn-dark tap-pop room-ready-button relative z-[1] mt-3 self-center rounded px-3 py-[5px] text-[11px] font-black leading-none lg:mt-[30px] lg:px-5 lg:py-2 lg:text-[15px]"
            type="button"
            @click="$emit('toggle-ready', slot)"
          >
            {{ slot.isReady ? "取消準備" : "準備" }}
          </button>
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
}

.room-player-avatar {
  color: var(--brand-active, #465563);
}

.room-player-avatar-image {
  box-shadow: 0 6px 14px rgba(0, 19, 50, 0.18);
}

.room-host-label {
  color: var(--brand-hover, #0046f4);
}

.room-player-title,
.room-player-option-button {
  border-radius: var(--radius-md, 0);
  color: var(--brand-active, #465563);
}

.room-player-option-button {
  cursor: pointer;
  transition:
    color 180ms ease,
    opacity 180ms ease,
    transform 180ms ease;
}

.room-player-option-button:hover {
  color: var(--brand-hover, #0046f4);
  opacity: 0.92;
  transform: translateY(-1px);
}

.room-player-option-button:active {
  color: var(--brand-active, #465563);
  transform: translateY(1px);
}

.room-player-option-button:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
}

.room-ready-button {
  pointer-events: auto;
  cursor: pointer;
}

.room-player-level {
  color: var(--brand-active, #465563);
}

.room-ready-button:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
}
</style>
