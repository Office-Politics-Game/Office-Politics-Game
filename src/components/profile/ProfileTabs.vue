<template>
  <nav
    class="profile-tabs grid h-8 grid-cols-4 border-b border-[rgba(160,166,179,0.3)] lg:h-16"
    aria-label="個人資料分頁"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="profile-tabs__button relative min-w-0 border-0 bg-transparent font-bold tracking-[0] text-[var(--gray-400)]"
      :class="{ 'profile-tabs__button--active': tab.id === activeTab }"
      @click="$emit('update:activeTab', tab.id)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<script setup>
defineProps({
  tabs: {
    type: Array,
    required: true,
  },
  activeTab: {
    type: String,
    required: true,
  },
});

defineEmits(["update:activeTab"]);
</script>

<style scoped>
.profile-tabs__button {
  transition:
    color 0.18s ease,
    background 0.18s ease;
  font-size: var(--text-sm);
}

.profile-tabs__button::after {
  position: absolute;
  right: 18px;
  bottom: -1px;
  left: 18px;
  height: 3px;
  content: "";
  background: transparent;
}

.profile-tabs__button:hover,
.profile-tabs__button--active {
  color: var(--brand-navy);
}

.profile-tabs__button--active::after {
  background: var(--brand-navy);
}

.profile-tabs__button:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 4px var(--brand-focus);
}

@media (max-width: 1024px) {
  .profile-tabs__button::after {
    right: 8px;
    left: 8px;
  }
}
</style>
