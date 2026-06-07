<template>
  <div class="app">
    <!-- ── Cinematic Background ── -->
    <div class="bg">
      <div class="bgOrb bgOrb1" />
      <div class="bgOrb bgOrb2" />
      <div class="bgOrb bgOrb3" />
    </div>

    <!-- ── Diamond Grid Watermark ── -->
    <div class="diamondGrid" aria-hidden="true">
      <span v-for="i in 16" :key="i" class="diamondGridCell" />
    </div>

    <!-- ── Title Watermark ── -->
    <div class="titleWatermark" aria-hidden="true">F<br>O</div>

    <!-- ── Modal Overlay ── -->
    <div class="overlay">
      <LoginContent />
    </div>
  </div>
</template>

<script setup>
import LoginContent from './LoginContent.vue'
</script>

<style>
@import '../assets/styles/LoginStyle.css';
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&family=Cinzel:wght@400;700&display=swap');

body {
  font-family: var(--font-body);
  min-height: 100vh;
  background: #1a2a3a;
  overflow: hidden;
}

.app {
  position: relative;
  min-height: 100vh;
}

/* ── Background ── */
.bg {
  position: fixed; inset: 0; z-index: 0;
  background:
    radial-gradient(ellipse at 50% 60%, rgba(107, 184, 212, 0.18) 0%, transparent 65%),
    linear-gradient(175deg, #0d1b2a 0%, #1e3a52 35%, #2a5570 55%, #1b3045 100%);
}
.bg::before {
  content: '';
  position: absolute; inset: 0;
  background: repeating-linear-gradient(
    135deg, transparent, transparent 40px,
    rgba(255, 255, 255, 0.012) 40px, rgba(255, 255, 255, 0.012) 41px
  );
}
.bgOrb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.25;
  animation: drift 12s ease-in-out infinite alternate;
}
.bgOrb1 { width: 320px; height: 320px; background: #6bb8d4; top: -80px; left: -60px; animation-delay: 0s; }
.bgOrb2 { width: 240px; height: 240px; background: #c8a84b; bottom: -60px; right: -40px; animation-delay: -4s; }
.bgOrb3 { width: 180px; height: 180px; background: #3a8fb5; top: 40%; right: 10%; animation-delay: -8s; }

@keyframes drift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(20px, 30px) scale(1.08); }
}

/* ── Diamond Grid ── */
.diamondGrid {
  position: fixed; top: 20px; left: 20px; z-index: 1;
  display: grid; grid-template-columns: repeat(4, 28px);
  gap: 4px; opacity: 0.3; pointer-events: none;
}
.diamondGridCell {
  width: 28px; height: 28px;
  background: #6bb8d4;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}

/* ── Title Watermark ── */
.titleWatermark {
  position: fixed; left: 50px; top: 50%; transform: translateY(-50%);
  z-index: 1; pointer-events: none;
  font-family: var(--font-display);
  font-size: clamp(72px, 12vw, 140px);
  font-weight: 700;
  color: rgba(255, 255, 255, 0.06);
  letter-spacing: 0.1em;
  line-height: 1;
}

/* ── Labels ── */
.ver {
  position: fixed; bottom: 16px; left: 20px;
  z-index: 1;
  color: rgba(255, 255, 255, 0.45);
  font-size: 11px;
}
.copyright {
  position: fixed; bottom: 16px; right: 20px;
  z-index: 1;
  color: rgba(255, 255, 255, 0.45);
  font-size: 11px;
  letter-spacing: 0.05em;
}

/* ── Overlay ── */
.overlay {
  position: fixed; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
</style>
