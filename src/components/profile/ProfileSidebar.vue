<template>
  <aside
    class="profile-sidebar relative grid w-[210px] min-w-[210px] grid-rows-[auto_auto_1fr] border-r border-[rgba(160,166,179,0.3)] p-[20px_18px_0px] lg:w-[320px] lg:min-w-[320px] lg:p-[28px_30px_24px]"
  >
    <div
      class="profile-sidebar__identity flex items-center gap-3 pt-0 text-left lg:grid lg:gap-0 lg:justify-items-center lg:pt-1 lg:text-center"
    >
      <img
        v-if="player.avatarUrl"
        class="profile-sidebar__avatar h-14 w-14 rounded-full border-[3px] border-[rgba(255,255,255,0.9)] object-cover lg:h-[104px] lg:w-[104px]"
        :src="player.avatarUrl"
        :alt="`${player.username} avatar`"
      />
      <div
        v-else
        class="profile-sidebar__avatar-placeholder h-14 w-14 rounded-full border-[3px] border-[rgba(255,255,255,0.9)] lg:h-[104px] lg:w-[104px]"
        aria-hidden="true"
      ></div>

      <div class="profile-sidebar__identity-copy min-w-0 flex-1 lg:w-full">
        <h1
          class="profile-sidebar__name mt-0 mb-1.5 w-full overflow-hidden text-ellipsis whitespace-nowrap text-md font-black leading-[1.12] text-[#080a0f] lg:mt-6 lg:text-lg"
        >
          {{ player.username }}
        </h1>
        <div
          class="profile-sidebar__title inline-flex items-center gap-[5px] text-[length:var(--text-xs)] font-bold text-[var(--gray-400)] lg:gap-2"
        >
          <Crown
            class="profile-sidebar__title-icon"
            :size="18"
            stroke-width="2.4"
          />
          <span>{{ player.title }}</span>
        </div>
      </div>
    </div>

    <div class="profile-sidebar__level mt-2 lg:mt-5">
      <div
        class="profile-sidebar__level-row flex min-w-0 items-center justify-between gap-3 text-[length:var(--text-sm)] font-bold text-[var(--brand-navy)]"
      >
        <span class="shrink-0">Lv. {{ player.level }}</span>
        <span
          class="min-w-0 max-w-[104px] overflow-hidden text-ellipsis whitespace-nowrap text-right text-[length:var(--text-xs)] font-semibold text-[var(--gray-400)] lg:max-w-[150px]"
        >
          {{ player.expDisplay }} / {{ player.nextExpDisplay }} XP
        </span>
      </div>
      <div
        class="profile-sidebar__xp-track mt-3 h-[10px] overflow-hidden bg-[rgba(160,166,179,0.2)]"
        aria-label="經驗值進度"
      >
        <span
          class="block h-full bg-[var(--brand-active)]"
          :style="{ width: `${player.expPercent}%` }"
        ></span>
      </div>
    </div>

    <section class="profile-sidebar__stats self-end" aria-label="戰績">
      <h2 class="m-0 text-sm font-extrabold text-[var(--brand-navy)]">戰績</h2>
      <div
        class="profile-sidebar__stats-body flex items-center justify-between gap-3 lg:block"
      >
        <div
          class="profile-sidebar__rate-ring"
          :style="{ '--rate': `${player.winRate * 3.6}deg` }"
        >
          <div>
            <strong>{{ player.winRate }}%</strong>
            <span>勝率</span>
          </div>
        </div>
        <dl
          class="profile-sidebar__stat-grid grid min-w-[72px] gap-2 text-left lg:mt-0 lg:grid-cols-3 lg:gap-0 lg:text-center"
        >
          <div
            class="flex min-w-0 flex-row-reverse items-center justify-between gap-2 lg:block"
          >
            <dt
              class="text-[length:var(--text-sm)] font-black leading-[1.1] text-[#2e75bb]"
            >
              {{ player.winCount }}
            </dt>
            <dd
              class="mt-0 mb-0 text-[length:var(--text-xs)] font-bold text-[var(--gray-500)] lg:mt-[5px]"
            >
              勝場
            </dd>
          </div>
          <div
            class="flex min-w-0 flex-row-reverse items-center justify-between gap-2 lg:block"
          >
            <dt class="profile-sidebar__loss text-sm font-black leading-[1.1]">
              {{ player.loseCount }}
            </dt>
            <dd
              class="mt-0 mb-0 text-xs font-bold text-[var(--gray-500)] lg:mt-[5px]"
            >
              敗場
            </dd>
          </div>
          <div
            class="flex min-w-0 flex-row-reverse items-center justify-between gap-2 lg:block"
          >
            <dt class="text-sm font-black leading-[1.1] text-[#2e75bb]">
              {{ player.totalGames }}
            </dt>
            <dd
              class="mt-0 mb-0 text-xs font-bold text-[var(--gray-500)] lg:mt-[5px]"
            >
              總場次
            </dd>
          </div>
        </dl>
      </div>
    </section>
    <div></div>
  </aside>
</template>

<script setup>
import { Crown } from "lucide-vue-next";

defineProps({
  player: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.profile-sidebar__title-icon {
  color: #d9792f;
  fill: rgba(217, 121, 47, 0.22);
}

.profile-sidebar__avatar-placeholder {
  flex: none;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.78), transparent 35%),
    linear-gradient(135deg, rgba(166, 181, 198, 0.55), rgba(109, 126, 148, 0.75));
}

.profile-sidebar__rate-ring {
  display: grid;
  width: 132px;
  height: 132px;
  margin: 14px auto 12px;
  place-items: center;
  border-radius: 999px;
  background: conic-gradient(#3f92d8 var(--rate), rgba(214, 215, 220, 0.72) 0);
}

.profile-sidebar__rate-ring > div {
  display: grid;
  width: 92px;
  height: 92px;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
}

.profile-sidebar__rate-ring strong {
  margin-top: 12px;
  color: var(--brand-navy);
  font-size: var(--text-xl);
  font-weight: 900;
  line-height: 1;
}

.profile-sidebar__rate-ring span {
  margin-top: -12px;
  color: var(--gray-500);
  font-size: var(--text-xs);
  font-weight: 800;
}

.profile-sidebar__stat-grid .profile-sidebar__loss {
  color: #c73b34;
}

@media (max-width: 1024px) {
  .profile-sidebar__rate-ring {
    display: grid;
    width: 92px;
    height: 92px;
    margin: 8px auto;
  }

  .profile-sidebar__rate-ring > div {
    width: 66px;
    height: 66px;
  }

  .profile-sidebar__rate-ring strong {
    margin-top: 8px;
    font-size: var(--text-lg);
  }

  .profile-sidebar__rate-ring span {
    margin-top: -8px;
    font-size: var(--text-xs);
  }
}
</style>
