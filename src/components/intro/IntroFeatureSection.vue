<script setup>
import { computed, ref } from "vue";
import rulesBackgroundUrl from "@/assets/images/intro/rules-bg.webp";
import featureMallUrl from "@/assets/images/intro/featrue-mall.webp";
import featureFriendUrl from "@/assets/images/intro/featrue-friend.webp";
import featureGachaUrl from "@/assets/images/intro/featrue-gacha.webp";

const featureSystems = [
  {
    id: "mall",
    navLabel: "商城系統",
    title: "打造你的專屬風格",
    imageUrl: featureMallUrl,
    alt: "職場風雲商城系統介面",
    points: [
      "使用遊戲內資源解鎖造型與個人化外觀",
      "瀏覽可購買項目，快速確認價格與持有狀態",
      "讓每位玩家在房間與對局中展現不同風格",
    ],
  },
  {
    id: "friend",
    navLabel: "社交系統",
    title: "與好友一同遊玩",
    imageUrl: featureFriendUrl,
    alt: "職場風雲好友與聊天系統介面",
    points: [
      "加入好友、查看狀態，快速建立遊戲連線",
      "支援聊天互動，讓遊戲前後都能延續交流",
      "邀請朋友進入房間共同遊玩",
    ],
  },
  {
    id: "gacha",
    navLabel: "招募系統",
    title: "蒐集期間限定外觀",
    imageUrl: featureGachaUrl,
    alt: "職場風雲招募系統介面",
    points: [
      "招募功能可以抽出外觀",
      "職位越高越稀有，抽到機率越低",
      "定期推出新造型",
    ],
  },
];

const activeFeatureId = ref(featureSystems[0].id);

const activeFeature = computed(
  () =>
    featureSystems.find((feature) => feature.id === activeFeatureId.value) ??
    featureSystems[0],
);
</script>

<template>
  <section
    id="intro-feature"
    class="flex h-full min-h-full w-full justify-center snap-start snap-always overflow-hidden bg-white bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${rulesBackgroundUrl})` }"
    aria-labelledby="intro-feature-title"
  >
    <div
      class="flex h-[654px] w-[calc(90%/var(--intro-scale))] min-w-[calc(600px/var(--intro-scale))] max-w-[calc(1180px/var(--intro-scale))] origin-top scale-[var(--intro-scale)] flex-col py-6"
    >
      <header
        class="flex shrink-0 items-start justify-between gap-[36px]"
        data-intro-reveal
        style="--intro-reveal-delay: 0ms"
      >
        <div>
          <p
            id="intro-feature-title"
            class="m-0 [color:var(--gray-300)] [font-size:24px] font-bold leading-none"
          >
            特色系統 FEATURES
          </p>
          <div
            class="mt-[24px] h-[6px] w-[88px] bg-[var(--brand-hover)]"
            aria-hidden="true"
          />
        </div>

        <nav class="flex items-center gap-[12px]" aria-label="特色系統子導覽">
          <button
            v-for="feature in featureSystems"
            :key="feature.id"
            class="grid h-[46px] w-[132px] place-items-center border border-[rgba(0,70,244,0.42)] px-[18px] text-center [font-size:18px] font-bold leading-none transition-[background,color,border-color,transform,box-shadow] duration-[180ms] ease-out hover:-translate-y-px hover:border-[var(--brand-hover)] focus-visible:outline-0 focus-visible:shadow-[0_0_0_5px_var(--brand-focus)]"
            :class="
              activeFeatureId === feature.id
                ? 'bg-[var(--brand-hover)] text-white shadow-[0_12px_30px_rgba(0,70,244,0.18)]'
                : 'bg-white/84 [color:var(--brand-active)]'
            "
            type="button"
            :aria-current="activeFeatureId === feature.id ? 'page' : undefined"
            @click="activeFeatureId = feature.id"
          >
            {{ feature.navLabel }}
          </button>
        </nav>
      </header>

      <div class="relative mt-[24px] min-h-0 flex-1 overflow-hidden">
        <div
          :key="activeFeature.id"
          class="absolute inset-0 bg-contain bg-right-bottom bg-no-repeat"
          :style="{ backgroundImage: `url(${activeFeature.imageUrl})` }"
          aria-hidden="true"
          data-intro-reveal
          style="--intro-reveal-delay: 220ms"
        />

        <article
          class="relative z-10 w-[390px] py-[18px]"
          :aria-label="activeFeature.alt"
          data-intro-reveal
          style="--intro-reveal-delay: 110ms"
        >
          <h3
            class="mb-0 mt-[18px] [color:var(--brand-navy)] [font-size:38px] font-black leading-none"
          >
            {{ activeFeature.title }}
          </h3>
          <ul
            class="m-0 mt-[28px] grid list-none gap-[14px] p-0 [color:var(--brand-active)] [font-size:16px] font-medium leading-[1.55]"
          >
            <li
              v-for="point in activeFeature.points"
              :key="point"
              class="flex gap-[10px]"
            >
              <span
                class="mt-[9px] h-[6px] w-[18px] shrink-0 bg-[var(--brand-hover)]"
                aria-hidden="true"
              />
              <span>{{ point }}</span>
            </li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>
