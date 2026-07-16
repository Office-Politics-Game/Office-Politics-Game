<script setup>
import BG from "../assets/images/bg-result.webp"
import Board from "@/assets/images/result-board.webp"
import RankingItems from "@/components/result/RankingItems.vue"
import ChampionCard from "@/components/result/ChampionCard.vue"
import Achievements from "@/components/result/Achievements.vue"
import { computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useGameActionStore } from "@/stores/gameActionStore.js"
import { resolveAvatarUrl } from "@/utils/playerUtils"

const route = useRoute()
const router = useRouter()
const gameActionStore = useGameActionStore()

const roomCode = computed(() => String(route.query.roomCode || "").trim())
const currentPlayerId = computed(() => route.query.playerId || "")
const currentPlayerResult = computed(() => {
  return resultData.value.currentPlayer || resultData.value.playerResult || {}
})

function toNumber(value, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function getPlayerName(player) {
  return player.username || player.name || player.playerName || "匿名同事"
}

function getAvatar(player, index) {
  const rawAvatar = player.avatarUrl || player.avatar || player.avatar_id || player.avatarId

  if (typeof rawAvatar === "string" && rawAvatar) {
    return rawAvatar
  }

  return resolveAvatarUrl(rawAvatar || index + 1)
}

function normalizePlayer(player, index) {
  const playerData = player.player || player

  return {
    id: playerData.playerId ?? playerData.id ?? player.playerId ?? player.id ?? index + 1,
    name: getPlayerName(playerData),
    level: toNumber(playerData.level, 1),
    avatar: getAvatar(playerData, index),
    roundWins: toNumber(
      player.roundWins ?? player.round_wins ?? playerData.roundWins ?? playerData.stars,
      0,
    ),
  }
}

const resultData = computed(() => gameActionStore.result || {})

const resultPlayers = computed(() => {
  const players =
    resultData.value.players ||
    resultData.value.participants ||
    resultData.value.ranking ||
    resultData.value.rankingList

  return Array.isArray(players) ? players : []
})

const rankingPlayers = computed(() =>
  resultPlayers.value
    .map(normalizePlayer)
    .sort((a, b) => b.roundWins - a.roundWins || String(a.name).localeCompare(String(b.name), "zh-Hant"))
    .slice(0, 4),
)

const champion = computed(() => {
  const winnerId =
    resultData.value.winnerPlayerId ||
    resultData.value.winner_player_id ||
    resultData.value.winner?.playerId ||
    resultData.value.winner?.id

  return (
    rankingPlayers.value.find((player) => String(player.id) === String(winnerId)) ||
    rankingPlayers.value[0] ||
    null
  )
})

const rewards = computed(() => {
  const achievements = resultData.value.achievements || []
  const achievement = resultData.value.achievement || achievements[0] || {}

  return {
    achievementTitle: achievement.title || achievement.name || "完成對局",
    achievementDescription: achievement.description || "完成一場職場角力，累積績效表現。",
    expGained: toNumber(
      currentPlayerResult.value.expGained ??
        resultData.value.expGained ??
        resultData.value.xpGained ??
        resultData.value.rewards?.exp,
      100,
    ),
    coinsGained: toNumber(
      currentPlayerResult.value.coinsGained ??
        resultData.value.coinsGained ??
        resultData.value.rewards?.coins,
      500,
    ),
  }
})

onMounted(async () => {
  if (!roomCode.value) {
    return
  }

  try {
    await gameActionStore.fetchGameResult(
      roomCode.value,
      currentPlayerId.value ? { playerId: currentPlayerId.value } : {},
    )
  } catch (error) {
    console.warn("[結算頁] 取得遊戲結算資料失敗", error)
  }
})
</script>

<template>
  <main
    class="result-page"
    :style="{ backgroundImage: `url(${BG})` }"
  >
    <section class="result-stage" aria-label="遊戲結算畫面">
      <img class="result-stage__board" :src="Board" alt="年度績效考核白板" />
      <div class="result-stage__content">
        <RankingItems
          class="result-stage__ranking"
          :players="rankingPlayers"
        />
        <ChampionCard
          class="result-stage__champion"
          :champion="champion"
        />
        <Achievements
          class="result-stage__achievements"
          :achievement-title="rewards.achievementTitle"
          :achievement-description="rewards.achievementDescription"
          :exp-gained="rewards.expGained"
          :coins-gained="rewards.coinsGained"
        />
        <div class="result-stage__actions">
          <button
            class="result-stage__action btn-dark tap-pop"
            type="button"
            @click="router.push('/lobby')"
          >
            返回大廳
          </button>
          <button
            class="result-stage__action btn-dark tap-pop"
            type="button"
            @click="router.push('/lobby/game-menu')"
          >
            再來一局
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.result-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.result-stage {
  position: relative;
  width: min(98vw, 1500px, calc(96vh * 1311 / 801));
  aspect-ratio: 1311 / 801;
  container-type: inline-size;

  --ranking-x: 13.0%;
  --ranking-y: 39.6%;
  --ranking-w: 32.3%;
  --ranking-h: 39.8%;

  --winner-x: 49.2%;
  --winner-y: 38.2%;
  --winner-w: 20.8%;
  --winner-h: 44.8%;
}

.result-stage__board {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  display: block;
}

.result-stage__content {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.result-stage__ranking {
  position: absolute;
  top: var(--ranking-y);
  left: var(--ranking-x);
  width: var(--ranking-w);
  height: var(--ranking-h);
}

.result-stage__champion {
  position: absolute;
  top: var(--winner-y);
  left: var(--winner-x);
  width: var(--winner-w);
  height: var(--winner-h);
}

.result-stage__achievements {
  position: absolute;
  inset: 0;
}

.result-stage__actions {
  position: absolute;
  left: 50%;
  bottom: 7%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  transform: translateX(-50%);
  pointer-events: auto;
  animation: result-fade-up 0.7s ease both;
  animation-delay: 4.7s;
}

.result-stage__action {
  min-width: 150px;
  min-height: 44px;
  padding: 8px 20px;
  cursor: pointer;
  font-size: var(--text-md);
  font-weight: 800;
}

.result-stage__action:hover {
  border-color: var(--brand-hover);
  background: var(--brand-hover);
  color: #fff;
}

@keyframes result-fade-up {
  from {
    opacity: 0;
    transform: translate(-50%, 16px);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@media (orientation: landscape) and (max-width: 1023px) {
  .result-stage {
    width: min(99vw, calc(96vh * 1311 / 801));
  }

  .result-stage__actions {
    bottom: 6%;
    gap: 20px;
    animation-delay: 5.1s;
  }

  .result-stage__action {
    min-width: 96px;
    min-height: 30px;
    padding: 4px 10px;
    font-size: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .result-stage__actions {
    animation: none;
  }
}
</style>
