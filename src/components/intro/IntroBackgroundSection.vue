<script setup>
import backgroundImageUrl from "@/assets/images/intro/background-bg.webp";
</script>

<template>
  <section
    id="intro-background"
    class="relative h-full min-h-full w-full snap-start snap-always overflow-hidden bg-white bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
    aria-labelledby="intro-background-title"
  >
    <div
      class="absolute w-[680px] origin-top-left scale-[var(--intro-scale)]"
      style="
        left: calc(72px * var(--intro-scale));
        top: calc(64px * var(--intro-scale));
      "
    >
      <p
        class="m-0 [color:var(--gray-300)] [font-size:24px] font-bold leading-none"
        data-intro-reveal
        style="--intro-reveal-delay: 0ms"
      >
        遊戲背景 BACKGROUND
      </p>
      <h2
        id="intro-background-title"
        class="mb-0 mt-[16px] [color:var(--brand-hover)] [font-size:42px] font-black leading-[1.2]"
        data-intro-reveal
        style="--intro-reveal-delay: 90ms"
      >
        歡迎加入職場的權力遊戲
      </h2>
      <div
        class="mt-[28px] h-[6px] w-[88px] bg-[var(--brand-hover)]"
        data-intro-reveal
        style="--intro-reveal-delay: 160ms"
        aria-hidden="true"
      />
    </div>

    <div
      class="absolute w-[680px] [color:var(--brand-active)] [font-size:14px] font-medium leading-[1.9] lg:[font-size:20px]"
      data-intro-reveal
      style="
        --intro-reveal-delay: 260ms;
        left: calc(72px * var(--intro-scale));
        bottom: calc(50px * var(--intro-scale));
      "
    >
      <p class="m-0">年終考核將至，權力的角逐悄然展開</p>
      <p class="m-0">你將扮演公司內的一名職員，運用人脈、情報與策略</p>
      <p class="m-0">在明爭暗鬥中淘汰競爭對手，成為最後唯一的倖存者</p>
      <p class="m-0">獨得豐厚的年終分紅！</p>
    </div>
  </section>
</template>
