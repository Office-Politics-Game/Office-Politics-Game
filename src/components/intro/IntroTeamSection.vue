<script setup>
import { Github, Mail } from "lucide-vue-next";
import rulesBackgroundUrl from "@/assets/images/intro/rules-bg.webp";

const teamMembers = [
  {
    name: "蘇郁傑",
    github: "Tissuu",
    email: "abcd031313@gmail.com",
    roles: ["好友聊天系統、遊戲音效統籌"],
    tasks: [
      "主要遊戲畫面切版",
      "抽牌/發牌/交換手牌動畫",
      "好友系統",
      "房間邀請功能串接",
      "專案文件建置",
    ],
  },
  {
    name: "郭嘉琪",
    github: "Maggie0513",
    email: "h6741957@gmail.com",
    roles: ["儲值系統、遊戲後端邏輯"],
    tasks: [
      "遊戲主選單切版",
      "建立後端專案與資料庫",
      "實作遊戲卡牌後端邏輯",
      "實現遊戲多人連線",
      "遊戲儲值系統",
    ],
  },
  {
    name: "詹珈璇",
    github: "ChloeChan1",
    email: "angel332332@gmail.com",
    roles: ["會員系統、第三方登入"],
    tasks: [
      "房間頁面切版",
      "房間、遊戲回合流程",
      "訪客模式登入後端",
      "註冊/登入/登出功能後端",
      "登入系統前端權限建置",
    ],
  },
  {
    name: "蔡佩芹",
    github: "celery1123",
    email: "p.tonki1123@gmail.com",
    roles: ["商城購物系統、造型系統"],
    tasks: [
      "入口頁/登入頁切版",
      "出牌/洗牌動畫",
      "商城系統",
      "房間功能前端",
      "404 頁面串接",
    ],
  },
  {
    name: "林立崴",
    github: "mountainway54",
    email: "linliweii54@gmail.com",
    roles: ["遊戲互動整合、美術設計"],
    tasks: [
      "結算頁切版",
      "視覺規劃/圖片素材",
      "卡片特殊效果動畫",
      "遊戲動畫串接",
      "前後端/資料庫部署",
    ],
  },
];

const repositoryUrl =
  "https://github.com/Office-Politics-Game/Office-Politics-Game";
</script>

<template>
  <section
    id="intro-team"
    class="flex h-full min-h-full w-full justify-center snap-start snap-always overflow-hidden bg-white bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${rulesBackgroundUrl})` }"
    aria-labelledby="intro-team-title"
  >
    <div
      class="flex h-[654px] w-[calc(90%/var(--intro-scale))] min-w-[calc(600px/var(--intro-scale))] max-w-[calc(1180px/var(--intro-scale))] origin-top scale-[var(--intro-scale)] flex-col py-6"
    >
      <header
        class="shrink-0"
        data-intro-reveal
        style="--intro-reveal-delay: 0ms"
      >
        <p
          class="m-0 [color:var(--gray-300)] [font-size:24px] font-bold leading-none"
        >
          團隊成員 TEAM
        </p>
        <div
          class="mt-[24px] h-[6px] w-[88px] bg-[var(--brand-hover)]"
          aria-hidden="true"
        />
      </header>

      <div
        class="mt-[22px] grid min-h-0 flex-1 grid-cols-3 grid-rows-2 gap-x-[18px] gap-y-[14px]"
        aria-label="團隊成員列表"
      >
        <article
          v-for="(member, index) in teamMembers"
          :key="member.email"
          class="flex min-h-0 flex-col border border-[rgba(0,70,244,0.42)] bg-white/88 shadow-[0_12px_32px_rgba(0,19,50,0.08)] backdrop-blur-[10px]"
          data-intro-reveal
          :style="{ '--intro-reveal-delay': `${110 + index * 75}ms` }"
        >
          <div
            class="flex min-h-[76px] flex-col items-center justify-center px-[10px] py-[8px] text-center"
          >
            <h3
              class="m-0 [color:var(--brand-navy)] [font-size:21px] font-bold leading-none"
            >
              {{ member.name }}
            </h3>
            <div
              class="mt-[8px] flex items-center gap-[6px] [color:var(--brand-active)] [font-size:12px] font-bold leading-none"
            >
              <Github class="h-[14px] w-[14px] shrink-0" aria-hidden="true" />
              <span>{{ member.github }}</span>
            </div>
            <div
              class="mt-[6px] flex items-center gap-[6px] [color:var(--brand-navy)] [font-size:12px] font-bold leading-none"
            >
              <Mail class="h-[13px] w-[13px] shrink-0" aria-hidden="true" />
              <span>{{ member.email }}</span>
            </div>
          </div>

          <div
            class="grid min-h-[54px] place-items-center bg-[var(--brand-hover)] px-[10px] text-center text-white"
          >
            <p class="m-0 [font-size:20px] font-bold leading-[1.25]">
              <span v-for="role in member.roles" :key="role" class="block">
                {{ role }}
              </span>
            </p>
          </div>

          <ul
            class="m-0 grid list-none grid-cols-2 gap-x-[10px] gap-y-[6px] px-[12px] py-[14px] [color:var(--brand-active)] [font-size:14px] font-medium leading-[1.35]"
          >
            <li v-for="task in member.tasks" :key="task" class="flex gap-[6px]">
              <span class="shrink-0 [color:var(--gray-300)]" aria-hidden="true">
                -
              </span>
              <span>{{ task }}</span>
            </li>
          </ul>
        </article>

        <a
          class="group flex min-h-0 flex-col border border-[rgba(0,70,244,0.42)] bg-[var(--brand-hover)] text-white shadow-[0_12px_32px_rgba(0,19,50,0.1)] transition-[transform,background,box-shadow] duration-[180ms] ease-out hover:-translate-y-px hover:bg-[var(--brand-active)] hover:shadow-[0_16px_38px_rgba(0,19,50,0.16)] active:translate-y-px focus-visible:outline-0 focus-visible:shadow-[0_0_0_5px_var(--brand-focus),0_16px_38px_rgba(0,19,50,0.16)]"
          :href="repositoryUrl"
          target="_blank"
          rel="noreferrer"
          aria-label="前往 Office Politics Game GitHub repository"
          data-intro-reveal
          :style="{
            '--intro-reveal-delay': `${110 + teamMembers.length * 75}ms`,
          }"
        >
          <div
            class="grid min-h-0 flex-1 place-items-center px-[24px] text-center"
          >
            <div>
              <div class="inline-flex items-center justify-center gap-[10px]">
                <Github
                  class="h-[32px] w-[32px] stroke-[2.2]"
                  aria-hidden="true"
                />
                <p class="m-0 [font-size:18px] font-bold leading-none">
                  GitHub
                </p>
              </div>
              <h3
                class="mb-0 mt-[18px] [font-size:20px] font-bold leading-[1.1]"
              >
                《Office Politics: 職場風雲》
              </h3>
              <p
                class="mb-0 mt-[18px] [font-size:15px] font-medium leading-[1.6] text-white/86"
              >
                喜歡我們的遊戲嗎？<br />
                歡迎到 GitHub 幫我們按下 ⭐ Star<br />您的支持就是我們持續開發的最大動力！
              </p>
            </div>
          </div>
          <div
            class="border-t border-white/24 px-[16px] py-[10px] text-center [font-size:12px] font-bold leading-none text-white/82 transition-colors duration-[180ms] ease-out group-hover:text-white"
          >
            github.com/Office-Politics-Game
          </div>
        </a>
      </div>

      <footer
        class="mt-[12px] flex h-[34px] shrink-0 items-center justify-between border-t border-[rgba(0,70,244,0.24)] pt-[8px] [color:var(--brand-active)] [font-size:12px] font-medium leading-none"
        data-intro-reveal
        style="--intro-reveal-delay: 640ms"
      >
        <div class="flex items-center gap-[10px]">
          <span class="[color:var(--brand-navy)] font-semibold">
            OFFICE POLITICS
          </span>
          <span class="[color:var(--gray-300)]">
            © 2026 Office Politics Game Team
          </span>
        </div>
        <nav class="flex items-center gap-[14px]" aria-label="頁尾連結">
          <a
            class="transition-colors duration-[180ms] ease-out hover:[color:var(--brand-hover)] focus-visible:outline-0 focus-visible:shadow-[0_0_0_4px_var(--brand-focus)]"
            href="#"
            @click.prevent
          >
            服務條款
          </a>
          <span class="[color:var(--gray-300)]" aria-hidden="true">/</span>
          <a
            class="transition-colors duration-[180ms] ease-out hover:[color:var(--brand-hover)] focus-visible:outline-0 focus-visible:shadow-[0_0_0_4px_var(--brand-focus)]"
            href="#"
            @click.prevent
          >
            隱私權政策
          </a>
        </nav>
      </footer>
    </div>
  </section>
</template>
