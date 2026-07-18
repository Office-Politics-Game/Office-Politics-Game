<script setup>
import { nextTick, ref, watch } from "vue";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  ListChecks,
  Target,
  Trophy,
  Users,
} from "lucide-vue-next";
import bonusChequeTokenUrl from "@/assets/images/bonus-cheque-token.png";
import gameRulesFlowUrl from "@/assets/images/game-rules-flow.svg";

const isOpen = ref(false);
const triggerButton = ref(null);
const panel = ref(null);
const activeRulesPage = ref(2);

const ruleSections = Object.freeze([
  {
    title: "遊戲目標",
    icon: Target,
    cards: [
      { icon: Users, text: "成為最後唯一倖存的玩家" },
      { icon: HelpCircle, text: "牌庫抽完後，比較手牌點數，點數最高者獲勝" },
    ],
  },
  {
    title: "勝利條件",
    icon: Trophy,
    cards: [
      {
        image: bonusChequeTokenUrl,
        text: "符合任一條件即可獲得一張年終支票",
      },
      {
        imageStack: true,
        text: "先獲得三張支票的玩家，取得最終勝利",
      },
    ],
    strong: true,
  },
]);

const cardInfoRows = Object.freeze([
  {
    rank: 8,
    name: "執行長",
    count: 1,
    effect: "迫使丟棄此牌時，你直接淘汰。",
  },
  {
    rank: 7,
    name: "資深顧問",
    count: 1,
    effect: "若同時持有「人資主管」或「專案經理」必須強制打出此牌。",
  },
  {
    rank: 6,
    name: "人資主管",
    count: 1,
    effect: "與一名玩家秘密交換手牌。",
  },
  {
    rank: 5,
    name: "專案經理",
    count: 2,
    effect: "指定一名玩家棄牌重抽。",
  },
  {
    rank: 4,
    name: "職場老鳥",
    count: 2,
    effect: "直到下個回合前，免疫所有卡牌效果。",
  },
  {
    rank: 3,
    name: "部門主管",
    count: 2,
    effect: "與一名玩家秘密比大小，點數小者淘汰。",
  },
  {
    rank: 2,
    name: "打掃阿姨",
    count: 2,
    effect: "秘密觀看一名玩家的手牌。",
  },
  {
    rank: 1,
    name: "實習生",
    count: 5,
    effect: "猜測一名玩家的手牌，猜中則對方淘汰。",
  },
]);

function closeRules() {
  isOpen.value = false;
}

function getFocusableElements() {
  const panelElements = Array.from(
    panel.value?.querySelectorAll(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  );
  return triggerButton.value
    ? [triggerButton.value, ...panelElements]
    : panelElements;
}

function handleKeydown(event) {
  if (!isOpen.value) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeRules();
    return;
  }
  if (event.key !== "Tab") return;

  const focusable = getFocusableElements();
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return event.preventDefault();
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(isOpen, async (nextIsOpen) => {
  if (nextIsOpen) activeRulesPage.value = 2;
  await nextTick();
  triggerButton.value?.focus();
});
</script>

<template>
  <div class="contents" @keydown="handleKeydown">
    <button
      v-if="isOpen"
      type="button"
      class="absolute inset-0 z-[200] cursor-default border-0 bg-[rgba(0,19,50,0.62)] p-0 focus:outline-none"
      aria-label="關閉遊戲規則"
      @click="closeRules"
    />

    <div
      class="rules-drawer-shell absolute top-0 right-0 bottom-0 z-[201] w-[400px] transition-transform duration-[260ms] ease-[ease] lg:w-[480px]"
      :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <button
        ref="triggerButton"
        type="button"
        class="game-rules-trigger absolute bottom-1/5 left-[-28px] z-[45] grid h-14 w-7 translate-y-1/2 place-items-center rounded-l-full border-0 bg-[var(--brand-hover)] p-0 text-white shadow-[0_16px_36px_rgba(0,19,50,0.32),inset_0_1px_0_rgba(255,255,255,0.42)] transition-[transform,background,color,box-shadow] duration-[180ms] hover:translate-y-[calc(50%-1px)] hover:bg-[var(--brand-hover)] active:translate-y-[calc(50%+1px)] active:bg-[var(--brand-active)] focus-visible:outline-none focus-visible:shadow-[0_0_0_5px_var(--brand-focus)] lg:left-[-40px] lg:h-20 lg:w-10"
        :aria-label="isOpen ? '收起遊戲規則' : '查看遊戲規則'"
        aria-haspopup="dialog"
        :aria-expanded="isOpen"
        @click="isOpen = !isOpen"
      >
        <ChevronLeft
          v-if="!isOpen"
          class="h-6 w-6 drop-shadow-[0_3px_8px_rgba(0,19,50,0.34)] lg:h-8 lg:w-8"
          aria-hidden="true"
        />
        <ChevronRight
          v-else
          class="h-6 w-6 drop-shadow-[0_3px_8px_rgba(0,19,50,0.34)] lg:h-8 lg:w-8"
          aria-hidden="true"
        />
      </button>

      <section
        ref="panel"
        class="rules-panel absolute inset-0 grid grid-rows-[58px_1fr] overflow-hidden bg-white text-[var(--brand-navy)] shadow-[-18px_0_48px_rgba(0,19,50,0.28),inset_1px_0_0_rgba(214,215,220,0.92)] focus:outline-none lg:grid-rows-[82px_1fr]"
        role="dialog"
        aria-modal="false"
        aria-labelledby="game-rules-title"
        :aria-hidden="!isOpen"
        :inert="!isOpen"
        tabindex="-1"
      >
        <header
          class="relative flex items-center border-b border-[rgba(70,85,99,0.18)] bg-white/50 px-3 py-2 lg:px-[18px] lg:py-3"
        >
          <div class="flex items-center gap-2 lg:gap-3">
            <BookOpen
              class="h-5 w-5 text-[var(--brand-hover)] lg:h-[34px] lg:w-[34px]"
              aria-hidden="true"
            />
            <h2
              id="game-rules-title"
              class="m-0 text-[18px] leading-none font-black lg:text-[36px]"
            >
              遊戲規則
            </h2>
          </div>
          <div
            class="ml-auto flex items-center gap-1 lg:gap-2"
            aria-label="切換規則頁面"
          >
            <button
              type="button"
              class="rules-page-button"
              :class="{ 'is-active': activeRulesPage === 1 }"
              :aria-pressed="activeRulesPage === 1"
              @click="activeRulesPage = 1"
            >
              規則
            </button>
            <button
              type="button"
              class="rules-page-button"
              :class="{ 'is-active': activeRulesPage === 2 }"
              :aria-pressed="activeRulesPage === 2"
              @click="activeRulesPage = 2"
            >
              卡牌
            </button>
          </div>
        </header>

        <div
          v-if="activeRulesPage === 1"
          class="rules-content grid min-h-0 grid-rows-3 gap-3 overflow-hidden p-3 lg:gap-4 lg:p-4"
        >
          <section
            v-for="section in ruleSections"
            :key="section.title"
            class="grid min-h-0 min-w-0 grid-rows-[auto_1fr] overflow-hidden border border-[rgba(134,179,224,0.36)] bg-white/60 text-[var(--brand-navy)] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]"
          >
            <div
              class="flex min-h-8 items-center gap-1.5 px-2 py-1 text-[var(--brand-hover)] lg:min-h-[42px] lg:gap-2 lg:px-3 lg:py-2 [&>svg]:h-[18px] [&>svg]:w-[18px] lg:[&>svg]:h-6 lg:[&>svg]:w-6"
            >
              <component :is="section.icon" aria-hidden="true" />
              <h3
                class="m-0 text-[13px] leading-[1.1] font-black lg:text-[22px]"
              >
                {{ section.title }}
              </h3>
            </div>
            <ul
              v-if="section.items"
              class="m-0 grid gap-1.5 py-1 pr-3 pb-3 pl-7 text-[10px] leading-[1.5] font-medium text-[var(--gray-500)] marker:text-[var(--brand-hover)] lg:gap-2 lg:px-8 lg:pb-4 lg:text-[15px] lg:leading-[1.6]"
            >
              <li v-for="item in section.items" :key="item">{{ item }}</li>
            </ul>
            <div
              v-else
              class="grid min-h-0 grid-cols-2 gap-2 px-2 pb-2 lg:gap-3 lg:px-3 lg:pb-3"
            >
              <article
                v-for="card in section.cards"
                :key="card.text"
                class="flex min-h-11 flex-row items-center gap-2 px-3 py-2 lg:min-h-14 lg:flex-col lg:justify-center lg:gap-3 lg:px-4 lg:py-3 lg:text-center [&>img]:h-7 [&>img]:w-7 [&>img]:shrink-0 [&>img]:object-contain [&>svg]:h-7 [&>svg]:w-7 [&>svg]:shrink-0 [&>svg]:text-[var(--brand-hover)] lg:[&>img]:h-9 lg:[&>img]:w-9 lg:[&>svg]:h-9 lg:[&>svg]:w-9"
                :class="
                  section.strong
                    ? 'bg-[rgba(134,179,224,0.18)]'
                    : 'bg-[rgba(244,247,251,0.92)]'
                "
              >
                <div
                  v-if="card.imageStack"
                  class="cheque-stack"
                  aria-hidden="true"
                >
                  <img :src="bonusChequeTokenUrl" alt="" draggable="false" />
                  <img :src="bonusChequeTokenUrl" alt="" draggable="false" />
                  <img :src="bonusChequeTokenUrl" alt="" draggable="false" />
                </div>
                <img
                  v-else-if="card.image"
                  :src="card.image"
                  alt=""
                  aria-hidden="true"
                  draggable="false"
                />
                <component v-else :is="card.icon" aria-hidden="true" />
                <p
                  class="m-0 text-[10px] leading-[1.5] font-medium text-[var(--gray-500)] lg:text-[15px] lg:leading-[1.6]"
                >
                  {{ card.text }}
                </p>
              </article>
            </div>
          </section>

          <section
            class="flex min-h-0 min-w-0 flex-row overflow-hidden border border-[rgba(134,179,224,0.36)] bg-white/60 text-[var(--brand-navy)] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] lg:grid lg:grid-rows-[auto_1fr]"
          >
            <div
              class="flex min-h-8 w-[92px] shrink-0 items-start gap-1.5 px-2 py-1 text-[var(--brand-hover)] lg:min-h-[42px] lg:w-auto lg:gap-2 lg:px-3 lg:py-2 [&>svg]:h-[18px] [&>svg]:w-[18px] lg:[&>svg]:h-6 lg:[&>svg]:w-6"
            >
              <ListChecks aria-hidden="true" />
              <h3
                class="m-0 text-[13px] leading-[1.1] font-black lg:text-[22px]"
              >
                遊戲流程
              </h3>
            </div>
            <div
              class="flex min-h-0 min-w-0 flex-1 items-center justify-center p-2 lg:p-3"
            >
              <img
                :src="gameRulesFlowUrl"
                alt="遊戲流程：從發牌、抽牌、出牌到淘汰對手或存活到最後。"
                class="block h-full max-h-[96px] w-full object-contain lg:max-h-[132px]"
                draggable="false"
              />
            </div>
          </section>
        </div>

        <section
          v-else
          class="rules-content grid min-h-0 grid-rows-[36px_1fr] overflow-hidden p-3 lg:grid-rows-[48px_1fr] lg:p-4"
        >
          <div
            class="flex items-center gap-1.5 border border-[rgba(134,179,224,0.36)] border-b-0 bg-white/60 px-2 text-[var(--brand-hover)] lg:gap-2 lg:px-3 [&>svg]:h-[18px] [&>svg]:w-[18px] lg:[&>svg]:h-6 lg:[&>svg]:w-6"
          >
            <ListChecks aria-hidden="true" />
            <h3 class="m-0 text-[13px] leading-[1.1] font-black lg:text-[22px]">
              卡牌資訊
            </h3>
          </div>
          <div
            class="min-h-0 overflow-hidden border border-[rgba(134,179,224,0.36)] bg-white/60 text-[var(--brand-navy)] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]"
          >
            <table class="rules-card-table">
              <thead>
                <tr>
                  <th scope="col">點數</th>
                  <th scope="col">職位</th>
                  <th scope="col">張數</th>
                  <th scope="col">效果</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="card in cardInfoRows" :key="card.rank">
                  <td>{{ card.rank }}</td>
                  <td>{{ card.name }}</td>
                  <td>{{ card.count }}</td>
                  <td>{{ card.effect }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  </div>
</template>

<style scoped>
.rules-panel,
.rules-page-button,
.rules-content section,
.rules-content article,
.rules-card-table,
.rules-card-table th,
.rules-card-table td {
  border-radius: 0;
}

.rules-drawer-shell {
  isolation: isolate;
  will-change: transform;
}

.rules-panel {
  isolation: isolate;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.98),
      rgba(244, 247, 251, 0.94)
    ),
    white;
}

.rules-content {
  scrollbar-color: rgba(70, 85, 99, 0.58) rgba(134, 179, 224, 0.14);
  scrollbar-width: thin;
}

.rules-page-button {
  width: 44px;
  height: 24px;
  border: 1px solid rgba(134, 179, 224, 0.48);
  background: rgba(255, 255, 255, 0.48);
  color: var(--brand-navy);
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.rules-page-button:hover {
  transform: translateY(-1px);
  border-color: var(--brand-hover);
  background: var(--brand-hover);
  color: white;
}

.rules-page-button:active {
  transform: translateY(1px);
  border-color: var(--brand-active);
  background: var(--brand-active);
  color: white;
}

.rules-page-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 5px var(--brand-focus);
}

.rules-page-button.is-active {
  border-color: var(--brand-hover);
  background: var(--brand-hover);
  color: white;
}

.rules-card-table {
  width: 100%;
  height: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.4;
}

.rules-card-table th,
.rules-card-table td {
  border: 1px solid rgba(134, 179, 224, 0.28);
  padding: 6px 5px;
  vertical-align: middle;
}

.rules-card-table th {
  background: rgba(134, 179, 224, 0.2);
  color: var(--brand-active);
  text-align: left;
  font-size: 10px;
}

.rules-card-table th:nth-child(1),
.rules-card-table th:nth-child(3),
.rules-card-table td:nth-child(1),
.rules-card-table td:nth-child(3) {
  width: 42px;
  text-align: center;
}

.rules-card-table th:nth-child(2),
.rules-card-table td:nth-child(2) {
  width: 76px;
}

.rules-card-table td:nth-child(4) {
  color: var(--gray-500);
  font-size: 10px;
  font-weight: 700;
}

.rules-card-table tr:nth-child(even) {
  background: rgba(244, 247, 251, 0.82);
}

.cheque-stack {
  position: relative;
  width: 22px;
  height: 17px;
}

.cheque-stack img {
  position: absolute;
  width: 17px;
  height: auto;
  max-width: none;
  filter: drop-shadow(0 2px 3px rgba(0, 19, 50, 0.18));
}

.cheque-stack img:nth-child(1) {
  top: 0;
  left: 0;
}

.cheque-stack img:nth-child(2) {
  top: 3px;
  left: 3px;
  z-index: 1;
}

.cheque-stack img:nth-child(3) {
  top: 6px;
  left: 6px;
  z-index: 2;
}

@media (min-width: 1024px) {
  .rules-page-button {
    width: 64px;
    height: 36px;
    font-size: 15px;
  }

  .rules-card-table {
    font-size: 15px;
    line-height: 1.5;
  }

  .rules-card-table th,
  .rules-card-table td {
    padding: 8px 7px;
  }

  .rules-card-table th {
    font-size: 15px;
  }

  .rules-card-table th:nth-child(1),
  .rules-card-table th:nth-child(3),
  .rules-card-table td:nth-child(1),
  .rules-card-table td:nth-child(3) {
    width: 50px;
  }

  .rules-card-table th:nth-child(2),
  .rules-card-table td:nth-child(2) {
    width: 92px;
  }

  .rules-card-table td:nth-child(4) {
    font-size: 15px;
  }

  .cheque-stack {
    width: 39px;
    height: 29px;
  }

  .cheque-stack img {
    width: 31px;
  }

  .cheque-stack img:nth-child(2) {
    top: 4px;
    left: 4px;
  }

  .cheque-stack img:nth-child(3) {
    top: 8px;
    left: 8px;
  }
}
</style>
