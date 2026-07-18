<script setup>
import {
  CircleHelp,
  ListChecks,
  Target,
  Trophy,
  Users,
} from "lucide-vue-next";
import bonusChequeUrl from "@/assets/images/bonus-cheque-token.png";
import gameRuleFlowUrl from "@/assets/images/intro/game-rule-flow.webp";
import rulesBackgroundUrl from "@/assets/images/intro/rules-bg.webp";
</script>

<template>
  <section
    id="intro-rules"
    class="flex h-full min-h-full w-full justify-center snap-start snap-always overflow-hidden bg-white bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${rulesBackgroundUrl})` }"
    aria-labelledby="intro-rules-title"
  >
    <div
      class="flex h-[654px] w-[calc(90%/var(--intro-scale))] min-w-[calc(600px/var(--intro-scale))] max-w-[calc(1180px/var(--intro-scale))] origin-top scale-[var(--intro-scale)] flex-col py-6"
    >
      <header data-intro-reveal style="--intro-reveal-delay: 0ms">
        <p
          class="m-0 [color:var(--gray-300)] [font-size:22px] font-bold leading-none"
        >
          遊戲規則 RULES
        </p>
        <div
          class="mt-[24px] h-[6px] w-[88px] bg-[var(--brand-hover)]"
          aria-hidden="true"
        />
      </header>

      <div class="mt-[30px] grid grid-cols-2 gap-[14px]">
        <article
          class="flex min-h-[242px] flex-col border border-[rgba(134,179,224,0.42)] bg-white/75 p-[12px] shadow-[0_10px_30px_rgba(0,19,50,0.06)] backdrop-blur-[10px]"
          data-intro-reveal
          style="--intro-reveal-delay: 110ms"
        >
          <h3
            class="m-0 flex items-center gap-[8px] [color:var(--brand-hover)] [font-size:24px] font-extrabold leading-none"
          >
            <Target class="h-[20px] w-[20px] stroke-[2.5]" aria-hidden="true" />
            遊戲目標
          </h3>
          <div class="mt-[10px] grid min-h-0 flex-1 grid-rows-2 gap-[8px]">
            <div
              class="flex flex-row items-center justify-center gap-[8px] bg-[rgba(134,179,224,0.12)] px-[10px] text-left [color:var(--brand-active)] [font-size:24px] font-medium leading-[1.45] lg:flex-col lg:text-center lg:[font-size:16px]"
            >
              <Users
                class="h-[28px] w-[28px] shrink-0 [color:var(--brand-hover)]"
                aria-hidden="true"
              />
              <p class="m-0">成為最後唯一倖存的玩家</p>
            </div>
            <div
              class="flex flex-row items-center justify-center gap-[8px] bg-[rgba(134,179,224,0.12)] px-[10px] text-left [color:var(--brand-active)] [font-size:24px] font-medium leading-[1.45] lg:flex-col lg:text-center lg:[font-size:16px]"
            >
              <CircleHelp
                class="h-[28px] w-[28px] shrink-0 [color:var(--brand-hover)]"
                aria-hidden="true"
              />
              <p class="m-0">牌庫抽完後，比較手牌點數，點數最高者獲勝</p>
            </div>
          </div>
        </article>

        <article
          class="flex flex-col border border-[rgba(134,179,224,0.42)] bg-white/75 p-[12px] shadow-[0_10px_30px_rgba(0,19,50,0.06)] backdrop-blur-[10px]"
          data-intro-reveal
          style="--intro-reveal-delay: 200ms"
        >
          <h3
            class="m-0 flex items-center gap-[8px] [color:var(--brand-hover)] [font-size:24px] font-extrabold leading-none"
          >
            <Trophy class="h-[20px] w-[20px] stroke-[2.5]" aria-hidden="true" />
            勝利條件
          </h3>
          <div class="mt-[10px] grid min-h-0 flex-1 grid-rows-2 gap-[8px]">
            <div
              class="flex flex-row items-center justify-center gap-[6px] bg-[rgba(134,179,224,0.12)] px-[10px] text-left [color:var(--brand-active)] [font-size:24px] font-medium leading-[1.45] lg:flex-col lg:text-center lg:[font-size:16px]"
            >
              <img
                class="h-[25px] w-auto shrink-0"
                :src="bonusChequeUrl"
                alt="年終支票"
              />
              <p class="m-0">符合任一條件即可獲得一張年終支票</p>
            </div>
            <div
              class="flex flex-row items-center justify-center gap-[6px] bg-[rgba(134,179,224,0.12)] px-[10px] text-left [color:var(--brand-active)] [font-size:24px] font-medium leading-[1.45] lg:flex-col lg:text-center lg:[font-size:16px]"
            >
              <div class="flex h-[27px] w-[48px] shrink-0" aria-hidden="true">
                <img
                  v-for="index in 3"
                  :key="index"
                  class="h-[22px] w-auto"
                  :class="[
                    index === 1 && 'mt-[4px]',
                    index === 2 && '-ml-[29px] mt-[2px]',
                    index === 3 && '-ml-[29px]',
                  ]"
                  :src="bonusChequeUrl"
                  alt=""
                />
              </div>
              <p class="m-0">先獲得三張支票的玩家，取得最終勝利</p>
            </div>
          </div>
        </article>
      </div>

      <article
        class="mt-[8px] flex min-h-0 flex-1 flex-col border border-[rgba(134,179,224,0.42)] bg-white/75 px-[12px] pt-[12px] shadow-[0_10px_30px_rgba(0,19,50,0.06)] backdrop-blur-[10px]"
        data-intro-reveal
        style="--intro-reveal-delay: 290ms"
      >
        <h3
          class="m-0 flex items-center gap-[8px] [color:var(--brand-hover)] [font-size:24px] font-extrabold leading-none"
        >
          <ListChecks
            class="h-[20px] w-[20px] stroke-[2.5]"
            aria-hidden="true"
          />
          遊戲流程
        </h3>
        <img
          class="mx-auto my-[8px] block h-[100%] min-h-0 w-auto object-contain lg:my-[20px]"
          :src="gameRuleFlowUrl"
          alt="遊戲流程：每人先發一張、每回合再抽一張、選擇其中一張打出、發動效果淘汰對手"
        />
      </article>
    </div>
  </section>
</template>
