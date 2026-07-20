<script setup>
defineProps({
  achievementTitle: {
    type: String,
    default: "完成對局",
  },
  achievementDescription: {
    type: String,
    default: "完成一場職場角力，累積績效表現。",
  },
  expGained: {
    type: Number,
    default: 100,
  },
  coinsGained: {
    type: Number,
    default: 500,
  },
})
</script>

<template>
  <section class="achievement-panel" aria-label="本局獎勵">
    <div class="achievement-panel__main">
      <span class="achievement-panel__tag">本局成就</span>
      <h2 class="achievement-panel__title">{{ achievementTitle }}</h2>
      <p class="achievement-panel__description">{{ achievementDescription }}</p>
    </div>
    <div class="achievement-panel__reward achievement-panel__reward--exp">
      <span>經驗值</span>
      <strong>+{{ expGained }} Exp</strong>
    </div>
    <div class="achievement-panel__reward achievement-panel__reward--coin">
      <span>遊戲幣</span>
      <strong>+{{ coinsGained }} G</strong>
    </div>
  </section>
</template>

<style scoped>
.achievement-panel {
  position: relative;
  width: 100%;
  height: 100%;
  color: var(--brand-navy);
}

.achievement-panel__main {
  position: absolute;
  top: 37.5%;
  left: 73.2%;
  width: 21.2%;
  height: 29.8%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5%;
  padding: 2.8% 2.2%;
  text-align: center;
  transform: rotate(2deg);
  opacity: 0;
  animation: reward-fade-in 0.55s ease-out forwards;
  animation-delay: 4.05s;
}

.achievement-panel__tag {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  background: #4f6578;
  color: #fff;
  font-size: clamp(10px, 1vw, 15px);
  font-weight: 800;
}

.achievement-panel__title {
  margin: 0;
  font-size: clamp(18px, 2vw, 30px);
  font-weight: 900;
}

.achievement-panel__description {
  margin: 0;
  color: #4f6578;
  font-size: clamp(12px, 1.15vw, 17px);
  font-weight: 700;
  line-height: 1.45;
}

.achievement-panel__reward {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8%;
  color: var(--brand-navy);
  text-align: center;
  opacity: 0;
  animation: reward-fade-in 0.5s ease-out forwards;
}

.achievement-panel__reward--exp {
  top: 71.6%;
  left: 72.0%;
  width: 10.8%;
  height: 16.4%;
  transform: rotate(3deg);
  animation-delay: 4.05s;
}

.achievement-panel__reward--coin {
  top: 73.3%;
  left: 83.5%;
  width: 10.8%;
  height: 16.2%;
  transform: rotate(-1deg);
  animation-delay: 4.05s;
}

.achievement-panel__reward span,
.achievement-panel__reward strong {
  display: block;
}

.achievement-panel__reward span {
  color: #4f6578;
  font-size: clamp(12px, 1.3vw, 19px);
  font-weight: 900;
}

.achievement-panel__reward strong {
  font-size: clamp(12px, 1.35vw, 20px);
  font-weight: 900;
}

@keyframes notes-in {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes reward-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .achievement-panel__main,
  .achievement-panel__reward {
    opacity: 1;
    animation: none;
  }
}

@media (orientation: landscape) and (max-width: 1023px) {
  .achievement-panel__tag {
    font-size: clamp(8px, 0.85vw, 11px);
  }

  .achievement-panel__title {
    font-size: clamp(14px, 1.45vw, 22px);
  }

  .achievement-panel__description {
    font-size: clamp(9px, 0.9vw, 13px);
    line-height: 1.32;
  }

  .achievement-panel__reward span {
    font-size: clamp(9px, 0.95vw, 14px);
  }

  .achievement-panel__reward strong {
    font-size: clamp(10px, 1vw, 15px);
  }
}
</style>
