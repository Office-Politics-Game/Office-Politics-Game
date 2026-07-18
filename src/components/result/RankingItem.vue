<script setup>
import TicketIcon from "@/assets/images/bonus-cheque-token.png"

defineProps({
  player: {
    type: Object,
    required: true,
  },
  rank: {
    type: Number,
    required: true,
  },
  delay: {
    type: String,
    default: "1.6s",
  },
  maxTickets: {
    type: Number,
    default: 3,
  },
})
</script>

<template>
  <article
    class="ranking-item"
    :style="{ '--item-delay': delay }"
  >
    <div class="ranking-item__avatar-wrap">
      <img class="ranking-item__avatar" :src="player.avatar" :alt="player.name" />
      <span class="ranking-item__level">{{ player.level }}</span>
    </div>

    <strong class="ranking-item__name">{{ player.name }}</strong>

    <div class="ranking-item__tickets" aria-label="小局勝場">
      <img
        v-for="ticketIndex in maxTickets"
        :key="ticketIndex"
        class="ranking-item__ticket"
        :class="{ 'ranking-item__ticket--empty': ticketIndex > player.roundWins }"
        :src="TicketIcon"
        alt=""
      />
    </div>
  </article>
</template>

<style scoped>
.ranking-item {
  display: grid;
  grid-template-columns: 15% minmax(0, 1fr) 32%;
  column-gap: 2.2%;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--brand-navy);
  opacity: 0;
  animation: ranking-slide-in 0.75s cubic-bezier(.2, .8, .2, 1) forwards;
  animation-delay: var(--item-delay);
  --item-offset-y: 0px;
  transform: translate(-40px, var(--item-offset-y));
}

.ranking-item__avatar-wrap {
  position: relative;
  justify-self: center;
  height: 58%;
  aspect-ratio: 1;
}

.ranking-item__avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 3px solid #1f65d6;
  border-radius: 50%;
}

.ranking-item__level {
  position: absolute;
  right: -9%;
  bottom: -6%;
  min-width: 24%;
  padding: 0 4px;
  border-radius: 999px;
  background: #1f65d6;
  color: #fff;
  font-size: clamp(9px, 0.95vw, 12px);
  font-weight: 800;
  text-align: center;
}

.ranking-item__name {
  min-width: 0;
  overflow: hidden;
  color: var(--brand-navy);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: clamp(12px, 1.9cqw, 28px);
  font-weight: 900;
}

.ranking-item__tickets {
  display: flex;
  justify-content: flex-end;
  gap: clamp(4px, .48cqw, 8px);
  padding-right: 0;
  transform: translateX(-10px);
}

.ranking-item__ticket {
  width: clamp(26px, 3.3cqw, 50px);
  transform: rotate(-8deg);
  filter: drop-shadow(0 2px 2px rgb(0 0 0 / 18%));
}

.ranking-item__ticket--empty {
  opacity: 0.18;
  filter: grayscale(1);
}

@keyframes ranking-slide-in {
  from {
    opacity: 0;
    transform: translate(-54px, var(--item-offset-y));
  }

  to {
    opacity: 1;
    transform: translate(0, var(--item-offset-y));
  }
}

@media (prefers-reduced-motion: reduce) {
  .ranking-item {
    opacity: 1;
    transform: none;
    animation: none;
  }
}

@media (orientation: landscape) and (max-width: 1023px) {
  .ranking-item__avatar {
    border-width: 2px;
  }

  .ranking-item__level {
    right: -4%;
    bottom: -1%;
    min-width: 0;
    width: 30%;
    height: 30%;
    padding: 0;
    display: grid;
    place-items: center;
    font-size: clamp(6px, 0.7cqw, 10px);
    line-height: 1;
  }

  .ranking-item__ticket {
    width: clamp(18px, 2.55cqw, 34px);
  }

  .ranking-item__tickets {
    gap: clamp(2px, 0.3cqw, 5px);
  }
}
</style>
