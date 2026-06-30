<template>
  <section class="not-found-page">
    <video
      class="bg-video"
      autoplay
      muted
      loop
      playsinline
    >
      <source :src="bgVideo" type="video/mp4" />
    </video>

    <div class="overlay" aria-hidden="true"></div>

    <div class="action-wrap">
      <RouterLink class="home-link tap-pop" to="/">
        返回首頁
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import bgVideo from "@/assets/videos/404.mp4";
</script>

<style scoped>
.not-found-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #08080a;
}

.bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(6, 8, 10, 0.08),
    rgba(6, 8, 10, 0.24) 70%,
    rgba(6, 8, 10, 0.42)
  );
}

.action-wrap {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 24px;
  padding-bottom: 40px;
}

.home-link {
  display: inline-flex;
  min-height: 52px;
  min-width: 160px;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(10, 12, 16, 0.5);
  color: #ffffff;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-decoration: none;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(10px);
  transition:
    transform 180ms ease,
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.home-link:hover {
  transform: translateY(-1px);
  background: rgba(10, 12, 16, 0.64);
  border-color: rgba(255, 255, 255, 0.72);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.32);
}

@media (max-width: 640px) {
  .action-wrap {
    padding: 20px;
    padding-bottom: 28px;
  }

  .home-link {
    width: min(100%, 240px);
  }
}
</style>
