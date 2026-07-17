<script setup>
import { useRouter } from "vue-router";
import { Play } from "lucide-vue-next";
import navLogoUrl from "@/assets/images/intro/logo-ch-en-long-01.svg";

defineProps({
  activeSection: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["navigate"]);
const router = useRouter();

const navItems = [
  { label: "遊戲簡介", sectionId: "intro-background", enabled: true },
  { label: "規則介紹", sectionId: "intro-rules", enabled: true },
  { label: "卡牌介紹", sectionId: "intro-cards", enabled: true },
  { label: "團隊成員", sectionId: "intro-team", enabled: false },
];

function startGame() {
  router.push("/");
}
</script>

<template>
  <header
    class="relative z-10 grid h-[48px] w-full flex-[0_0_48px] grid-cols-[128px_minmax(0,1fr)_96px] items-center gap-6 border-b border-[rgba(134,179,224,0.52)] bg-white/95 px-[20px] backdrop-blur-[10px] lg:h-[66px] lg:flex-[0_0_66px] lg:grid-cols-[228px_1fr_132px] lg:gap-12 lg:pl-[70px] lg:pr-[58px]"
    aria-label="介紹頁導覽"
  >
    <img
      class="block w-[112px] lg:w-[148px]"
      :src="navLogoUrl"
      alt="職場風雲 Office Politics"
    />

    <nav
      class="flex h-full justify-end gap-[18px] lg:gap-[60px]"
      aria-label="頁面區塊"
    >
      <template v-for="item in navItems" :key="item.sectionId">
        <button
          v-if="item.enabled"
          class="relative inline-flex h-full items-center whitespace-nowrap [color:var(--brand-active)] [font-size:10px]! font-extrabold leading-none transition-colors duration-[180ms] ease-out hover:[color:var(--brand-hover)] active:[color:var(--brand-active)] focus-visible:outline-0 focus-visible:shadow-[inset_0_0_0_3px_var(--brand-focus)] lg:[font-size:14px]!"
          type="button"
          :aria-current="
            activeSection === item.sectionId ? 'location' : undefined
          "
          @click="emit('navigate', item.sectionId)"
        >
          {{ item.label }}
          <span
            v-if="activeSection === item.sectionId"
            class="absolute inset-x-0 bottom-0 h-1 bg-[var(--brand-hover)]"
            aria-hidden="true"
          />
        </button>
        <span
          v-else
          class="inline-flex h-full items-center whitespace-nowrap [color:var(--brand-active)] [font-size:10px] font-extrabold leading-none lg:[font-size:14px]"
        >
          {{ item.label }}
        </span>
      </template>
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
</template>
