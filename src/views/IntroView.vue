<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import IntroBackgroundSection from "@/components/intro/IntroBackgroundSection.vue";
import IntroCardsSection from "@/components/intro/IntroCardsSection.vue";
import IntroMainSection from "@/components/intro/IntroMainSection.vue";
import IntroNavbar from "@/components/intro/IntroNavbar.vue";
import IntroRulesSection from "@/components/intro/IntroRulesSection.vue";
import IntroTeamSection from "@/components/intro/IntroTeamSection.vue";

const scrollContainer = ref(null);
const activeSection = ref("");
const sectionRatios = new Map();
let sectionObserver;
let revealedSectionId = "";
let revealAnimationFrame = 0;

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

function revealSection(sectionId, sections) {
  if (revealedSectionId === sectionId) return;

  if (revealAnimationFrame) {
    window.cancelAnimationFrame(revealAnimationFrame);
    revealAnimationFrame = 0;
  }

  sections.forEach((section) => {
    section.classList.remove("intro-section--revealed");
  });

  revealedSectionId = sectionId;
  const target = sections.find((section) => section.id === sectionId);

  if (!target) return;

  revealAnimationFrame = window.requestAnimationFrame(() => {
    target.classList.add("intro-section--revealed");
    revealAnimationFrame = 0;
  });
}

onMounted(async () => {
  await nextTick();

  const container = scrollContainer.value;
  const sections = [
    "intro-main",
    "intro-background",
    "intro-rules",
    "intro-cards",
    "intro-team",
  ]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!container || sections.length === 0) return;

  sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        sectionRatios.set(entry.target.id, entry.intersectionRatio);
      });

      let visibleSectionId = "";

      if ((sectionRatios.get("intro-team") ?? 0) >= 0.6) {
        visibleSectionId = "intro-team";
        activeSection.value = "intro-team";
      } else if ((sectionRatios.get("intro-cards") ?? 0) >= 0.6) {
        visibleSectionId = "intro-cards";
        activeSection.value = "intro-cards";
      } else if ((sectionRatios.get("intro-rules") ?? 0) >= 0.6) {
        visibleSectionId = "intro-rules";
        activeSection.value = "intro-rules";
      } else if ((sectionRatios.get("intro-background") ?? 0) >= 0.6) {
        visibleSectionId = "intro-background";
        activeSection.value = "intro-background";
      } else if ((sectionRatios.get("intro-main") ?? 0) >= 0.6) {
        visibleSectionId = "intro-main";
        activeSection.value = "";
      } else {
        activeSection.value = "";
      }

      revealSection(visibleSectionId, sections);
    },
    {
      root: container,
      threshold: [0, 0.6, 1],
    },
  );

  sections.forEach((section) => sectionObserver.observe(section));
});

onBeforeUnmount(() => {
  if (revealAnimationFrame) {
    window.cancelAnimationFrame(revealAnimationFrame);
  }
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
      <IntroCardsSection />
      <IntroTeamSection />
    </div>
  </main>
</template>

<style>
[data-intro-reveal] {
  opacity: 0;
  transform: translateY(18px);
}

.intro-section--revealed [data-intro-reveal] {
  animation: introRevealIn 760ms cubic-bezier(0.16, 0.84, 0.22, 1) both;
  animation-delay: var(--intro-reveal-delay, 0ms);
}

@keyframes introRevealIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-intro-reveal] {
    opacity: 1;
    transform: none;
  }

  .intro-section--revealed [data-intro-reveal] {
    animation: none;
  }
}
</style>
