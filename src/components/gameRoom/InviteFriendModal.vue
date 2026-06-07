<script setup>
import { Crown, UserRound } from '@lucide/vue';
import buttonBlue from '@/assets/image/button-blue.png';
import buttonWhite from '@/assets/image/button-white.png';
import inviteFriendModal from '@/assets/image/modal-invite-friend.png';
</script>

<template>
  <div class="invite-modal-backdrop" aria-label="邀請好友彈窗">
    <article class="invite-modal-panel">
      <img class="invite-modal-paper" :src="inviteFriendModal" alt="" aria-hidden="true" />

      <header class="invite-modal-header text-center">
        <div class="invite-brand mx-auto flex items-center justify-center gap-2 text-[#9a8468]">
          <span class="invite-star">★</span>
          <span class="invite-star">★</span>
          <Crown class="invite-crown fill-current stroke-current" :stroke-width="1.4" />
          <span class="invite-star">★</span>
          <span class="invite-star">★</span>
        </div>

        <h2 class="invite-title font-display font-black leading-none tracking-normal text-[#2d241b]">
          邀請好友
        </h2>

        <div class="invite-rule mx-auto flex w-[72%] items-center justify-center gap-2 text-[#8c785f]">
          <span class="h-px flex-1 bg-current"></span>
          <span class="h-2 w-2 rotate-45 border border-current"></span>
          <span class="h-px flex-1 bg-current"></span>
        </div>
      </header>

      <section class="friend-row" aria-label="好友欄位示意">
        <span class="friend-checkbox" aria-hidden="true"></span>
        <span class="friend-avatar" aria-hidden="true">
          <UserRound class="h-[58%] w-[58%]" :stroke-width="2.2" />
        </span>
        <span class="friend-id">玩家ID</span>
      </section>

      <footer class="invite-actions">
        <button class="invite-action-button invite-action-button-light" type="button">
          <img :src="buttonWhite" alt="" aria-hidden="true" />
          <span>取消</span>
        </button>
        <button class="invite-action-button invite-action-button-primary" type="button">
          <img :src="buttonBlue" alt="" aria-hidden="true" />
          <span>發送邀請</span>
        </button>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.invite-modal-backdrop {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at center, rgba(255, 244, 218, 0.16), rgba(0, 0, 0, 0.34) 68%);
  padding: 8px;
}

.invite-modal-panel {
  position: relative;
  width: 70%;
  max-width: 520px;
  aspect-ratio: 1419 / 1108;
  overflow: visible;
}

.invite-modal-paper {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  object-fit: contain;
  user-select: none;
}

.invite-modal-header {
  position: absolute;
  top: 14.5%;
  left: 50%;
  z-index: 1;
  width: 62%;
  transform: translateX(-50%);
}

.invite-brand {
  width: clamp(80px, 18vw, 104px);
}

.invite-crown {
  width: clamp(16px, 3.8vw, 22px);
  height: clamp(16px, 3.8vw, 22px);
}

.invite-star {
  font-size: clamp(8px, 1.8vw, 11px);
}

.invite-title {
  margin-top: clamp(2px, 0.8vw, 4px);
  font-size: clamp(22px, 5.4vw, 30px);
}

.invite-rule {
  width: 62%;
  margin-top: clamp(4px, 1.2vw, 6px);
}

.invite-rule span:nth-child(2) {
  width: clamp(4px, 1vw, 6px);
  height: clamp(4px, 1vw, 6px);
}

.friend-row {
  position: absolute;
  top: 42.5%;
  left: 50%;
  z-index: 1;
  display: grid;
  width: 72%;
  min-height: 46px;
  transform: translateX(-50%);
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(117, 89, 55, 0.5);
  border-radius: 4px;
  background: rgba(244, 232, 211, 0.68);
  padding: 6px 14px;
  box-shadow: 0 5px 10px rgba(49, 33, 18, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.58);
}

.friend-checkbox {
  width: 22px;
  aspect-ratio: 1;
  border: 2px solid rgba(98, 74, 46, 0.76);
  border-radius: 4px;
  background: rgba(245, 236, 220, 0.58);
  box-shadow: inset 0 1px 2px rgba(56, 38, 19, 0.12);
}

.friend-avatar {
  display: grid;
  width: 38px;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid rgba(120, 96, 67, 0.34);
  border-radius: 999px;
  background: radial-gradient(circle at 50% 34%, #f0e5d3, #bba98e);
  color: #6b5f51;
}

.friend-id {
  overflow: hidden;
  color: #34291f;
  font-family: "Noto Serif TC", "Songti TC", "PMingLiU", serif;
  font-size: 22px;
  font-weight: 900;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invite-actions {
  position: absolute;
  bottom: 12.5%;
  left: 50%;
  z-index: 1;
  display: grid;
  width: 62%;
  transform: translateX(-50%);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.invite-action-button {
  position: relative;
  display: grid;
  aspect-ratio: 2172 / 724;
  place-items: center;
  overflow: hidden;
  border: 0;
  background: transparent;
  font-family: "Noto Serif TC", "Songti TC", "PMingLiU", serif;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.28);
}

.invite-action-button img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  object-fit: fill;
}

.invite-action-button span {
  position: relative;
  z-index: 1;
}

.invite-action-button-light {
  color: #33281e;
}

.invite-action-button-primary {
  color: #f4dfb8;
}

@media (min-width: 768px) {
  .invite-modal-panel {
    width: 72%;
    max-width: 740px;
  }

  .invite-modal-header {
    top: 14.5%;
    width: 64%;
  }

  .invite-brand {
    width: clamp(112px, 18vw, 144px);
  }

  .invite-crown {
    width: clamp(22px, 4vw, 30px);
    height: clamp(22px, 4vw, 30px);
  }

  .invite-star {
    font-size: clamp(10px, 1.8vw, 13px);
  }

  .invite-title {
    margin-top: clamp(4px, 1vw, 6px);
    font-size: clamp(32px, 5.2vw, 42px);
  }

  .invite-rule {
    width: 64%;
    margin-top: clamp(6px, 1.2vw, 10px);
  }

  .invite-rule span:nth-child(2) {
    width: clamp(6px, 1vw, 8px);
    height: clamp(6px, 1vw, 8px);
  }

  .friend-row {
    width: 72%;
    min-height: 68px;
    gap: 18px;
    padding: 8px 22px;
    border-radius: 6px;
  }

  .friend-checkbox {
    width: 32px;
  }

  .friend-avatar {
    width: 56px;
  }

  .friend-id {
    font-size: 34px;
  }

  .invite-actions {
    gap: 36px;
    width: 66%;
  }

  .invite-action-button {
    font-size: 24px;
  }
}

@media (min-width: 1024px) {
  .invite-modal-panel {
    width: 74%;
    max-width: 860px;
  }

  .invite-modal-header {
    top: 15%;
    width: 66%;
  }

  .invite-brand {
    width: clamp(136px, 13vw, 168px);
  }

  .invite-crown {
    width: clamp(28px, 3vw, 34px);
    height: clamp(28px, 3vw, 34px);
  }

  .invite-star {
    font-size: clamp(12px, 1.4vw, 14px);
  }

  .invite-title {
    margin-top: clamp(6px, 0.8vw, 8px);
    font-size: clamp(42px, 4.4vw, 52px);
  }

  .invite-rule {
    width: 66%;
    margin-top: clamp(8px, 1vw, 10px);
  }

  .invite-rule span:nth-child(2) {
    width: 8px;
    height: 8px;
  }

  .friend-row {
    width: 70%;
    min-height: 88px;
    gap: 28px;
    padding: 12px 28px;
    border-radius: 8px;
  }

  .friend-checkbox {
    width: 38px;
  }

  .friend-avatar {
    width: 76px;
  }

  .friend-id {
    font-size: 36px;
  }

  .invite-actions {
    gap: 64px;
    width: 64%;
  }

  .invite-action-button {
    font-size: 32px;
  }
}
</style>
