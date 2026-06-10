<script setup>
import { Crown, UserRound } from '@lucide/vue';
import inviteFriendModal from '@/assets/images/modal-invite-friend.png';
</script>

<template>
  <div class="invite-modal-backdrop" aria-label="邀請好友彈窗">
    <div class="invite-modal-panel">
      <img class="invite-modal-paper" :src="inviteFriendModal" alt="" aria-hidden="true" />
      <header class="invite-modal-header">
        <div class="invite-brand">
          <span class="invite-star">★</span>
          <span class="invite-star">★</span>
          <Crown class="invite-crown" :stroke-width="1.4" />
          <span class="invite-star">★</span>
          <span class="invite-star">★</span>
        </div>
        <h2 class="invite-title">
          邀請好友
        </h2>
        <div class="invite-rule">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </header>
      <section class="friend-row" aria-label="好友欄位示意">
        <input type="checkbox" class="friend-checkbox" aria-hidden="true" />
        <span class="friend-avatar" aria-hidden="true">
          <UserRound :stroke-width="2.2" />
        </span>
        <span class="friend-id">玩家ID</span>
      </section>
      <footer class="invite-actions">
        <button class="invite-action-button invite-action-button-light" type="button">
          <span>取消</span>
        </button>
        <button class="invite-action-button invite-action-button-primary" type="button">
          <span>發送邀請</span>
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
@reference "../../assets/styles/main.css";

.invite-modal-backdrop {
  @apply absolute inset-0 z-[8] grid place-items-center;
  background: radial-gradient(circle at center, rgba(255, 244, 218, 0.16), rgba(0, 0, 0, 0.34) 68%);
  padding: 8px;
}

.invite-modal-panel {
  @apply relative overflow-visible;
  width: 70%;
  max-width: 520px;
  aspect-ratio: 1419 / 1108;
}

.invite-modal-paper {
  @apply pointer-events-none absolute inset-0 z-0 h-full w-full select-none object-contain;
}

.invite-modal-header {
  @apply absolute left-1/2 z-[1] text-center;
  top: 18%;
  width: 54%;
  transform: translateX(-50%);
}

.invite-brand {
  @apply mx-auto flex items-center justify-center gap-2 text-[#9a8468];
  width: clamp(72px, 13vw, 92px);
}

.invite-crown {
  @apply shrink-0 fill-current stroke-current;
  width: clamp(12px, 2.7vw, 16px);
  height: clamp(12px, 2.7vw, 16px);
}

.invite-star {
  @apply shrink-0;
  font-size: clamp(6px, 1.3vw, 8px);
}

.invite-title {
  @apply font-black leading-none tracking-normal text-[#2d241b];
  margin-top: clamp(1px, 0.5vw, 3px);
  font-family: var(--font-sans, Inter, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
  font-size: clamp(16px, 3.8vw, 21px);
}

.invite-rule {
  @apply mx-auto flex items-center justify-center gap-2 text-[#8c785f];
  width: 54%;
  margin-top: clamp(3px, 0.7vw, 4px);
}

.invite-rule span:first-child,
.invite-rule span:last-child {
  @apply h-px flex-1 bg-current;
}

.invite-rule span:nth-child(2) {
  @apply rotate-45 border border-current;
  width: clamp(3px, 0.7vw, 4px);
  height: clamp(3px, 0.7vw, 4px);
}

.friend-row {
  @apply absolute left-1/2 z-[1] grid items-center;
  top: 42.5%;
  width: 56%;
  min-height: 18px;
  transform: translateX(-50%);
  grid-template-columns: auto auto minmax(0, 1fr);
  gap: 6px;
  border: 1px solid var(--brand-primary, #86b3e0);
  border-radius: var(--radius-md, 0);
  background: var(--surface-glass, rgba(255, 255, 255, 0.3));
  padding: 2px 8px;
  box-shadow: 0 5px 10px rgba(0, 19, 50, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.58);
}

.friend-checkbox {
  width: 10px;
  aspect-ratio: 1;
  border: 2px solid var(--brand-primary, #86b3e0);
  border-radius: var(--radius-md, 0);
  background: rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 1px 2px rgba(0, 19, 50, 0.12);
  accent-color: var(--brand-hover, #0046f4);
}

.friend-avatar {
  @apply grid place-items-center rounded-full;
  width: 16px;
  aspect-ratio: 1;
  border: 1px solid rgba(120, 96, 67, 0.34);
  background: radial-gradient(circle at 50% 34%, #f0e5d3, #bba98e);
  color: #6b5f51;
}

.friend-avatar svg {
  @apply h-[58%] w-[58%];
}

.friend-id {
  @apply overflow-hidden whitespace-nowrap text-ellipsis;
  color: var(--brand-active, #465563);
  font-family: var(--font-sans, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
}

.invite-actions {
  @apply absolute left-1/2 z-[1] grid;
  bottom: 16.5%;
  width: 48%;
  transform: translateX(-50%);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.invite-action-button {
  @apply relative flex cursor-pointer items-center justify-center;
  min-height: clamp(22px, 3.5vw, 32px);
  border: 1px solid var(--brand-primary, #86b3e0);
  border-radius: var(--radius-md, 0);
  background: var(--surface-glass, rgba(255, 255, 255, 0.3));
  color: var(--brand-active, #465563);
  font-family: var(--font-sans, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif);
  font-size: clamp(var(--text-sm, 14px), 2vw, 15px);
  font-weight: 700;
  line-height: 1;
  text-shadow: none;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease;
}

.invite-action-button span {
  @apply relative z-[1];
}

.invite-action-button-light {
  background: var(--surface-glass, rgba(255, 255, 255, 0.3));
}

.invite-action-button-primary {
  background: rgba(134, 179, 224, 0.34);
}

.invite-action-button:hover {
  transform: translateY(-2px);
  border-color: var(--brand-hover, #0046f4);
  background: var(--brand-hover, #0046f4);
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(0, 70, 244, 0.24);
}

.invite-action-button:active {
  transform: translateY(1px);
  border-color: var(--brand-active, #465563);
  background: var(--brand-active, #465563);
  color: #ffffff;
  box-shadow: 0 6px 14px rgba(70, 85, 99, 0.24);
}

.invite-action-button:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 4px var(--brand-focus, rgba(0, 70, 244, 0.24));
}

@media (min-width: 768px) {
  .invite-modal-panel {
    width: 72%;
    max-width: 740px;
  }

  .invite-modal-header {
    top: 18%;
    width: 56%;
  }

  .invite-brand {
    width: clamp(86px, 12vw, 112px);
  }

  .invite-crown {
    width: clamp(16px, 2.7vw, 22px);
    height: clamp(16px, 2.7vw, 22px);
  }

  .invite-star {
    font-size: clamp(8px, 1.2vw, 10px);
  }

  .invite-title {
    margin-top: clamp(2px, 0.6vw, 4px);
    font-size: clamp(22px, 3.6vw, 30px);
  }

  .invite-rule {
    width: 56%;
    margin-top: clamp(4px, 0.8vw, 6px);
  }

  .invite-rule span:nth-child(2) {
    width: clamp(4px, 0.7vw, 5px);
    height: clamp(4px, 0.7vw, 5px);
  }

  .friend-row {
    width: 56%;
    min-height: 24px;
    gap: 8px;
    padding: 3px 12px;
  }

  .friend-checkbox {
    width: 14px;
  }

  .friend-avatar {
    width: 22px;
  }

  .friend-id {
    font-size: 16px;
  }

  .invite-actions {
    bottom: 16.5%;
    gap: 24px;
    width: 50%;
  }

  .invite-action-button {
    min-height: 32px;
    font-size: 13px;
  }
}

@media (min-width: 1024px) {
  .invite-modal-panel {
    width: 74%;
    max-width: 860px;
  }

  .invite-modal-header {
    top: 18.2%;
    width: 56%;
  }

  .invite-brand {
    width: clamp(96px, 9vw, 118px);
  }

  .invite-crown {
    width: clamp(20px, 2vw, 24px);
    height: clamp(20px, 2vw, 24px);
  }

  .invite-star {
    font-size: clamp(9px, 1vw, 11px);
  }

  .invite-title {
    margin-top: clamp(3px, 0.5vw, 5px);
    font-size: clamp(28px, 3vw, 38px);
  }

  .invite-rule {
    width: 58%;
    margin-top: clamp(5px, 0.7vw, 7px);
  }

  .invite-rule span:nth-child(2) {
    width: 6px;
    height: 6px;
  }

  .friend-row {
    width: 54%;
    min-height: 30px;
    gap: 10px;
    padding: 4px 14px;
  }

  .friend-checkbox {
    width: 16px;
  }

  .friend-avatar {
    width: 28px;
  }

  .friend-id {
    font-size: 20px;
  }

  .invite-actions {
    bottom: 16.5%;
    gap: 44px;
    width: 48%;
  }

  .invite-action-button {
    min-height: 38px;
    font-size: 14px;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .invite-modal-backdrop {
    padding: 4px;
  }

  .invite-modal-panel {
    width: min(calc(100vw - 8px), calc((100svh - 8px) * 1419 / 1108), 560px);
  }

  .invite-modal-header {
    top: 17.2%;
    width: 54%;
  }

  .invite-brand {
    width: clamp(72px, 12vw, 90px);
  }

  .invite-crown {
    width: clamp(11px, 2vw, 15px);
    height: clamp(11px, 2vw, 15px);
  }

  .invite-title {
    margin-top: 1px;
    font-size: clamp(15px, 3vw, 20px);
  }

  .invite-rule {
    margin-top: 3px;
  }

  .friend-row {
    top: 42.5%;
    width: 56%;
    min-height: clamp(16px, 4vh, 22px);
    gap: 5px;
    padding: 2px 8px;
  }

  .friend-checkbox {
    width: clamp(9px, 1.8vw, 12px);
  }

  .friend-avatar {
    width: clamp(15px, 3vw, 19px);
  }

  .friend-id {
    font-size: clamp(10px, 2.2vw, 13px);
  }

  .invite-actions {
    bottom: 15.8%;
    gap: 12px;
    width: 50%;
  }

  .invite-action-button {
    min-height: clamp(20px, 5vh, 26px);
    font-size: 12px;
  }
}
</style>
