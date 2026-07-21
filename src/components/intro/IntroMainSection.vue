<script setup>
import { useRouter } from "vue-router";
import { Crosshair, FileBadge, Play, Trophy, Users } from "lucide-vue-next";
import mainBackgroundUrl from "@/assets/images/intro/main-bg.webp";
import mainLogoUrl from "@/assets/images/logo-main.png";

const router = useRouter();

const features = [
  {
    title: "四人遊玩",
    description: "即時線上對局",
    icon: Users,
  },
  {
    title: "角色卡牌",
    description: "善用不同技能",
    icon: FileBadge,
  },
  {
    title: "局勢多變",
    description: "瞬間扭轉戰局",
    icon: Crosshair,
  },
  {
    title: "運籌帷幄",
    description: "贏得最終勝利",
    icon: Trophy,
  },
];

function startGame() {
  router.push("/");
}
</script>

<template>
  <section
    id="intro-main"
    class="grid h-full min-h-full w-full snap-start snap-always place-items-center overflow-hidden bg-[linear-gradient(90deg,#f4f7fb_0%,var(--brand-primary)_100%)]"
    aria-labelledby="intro-main-title"
  >
    <div
      class="relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f4f7fb] text-white"
    >
      <div
        class="relative min-h-0 flex-1 overflow-hidden bg-cover bg-center bg-no-repeat"
        :style="{ backgroundImage: `url(${mainBackgroundUrl})` }"
      >
        <div
          class="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(255,255,255,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,19,50,0.12))]"
        />

        <!-- RWD baseline: 1280x720, shared scale floor: 0.3853. -->
        <div
          class="absolute left-1/2 z-[2]"
          style="
            --hero-offset: clamp(180px, 25vw, 250px);
            top: calc(90px * var(--intro-scale));
          "
        >
          <div class="translate-x-[var(--hero-offset)]">
            <div class="w-[540px] -translate-x-[55%]">
              <div
                class="flex w-[540px] origin-top scale-[var(--intro-scale)] flex-col items-center text-center"
              >
                <h1
                  id="intro-main-title"
                  class="m-0"
                  data-intro-reveal
                  style="--intro-reveal-delay: 0ms"
                >
                  <img
                    class="block w-[540px] brightness-0 invert"
                    :src="mainLogoUrl"
                    alt="職場風雲 Office Politics"
                  />
                </h1>

                <p
                  class="mb-0 mt-[34px] text-[28px] font-black leading-[1.2] text-white drop-shadow-[0_6px_18px_rgba(0,19,50,0.22)]"
                  data-intro-reveal
                  style="--intro-reveal-delay: 90ms"
                >
                  策略・心機・人際・勝負
                </p>
                <p
                  class="mb-[44px] mt-[12px] text-[length:var(--text-md)] font-bold leading-[1.2] text-white/85 drop-shadow-[0_6px_18px_rgba(0,19,50,0.2)]"
                  data-intro-reveal
                  style="--intro-reveal-delay: 160ms"
                >
                  每一步決策，都將左右你的職場命運
                </p>

                <div
                  data-intro-reveal
                  style="--intro-reveal-delay: 240ms"
                >
                  <button
                    class="inline-flex h-[58px] w-[246px] items-center justify-center gap-[14px] bg-[var(--brand-hover)] text-[23px]! font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.32),0_0_24px_rgba(255,255,255,0.5),0_20px_46px_rgba(0,70,244,0.32)] transition-[transform,background,border-color,box-shadow] duration-[180ms] ease-out hover:-translate-y-px hover:border-[var(--brand-active)] hover:bg-[var(--brand-active)] active:translate-y-px active:border-[var(--brand-active)] active:bg-[var(--brand-active)] focus-visible:outline-0 focus-visible:shadow-[0_0_0_5px_var(--brand-focus),0_0_24px_rgba(255,255,255,0.5),0_20px_46px_rgba(0,70,244,0.28)]"
                    type="button"
                    @click="startGame"
                  >
                    <Play
                      class="h-[24px] w-[24px] fill-current stroke-[3]"
                      aria-hidden="true"
                    />
                    <span>開始遊戲</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul
          class="absolute bottom-2 left-1/2 z-[3] grid h-10 w-[80%] -translate-x-1/2 grid-cols-4 bg-white/25 p-0 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_18px_46px_rgba(0,19,50,0.16)] backdrop-blur-[14px] lg:bottom-8 lg:h-18"
          aria-label="遊戲特色"
        >
          <li
            v-for="(feature, index) in features"
            :key="feature.title"
            class="flex min-w-0 items-center justify-center gap-[10px] text-white lg:gap-[18px]"
            :class="{ 'border-l border-white/30': index > 0 }"
            data-intro-reveal
            :style="{ '--intro-reveal-delay': `${320 + index * 70}ms` }"
          >
            <component
              :is="feature.icon"
              class="h-5 w-5 shrink-0 stroke-[1.8] lg:h-11 lg:w-11"
              aria-hidden="true"
            />
            <span class="grid min-w-0 gap-1 text-left lg:gap-[7px]">
              <strong class="text-xs font-medium leading-none lg:text-[16px]">
                {{ feature.title }}
              </strong>
              <span
                class="text-[8px] font-medium leading-none text-white/75 lg:text-[12px]"
              >
                {{ feature.description }}
              </span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
