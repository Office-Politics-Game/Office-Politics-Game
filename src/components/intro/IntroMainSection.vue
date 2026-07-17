<script setup>
import { useRouter } from "vue-router";
import { Crosshair, FileBadge, Play, Trophy, Users } from "lucide-vue-next";
import mainBackgroundUrl from "@/assets/images/intro/main-bg.webp";
import navLogoUrl from "@/assets/images/intro/logo-ch-en-long-01.svg";
import mainLogoUrl from "@/assets/images/logo-main.png";

const router = useRouter();

const navItems = ["遊戲簡介", "規則介紹", "卡牌介紹", "團隊成員"];

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
    class="grid h-full min-h-full w-full place-items-center overflow-hidden bg-[linear-gradient(90deg,#f4f7fb_0%,var(--brand-primary)_100%)]"
    aria-labelledby="intro-main-title"
  >
    <div
      class="relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f4f7fb] text-white lg:min-h-[720px]"
    >
      <header
        class="relative z-[5] grid h-[48px] w-full flex-[0_0_48px] grid-cols-[128px_minmax(0,1fr)_96px] items-center gap-6 border-b border-[rgba(134,179,224,0.52)] bg-white/90 px-[20px] lg:h-[66px] lg:flex-[0_0_66px] lg:grid-cols-[228px_1fr_132px] lg:gap-12 lg:pl-[70px] lg:pr-[58px]"
        aria-label="介紹頁導覽"
      >
        <img
          class="block w-[112px] lg:w-[148px]"
          :src="navLogoUrl"
          alt="職場風雲 Office Politics"
        />

        <nav
          class="flex justify-end gap-[18px] lg:gap-[60px]"
          aria-label="頁面區塊"
        >
          <span
            v-for="item in navItems"
            :key="item"
            class="whitespace-nowrap [color:var(--brand-active)] text-[10px] font-extrabold leading-none lg:text-[length:var(--text-sm)]"
          >
            {{ item }}
          </span>
        </nav>

        <button
          class="inline-flex h-[30px] w-[84px] items-center justify-center gap-[4px] border border-[var(--brand-hover)] bg-[var(--brand-hover)] [font-size:10px]! font-bold text-white transition-[transform,background,border-color,box-shadow] duration-[180ms] ease-out hover:-translate-y-px hover:border-[var(--brand-active)] hover:bg-[var(--brand-active)] active:translate-y-px active:border-[var(--brand-active)] active:bg-[var(--brand-active)] focus-visible:outline-0 focus-visible:shadow-[0_0_0_5px_var(--brand-focus)] lg:h-[40px] lg:w-[132px] lg:gap-[8px] lg:text-sm!"
          type="button"
          @click="startGame"
        >
          <Play
            class="h-2 w-2 fill-current stroke-[3] lg:h-[15px] lg:w-[15px]"
            aria-hidden="true"
          />
          <span>開始遊戲</span>
        </button>
      </header>

      <div
        class="relative min-h-0 flex-1 overflow-hidden bg-cover bg-center bg-no-repeat"
        :style="{ backgroundImage: `url(${mainBackgroundUrl})` }"
      >
        <div
          class="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(255,255,255,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,19,50,0.12))]"
        />

        <div
          class="absolute left-1/2 top-[38px] z-[2] [--hero-nav-height:48px] lg:top-[94px] lg:[--hero-nav-height:66px]"
          style="
            --hero-scale: clamp(
              0.5,
              min(
                calc(100vw / 1280px),
                calc((100dvh - var(--hero-nav-height)) / 654px)
              ),
              1
            );
            --hero-offset: clamp(180px, 25vw, 250px);
          "
        >
          <div class="translate-x-[var(--hero-offset)]">
            <div class="w-[540px] -translate-x-[55%]">
              <div
                class="flex w-[540px] origin-top scale-[var(--hero-scale)] flex-col items-center text-center"
              >
                <h1 id="intro-main-title" class="m-0">
                  <img
                    class="block w-[540px] brightness-0 invert"
                    :src="mainLogoUrl"
                    alt="職場風雲 Office Politics"
                  />
                </h1>

                <p
                  class="mb-0 mt-[34px] text-[28px] font-black leading-[1.2] text-white drop-shadow-[0_6px_18px_rgba(0,19,50,0.22)]"
                >
                  策略・心機・人際・勝負
                </p>
                <p
                  class="mb-[44px] mt-[12px] text-[length:var(--text-md)] font-bold leading-[1.2] text-white/85 drop-shadow-[0_6px_18px_rgba(0,19,50,0.2)]"
                >
                  每一步決策，都將左右你的職場命運
                </p>

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

        <ul
          class="absolute bottom-[16px] left-1/2 z-[3] grid h-12 w-[80%] -translate-x-1/2 grid-cols-4 bg-white/25 p-0 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_18px_46px_rgba(0,19,50,0.16)] backdrop-blur-[14px] lg:bottom-[42px] lg:h-[94px]"
          aria-label="遊戲特色"
        >
          <li
            v-for="(feature, index) in features"
            :key="feature.title"
            class="flex min-w-0 items-center justify-center gap-[10px] text-white lg:gap-[18px]"
            :class="{ 'border-l border-white/30': index > 0 }"
          >
            <component
              :is="feature.icon"
              class="h-6 w-6 shrink-0 stroke-[1.8] lg:h-11 lg:w-11"
              aria-hidden="true"
            />
            <span class="grid min-w-0 gap-1 text-left lg:gap-[7px]">
              <strong class="text-xs font-bold leading-none lg:text-[20px]">
                {{ feature.title }}
              </strong>
              <span
                class="text-[8px] font-bold leading-none text-white/75 lg:text-[14px]"
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
