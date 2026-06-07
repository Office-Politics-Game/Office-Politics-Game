<script setup>
import { ref } from 'vue';
import { Crown, DoorOpen } from '@lucide/vue';
import buttonBlue from '@/assets/image/button-blue.png';
import buttonWhite from '@/assets/image/button-white.png';
import joinRoomBackground from '@/assets/image/modal-join-room.png';

const roomId = ref("")
</script>

<template>
  <div class="lobby-modal-backdrop" aria-label="加入房間彈窗">
    <article class="lobby-modal-paper join-room-panel">
      <img class="modal-paper-image" :src="joinRoomBackground" alt="" aria-hidden="true" />

      <header class="text-center">
        <div class="join-room-brand mx-auto flex items-center justify-center gap-4 text-[#836a4e]">
          <span class="h-px flex-1 bg-current"></span>
          <Crown class="join-room-crown fill-current stroke-current" :stroke-width="1.4" />
          <span class="h-px flex-1 bg-current"></span>
        </div>

        <div class="join-room-title-row flex items-center justify-center text-[#8a6f4f]">
          <span class="join-room-star">★</span>
          <h2 class="join-room-title font-display font-black leading-none tracking-normal text-[#2d241b]">
            加入房間
          </h2>
          <span class="join-room-star">★</span>
        </div>

        <div class="join-room-title-rule mx-auto h-px w-[82%] border-t border-dashed border-[#b99f7a]/58"></div>
      </header>

      <section class="join-room-form" aria-label="輸入房號">
        <label class="join-room-label flex items-center font-display font-black text-[#2f2a25]">
          <DoorOpen class="h-[1.25em] w-[1.25em] fill-[#9b7b52] stroke-[#9b7b52]" :stroke-width="1.8" />
          請輸入房間 ID：
        </label>

        <div class="join-room-input" aria-hidden="true">
          <input
                id="roomId"
                v-model="roomId"
                class="join-room-real-input"
                type="text"
          />
          <!-- <span class="join-room-divider"></span> -->
          <!-- <Search class="join-room-search" :stroke-width="3.6" /> -->
        </div>
      </section>

      <footer class="join-room-actions">
        <button class="modal-action-button modal-action-button-light" type="button">
          <img :src="buttonWhite" alt="" aria-hidden="true" />
          <span>取消</span>
        </button>
        <button class="modal-action-button modal-action-button-primary" type="button">
          <img :src="buttonBlue" alt="" aria-hidden="true" />
          <span>加入</span>
        </button>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.lobby-modal-backdrop {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at center, rgba(255, 244, 218, 0.18), rgba(0, 0, 0, 0.32) 68%);
  padding: 8px;
}

.lobby-modal-paper {
  position: relative;
  width: 70%;
  max-width: 520px;
  overflow: visible;
}

.modal-paper-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  object-fit: contain;
  user-select: none;
}

.join-room-panel {
  aspect-ratio: 1448 / 1086;
}

.join-room-panel > header {
  position: absolute;
  top: 14%;
  left: 50%;
  z-index: 1;
  width: 64%;
  transform: translateX(-50%);
}

.join-room-brand {
  width: 100px;
}

.join-room-crown {
  width: 18px;
  height: 18px;
}

.join-room-title-row {
  gap: 8px;
  margin-top: 4px;
}

.join-room-title {
  font-size: 22px;
}

.join-room-star {
  font-size: 10px;
}

.join-room-title-rule {
  margin-top: 8px;
}

.join-room-form {
  position: absolute;
  top: 39%;
  left: 50%;
  z-index: 1;
  width: 72%;
  transform: translateX(-50%);
}

.join-room-label {
  gap: 8px;
  font-size: 12px;
}

.join-room-input {
  display: grid;
  min-height: 38px;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  margin-top: 8px;
  border: 1px solid rgba(113, 86, 53, 0.62);
  border-radius: 4px;
  background: rgba(244, 235, 218, 0.78);
  color: #897b6b;
  font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
  font-weight: 500;
  letter-spacing: 0.08em;
  box-shadow: 0 8px 12px rgba(49, 33, 18, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.62);
}

.join-room-real-input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #2f2a25;
  padding: 0 12px;
  font-size: 20px;
  letter-spacing: 0.08em;
}

.join-room-actions {
  position: absolute;
  bottom: 12%;
  left: 50%;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  width: 64%;
  transform: translateX(-50%);
}

.modal-action-button {
  position: relative;
  display: grid;
  aspect-ratio: 2172 / 724;
  place-items: center;
  overflow: hidden;
  border: 0;
  background: transparent;
  font-family: "Noto Serif TC", "Songti TC", "PMingLiU", serif;
  font-size: 14px;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
}

.modal-action-button img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  object-fit: fill;
}

.modal-action-button span {
  position: relative;
  z-index: 1;
}

.modal-action-button-light {
  color: #33281e;
}

.modal-action-button-primary {
  color: #f4dfb8;
}

@media (min-width: 768px) {
  .lobby-modal-paper {
    width: 70%;
    max-width: 740px;
  }

  .join-room-brand {
    width: 140px;
  }

  .join-room-crown {
    width: 28px;
    height: 28px;
  }

  .join-room-title-row {
    gap: 14px;
    margin-top: 6px;
  }

  .join-room-title {
    font-size: 40px;
  }

  .join-room-star {
    font-size: 16px;
  }

  .join-room-title-rule {
    margin-top: 14px;
  }

  .join-room-form {
    width: 78%;
  }

  .join-room-label {
    gap: 12px;
    font-size: 24px;
  }

  .join-room-input {
    min-height: 74px;
    margin-top: 16px;
    font-size: 48px;
    border-radius: 6px;
  }

  .join-room-real-input {
    letter-spacing: 0.1em;
    padding: 0 16px;
    font-size: 32px;
  }

  .join-room-actions {
    gap: 36px;
    width: 72%;
  }

  .modal-action-button {
    font-size: 28px;
  }
}

@media (min-width: 1024px) {
  .lobby-modal-paper {
    width: 70%;
    max-width: 840px;
  }

  .join-room-brand {
    width: 170px;
  }

  .join-room-crown {
    width: 34px;
    height: 34px;
  }

  .join-room-title {
    font-size: 50px;
  }

  .join-room-form {
    width: 82%;
  }

  .join-room-label {
    font-size: 30px;
  }

  .join-room-input {
    min-height: 96px;
    margin-top: 18px;
    font-size: 58px;
    border-radius: 8px;
  }

  .join-room-real-input {
    letter-spacing: 0.12em;
    font-size: 48px;
    padding: 0 20px;
  }

  .join-room-actions {
    gap: 58px;
    width: 76%;
  }

  .modal-action-button {
    font-size: 34px;
  }
}
</style>
