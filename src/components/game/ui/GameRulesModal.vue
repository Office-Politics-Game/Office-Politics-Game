<script setup>
import { nextTick, ref, watch } from "vue";
import {
  BookOpen,
  HelpCircle,
  Info,
  ListChecks,
  Target,
  Trophy,
  Users,
  X,
} from "lucide-vue-next";
import bonusChequeTokenUrl from "@/assets/images/bonus-cheque-token.png";
import gameRulesFlowUrl from "@/assets/images/game-rules-flow.svg";

const isOpen = ref(false);
const triggerButton = ref(null);
const closeButton = ref(null);
const panel = ref(null);
const activeRulesPage = ref(1);

const ruleSections = Object.freeze([
  {
    title: "遊戲資訊",
    icon: Info,
    items: [
      "全遊戲共 16 張卡牌",
      "八種職位，各具獨特能力",
      "每位玩家手上各持 1 張牌",
    ],
  },
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
  return Array.from(
    panel.value?.querySelectorAll(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  );
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
  if (nextIsOpen) activeRulesPage.value = 1;
  await nextTick();
  (nextIsOpen ? closeButton : triggerButton).value?.focus();
});
</script>

<template>
  <div
    class="game-rules-widget absolute right-5 bottom-5 z-[43] h-[30px] w-[30px] overflow-hidden bg-[var(--brand-hover)] text-white shadow-[0_16px_36px_rgba(0,19,50,0.32),inset_0_1px_0_rgba(255,255,255,0.42)] lg:right-10 lg:bottom-10 lg:h-16 lg:w-16"
    :class="{ 'is-open': isOpen }"
    @keydown="handleKeydown"
  >
    <button
      v-if="!isOpen"
      ref="triggerButton"
      type="button"
      class="grid h-[30px] w-[30px] place-items-center border-0 bg-transparent p-0 text-white transition-[transform,background,color,box-shadow] duration-[180ms] hover:-translate-y-px hover:bg-white/15 active:translate-y-px active:bg-[var(--brand-active)] focus-visible:outline-none focus-visible:shadow-[0_0_0_5px_var(--brand-focus)] lg:h-16 lg:w-16"
      aria-label="查看遊戲規則"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      @click="isOpen = true"
    >
      <BookOpen
        class="h-4 w-4 drop-shadow-[0_3px_8px_rgba(0,19,50,0.34)] lg:h-8 lg:w-8"
        aria-hidden="true"
      />
    </button>

    <section
      v-else
      ref="panel"
      class="rules-panel grid h-full grid-rows-[50px_1fr] focus:outline-none lg:grid-rows-[82px_1fr]"
      role="dialog"
      aria-modal="false"
      aria-labelledby="game-rules-title"
      tabindex="-1"
    >
      <header
        class="relative flex items-center border-b border-[rgba(70,85,99,0.18)] bg-white/50 px-3 py-2 pr-10 lg:px-[18px] lg:py-3 lg:pr-14"
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
          class="ml-auto mr-8 flex items-center gap-1 lg:mr-12 lg:gap-2"
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
        <button
          ref="closeButton"
          type="button"
          class="absolute top-0 right-0 grid h-8 w-8 place-items-center bg-white/70 p-0 text-[var(--brand-navy)] transition-[transform,background,color,box-shadow,border-color] duration-[180ms] hover:-translate-y-px hover:border-[var(--brand-hover)] hover:bg-[var(--brand-hover)] hover:text-white active:translate-y-px active:border-[var(--brand-active)] active:bg-[var(--brand-active)] focus-visible:outline-none focus-visible:shadow-[0_0_0_5px_var(--brand-focus)] lg:h-11 lg:w-11 [&>svg]:h-4 [&>svg]:w-4 lg:[&>svg]:h-[22px] lg:[&>svg]:w-[22px]"
          aria-label="關閉遊戲規則"
          @click="closeRules"
        >
          <X aria-hidden="true" />
        </button>
      </header>

      <div
        v-if="activeRulesPage === 1"
        class="grid h-full min-h-0 grid-cols-3 grid-rows-[1fr_1fr] gap-2 p-3 lg:grid-cols-[1.04fr_1fr_1fr] lg:grid-rows-[1fr_0.9fr] lg:gap-x-4 lg:gap-y-3 lg:p-[18px]"
      >
        <section
          v-for="section in ruleSections"
          :key="section.title"
          class="min-w-0 border border-[rgba(134,179,224,0.36)] bg-white/60 text-[var(--brand-navy)] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] lg:flex lg:flex-col"
        >
          <div
            class="flex min-h-8 items-center gap-1.5 px-2 py-1 text-[var(--brand-hover)] lg:min-h-[42px] lg:gap-2 lg:px-3 lg:py-2 [&>svg]:h-[18px] [&>svg]:w-[18px] lg:[&>svg]:h-6 lg:[&>svg]:w-6"
          >
            <component :is="section.icon" aria-hidden="true" />
            <h3 class="m-0 text-[13px] leading-[1.1] font-black lg:text-[22px]">
              {{ section.title }}
            </h3>
          </div>
          <ul
            v-if="section.items"
            class="m-0 grid gap-1 py-0 pr-2 pb-2 pl-6 text-[10px] leading-[1.25] font-medium text-[var(--gray-500)] marker:text-[var(--brand-hover)] lg:flex lg:flex-1 lg:list-none lg:flex-col lg:justify-center lg:gap-2 lg:px-6 lg:pb-4 lg:text-center lg:text-[16px] lg:leading-[1.35]"
          >
            <li v-for="item in section.items" :key="item">{{ item }}</li>
          </ul>
          <div
            v-else
            class="grid gap-1.5 px-2 pb-2 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:gap-2.5 lg:px-3 lg:pb-3.5"
          >
            <article
              v-for="card in section.cards"
              :key="card.text"
              class="grid min-h-8 grid-cols-[22px_1fr] items-center gap-1.5 px-1.5 py-1 lg:flex lg:flex-1 lg:flex-col lg:items-center lg:justify-center lg:gap-2 lg:px-4 lg:py-3 lg:text-center [&>img]:h-5 [&>img]:w-5 [&>img]:object-contain [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-[var(--brand-hover)] lg:[&>img]:h-9 lg:[&>img]:w-9 lg:[&>svg]:h-9 lg:[&>svg]:w-9"
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
                class="m-0 text-[10px] leading-[1.25] font-medium text-[var(--gray-500)] lg:text-[16px] lg:leading-[1.35]"
              >
                {{ card.text }}
              </p>
            </article>
          </div>
        </section>

        <section
          class="flex flex-row col-span-3 min-w-0 border border-[rgba(134,179,224,0.36)] bg-white/60 text-[var(--brand-navy)] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] lg:flex lg:flex-col"
        >
          <div
            class="flex min-h-8 items-start gap-1.5 px-2 py-1 text-[var(--brand-hover)] lg:min-h-[42px] lg:gap-2 lg:px-3 lg:py-2 [&>svg]:h-[18px] [&>svg]:w-[18px] lg:[&>svg]:h-6 lg:[&>svg]:w-6"
          >
            <ListChecks aria-hidden="true" />
            <h3 class="m-0 text-[13px] leading-[1.1] font-black lg:text-[22px]">
              遊戲流程
            </h3>
          </div>
          <div class="flex min-h-0 flex-1 flex-row items-center justify-center">
            <img
              :src="gameRulesFlowUrl"
              alt="遊戲流程：從發牌、抽牌、出牌到淘汰對手或存活到最後。"
              class="block max-h-19 w-full object-contain lg:max-h-[150px]"
              draggable="false"
            />
          </div>
        </section>
      </div>

      <section
        v-else
        class="grid h-full min-h-0 grid-rows-[32px_1fr] p-3 lg:grid-rows-[48px_1fr] lg:p-[18px]"
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
</template>

<style scoped>
.game-rules-widget {
  border-radius: 0;
  transition:
    width 0.26s ease,
    height 0.26s ease,
    background 0.26s ease,
    border-color 0.26s ease,
    box-shadow 0.26s ease;
}

.game-rules-widget.is-open {
  width: 630px;
  height: 340px;
  opacity: 0.95;
  color: var(--brand-navy);
  border-color: rgba(214, 215, 220, 0.92);
  background:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.98),
      rgba(244, 247, 251, 0.94)
    ),
    white;
  box-shadow:
    0 22px 60px rgba(0, 19, 50, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.rules-panel {
  animation: rules-content-fade 0.2s ease 0.12s both;
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
  font-size: 11px;
  font-weight: 800;
  line-height: 1.25;
}

.rules-card-table th,
.rules-card-table td {
  border: 1px solid rgba(134, 179, 224, 0.28);
  padding: 3px 8px;
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
  width: 52px;
  text-align: center;
}

.rules-card-table th:nth-child(2),
.rules-card-table td:nth-child(2) {
  width: 108px;
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

@keyframes rules-content-fade {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (min-width: 1024px) {
  .game-rules-widget.is-open {
    width: calc(100vw - 80px);
    max-width: calc(100vw - 80px);
    height: calc(100vh - 80px);
    max-height: calc(100vh - 80px);
  }

  .rules-page-button {
    width: 64px;
    height: 36px;
    font-size: 15px;
  }

  .rules-card-table {
    font-size: 20px;
    line-height: 1.35;
  }

  .rules-card-table th,
  .rules-card-table td {
    padding: 8px 18px;
  }

  .rules-card-table th {
    font-size: 14px;
  }

  .rules-card-table th:nth-child(1),
  .rules-card-table th:nth-child(3),
  .rules-card-table td:nth-child(1),
  .rules-card-table td:nth-child(3) {
    width: 128px;
  }

  .rules-card-table th:nth-child(2),
  .rules-card-table td:nth-child(2) {
    width: 166px;
  }

  .rules-card-table td:nth-child(4) {
    font-size: 20px;
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
