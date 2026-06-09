<template>
  <div class="login-page app relative min-h-screen overflow-hidden bg-[#1a2a3a] text-white">
    <div class="bg fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(107,184,212,0.18)_0%,transparent_65%),linear-gradient(175deg,#0d1b2a_0%,#1e3a52_35%,#2a5570_55%,#1b3045_100%)]">
      <div class="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_40px,rgba(255,255,255,0.012)_40px,rgba(255,255,255,0.012)_41px)]"></div>
      <div class="bgOrb bgOrb1 absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#6bb8d4] blur-[60px] opacity-25 animate-[drift_12s_ease-in-out_infinite_alternate]"></div>
      <div class="bgOrb bgOrb2 absolute -right-10 -bottom-14 h-60 w-60 rounded-full bg-[#c8a84b] blur-[60px] opacity-25 animate-[drift_12s_ease-in-out_infinite_alternate]" style="animation-delay:-4s"></div>
      <div class="bgOrb bgOrb3 absolute right-[10%] top-[40%] h-45 w-45 rounded-full bg-[#3a8fb5] blur-[60px] opacity-25 animate-[drift_12s_ease-in-out_infinite_alternate]" style="animation-delay:-8s"></div>
    </div>

    <div class="diamondGrid fixed top-5 left-5 z-10 grid grid-cols-4 gap-1 opacity-30 pointer-events-none">
      <span v-for="i in 16" :key="i" class="diamondGridCell h-7 w-7 bg-[#6bb8d4] [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]"></span>
    </div>

    <div class="titleWatermark fixed left-12 top-1/2 z-10 -translate-y-1/2 pointer-events-none font-['Cinzel',serif] text-[clamp(72px,12vw,60px)] font-bold text-white/5 tracking-widest leading-none">
      Office<br />Politics
    </div>

    <div class="overlay fixed inset-0 z-20 flex items-center justify-center p-5">
      <LoginContent />
    </div>
  </div>
</template>

<script setup>
import LoginContent from './LoginContent.vue'
</script>
