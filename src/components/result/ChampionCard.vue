<script setup>
import Crown from "@/assets/images/crown.png";

defineProps({
  champion: {
    type: Object,
    default: null,
  },
})
</script>

<template>
  <section v-if="champion" class="champion-card" aria-label="最終獲勝者">
    <div class="champion-card__portrait">
      <img class="champion-card__crown" :src="Crown" alt="" />
      <img class="champion-card__avatar" :src="champion.avatar" :alt="champion.name" />
    </div>
    <h2 class="champion-card__name">{{ champion.name }}</h2>
  </section>
</template>

<style scoped>
.champion-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5%;
  width: 100%;
  height: 100%;
  color: var(--brand-navy);
  opacity: 0;
  transform: translateY(-90px) rotate(-2deg);
  animation: champion-drop-in 0.9s cubic-bezier(.18, .95, .32, 1.2) forwards;
  animation-delay: 3.05s;
}

.champion-card__portrait {
  position: relative;
  width: 48%;
  aspect-ratio: 1;
}

.champion-card__crown {
  position: absolute;
  top: -28%;
  left: -22%;
  z-index: 2;
  width: 58%;
  transform: rotate(-16deg);
  filter: drop-shadow(0 3px 0 rgba(10, 37, 78, .18));
}

.champion-card__avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 4px solid #1459a6;
  border-radius: 50%;
  box-shadow: 0 8px 0 rgba(10, 37, 78, 0.12);
}

.champion-card__name {
  margin: 0;
  max-width: 95%;
  overflow: hidden;
  color: var(--brand-navy);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: clamp(20px, 2.9cqw, 40px);
  font-weight: 900;
}

@keyframes champion-drop-in {
  0% {
    opacity: 0;
    transform: translateY(-90px) rotate(-2deg);
  }

  72% {
    opacity: 1;
    transform: translateY(10px) rotate(1deg);
  }

  100% {
    opacity: 1;
    transform: translateY(0) rotate(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .champion-card {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
</style>
