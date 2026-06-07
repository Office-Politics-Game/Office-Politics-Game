<script setup>
import { Crown } from '@lucide/vue';
import buttonBlue from '@/assets/image/button-blue.png';
import buttonWhite from '@/assets/image/button-white.png';
import matchingBackground from '@/assets/image/modal-matching.png';
</script>

<template>
  <div class="lobby-modal-backdrop" aria-label="配對中彈窗">
    <article class="lobby-modal-paper matching-panel">
      <img class="modal-paper-image" :src="matchingBackground" alt="" aria-hidden="true" />

      <header class="matching-header text-center">
        <div class="matching-brand mx-auto flex items-center justify-center gap-2 text-[#9a8468]">
          <span class="h-px flex-1 bg-current"></span>
          <span class="matching-star">★</span>
          <Crown class="matching-crown fill-current stroke-current" :stroke-width="1.5" />
          <span class="matching-star">★</span>
          <span class="h-px flex-1 bg-current"></span>
        </div>

        <h2 class="matching-title font-display font-black leading-none tracking-normal text-[#2d241b]">
          匹配中...
        </h2>

        <div class="matching-rule mx-auto flex w-[78%] items-center justify-center gap-1.5 text-[#8c785f]">
          <span class="h-px flex-1 bg-current"></span>
          <span class="h-2 w-2 rotate-45 border border-current"></span>
          <span class="h-px flex-1 bg-current"></span>
        </div>

        <p class="matching-subtitle font-sans font-bold text-[#3d3329]">
          正在為你尋找對手，請稍候
        </p>
      </header>

      <footer class="matching-actions">
        <button class="modal-action-button modal-action-button-light" type="button">
          <img :src="buttonWhite" alt="" aria-hidden="true" />
          <span>取消</span>
        </button>
        <button class="modal-action-button modal-action-button-primary" type="button">
          <img :src="buttonBlue" alt="" aria-hidden="true" />
          <span>返回大廳</span>
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
  background: radial-gradient(circle at center, rgba(255, 244, 218, 0.2), rgba(0, 0, 0, 0.34) 66%);
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

.matching-panel {
  aspect-ratio: 1448 / 1086;
}

.matching-header {
  position: absolute;
  top: 16%;
  left: 50%;
  z-index: 1;
  width: 68%;
  transform: translateX(-50%);
}

.matching-brand {
  width: 112px;
}

.matching-crown {
  width: 16px;
  height: 16px;
}

.matching-star {
  font-size: 10px;
}

.matching-title {
  margin-top: 4px;
  font-size: clamp(20px, 4.5vw, 56px);
}

.matching-rule {
  margin-top: 6px;
}

.matching-subtitle {
  margin-top: 6px;
  font-size: clamp(12px, 1.2vw, 20px);
  line-height: 1.35;
}

.matching-actions {
  position: absolute;
  bottom: 10%;
  left: 50%;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 62%;
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
  font-size: clamp(10px, 2.2vw, 28px);
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.32);
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
    max-width: 720px;
  }

  .matching-brand {
    width: 152px;
  }

  .matching-crown {
    width: 30px;
    height: 30px;
  }

  .matching-star {
    font-size: 14px;
  }
/* 
  .matching-title {
    margin-top: 8px;
    font-size: 44px;
  } */

  .matching-rule {
    margin-top: 10px;
  }

  .matching-subtitle {
    margin-top: 10px;
    /* font-size: 16px; */
  }

  .matching-actions {
    gap: 28px;
    width: 66%;
  }

  /* .modal-action-button {
    font-size: 20px;
  } */
}

@media (min-width: 1024px) {
  .lobby-modal-paper {
    width: 72%;
    max-width: 860px;
  }

  .matching-brand {
    width: 176px;
  }

  .matching-crown {
    width: 38px;
    height: 38px;
  }

  /* .matching-title {
    font-size: 56px;
  } */

  /* .matching-subtitle {
    font-size: 20px;
  } */

  .matching-actions {
    gap: 40px;
    width: 66%;
  }

  /* .modal-action-button {
    font-size: 28px;
  } */
}
</style>