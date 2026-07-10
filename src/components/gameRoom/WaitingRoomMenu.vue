<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import matchIcon from "@/assets/images/icon-match.png";
import joinIcon from "@/assets/images/icon-join.png";
import createIcon from "@/assets/images/icon-create.png";
import waitingRoomOne from "@/assets/images/waiting-room-1.webp";
import waitingRoomTwo from "@/assets/images/waiting-room-2.webp";
import waitingRoomThree from "@/assets/images/waiting-room-3.webp";
import { useCurrentPlayerId } from "@/composables/useCurrentPlayerId.js";
import { useRoomStore } from "@/stores/roomStore.js";

const roomActions = [
  {
    title: "開始配對",
    description: ["快速匹配玩家", "開始對局"],
    icon: matchIcon,
    paper: waitingRoomOne,
    alt: "尋找玩家圖示",
  },
  {
    title: "加入房間",
    description: ["輸入房間代號", "加入好友對局"],
    icon: joinIcon,
    paper: waitingRoomTwo,
    alt: "文件夾板圖示",
  },
  {
    title: "建立房間",
    description: ["自訂專屬房間", "邀請好友加入"],
    icon: createIcon,
    paper: waitingRoomThree,
    alt: "辦公大樓圖示",
  },
];

const router = useRouter();
const roomStore = useRoomStore();
const { currentPlayerId } = useCurrentPlayerId();

const roomId = ref("");
const activeAction = ref("");
const matchElapsedSeconds = ref(0);
const matchTimerId = ref(null);
const { isLoading, errorMessage } = storeToRefs(roomStore);

const Matching = computed(() => {
  const minutes = Math.floor(matchElapsedSeconds.value / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (matchElapsedSeconds.value % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
});

function stopMatchTimer() {
  if (!matchTimerId.value) {
    return;
  }

  clearInterval(matchTimerId.value);
  matchTimerId.value = null;
}

function startMatchTimer() {
  stopMatchTimer();
  matchElapsedSeconds.value = 0;
  matchTimerId.value = window.setInterval(() => {
    matchElapsedSeconds.value += 1;
  }, 1000);
}

async function handleCreateRoom() {
  if (!currentPlayerId.value) {
    roomStore.errorMessage = "請先登入或建立訪客玩家。";
    return;
  }

  try {
    await roomStore.createRoom({
      hostPlayerId: currentPlayerId.value,
    });

    router.push({
      name: "CustomRoom",
      query: { roomCode: roomStore.roomCode },
    });
  } catch {
    return;
  }
}

async function handleJoinRoom() {
  const normalizedRoomId = roomId.value.trim().toUpperCase();

  if (!normalizedRoomId) {
    roomStore.errorMessage = "請先輸入房號。";
    return;
  }

  if (!currentPlayerId.value) {
    roomStore.errorMessage = "請先登入或建立訪客玩家。";
    return;
  }

  try {
    await roomStore.joinRoom(normalizedRoomId, {
      playerId: currentPlayerId.value,
    });

    router.push({
      name: "CustomRoom",
      query: { roomCode: normalizedRoomId },
    });
  } catch {
    return;
  }
}

async function handleActionClick(action) {
  activeAction.value = action.title;

  if (action.title === "開始配對") {
    startMatchTimer();
    return;
  }

  stopMatchTimer();

  if (action.title === "建立房間") {
    await handleCreateRoom();
  }
}

onBeforeUnmount(stopMatchTimer);
</script>

<template>
  <div
    class="waiting-room-menu pointer-events-none absolute inset-0"
    aria-label="遊戲入口選單"
  >
    <div
      v-for="action in roomActions"
      :key="action.title"
      class="waiting-room-item pointer-events-auto absolute"
      :class="{
        'is-join-expanded':
          action.title === '加入房間' && activeAction === '加入房間',
      }"
      @click="handleActionClick(action)"
    >
      <img
        class="waiting-room-paper pointer-events-none absolute inset-0 h-full w-full object-contain"
        :src="action.paper"
        alt=""
        aria-hidden="true"
      />

      <div
        class="waiting-room-button absolute border-0 bg-transparent p-0 text-center"
        role="button"
        tabindex="0"
        :aria-label="action.title"
        @keydown.enter.self.prevent="handleActionClick(action)"
        @keydown.space.self.prevent="handleActionClick(action)"
      >
        <span
          class="waiting-room-content pointer-events-none flex h-full w-full flex-col items-center"
        >
          <img
            class="w-10 opacity-80 object-contain mix-blend-multiply contrast-125 lg:w-24"
            :src="action.icon"
            :alt="action.alt"
          />

          <span class="waiting-room-copy block w-full">
            <span
              class="title text-lg text-[var(--brand-active)] block font-black leading-none"
            >
              {{ action.title }}
            </span>
            <span
              class="desc text-xs text-[var(--brand-active)] block font-medium mt-2 lg:text-sm"
            >
              <span
                v-for="line in action.description"
                :key="line"
                class="block"
                >{{ line }}</span
              >
            </span>
          </span>

          <span class="waiting-room-rule flex items-center w-[70%]">
            <span class="waiting-room-line flex-1 mt-1"></span>
          </span>

          <span
            v-if="action.title === '開始配對' && activeAction === '開始配對'"
            class="match-timer-inline text-xs lg:text-sm mt-2"
          >
            配對中 {{ Matching }}
          </span>

          <span
            v-if="action.title === '加入房間' && activeAction === '加入房間'"
            class="join-room-inline pointer-events-auto w-[70%]"
            @click.stop
          >
            <input
              id="inlineRoomId"
              v-model="roomId"
              class="join-room-inline-input !text-[11px] block w-full text-center lg:!text-[14px]"
              type="text"
              placeholder="請輸入房號"
              @click.stop
              @keydown.enter.stop.prevent="handleJoinRoom"
            />
            <button
              class="btn-dark mt-1 block w-full !text-[11px] lg:!text-[14px]"
              type="button"
              :disabled="isLoading"
              @click.stop="handleJoinRoom"
            >
              {{ isLoading ? "加入中" : "確認" }}
            </button>
          </span>

          <span
            v-if="action.title === '建立房間' && isLoading && activeAction === '建立房間'"
            class="match-timer-inline text-xs lg:text-sm mt-2"
          >
            建立中
          </span>
        </span>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="pointer-events-auto absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded bg-white/85 px-4 py-2 text-sm font-bold text-red-700"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>

<style scoped>
.waiting-room-item {
  --hover-y: 0px;
  --room-line-color: #c51f28;
  left: 20.55%;
  top: 46.7%;
  aspect-ratio: 520 / 820;
  height: 66%;
  transform: translate(-50%, calc(-50% + var(--hover-y)));
  transition:
    transform 180ms ease,
    filter 180ms ease;
}

.waiting-room-item:nth-child(2) {
  --room-line-color: #1f5fc2;
  left: 50%;
}

.waiting-room-item:nth-child(3) {
  --room-line-color: #1f6f48;
  left: 79.45%;
}

.waiting-room-item:hover,
.waiting-room-item:focus-within {
  --hover-y: -12px;
  filter: drop-shadow(0 12px 18px rgba(0, 70, 244, 0.22));
}

.waiting-room-item:active {
  --hover-y: 12px;
  filter: drop-shadow(0 8px 14px rgba(70, 85, 99, 0.24));
}

.waiting-room-item.is-join-expanded:active {
  --hover-y: -12px;
  filter: drop-shadow(0 12px 18px rgba(0, 70, 244, 0.22));
}

.waiting-room-button {
  left: 8.1%;
  top: 25%;
  width: 83.8%;
  height: 41%;
  cursor: pointer;
  outline: 0;
}

.waiting-room-button:focus-visible {
  box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
}

.waiting-room-content {
  height: auto;
  max-height: 100%;
  gap: clamp(4px, 1.2svh, 7px);
  justify-content: flex-start;
}

.match-timer-inline {
  color: var(--brand-active, #465563);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.04em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.join-room-inline-input {
  border: 1px solid var(--brand-primary, #86b3e0);
  background: rgba(255, 255, 255, 0.64);
  color: var(--brand-active, #465563);
  font-weight: 700;
  outline: 0;
}

.join-room-inline-input:disabled {
  cursor: wait;
  opacity: 0.7;
}

.waiting-room-line {
  height: 2px;
}

.waiting-room-line {
  background-color: var(--room-line-color);
  transition:
    background-color 180ms ease,
    border-color 180ms ease;
}

.waiting-room-item:hover .title,
.waiting-room-item:focus-within .title {
  color: var(--brand-hover, #0046f4);
  text-shadow: 0 2px 0 rgba(255, 255, 255, 0.6);
}

.waiting-room-item:hover .desc,
.waiting-room-item:focus-within .desc {
  color: var(--brand-hover, #0046f4);
}

.join-room-inline-input::placeholder {
  color: var(--brand-disabled, #a0a6b3);
}

.join-room-inline-input:focus {
  border-color: var(--brand-hover, #0046f4);
  background: var(--surface-glass-hover, rgba(255, 255, 255, 0.72));
  box-shadow: 0 0 0 3px var(--brand-focus, rgba(0, 70, 244, 0.24));
}
</style>
