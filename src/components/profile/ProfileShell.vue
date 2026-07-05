<template>
  <main
    class="profile-page grid w-screen min-h-[100svh] place-items-center overflow-hidden bg-[var(--brand-navy)] bg-center bg-cover isolate"
    :class="{ 'is-returning': isReturning }"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <div
      class="profile-exit-layer absolute inset-0 z-0 bg-center bg-cover opacity-0 will-change-[opacity]"
      :style="{ backgroundImage: `url(${exitBackgroundImage})` }"
      aria-hidden="true"
    ></div>

    <section
      class="profile-paper"
      :style="{ '--paper-image': `url(${paperImage})` }"
    >
      <ProfileSidebar :player="player" />

      <div class="profile-paper__content flex min-h-0 min-w-0 flex-1 flex-col">
        <header class="profile-paper__header relative pr-[38px] lg:pr-[58px]">
          <ProfileTabs
            :tabs="tabs"
            :active-tab="activeTab"
            @update:active-tab="$emit('update:activeTab', $event)"
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
import ProfileSidebar from "@/components/profile/ProfileSidebar.vue";
import ProfileTabs from "@/components/profile/ProfileTabs.vue";

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
});

defineEmits(["close", "update:activeTab"]);
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
  animation: dashboardReveal 520ms ease both;
}

.profile-page.is-returning .profile-paper {
  opacity: 0;
  pointer-events: none;
  animation: none;
}

.profile-paper__close {
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

@media (prefers-reduced-motion: reduce) {
  .profile-page.is-returning .profile-exit-layer,
  .profile-page.is-returning .profile-paper,
  .profile-paper {
    animation: none;
  }
}
</style>
