<template>
  <main
    class="profile-page grid w-screen min-h-[100svh] place-items-center overflow-hidden bg-[var(--brand-navy)] bg-center bg-cover isolate"
    :class="{ 'is-returning': isReturning }"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
    @click.capture="handleButtonClick"
  >
    <div
      class="profile-exit-layer pointer-events-none absolute inset-0 z-0 bg-center bg-cover opacity-0 will-change-[opacity]"
      :style="{ backgroundImage: `url(${exitBackgroundImage})` }"
      aria-hidden="true"
    ></div>

    <div
      v-if="isReturning"
      class="profile-return-scene h-81 w-144 lg:h-135 lg:w-240"
      aria-hidden="true"
    >
      <div class="profile-return-card">
        <section class="profile-return-face profile-return-front">
          <LobbyMenu />
        </section>
        <section
          class="profile-return-face profile-return-back"
          :style="{ backgroundImage: `url(${exitBackgroundImage})` }"
        >
          <div class="social-flip-backdrop"></div>
        </section>
      </div>
    </div>

    <section
      class="profile-paper"
      :style="{ '--paper-image': `url(${paperImage})` }"
    >
      <ProfileSidebar
        :player="player"
        :can-edit="canEdit"
        @edit-avatar="$emit('edit-avatar')"
      />

      <div class="profile-paper__content flex min-h-0 min-w-0 flex-1 flex-col">
        <header class="profile-paper__header relative pr-[38px] lg:pr-[58px]">
          <ProfileTabs
            :tabs="tabs"
            :active-tab="activeTab"
            :locked-tabs="lockedTabs"
            @update:active-tab="$emit('update:active-tab', $event)"
          />
          <button
            type="button"
            class="profile-paper__close absolute -top-1 -right-1 grid h-[34px] w-[34px] place-items-center border-0 bg-transparent text-[var(--brand-navy)] lg:top-[13px] lg:right-[14px] lg:h-[38px] lg:w-[38px]"
            :disabled="isReturning"
            @click="$emit('close')"
          >
            <X :size="26" stroke-width="1.8" />
          </button>
        </header>

        <div class="profile-paper__body min-h-0 flex-1 overflow-auto">
          <slot />
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { X } from "lucide-vue-next";
import LobbyMenu from "@/components/menu/LobbyMenu.vue";
import ProfileSidebar from "@/components/profile/ProfileSidebar.vue";
import ProfileTabs from "@/components/profile/ProfileTabs.vue";
import { useButtonClickAudio } from "@/composables/UseButtonClickAudio";

const { handleButtonClick } = useButtonClickAudio();

defineProps({
  player: {
    type: Object,
    required: true,
  },
  tabs: {
    type: Array,
    required: true,
  },
  activeTab: {
    type: String,
    required: true,
  },
  backgroundImage: {
    type: String,
    required: true,
  },
  paperImage: {
    type: String,
    required: true,
  },
  exitBackgroundImage: {
    type: String,
    required: true,
  },
  isReturning: {
    type: Boolean,
    default: false,
  },
  lockedTabs: {
    type: Array,
    default: () => [],
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["close", "update:active-tab", "edit-avatar"]);
</script>

<style scoped>
.profile-page::before {
  position: fixed;
  inset: 0;
  content: "";
  background:
    linear-gradient(
      90deg,
      rgba(0, 19, 50, 0.24),
      rgba(0, 19, 50, 0.06),
      rgba(0, 19, 50, 0.26)
    ),
    rgba(0, 0, 0, 0.12);
  pointer-events: none;
}

.profile-paper {
  position: relative;
  z-index: 1;
  display: flex;
  width: 620px;
  height: 350px;
  /* max-width: calc(100vw - 40px); */
  /* max-height: calc(100svh - 40px); */
  flex-direction: row;
  overflow: hidden;
  background: var(--paper-image) center / contain no-repeat;
  padding: 30px;
  animation: profilePageEnter 360ms ease both;
  will-change: transform, opacity;
}

.profile-page.is-returning .profile-exit-layer {
  animation: dashboardReveal 700ms ease both;
}

.profile-page.is-returning .profile-paper {
  opacity: 0;
  pointer-events: none;
  animation: none;
}

.profile-return-scene {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  perspective: 1600px;
  transform: translate(-50%, -50%);
}

.profile-return-card {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: profileReturnFlip 700ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
  will-change: transform;
}

.profile-return-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background-position: center;
  background-size: 100% 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.profile-return-front {
  transform: rotateY(0deg);
  pointer-events: none;
}

.profile-return-back {
  transform: rotateY(180deg);
}

.social-flip-backdrop {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(0, 19, 50, 0.18), rgba(70, 85, 99, 0.36)),
    rgba(0, 19, 50, 0.08);
}

.profile-paper__close {
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.profile-paper__close:hover {
  background: var(--brand-hover);
  color: white;
}

.profile-paper__close:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 4px var(--brand-focus);
}

.profile-paper__close:disabled {
  cursor: wait;
  background: rgba(160, 166, 179, 0.62);
  color: white;
}

@media (min-width: 1024px) {
  .profile-paper {
    width: 1000px;
    height: 600px;
    padding: 30px;
  }
}

@keyframes profilePageEnter {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dashboardReveal {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes profileReturnFlip {
  from {
    transform: rotateY(180deg);
  }

  to {
    transform: rotateY(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-page.is-returning .profile-exit-layer,
  .profile-page.is-returning .profile-return-card,
  .profile-page.is-returning .profile-paper,
  .profile-paper {
    animation: none;
  }
}
</style>
