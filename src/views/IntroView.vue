<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import IntroBackgroundSection from "@/components/intro/IntroBackgroundSection.vue";
import IntroMainSection from "@/components/intro/IntroMainSection.vue";
import IntroNavbar from "@/components/intro/IntroNavbar.vue";
import IntroRulesSection from "@/components/intro/IntroRulesSection.vue";

const scrollContainer = ref(null);
const activeSection = ref("");
const sectionRatios = new Map();
let sectionObserver;

function navigateToSection(sectionId) {
  const target = document.getElementById(sectionId);
  const container = scrollContainer.value;

  if (!target || !container) return;

  const targetTop =
    target.getBoundingClientRect().top -
    container.getBoundingClientRect().top +
    container.scrollTop;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  container.scrollTo({
    top: targetTop,
    behavior: reduceMotion ? "auto" : "smooth",
  });
}

onMounted(async () => {
  await nextTick();

  const container = scrollContainer.value;
  const sections = ["intro-main", "intro-background", "intro-rules"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!container || sections.length === 0) return;

  sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        sectionRatios.set(entry.target.id, entry.intersectionRatio);
      });

      if ((sectionRatios.get("intro-rules") ?? 0) >= 0.6) {
        activeSection.value = "intro-rules";
      } else if ((sectionRatios.get("intro-background") ?? 0) >= 0.6) {
        activeSection.value = "intro-background";
      } else {
        activeSection.value = "";
      }
    },
    {
      root: container,
      threshold: [0, 0.6, 1],
    },
  );

  sections.forEach((section) => sectionObserver.observe(section));
});

onBeforeUnmount(() => {
  sectionObserver?.disconnect();
});
</script>

<template>
  <!-- Shared RWD: 1280x720 baseline, 654px content height, 0.3853 floor. -->
  <main
    class="flex h-full w-full flex-col overflow-hidden bg-[var(--brand-navy)] font-sans [--intro-nav-height:48px] lg:[--intro-nav-height:66px]"
    style="
      --intro-scale: clamp(
        0.3853,
        min(
          calc(100vw / 1280px),
          calc((100dvh - var(--intro-nav-height)) / 654px)
        ),
        1
      );
    "
    aria-label="職場風雲遊戲介紹"
  >
    <IntroNavbar
      :active-section="activeSection"
      @navigate="navigateToSection"
    />

    <div
      ref="scrollContainer"
      class="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto scroll-smooth motion-reduce:scroll-auto"
    >
      <IntroMainSection />
      <IntroBackgroundSection />
      <IntroRulesSection />
    </div>
  </main>
</template>
