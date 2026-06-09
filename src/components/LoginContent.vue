<template>
  <div class="modal relative w-full max-w-105 rounded-2xl bg-white/95 px-8 pt-9 pb-8 shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_0_1px_rgba(200,168,75,0.2)] animate-[popIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)_both]">
    <div class="absolute inset-x-8 top-0 h-px rounded-full bg-[linear-gradient(90deg,transparent,rgba(200,168,75,0.6),transparent)]" />

    <button class="modalClose absolute top-3.5 right-3.5 h-9 w-9 rounded-full bg-slate-300 text-white text-lg font-bold flex items-center justify-center">✕</button>

    <h2 class="modalTitle text-center text-[26px] font-bold text-[#6bb8d4] tracking-[0.25em] mb-7 font-['Cinzel',serif]">登入</h2>

    <div class="field relative mb-3.5">
      <input
        class="fieldInput w-full rounded-[10px] border border-[#d0d0d0] bg-[#f0f0f0] px-4 pr-20 py-3.5 text-base text-[#333333] outline-none placeholder:text-[#bbb]"
        type="text"
        placeholder="帳號"
        value=""
      />
      <div class="fieldActions absolute right-2.5 top-1/2 flex gap-1.5 -translate-y-1/2">
        <button class="fieldIconBtn text-[#aaa] text-[17px] p-1.5">✕</button>
        <button class="fieldIconBtn text-[#aaa] text-[17px] p-1.5">▾</button>
      </div>
    </div>

    <div class="relative mb-3.5">
      <input
        class="w-full rounded-[10px] border border-[#d0d0d0] bg-[#f0f0f0] px-4 py-3.5 text-base text-[#333333] outline-none placeholder:text-[#bbb]"
        type="password"
        placeholder="密碼"
      />
    </div>

    <div class="modalBtnRow grid grid-cols-2 gap-3 mt-5">
      <button class="btn btnRegister rounded-xl border-2 border-[#6bb8d4] bg-white text-[#6bb8d4] font-bold text-lg uppercase tracking-[0.18em] py-3.5">註冊</button>
      <button class="btn btnLogin rounded-xl bg-linear-to-r from-[#6bb8d4] to-[#3a8fb5] text-white font-bold text-lg uppercase tracking-[0.18em] py-3.5 shadow-[0_4px_20px_rgba(58,143,181,0.45)]">登入</button>
    </div>

    <div class="modalLinkRow flex justify-between mt-4.5 text-[#666666] text-sm">
      <button class="linkBtn inline-flex items-center gap-1">訪客登入 <span class="linkBtnArrow text-xs">›</span></button>
      <button class="linkBtn inline-flex items-center gap-1">取回密碼 <span class="linkBtnArrow text-xs">›</span></button>
    </div>

    <div class="divider relative my-5 text-center text-sm text-[#666666]">
      <div class="absolute inset-x-0 top-1/2 h-px bg-[#d0d0d0]"></div>
      <span class="relative bg-white px-3">其他登入方式</span>
    </div>

    <div class="modalSocialRow grid grid-cols-2 gap-3">
      <button class="socialBtn flex items-center justify-center gap-2 rounded-[10px] border border-[#d0d0d0] bg-white py-3 text-sm font-medium text-[#333333]">
        <span class="socialBtnFbIcon grid h-6 w-6 place-items-center rounded-full bg-[#1877f2] text-sm font-bold text-white">f</span>
        Facebook
      </button>
      <button class="socialBtn flex items-center justify-center gap-2 rounded-[10px] border border-[#d0d0d0] bg-white py-3 text-sm font-medium text-[#333333]">
        <svg class="socialBtnGoogleIcon h-6 w-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </button>
    </div>
  </div>
</template>

<script setup>
</script>
